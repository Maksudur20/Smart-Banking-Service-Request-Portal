const db = require('../config/database');
const { uploadFileBuffer } = require('../services/cloudinaryService');

/**
 * Customer submits a Cash Withdrawal Request with Cheque Image
 */
async function submitWithdrawal(req, res, next) {
  const client = await db.getClient();
  try {
    const {
      amount,
      cheque_number,
      cheque_date,
      payee_name
    } = req.body;
    const file = req.file;

    // 1. Mandatory Cheque Image check
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'চেকের পরিষ্কার ছবি আপলোড করা আবশ্যক (JPG, JPEG, PNG ফরম্যাট)।'
      });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'উত্তোলনের পরিমাণ একটি সঠিক ধনাত্মক সংখ্যা হতে হবে।'
      });
    }

    if (!cheque_number || !cheque_date || !payee_name) {
      return res.status(400).json({
        success: false,
        message: 'চেক নম্বর, চেকের তারিখ এবং প্রাপকের নাম (Payee Name) আবশ্যক।'
      });
    }

    // 2. Fetch and verify customer account
    const custRes = await client.query(
      `SELECT c.*, u.full_name, u.email, u.phone 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'গ্রাহক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।'
      });
    }

    const customer = custRes.rows[0];

    // Check account operational restrictions
    if (customer.account_operational_status === 'Closed') {
      return res.status(403).json({
        success: false,
        message: 'এই ব্যাংক অ্যাকাউন্টটি স্থায়ীভাবে বন্ধ (Closed) রয়েছে। কোনো উত্তোলন সম্ভব নয়।'
      });
    }

    if (customer.account_operational_status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'এই অ্যাকাউন্টটি স্থগিত (Suspended) রয়েছে। নগদ উত্তোলনের পূর্বে শাখায় যোগাযোগ করুন।'
      });
    }

    // Check balance
    const availableBalance = parseFloat(customer.balance || 0);
    if (availableBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}, যা উত্তোলনের পরিমাণ ৳${withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} থেকে কম।`
      });
    }

    // 3. Upload Cheque Image to Cloudinary
    let uploadRes;
    try {
      uploadRes = await uploadFileBuffer(
        file.buffer,
        file.originalname,
        'Smart-Banking-Service-Request-Portal/cheques'
      );
    } catch (uploadErr) {
      return res.status(500).json({
        success: false,
        message: 'চেকের ছবি আপলোড ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।'
      });
    }

    // 4. Generate Unique Request ID: CW-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const withdrawalRef = `CW-${year}-${randomSuffix}`;

    await client.query('BEGIN');

    const insertRes = await client.query(
      `INSERT INTO cash_withdrawals (
         withdrawal_reference, customer_id, account_number, account_holder_name,
         amount, cheque_number, cheque_date, payee_name, cheque_image_url,
         cloudinary_public_id, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
       RETURNING *`,
      [
        withdrawalRef,
        customer.id,
        customer.account_number,
        customer.full_name,
        withdrawAmount,
        cheque_number.trim(),
        cheque_date,
        payee_name.trim(),
        uploadRes.secure_url,
        uploadRes.public_id
      ]
    );
    const withdrawal = insertRes.rows[0];

    // Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, 'নগদ উত্তোলনের আবেদন জমা হয়েছে', $2)`,
      [
        req.user.id,
        `আপনার চেক নম্বর ${cheque_number} দিয়ে ৳${withdrawAmount.toFixed(2)} নগদ উত্তোলনের আবেদন (${withdrawalRef}) সফলভাবে জমা হয়েছে। ব্যাংক কর্মকর্তা যাচাই সম্পন্ন করলে ক্যাশ পেমেন্ট প্রদান করা হবে।`
      ]
    );

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CASH_WITHDRAWAL_REQUEST', 'cash_withdrawals', $2, $3, $4)`,
      [
        req.user.id,
        String(withdrawal.id),
        JSON.stringify({
          withdrawal_reference: withdrawalRef,
          amount: withdrawAmount,
          cheque_number,
          account_number: customer.account_number
        }),
        req.ip || '127.0.0.1'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `নগদ উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে। রেফারেন্স নম্বর: ${withdrawalRef}`,
      withdrawal
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Customer fetches their cash withdrawal history
 */
async function getMyWithdrawals(req, res, next) {
  try {
    const custRes = await db.query('SELECT id, balance FROM customers WHERE user_id = $1', [req.user.id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'গ্রাহক অ্যাকাউন্ট পাওয়া যায়নি।' });
    }

    const customerId = custRes.rows[0].id;
    const result = await db.query(
      `SELECT w.*, c.balance as current_balance 
       FROM cash_withdrawals w 
       JOIN customers c ON c.id = w.customer_id 
       WHERE w.customer_id = $1 
       ORDER BY w.created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      withdrawals: result.rows,
      available_balance: custRes.rows[0].balance
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch official withdrawal payment receipt
 */
async function getWithdrawalReceipt(req, res, next) {
  try {
    const { id } = req.params;
    const query = `
      SELECT w.*, 
             u.full_name as account_holder_name, 
             u.email as customer_email, 
             u.phone as customer_phone,
             c.customer_reference, 
             c.account_type,
             c.balance as current_balance,
             admin_u.full_name as reviewed_by_name,
             a.staff_reference as reviewed_by_staff_ref
      FROM cash_withdrawals w
      JOIN customers c ON c.id = w.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = w.reviewed_by_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      WHERE w.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'উত্তোলনের রশিদ পাওয়া যায়নি।' });
    }

    const receipt = result.rows[0];

    // If customer, ensure they own it
    if (req.user.role === 'CUSTOMER') {
      const custRes = await db.query('SELECT id FROM customers WHERE user_id = $1', [req.user.id]);
      if (custRes.rows.length === 0 || custRes.rows[0].id !== receipt.customer_id) {
        return res.status(403).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস।' });
      }
    }

    res.json({
      success: true,
      receipt
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List all cash withdrawals with filters
 */
async function getAdminWithdrawals(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (status) {
      params.push(status);
      whereClause += ` AND w.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (
        w.withdrawal_reference ILIKE $${params.length} OR 
        w.account_number ILIKE $${params.length} OR 
        w.cheque_number ILIKE $${params.length} OR 
        u.full_name ILIKE $${params.length} OR 
        u.email ILIKE $${params.length}
      )`;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM cash_withdrawals w
      JOIN customers c ON c.id = w.customer_id
      JOIN users u ON u.id = c.user_id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT w.*, 
             u.full_name as customer_name, 
             u.email as customer_email, 
             u.phone as customer_phone,
             c.customer_reference, 
             c.balance as current_balance, 
             c.kyc_status,
             c.account_operational_status,
             admin_u.full_name as reviewed_by_name,
             (SELECT file_url FROM kyc_documents kd WHERE kd.customer_id = c.id AND kd.doc_type = 'signature' LIMIT 1) as customer_signature_url
      FROM cash_withdrawals w
      JOIN customers c ON c.id = w.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = w.reviewed_by_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN w.status = 'Pending' THEN 1
          WHEN w.status = 'Under Review' THEN 2
          WHEN w.status = 'Approved' THEN 3
          WHEN w.status = 'Processing' THEN 4
          ELSE 5
        END,
        w.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(parseInt(limit, 10), offset);
    const result = await db.query(query, params);

    // Global withdrawal stats across the entire bank
    const statsRes = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending_count,
        COUNT(*) FILTER (WHERE status IN ('Under Review', 'Approved', 'Processing')) AS review_count,
        COUNT(*) FILTER (WHERE status = 'Completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'Rejected') AS rejected_count
      FROM cash_withdrawals
    `);
    const statsRow = statsRes.rows[0] || {};
    const stats = {
      pending: parseInt(statsRow.pending_count || 0, 10),
      under_review: parseInt(statsRow.review_count || 0, 10),
      completed: parseInt(statsRow.completed_count || 0, 10),
      rejected: parseInt(statsRow.rejected_count || 0, 10),
    };

    res.json({
      success: true,
      withdrawals: result.rows,
      stats,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get single withdrawal details including KYC signature comparison
 */
async function getAdminWithdrawalDetails(req, res, next) {
  try {
    const { id } = req.params;
    const query = `
      SELECT w.*, 
             u.full_name as customer_name, 
             u.email as customer_email, 
             u.phone as customer_phone,
             c.customer_reference, 
             c.balance as current_balance, 
             c.kyc_status,
             c.account_type,
             c.account_operational_status,
             admin_u.full_name as reviewed_by_name,
             (SELECT file_url FROM kyc_documents kd WHERE kd.customer_id = c.id AND kd.doc_type = 'signature' LIMIT 1) as customer_signature_url,
             (SELECT file_url FROM kyc_documents kd WHERE kd.customer_id = c.id AND kd.doc_type = 'applicant_photo' LIMIT 1) as customer_photo_url
      FROM cash_withdrawals w
      JOIN customers c ON c.id = w.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = w.reviewed_by_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      WHERE w.id = $1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'উত্তোলন রেকর্ড পাওয়া যায়নি।' });
    }

    res.json({
      success: true,
      withdrawal: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Process Withdrawal Decision & Cash Payment
 * Statuses: 'Pending', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'
 */
async function updateWithdrawalStatus(req, res, next) {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { status, remarks = '' } = req.body;

    const validStatuses = ['Pending', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `অবৈধ স্ট্যাটাস। গ্রহণযোগ্য স্ট্যাটাসসমূহ: ${validStatuses.join(', ')}`
      });
    }

    // Find admin profile
    const adminRes = await client.query(
      `SELECT a.id, u.full_name FROM admins a JOIN users u ON u.id = a.user_id WHERE a.user_id = $1`,
      [req.user.id]
    );
    const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;
    const adminName = adminRes.rows.length > 0 ? adminRes.rows[0].full_name : 'Bank Officer';

    await client.query('BEGIN');

    // Fetch and lock withdrawal record
    const withRes = await client.query(
      `SELECT w.*, c.user_id as customer_user_id, c.balance as current_balance, c.account_number 
       FROM cash_withdrawals w 
       JOIN customers c ON c.id = w.customer_id 
       WHERE w.id = $1 FOR UPDATE`,
      [id]
    );

    if (withRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'উত্তোলন রেকর্ড পাওয়া যায়নি।' });
    }

    const currentWithdrawal = withRes.rows[0];

    // Prevent double processing if already completed
    if (currentWithdrawal.status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'এই উত্তোলনের ক্যাশ পেমেন্ট ইতিমধ্যে সম্পন্ন (Completed) করা হয়েছে। পুনরায় পরিবর্তন করা যাবে না।'
      });
    }

    let updatedBalance = parseFloat(currentWithdrawal.current_balance);

    // If status is COMPLETED -> Debit Balance & Record Debit Transaction
    if (status === 'Completed') {
      const withdrawAmount = parseFloat(currentWithdrawal.amount);
      if (updatedBalance < withdrawAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `অপর্যাপ্ত ব্যালেন্স! গ্রাহকের বর্তমান ব্যালেন্স ৳${updatedBalance.toFixed(2)}, কিন্তু চেকের পরিমাণ ৳${withdrawAmount.toFixed(2)}। ক্যাশ পেমেন্ট সম্পন্ন করা সম্ভব নয়।`
        });
      }

      // Debit customer balance
      const debitRes = await client.query(
        `UPDATE customers 
         SET balance = balance - $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING balance`,
        [withdrawAmount, currentWithdrawal.customer_id]
      );
      updatedBalance = parseFloat(debitRes.rows[0].balance);

      // Record transaction in real_transactions
      const timestamp = Date.now();
      const txnNumber = `TXN-WTH-${timestamp}-${currentWithdrawal.customer_id}`;
      await client.query(
        `INSERT INTO real_transactions (
           transaction_number, customer_id, account_number, type, amount,
           counterparty_account, counterparty_name, reference, balance_after
         )
         VALUES ($1, $2, $3, 'Withdrawal', $4, 'CASH_COUNTER', $5, $6, $7)`,
        [
          txnNumber,
          currentWithdrawal.customer_id,
          currentWithdrawal.account_number,
          withdrawAmount,
          currentWithdrawal.payee_name || 'Cash Withdrawal',
          `Cheque #${currentWithdrawal.cheque_number} (${currentWithdrawal.withdrawal_reference})`,
          updatedBalance
        ]
      );
    }

    // Update cash_withdrawals record
    const updateRes = await client.query(
      `UPDATE cash_withdrawals 
       SET status = $1, 
           admin_remarks = $2, 
           reviewed_by_admin_id = $3, 
           processed_at = ${status === 'Completed' ? 'NOW()' : 'processed_at'}, 
           updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [status, remarks, adminId, id]
    );
    const updated = updateRes.rows[0];

    // Notification to Customer
    let notifTitle = `নগদ উত্তোলনের স্ট্যাটাস: ${status}`;
    let notifMsg = `আপনার ক্যাশ উত্তোলনের আবেদন (${currentWithdrawal.withdrawal_reference}) এর স্ট্যাটাস '${status}'-এ পরিবর্তিত হয়েছে।`;
    if (status === 'Completed') {
      notifTitle = 'নগদ উত্তোলন সফল ও ক্যাশ পরিশোধিত';
      notifMsg = `চেক #${currentWithdrawal.cheque_number} এর বিপরীতে ৳${parseFloat(currentWithdrawal.amount).toFixed(2)} নগদ পরিশোধ সম্পন্ন হয়েছে। আপনার অবশিষ্ট ব্যালেন্স ৳${updatedBalance.toFixed(2)}। রসিদ সংগ্রহ করুন।`;
    } else if (status === 'Rejected') {
      notifTitle = 'নগদ উত্তোলনের আবেদন বাতিল';
      notifMsg = `আপনার ক্যাশ উত্তোলনের আবেদন (${currentWithdrawal.withdrawal_reference}) বাতিল করা হয়েছে। কারণ: ${remarks || 'চেক বা স্বাক্ষরে অসামঞ্জস্যতা'}।`;
    }

    await client.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, $2, $3)`,
      [currentWithdrawal.customer_user_id, notifTitle, notifMsg]
    );

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CASH_WITHDRAWAL_STATUS_UPDATE', 'cash_withdrawals', $2, $3, $4)`,
      [
        req.user.id,
        String(id),
        JSON.stringify({
          new_status: status,
          remarks,
          admin_name: adminName,
          withdrawal_reference: currentWithdrawal.withdrawal_reference,
          amount: currentWithdrawal.amount
        }),
        req.ip || '127.0.0.1'
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `উত্তোলনের স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।`,
      withdrawal: updated,
      new_balance: updatedBalance
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  submitWithdrawal,
  getMyWithdrawals,
  getWithdrawalReceipt,
  getAdminWithdrawals,
  getAdminWithdrawalDetails,
  updateWithdrawalStatus
};

