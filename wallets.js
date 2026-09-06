const express = require('express');
const db = require('../config/database');
const alchemyService = require('../services/alchemy');
const riskEngine = require('../services/riskEngine');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/:address/intel', authenticate, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const balance = await alchemyService.getWalletBalance(address);
    const txCount = await alchemyService.getTransactionCount(address);

    let transfers = [];
    try {
      transfers = await alchemyService.getAssetTransfers({ 
        fromAddress: address, 
        maxCount: '0x64',
        excludeZeroValue: false
      });
    } catch (e) {}

    let toTransfers = [];
    try {
      toTransfers = await alchemyService.getAssetTransfers({ 
        toAddress: address, 
        maxCount: '0x64',
        excludeZeroValue: false
      });
    } catch (e) {}

    const allTransfers = [...transfers, ...toTransfers];

    const risk = riskEngine.calculateWalletRisk(address, balance, txCount, allTransfers);

    // Save/update wallet intel
    const existing = db.prepare('SELECT id FROM wallet_intel WHERE address = ?').get(address);
    if (existing) {
      db.prepare(`
        UPDATE wallet_intel SET 
          risk_score = ?, risk_level = ?, tx_count = ?, 
          total_received = ?, total_sent = ?, counterparties = ?, updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `).run(risk.score, risk.level, txCount, 
             allTransfers.filter(t => t.to?.toLowerCase() === address.toLowerCase()).reduce((s, t) => s + (parseFloat(t.value)||0), 0),
             allTransfers.filter(t => t.from?.toLowerCase() === address.toLowerCase()).reduce((s, t) => s + (parseFloat(t.value)||0), 0),
             risk.counterpartyCount, address);
    } else {
      db.prepare(`
        INSERT INTO wallet_intel (address, risk_score, risk_level, tx_count, counterparties)
        VALUES (?, ?, ?, ?, ?)
      `).run(address, risk.score, risk.level, txCount, risk.counterpartyCount);
    }

    // Get related transactions
    const relatedTxs = db.prepare(`
      SELECT * FROM transactions 
      WHERE from_address = ? OR to_address = ? 
      ORDER BY created_at DESC LIMIT 20
    `).all(address, address);

    res.json({
      address,
      balance,
      txCount,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskFactors: risk.factors,
      counterpartyCount: risk.counterpartyCount,
      recentTransfers: allTransfers.slice(0, 20),
      relatedTransactions: relatedTxs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:address/transfers', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const transfers = await alchemyService.getAssetTransfers({ 
      fromAddress: address, 
      maxCount: '0x64' 
    });
    res.json(transfers || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
