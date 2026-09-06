const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = `SELECT c.*, u.full_name as assigned_name 
                 FROM cases c LEFT JOIN users u ON c.assigned_to = u.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY c.created_at DESC';

    const cases = db.prepare(query).all(...params);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const caseData = db.prepare(`
      SELECT c.*, u.full_name as assigned_name 
      FROM cases c LEFT JOIN users u ON c.assigned_to = u.id 
      WHERE c.id = ?
    `).get(id);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, priority, transactions, wallets } = req.body;
    const caseNumber = 'AC-' + Date.now().toString(36).toUpperCase();

    const result = db.prepare(`
      INSERT INTO cases (case_number, title, description, priority, assigned_to, transactions, wallets, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
    `).run(caseNumber, title, description, priority || 'MEDIUM', req.user.id, 
           JSON.stringify(transactions || []), JSON.stringify(wallets || []));

    // Audit log
    db.prepare(`
      INSERT INTO audit_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run('CASE_CREATED', 'case', caseNumber, req.user.id, `Created case: ${title}`);

    res.status(201).json({ id: result.lastInsertRowid, caseNumber, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, evidence, assigned_to } = req.body;

    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes) { updates.push('notes = ?'); params.push(notes); }
    if (evidence) { updates.push('evidence = ?'); params.push(JSON.stringify(evidence)); }
    if (assigned_to) { updates.push('assigned_to = ?'); params.push(assigned_to); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
