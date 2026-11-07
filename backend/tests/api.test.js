const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Smart Banking Backend Unit & Integration Tests', () => {

  after(async () => {
    await db.pool.end();
  });

  test('Database connectivity check', async () => {
    const res = await db.query('SELECT 1 + 1 AS solution');
    assert.strictEqual(parseInt(res.rows[0].solution, 10), 2);
  });

  test('Database has seeded services', async () => {
    const res = await db.query('SELECT COUNT(*) FROM services WHERE is_active = TRUE');
    const count = parseInt(res.rows[0].count, 10);
    assert.ok(count >= 10, 'Expected at least 10 banking services');
  });

  test('Database has seeded users with valid bcrypt password', async () => {
    const res = await db.query("SELECT * FROM users WHERE email = 'customer@smartbank.com'");
    assert.strictEqual(res.rows.length, 1);
    const user = res.rows[0];
    const isMatch = await bcrypt.compare('Password123!', user.password_hash);
    assert.strictEqual(isMatch, true, 'Default seed password should verify');
  });

  test('Database enforces role-based constraint on users', async () => {
    try {
      await db.query("INSERT INTO users (full_name, email, password_hash, role) VALUES ('Test', 'invalid_role@test.com', 'hash', 'HACKER')");
      assert.fail('Should have failed check constraint on role');
    } catch (err) {
      assert.ok(err.message.includes('check constraint') || err.code === '23514');
    }
  });

  test('Service requests have required columns and valid statuses', async () => {
    const res = await db.query('SELECT id, request_number, status FROM service_requests LIMIT 5');
    assert.ok(res.rows.length > 0);
    const validStatuses = [
      'Draft', 'Submitted', 'Document Review', 'AI Validation',
      'Pending Admin Review', 'Correction Required', 'Approved',
      'Rejected', 'Completed', 'Cancelled'
    ];
    res.rows.forEach(r => {
      assert.ok(validStatuses.includes(r.status), `Invalid status ${r.status}`);
    });
  });

  test('AI validation service returns structured response', async () => {
    const aiService = require('../src/services/aiValidationService');
    const result = await aiService.validateDocumentWithAI({
      documentTypeName: 'National ID',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      mimeType: 'image/jpeg',
      originalName: 'test_nid.jpg'
    });

    assert.ok(result.readability_status);
    assert.ok(result.completeness_status);
    assert.strictEqual(typeof result.possible_mismatch, 'boolean');
    assert.ok(typeof result.confidence === 'number');
    assert.ok(Array.isArray(result.issues));
    assert.ok(result.summary);
    assert.ok(result.recommendation);
  });

  test('Cloudinary service configuration check', () => {
    const { isConfigured } = require('../src/config/cloudinary');
    assert.strictEqual(isConfigured, true, 'Cloudinary credentials should be configured');
  });

});
