const db = require('../config/database');
const { uploadFileBuffer } = require('../services/cloudinaryService');

/**
 * Customer submits a Deposit Request with Slip Upload
 */
async function submitDeposit(req, res, next) {
  try {
    const {
      amount,
      sender_name,
      sender_mobile,
      deposit_method = 'Bank Transfer',
      transaction_id,
      deposit_date
    } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Transaction slip or deposit receipt image is required.'
      });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be a valid positive number.'
      });
    }

    if (!sender_name || !sender_mobile) {
      return res.status(400).json({
        success: false,
        message: 'Sender name and mobile number are required.'
      });
    }

    // Fetch customer profile
    const custRes = await db.query(
      `SELECT c.id, c.account_number, c.account_operational_status, u.full_name, u.email 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    const customer = custRes.rows[0];

    if (customer.account_operational_status === 'Closed') {
      return res.status(403).json({
        success: false,
        message: 'এই ব্যাংক অ্যাকাউন্টটি স্থায়ীভাবে বন্ধ (Closed) করা হয়েছে। কোনো নতুন ডিপোজিট গ্রহণ করা সম্ভব নয়।'
      });
    }

    // Check duplicate pending or approved transaction ID
    if (transaction_id && transaction_id.trim()) {
      const dupCheck = await db.query(
        `SELECT id, status FROM deposits WHERE transaction_id = $1 AND status IN ('Approved', 'Pending Verification')`,
        [transaction_id.trim()]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A deposit with Transaction ID '${transaction_id}' already exists and is ${dupCheck.rows[0].status.toLowerCase()}.`
        });
      }
    }

    // Upload slip to Cloudinary
    const uploadRes = await uploadFileBuffer(
      file.buffer,
      file.originalname,
      'Smart-Banking-Service-Request-Portal/deposits'
    );

    // Generate unique deposit number
    const year = new Date().getFullYear();
    const countRes = await db.query('SELECT COUNT(*) FROM deposits');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const depositNumber = `DEP-${year}-${String(seq).padStart(5, '0')}`;

    // Insert deposit record
    const insertRes = await db.query(
      `INSERT INTO deposits (
         deposit_number, customer_id, account_number, amount, sender_name,
         sender_mobile, deposit_method, transaction_id, deposit_date,
         slip_url, slip_public_id, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending Verification')
       RETURNING *`,
      [
        depositNumber,
        customer.id,
        customer.account_number,
        depositAmount,
        sender_name.trim(),
        sender_mobile.trim(),
        deposit_method,
        transaction_id ? transaction_id.trim() : null,
        deposit_date || new Date().toISOString().split('T')[0],
        uploadRes.secure_url,
        uploadRes.public_id
      ]
    );

    const deposit = insertRes.rows[0];

    // Send customer in-app notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        req.user.id,
        'Deposit Request Submitted',
        `Your deposit request of BDT ${depositAmount.toLocaleString()} (Ref: ${depositNumber}) has been submitted. It is currently Pending Bank Officer Verification. Your balance will be credited upon approval.`
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'DEPOSIT_SUBMITTED', 'deposits', $2, $3)`,
      [
        req.user.id,
        String(deposit.id),
        JSON.stringify({
          deposit_number: depositNumber,
          amount: depositAmount,
          method: deposit_method,
          transaction_id
        })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully! Your balance will be updated once bank officers verify the transaction slip.',
      deposit
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: List own deposit requests
 */
async function getMyDeposits(req, res, next) {
  try {
    const custRes = await db.query('SELECT id FROM customers WHERE user_id = $1', [req.user.id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const result = await db.query(
      `SELECT * FROM deposits WHERE customer_id = $1 ORDER BY created_at DESC`,
      [custRes.rows[0].id]
    );

    res.json({ success: true, count: result.rows.length, deposits: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List all deposit requests with filters
 */
async function getAdminDeposits(req, res, next) {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT d.*, u.full_name as customer_name, u.email as customer_email,
             c.balance as current_balance, c.kyc_status
      FROM deposits d
      JOIN customers c ON c.id = d.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (d.deposit_number ILIKE $${params.length} OR d.account_number ILIKE $${params.length} OR d.transaction_id ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, deposits: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Verify and Accept / Reject a deposit request
 */
async function verifyDeposit(req, res, next) {
  const client = await db.getClient();
  try {
    const { depositId } = req.params;
    const { decision, action, remarks } = req.body;
    const effectiveDecision = (decision || action || '').toUpperCase();

    if (!['ACCEPT', 'REJECT'].includes(effectiveDecision)) {
      return res.status(400).json({ success: false, message: 'Decision must be ACCEPT or REJECT.' });
    }

    if (effectiveDecision === 'REJECT' && (!remarks || !remarks.trim())) {
      return res.status(400).json({ success: false, message: 'A rejection reason is mandatory when rejecting a deposit.' });
    }

    await client.query('BEGIN');

    // Lock deposit row for update
    const depRes = await client.query(
      `SELECT d.*, c.user_id, c.balance, u.full_name 
       FROM deposits d 
       JOIN customers c ON c.id = d.customer_id 
       JOIN users u ON u.id = c.user_id 
       WHERE d.id = $1 FOR UPDATE`,
      [depositId]
    );

    if (depRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    const deposit = depRes.rows[0];

    if (deposit.status !== 'Pending Verification' && deposit.status !== 'Under Review') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `This deposit request has already been finalized as '${deposit.status}'.`
      });
    }

    const adminId = req.user.admin_id;

    if (effectiveDecision === 'ACCEPT') {
      // Check for duplicate credit on the same transaction ID
      if (deposit.transaction_id) {
        const dupCheck = await client.query(
          `SELECT id FROM deposits WHERE transaction_id = $1 AND status = 'Approved' AND id != $2`,
          [deposit.transaction_id, deposit.id]
        );
        if (dupCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: `Fraud Prevention: Transaction ID '${deposit.transaction_id}' has already been approved and credited on another deposit request.`
          });
        }
      }

      // Update deposit status
      await client.query(
        `UPDATE deposits 
         SET status = 'Approved', admin_remarks = $1, verified_by_admin_id = $2,
             verified_at = NOW(), updated_at = NOW() 
         WHERE id = $3`,
        [remarks || 'Verified and approved by bank officer', adminId, deposit.id]
      );

      // Increment customer balance
      const depositAmount = parseFloat(deposit.amount);
      const updateBalanceRes = await client.query(
        `UPDATE customers 
         SET balance = balance + $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING balance`,
        [depositAmount, deposit.customer_id]
      );
      const newBalance = parseFloat(updateBalanceRes.rows[0].balance);

      // Insert real transaction record
      const txnNumber = `TXN-DEP-${Date.now()}-${deposit.id}`;
      await client.query(
        `INSERT INTO real_transactions (
           transaction_number, customer_id, account_number, type, amount,
           counterparty_name, reference, balance_after, deposit_id
         )
         VALUES ($1, $2, $3, 'Deposit', $4, $5, $6, $7, $8)`,
        [
          txnNumber,
          deposit.customer_id,
          deposit.account_number,
          depositAmount,
          deposit.sender_name,
          `Deposit via ${deposit.deposit_method}${deposit.transaction_id ? ' (Trx: ' + deposit.transaction_id + ')' : ''}`,
          newBalance,
          deposit.id
        ]
      );

      // Send Customer Notification
      await client.query(
        `INSERT INTO notifications (user_id, title, message, channel)
         VALUES ($1, $2, $3, 'IN_APP')`,
        [
          deposit.user_id,
          'Deposit Approved & Credited',
          `Your deposit of BDT ${depositAmount.toLocaleString()} (Ref: ${deposit.deposit_number}) has been approved and credited to your account. Your new balance is BDT ${newBalance.toLocaleString()}.`
        ]
      );

      // Create Audit Log
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'DEPOSIT_APPROVED', 'deposits', $2, $3)`,
        [
          req.user.id,
          String(deposit.id),
          JSON.stringify({
            deposit_number: deposit.deposit_number,
            amount: depositAmount,
            credited_balance: newBalance
          })
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Deposit of BDT ${depositAmount.toLocaleString()} accepted and balance credited successfully.`,
        new_balance: newBalance
      });
    } else {
      // REJECT DECISION
      await client.query(
        `UPDATE deposits 
         SET status = 'Rejected', admin_remarks = $1, verified_by_admin_id = $2,
             verified_at = NOW(), updated_at = NOW() 
         WHERE id = $3`,
        [remarks, adminId, deposit.id]
      );

      // Send Customer Notification
      await client.query(
        `INSERT INTO notifications (user_id, title, message, channel)
         VALUES ($1, $2, $3, 'IN_APP')`,
        [
          deposit.user_id,
          'Deposit Request Rejected',
          `Your deposit request of BDT ${parseFloat(deposit.amount).toLocaleString()} (Ref: ${deposit.deposit_number}) was rejected by bank officers. Reason: "${remarks}".`
        ]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'DEPOSIT_REJECTED', 'deposits', $2, $3)`,
        [
          req.user.id,
          String(deposit.id),
          JSON.stringify({
            deposit_number: deposit.deposit_number,
            amount: deposit.amount,
            reason: remarks
          })
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Deposit request rejected successfully.',
        status: 'Rejected'
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  submitDeposit,
  getMyDeposits,
  getAdminDeposits,
  verifyDeposit,
};
