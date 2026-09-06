const express = require('express');
const db = require('../config/database');
const alchemyService = require('../services/alchemy');
const riskEngine = require('../services/riskEngine');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/latest', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const txs = db.prepare(`
      SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?
    `).all(limit);
    res.json(txs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:hash', authenticate, async (req, res) => {
  try {
    const { hash } = req.params;

    // Try DB first
    let tx = db.prepare('SELECT * FROM transactions WHERE tx_hash = ?').get(hash);

    if (!tx) {
      // Fetch from Alchemy
      const alchemyTx = await alchemyService.getTransaction(hash);
      if (!alchemyTx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      let walletHistory = [];
      try {
        walletHistory = await alchemyService.getAssetTransfers({ fromAddress: alchemyTx.from, maxCount: '0x14' });
      } catch (e) {}

      const risk = riskEngine.calculateRiskScore(alchemyTx, walletHistory);

      tx = {
        tx_hash: alchemyTx.hash,
        from_address: alchemyTx.from,
        to_address: alchemyTx.to,
        value_eth: alchemyTx.value,
        gas_price: alchemyTx.gasPrice,
        gas_used: alchemyTx.gasUsed,
        block_number: alchemyTx.blockNumber,
        timestamp: Math.floor(Date.now()/1000),
        risk_score: risk.score,
        risk_level: risk.level,
        status: alchemyTx.status
      };
    }

    const factors = db.prepare('SELECT * FROM risk_factors WHERE tx_hash = ?').all(hash);

    res.json({ ...tx, factors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:hash/risk', authenticate, async (req, res) => {
  try {
    const { hash } = req.params;
    const factors = db.prepare('SELECT * FROM risk_factors WHERE tx_hash = ?').all(hash);
    const tx = db.prepare('SELECT risk_score, risk_level FROM transactions WHERE tx_hash = ?').get(hash);
    res.json({ tx, factors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { txHash } = req.body;
    const alchemyTx = await alchemyService.getTransaction(txHash);
    if (!alchemyTx) {
      return res.status(404).json({ error: 'Transaction not found on blockchain' });
    }

    let walletHistory = [];
    try {
      walletHistory = await alchemyService.getAssetTransfers({ fromAddress: alchemyTx.from, maxCount: '0x14' });
    } catch (e) {}

    const risk = riskEngine.calculateRiskScore(alchemyTx, walletHistory);

    // Save
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions 
      (tx_hash, from_address, to_address, value_eth, gas_price, block_number, timestamp, risk_score, risk_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(alchemyTx.hash, alchemyTx.from, alchemyTx.to, alchemyTx.value, 
             alchemyTx.gasPrice, alchemyTx.blockNumber, Math.floor(Date.now()/1000), 
             risk.score, risk.level, alchemyTx.status);

    riskEngine.saveRiskFactors(alchemyTx.hash, risk.factors);

    res.json({ transaction: alchemyTx, risk, factors: risk.factors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
