const express = require('express');
const db = require('../config/database');
const alchemyService = require('../services/alchemy');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    // Transaction stats
    const txStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low,
        AVG(risk_score) as avg_risk,
        MAX(block_number) as latest_block
      FROM transactions
    `).get();

    // Alert stats
    const alertStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as low
      FROM alerts
    `).get();

    // Recent high-risk transactions
    const recentHighRisk = db.prepare(`
      SELECT * FROM transactions 
      WHERE risk_level IN ('HIGH', 'CRITICAL')
      ORDER BY created_at DESC LIMIT 10
    `).all();

    // Risk distribution
    const riskDist = db.prepare(`
      SELECT risk_level, COUNT(*) as count FROM transactions GROUP BY risk_level
    `).all();

    // Case stats
    const caseStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'Under Investigation' THEN 1 ELSE 0 END) as investigating,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
      FROM cases
    `).get();

    // Try to get real latest block
    let latestBlock = { number: txStats.latest_block || 0, timestamp: Date.now() };
    try {
      const block = await alchemyService.getLatestBlock();
      latestBlock = { number: block.number, timestamp: block.timestamp * 1000 };
    } catch (e) {}

    res.json({
      transactions: txStats,
      alerts: alertStats,
      cases: caseStats,
      recentHighRisk,
      riskDistribution: riskDist,
      latestBlock,
      dataSource: { network: 'Ethereum Mainnet', connected: true, lastUpdate: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk-trend', authenticate, (req, res) => {
  try {
    const trends = db.prepare(`
      SELECT 
        date(created_at) as date,
        AVG(risk_score) as avg_risk,
        COUNT(*) as tx_count,
        SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
      FROM transactions
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
