const db = require('../config/database');

/**
 * Execute an Outgoing Fund Transfer to another account
 * Strictly blocked at API-level if KYC is not Approved!
 */
async function executeTransfer(req, res, next) {
  const client = await db.getClient();
  try {
    const { receiver_account_number, recipient_account_number, recipient_account, amount, reference } = req.body;
    const cleanReceiverAcc = (receiver_account_number || recipient_account_number || recipient_account || '').trim();

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer amount must be a valid positive number.'
      });
    }

    if (!cleanReceiverAcc) {
      return res.status(400).json({
        success: false,
        message: 'Recipient account number is required.'
      });
    }

    await client.query('BEGIN');

    // Fetch and lock sender record
    const senderRes = await client.query(
      `SELECT c.*, u.full_name, u.email 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.user_id = $1 FOR UPDATE`,
      [req.user.id]
    );

    if (senderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Sender account not found.' });
    }

    const sender = senderRes.rows[0];

    // --- STRICT BACKEND KYC RESTRICTION ---
    if (sender.kyc_status !== 'Approved') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        code: 'KYC_RESTRICTED',
        kyc_status: sender.kyc_status,
        message: `Outgoing Fund Transfer Blocked: Your KYC verification status is '${sender.kyc_status}'. Transfers to other accounts are strictly restricted until bank officers review and approve your KYC documents.`
      });
    }

    // Check account operational status
    if (sender.account_operational_status === 'Closed') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_CLOSED',
        message: 'এই ব্যাংক অ্যাকাউন্টটি স্থায়ীভাবে বন্ধ (Closed) করা হয়েছে। কোনো লেনদেন বা ফান্ড ট্রান্সফার সম্ভব নয়।'
      });
    }

    if (sender.account_operational_status === 'Restricted' || sender.account_operational_status === 'Suspended') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_RESTRICTED',
        message: `Account operational status is '${sender.account_operational_status}'. Outgoing transactions are not permitted.`
      });
    }

    // Check self-transfer
    if (sender.account_number === cleanReceiverAcc) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer funds to your own account number.'
      });
    }

    // Check sender balance
    const currentBalance = parseFloat(sender.balance || 0);
    if (currentBalance < transferAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Your available balance is BDT ${currentBalance.toLocaleString()}, which is less than BDT ${transferAmount.toLocaleString()}.`
      });
    }

    // Find and lock receiver record
    const receiverRes = await client.query(
      `SELECT c.*, u.full_name, u.email 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.account_number = $1 FOR UPDATE`,
      [cleanReceiverAcc]
    );

    if (receiverRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Recipient account number '${cleanReceiverAcc}' does not exist in Smart Banking PLC.`
      });
    }

    const receiver = receiverRes.rows[0];

    if (receiver.account_operational_status === 'Closed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `প্রাপক অ্যাকাউন্ট নম্বর '${cleanReceiverAcc}' স্থায়ীভাবে বন্ধ (Closed) রয়েছে। এই অ্যাকাউন্টে কোনো ফান্ড পাঠানো যাবে না।`
      });
    }

    // Debit Sender
    const senderDebitRes = await client.query(
      `UPDATE customers 
       SET balance = balance - $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING balance`,
      [transferAmount, sender.id]
    );
    const senderNewBalance = parseFloat(senderDebitRes.rows[0].balance);

    // Credit Receiver
    const receiverCreditRes = await client.query(
      `UPDATE customers 
       SET balance = balance + $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING balance`,
      [transferAmount, receiver.id]
    );
    const receiverNewBalance = parseFloat(receiverCreditRes.rows[0].balance);

    const timestamp = Date.now();
    const senderTxnNumber = `TXN-OUT-${timestamp}-${sender.id}`;
    const receiverTxnNumber = `TXN-IN-${timestamp}-${receiver.id}`;

    // Record Sender Debit Transaction
    await client.query(
      `INSERT INTO real_transactions (
         transaction_number, customer_id, account_number, type, amount,
         counterparty_account, counterparty_name, reference, balance_after
       )
       VALUES ($1, $2, $3, 'Transfer_Out', $4, $5, $6, $7, $8)`,
      [
        senderTxnNumber,
        sender.id,
        sender.account_number,
        transferAmount,
        receiver.account_number,
        receiver.full_name,
        reference || 'Fund Transfer',
        senderNewBalance
      ]
    );

    // Record Receiver Credit Transaction
    await client.query(
      `INSERT INTO real_transactions (
         transaction_number, customer_id, account_number, type, amount,
         counterparty_account, counterparty_name, reference, balance_after
       )
       VALUES ($1, $2, $3, 'Transfer_In', $4, $5, $6, $7, $8)`,
      [
        receiverTxnNumber,
        receiver.id,
        receiver.account_number,
        transferAmount,
        sender.account_number,
        sender.full_name,
        reference || 'Fund Transfer Received',
        receiverNewBalance
      ]
    );

    // Notifications
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        sender.user_id,
        'Fund Transfer Successful',
        `Successfully transferred BDT ${transferAmount.toLocaleString()} to ${receiver.full_name} (A/C: ${receiver.account_number}). Remaining balance: BDT ${senderNewBalance.toLocaleString()}.`
      ]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        receiver.user_id,
        'Funds Received',
        `You have received BDT ${transferAmount.toLocaleString()} from ${sender.full_name} (A/C: ${sender.account_number}). New balance: BDT ${receiverNewBalance.toLocaleString()}.`
      ]
    );

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'FUND_TRANSFER', 'real_transactions', $2, $3)`,
      [
        req.user.id,
        senderTxnNumber,
        JSON.stringify({
          sender_account: sender.account_number,
          receiver_account: receiver.account_number,
          amount: transferAmount,
          reference: reference || null
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully transferred BDT ${transferAmount.toLocaleString()} to ${receiver.full_name}.`,
      transaction_number: senderTxnNumber,
      amount: transferAmount,
      remaining_balance: senderNewBalance,
      recipient: {
        account_number: receiver.account_number,
        name: receiver.full_name
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
 * Customer: Get full real transaction history (Deposits and Transfers)
 */
async function getMyTransactions(req, res, next) {
  try {
    const custRes = await db.query('SELECT id, account_number, balance FROM customers WHERE user_id = $1', [req.user.id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customer = custRes.rows[0];

    const result = await db.query(
      `SELECT * FROM real_transactions 
       WHERE customer_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [customer.id]
    );

    res.json({
      success: true,
      account_number: customer.account_number,
      current_balance: parseFloat(customer.balance || 0),
      count: result.rows.length,
      transactions: result.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  executeTransfer,
  getMyTransactions,
};
