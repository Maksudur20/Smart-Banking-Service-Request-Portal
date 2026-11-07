const db = require('../config/database');
const { uploadFileBuffer } = require('../services/cloudinaryService');

/**
 * Generate unique Account Closure reference code
 */
function generateClosureRequestNumber(id) {
  const year = new Date().getFullYear();
  const paddedId = String(id).padStart(5, '0');
  return `AC-${year}-${paddedId}`;
}

/**
 * Submit Account Closure Request (Customer)
 */
async function submitClosureRequest(req, res, next) {
  const client = await db.getClient();
  try {
    const userId = req.user.id;
    const { closure_reason, settlement_method, settlement_account_details, customer_confirmation } = req.body;

    if (!closure_reason || !closure_reason.trim()) {
      return res.status(400).json({ success: false, message: 'অ্যাকাউন্ট বন্ধ করার সুনির্দিষ্ট কারণ উল্লেখ করতে হবে।' });
    }

    // Fetch customer details
    const custRes = await client.query(
      `SELECT c.*, u.full_name, u.email, u.phone 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.user_id = $1`,
      [userId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'গ্রাহক তথ্য পাওয়া যায়নি।' });
    }

    const customer = custRes.rows[0];

    if (customer.account_operational_status === 'Closed') {
      return res.status(400).json({ success: false, message: 'এই অ্যাকাউন্টটি ইতিমধ্যে বন্ধ (Closed) রয়েছে।' });
    }

    // Check if an active closure request already exists
    const existingReq = await client.query(
      `SELECT id, request_number, status 
       FROM account_closure_requests 
       WHERE customer_id = $1 AND status NOT IN ('Closed', 'Rejected')`,
      [customer.id]
    );

    if (existingReq.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `আপনার একটি অ্যাকাউন্ট ক্লোজার আবেদন (${existingReq.rows[0].request_number}) ইতিমধ্যে প্রসেসিংয়ে রয়েছে (স্ট্যাটাস: ${existingReq.rows[0].status})।`
      });
    }

    // Look up dynamic Schedule of Charges closing fee for this account type
    const feeRes = await client.query(
      `SELECT fee_amount, vat_percentage 
       FROM closure_fee_schedules 
       WHERE account_type = $1 OR account_type = 'Savings' 
       ORDER BY (account_type = $1) DESC 
       LIMIT 1`,
      [customer.account_type]
    );

    const feeAmount = feeRes.rows.length > 0 ? parseFloat(feeRes.rows[0].fee_amount) : 200.00;
    const vatPercent = feeRes.rows.length > 0 ? parseFloat(feeRes.rows[0].vat_percentage) : 15.00;
    const vatAmount = parseFloat(((feeAmount * vatPercent) / 100).toFixed(2));
    const currentBalance = parseFloat(customer.balance || 0);

    await client.query('BEGIN');

    // Insert request record
    const insertRes = await client.query(
      `INSERT INTO account_closure_requests (
        request_number, customer_id, account_number, account_holder_name,
        registered_mobile, account_type, closure_reason, current_balance,
        settlement_method, settlement_account_details, customer_confirmation,
        closing_fee, vat_amount, status
      ) VALUES (
        'PENDING_GEN', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Request Submitted'
      ) RETURNING id`,
      [
        customer.id,
        customer.account_number,
        customer.full_name,
        customer.phone || 'N/A',
        customer.account_type,
        closure_reason.trim(),
        currentBalance,
        settlement_method || 'CASH_COUNTER',
        settlement_account_details || null,
        customer_confirmation !== 'false' && customer_confirmation !== false,
        feeAmount,
        vatAmount
      ]
    );

    const closureId = insertRes.rows[0].id;
    const requestNumber = generateClosureRequestNumber(closureId);

    await client.query(
      `UPDATE account_closure_requests SET request_number = $1 WHERE id = $2`,
      [requestNumber, closureId]
    );

    // Process and upload attached documents
    const files = req.files || {};
    const docMeta = [
      { field: 'doc_nid', type: 'Account Holder NID', title: 'Account Holder National ID' },
      { field: 'doc_application', type: 'Closure Application', title: 'Signed Account Closure Application' },
      { field: 'doc_signature', type: 'Signature Specimen', title: 'Customer Signature Specimen' },
      { field: 'doc_unused_cheques', type: 'Unused Cheques', title: 'Unused Cheque Book / Leaves' },
      { field: 'doc_debit_card', type: 'Debit Card Surrender', title: 'Surrendered Debit Card / Slip' },
      { field: 'doc_additional', type: 'Additional Documents', title: 'Supporting Document' }
    ];

    const uploadedDocs = [];

    for (const item of docMeta) {
      const fileArr = files[item.field];
      if (fileArr && fileArr[0]) {
        const file = fileArr[0];
        try {
          const uploadRes = await uploadFileBuffer(file.buffer, {
            folder: 'account_closures',
            tags: ['account_closure', requestNumber, item.type]
          });

          const docInsert = await client.query(
            `INSERT INTO account_closure_documents (
              closure_request_id, document_type, title, file_url, public_id, file_name, file_size, mime_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
              closureId,
              item.type,
              item.title,
              uploadRes.secure_url,
              uploadRes.public_id,
              file.originalname,
              file.size,
              file.mimetype
            ]
          );
          uploadedDocs.push(docInsert.rows[0]);
        } catch (uploadErr) {
          console.warn(`[Closure Doc Upload Error for ${item.field}]:`, uploadErr.message);
        }
      }
    }

    // In-app notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        userId,
        'Account Closure Request Submitted',
        `Your Account Closure Request (${requestNumber}) for account ${customer.account_number} has been submitted successfully. Bank administration is reviewing your documents and checking liabilities.`
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ACCOUNT_CLOSURE_REQUEST', 'account_closure_requests', $2, $3)`,
      [
        userId,
        String(closureId),
        JSON.stringify({
          request_number: requestNumber,
          account_number: customer.account_number,
          current_balance: currentBalance,
          documents_uploaded: uploadedDocs.length
        })
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'অ্যাকাউন্ট ক্লোজার আবেদন সফলভাবে জমা দেওয়া হয়েছে। ব্যাংক অ্যাডমিন এটি যাচাই করছেন।',
      request: {
        id: closureId,
        request_number: requestNumber,
        status: 'Request Submitted',
        current_balance: currentBalance,
        documents_count: uploadedDocs.length
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Get current customer's account closure requests
 */
async function getMyClosureRequests(req, res, next) {
  try {
    const userId = req.user.id;

    const custRes = await db.query(
      `SELECT id, account_number, account_operational_status, balance FROM customers WHERE user_id = $1`,
      [userId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'গ্রাহক তথ্য পাওয়া যায়নি।' });
    }

    const customer = custRes.rows[0];

    const requestsRes = await db.query(
      `SELECT acr.*, 
              (SELECT COUNT(*) FROM account_closure_documents WHERE closure_request_id = acr.id) as document_count
       FROM account_closure_requests acr
       WHERE acr.customer_id = $1
       ORDER BY acr.created_at DESC`,
      [customer.id]
    );

    // Fetch fee schedule for transparency
    const feeRes = await db.query(`SELECT * FROM closure_fee_schedules ORDER BY fee_amount ASC`);

    res.json({
      success: true,
      customer: {
        account_number: customer.account_number,
        account_operational_status: customer.account_operational_status,
        balance: parseFloat(customer.balance || 0)
      },
      requests: requestsRes.rows,
      fee_schedules: feeRes.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get details of a single closure request
 */
async function getClosureRequestById(req, res, next) {
  try {
    const { id } = req.params;

    const reqRes = await db.query(
      `SELECT acr.*, c.customer_reference, u.email as customer_email, u.phone as customer_phone
       FROM account_closure_requests acr
       JOIN customers c ON c.id = acr.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE acr.id = $1`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'আবেদনটি পাওয়া যায়নি।' });
    }

    const requestData = reqRes.rows[0];

    // Check authorization: customer can only view own request
    if (req.user.role === 'CUSTOMER' && requestData.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'অ্যাক্সেস অস্বীকৃত।' });
    }

    const docsRes = await db.query(
      `SELECT * FROM account_closure_documents WHERE closure_request_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      request: requestData,
      documents: docsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all closure requests with filtering
 */
async function adminGetAllClosureRequests(req, res, next) {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT acr.*, c.customer_reference, u.email as customer_email,
             (SELECT COUNT(*) FROM account_closure_documents WHERE closure_request_id = acr.id) as document_count
      FROM account_closure_requests acr
      JOIN customers c ON c.id = acr.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND acr.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (acr.request_number ILIKE $${params.length} OR acr.account_number ILIKE $${params.length} OR acr.account_holder_name ILIKE $${params.length} OR c.customer_reference ILIKE $${params.length})`;
    }

    query += ` ORDER BY acr.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      total: result.rows.length,
      requests: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update verification checklist for a closure request
 */
async function adminUpdateChecklist(req, res, next) {
  try {
    const { id } = req.params;
    const {
      identity_verified,
      signature_verified,
      balance_checked,
      liabilities_checked,
      unused_cheques_returned,
      card_returned,
      admin_remarks
    } = req.body;

    const updateRes = await db.query(
      `UPDATE account_closure_requests
       SET identity_verified = COALESCE($1, identity_verified),
           signature_verified = COALESCE($2, signature_verified),
           balance_checked = COALESCE($3, balance_checked),
           liabilities_checked = COALESCE($4, liabilities_checked),
           unused_cheques_returned = COALESCE($5, unused_cheques_returned),
           card_returned = COALESCE($6, card_returned),
           admin_remarks = COALESCE($7, admin_remarks),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        identity_verified,
        signature_verified,
        balance_checked,
        liabilities_checked,
        unused_cheques_returned,
        card_returned,
        admin_remarks,
        id
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'আবেদনটি পাওয়া যায়নি।' });
    }

    res.json({
      success: true,
      message: 'চেকলিস্ট সফলভাবে সংরক্ষিত হয়েছে।',
      request: updateRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Make decision on closure request
 * Supports: 'UNDER_REVIEW', 'REQUEST_DOCS', 'PENDING_SETTLEMENT', 'APPROVE', 'CLOSE', 'REJECT'
 */
async function adminDecideClosure(req, res, next) {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { action, remarks, custom_fee } = req.body;
    const adminId = req.user.admin_id;

    if (!action) {
      return res.status(400).json({ success: false, message: 'অ্যাকশন নির্ধারণ করুন।' });
    }

    const reqRes = await client.query(
      `SELECT acr.*, c.user_id, c.balance as latest_balance, c.account_operational_status as op_status 
       FROM account_closure_requests acr 
       JOIN customers c ON c.id = acr.customer_id 
       WHERE acr.id = $1`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'আবেদনটি পাওয়া যায়নি।' });
    }

    const currentReq = reqRes.rows[0];

    if (currentReq.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'এই অ্যাকাউন্টটি ইতিমধ্যে চূড়ান্তভাবে বন্ধ (Closed) করা হয়েছে।' });
    }

    await client.query('BEGIN');

    let newStatus = currentReq.status;
    let notifTitle = '';
    let notifMsg = '';

    const effectiveAction = action.toUpperCase();

    if (effectiveAction === 'UNDER_REVIEW') {
      newStatus = 'Under Review';
      notifTitle = 'Account Closure Under Review';
      notifMsg = `Your Account Closure Request (${currentReq.request_number}) is now under active review by bank officers.`;
      
      await client.query(
        `UPDATE account_closure_requests 
         SET status = $1, admin_remarks = COALESCE($2, admin_remarks), updated_at = NOW() 
         WHERE id = $3`,
        [newStatus, remarks, id]
      );
    } else if (effectiveAction === 'REQUEST_DOCS') {
      newStatus = 'Additional Documents Required';
      if (!remarks || !remarks.trim()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'অতিরিক্ত ডকুমেন্টের জন্য মন্তব্য/কারণ আবশ্যক।' });
      }
      notifTitle = 'Additional Closure Documents Required';
      notifMsg = `Bank officers require additional documents for closing account ${currentReq.account_number}. Officer note: "${remarks}".`;

      await client.query(
        `UPDATE account_closure_requests 
         SET status = $1, rejection_reason = $2, admin_remarks = $2, updated_at = NOW() 
         WHERE id = $3`,
        [newStatus, remarks, id]
      );
    } else if (effectiveAction === 'PENDING_SETTLEMENT') {
      newStatus = 'Pending Settlement';
      notifTitle = 'Account Closure - Pending Balance Settlement';
      notifMsg = `Your documents and liabilities have been verified. The remaining balance settlement is pending.`;

      await client.query(
        `UPDATE account_closure_requests 
         SET status = $1, admin_remarks = COALESCE($2, admin_remarks), updated_at = NOW() 
         WHERE id = $3`,
        [newStatus, remarks, id]
      );
    } else if (effectiveAction === 'APPROVE') {
      newStatus = 'Approved';
      notifTitle = 'Account Closure Approved';
      notifMsg = `Your Account Closure Request (${currentReq.request_number}) has been approved. Final settlement and closure is being processed.`;

      await client.query(
        `UPDATE account_closure_requests 
         SET status = $1, admin_remarks = COALESCE($2, admin_remarks), reviewed_by_admin_id = $3, reviewed_at = NOW(), updated_at = NOW() 
         WHERE id = $4`,
        [newStatus, remarks, adminId || null, id]
      );
    } else if (effectiveAction === 'REJECT') {
      newStatus = 'Rejected';
      if (!remarks || !remarks.trim()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'বাতিল করার কারণ উল্লেখ করতে হবে।' });
      }
      notifTitle = 'Account Closure Request Rejected';
      notifMsg = `Your Account Closure Request (${currentReq.request_number}) has been rejected. Reason: "${remarks}".`;

      await client.query(
        `UPDATE account_closure_requests 
         SET status = $1, rejection_reason = $2, admin_remarks = $2, reviewed_by_admin_id = $3, reviewed_at = NOW(), updated_at = NOW() 
         WHERE id = $4`,
        [newStatus, remarks, adminId || null, id]
      );
    } else if (effectiveAction === 'CLOSE') {
      // FINAL PERMANENT ACCOUNT CLOSURE
      // 1. Verify 6-point condition checklist
      if (!currentReq.identity_verified || !currentReq.signature_verified || !currentReq.balance_checked || !currentReq.liabilities_checked) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'চূড়ান্ত ক্লোজ করার আগে পরিচয়, স্বাক্ষর, ব্যালেন্স ও দায়-দেনার চেকলিস্ট ভেরিফাই করতে হবে।'
        });
      }

      newStatus = 'Closed';

      // Determine closing fee from Schedule of Charges or custom fee
      let finalFee = parseFloat(currentReq.closing_fee || 0);
      let finalVat = parseFloat(currentReq.vat_amount || 0);

      if (custom_fee !== undefined && !isNaN(parseFloat(custom_fee))) {
        finalFee = parseFloat(custom_fee);
        finalVat = parseFloat(((finalFee * 0.15)).toFixed(2));
      }

      const totalDeduction = finalFee + finalVat;
      const originalBalance = parseFloat(currentReq.latest_balance || 0);
      const settledAmount = Math.max(0, parseFloat((originalBalance - totalDeduction).toFixed(2)));

      // 1. Update customer account to Closed and balance to 0.00
      await client.query(
        `UPDATE customers 
         SET account_operational_status = 'Closed', balance = 0.00, updated_at = NOW() 
         WHERE id = $1`,
        [currentReq.customer_id]
      );

      // 2. Record ledger transaction for settlement and closure
      const txNumber = `TXN${Date.now()}`;
      await client.query(
        `INSERT INTO real_transactions (
          transaction_number, customer_id, account_number, type, amount,
          counterparty_name, counterparty_account, reference, balance_after
        ) VALUES ($1, $2, $3, 'DEBIT', $4, 'Smart Bank Closure Settlement', $3, $5, 0.00)`,
        [
          txNumber,
          currentReq.customer_id,
          currentReq.account_number,
          originalBalance,
          `Account Closure Settlement (Fee: ${finalFee} BDT, VAT: ${finalVat} BDT, Settled: ${settledAmount} BDT)`
        ]
      );

      // 3. Update closure request record to Closed
      await client.query(
        `UPDATE account_closure_requests 
         SET status = 'Closed',
             closing_fee = $1,
             vat_amount = $2,
             settled_amount = $3,
             admin_remarks = COALESCE($4, admin_remarks),
             reviewed_by_admin_id = $5,
             reviewed_at = NOW(),
             closed_at = NOW(),
             updated_at = NOW()
         WHERE id = $6`,
        [finalFee, finalVat, settledAmount, remarks || 'Account permanently closed upon settlement.', adminId || null, id]
      );

      notifTitle = 'Account Permanently Closed';
      notifMsg = `Your Smart Banking Account (${currentReq.account_number}) is now officially Closed. Remaining settled amount: ${settledAmount} BDT. Account Closure Certificate has been generated.`;
    }

    // In-app notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [currentReq.user_id, notifTitle, notifMsg]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ACCOUNT_CLOSURE_DECISION', 'account_closure_requests', $2, $3)`,
      [
        req.user.id,
        String(id),
        JSON.stringify({ action, newStatus, remarks: remarks || null })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `আবেদনের স্ট্যাটাস পরিবর্তিত হয়েছে: ${newStatus}`,
      new_status: newStatus
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Get Schedule of Charges for closure fees
 */
async function getFeeSchedules(req, res, next) {
  try {
    const result = await db.query(`SELECT * FROM closure_fee_schedules ORDER BY id ASC`);
    res.json({ success: true, schedules: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Schedule of Charges for account type (Dynamic fee management, NOT hardcoded)
 */
async function adminUpdateFeeSchedule(req, res, next) {
  try {
    const { account_type, fee_amount, vat_percentage, description } = req.body;

    if (!account_type || fee_amount === undefined) {
      return res.status(400).json({ success: false, message: 'Account type এবং Fee amount আবশ্যক।' });
    }

    const result = await db.query(
      `INSERT INTO closure_fee_schedules (account_type, fee_amount, vat_percentage, description, updated_at)
       VALUES ($1, $2, COALESCE($3, 15.00), $4, NOW())
       ON CONFLICT (account_type) DO UPDATE
       SET fee_amount = EXCLUDED.fee_amount,
           vat_percentage = EXCLUDED.vat_percentage,
           description = COALESCE(EXCLUDED.description, closure_fee_schedules.description),
           updated_at = NOW()
       RETURNING *`,
      [account_type, parseFloat(fee_amount), vat_percentage ? parseFloat(vat_percentage) : 15.00, description || null]
    );

    res.json({
      success: true,
      message: 'Schedule of Charges ফি সফলভাবে হালনাগাদ করা হয়েছে।',
      schedule: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitClosureRequest,
  getMyClosureRequests,
  getClosureRequestById,
  adminGetAllClosureRequests,
  adminUpdateChecklist,
  adminDecideClosure,
  getFeeSchedules,
  adminUpdateFeeSchedule
};

