const WebSocket = require('ws');
const alchemyService = require('./alchemy');
const riskEngine = require('./riskEngine');
const db = require('../config/database');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.alchemyWS = null;
    this.isConnected = false;
    this.reconnectInterval = null;
    this.setupWSS();
  }

  setupWSS() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.send(JSON.stringify({ type: 'status', data: { connected: this.isConnected } }));

      ws.on('close', () => this.clients.delete(ws));
      ws.on('error', () => this.clients.delete(ws));
    });
  }

  broadcast(data) {
    const msg = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  connectAlchemy() {
    if (this.alchemyWS) {
      try { this.alchemyWS.close(); } catch (e) {}
    }

    const wsUrl = alchemyService.getWebSocketURL();
    if (!wsUrl || wsUrl.includes('demo_key')) {
      console.log('Alchemy WebSocket: No valid API key, running in demo/polling mode');
      this.startPollingMode();
      return;
    }

    try {
      this.alchemyWS = new WebSocket(wsUrl);

      this.alchemyWS.on('open', () => {
        console.log('Alchemy WebSocket connected');
        this.isConnected = true;
        this.broadcast({ type: 'status', data: { connected: true, source: 'alchemy' } });

        // Subscribe to pending transactions
        this.alchemyWS.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: ['alchemy_minedTransactions', { includeRemoved: false, hashesOnly: false }]
        }));
      });

      this.alchemyWS.on('message', async (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.params?.result?.transaction) {
            const tx = msg.params.result.transaction;
            await this.processTransaction(tx);
          }
        } catch (e) {}
      });

      this.alchemyWS.on('close', () => {
        console.log('Alchemy WebSocket closed');
        this.isConnected = false;
        this.broadcast({ type: 'status', data: { connected: false } });
        setTimeout(() => this.connectAlchemy(), 5000);
      });

      this.alchemyWS.on('error', (err) => {
        console.error('Alchemy WS error:', err.message);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to connect Alchemy WS:', error.message);
      this.startPollingMode();
    }
  }

  startPollingMode() {
    console.log('Starting polling mode for live data...');
    this.broadcast({ type: 'status', data: { connected: true, source: 'polling', mode: 'demo' } });

    // Poll latest block every 12 seconds
    this.reconnectInterval = setInterval(async () => {
      try {
        const block = await alchemyService.getLatestBlock();
        if (block && block.transactions) {
          const recentTxs = block.transactions.slice(0, 5);
          for (const tx of recentTxs) {
            await this.processTransaction(tx);
          }
        }
      } catch (e) {}
    }, 12000);
  }

  async processTransaction(tx) {
    try {
      const valueEth = tx.value ? parseInt(tx.value, 16) / 1e18 : 0;
      const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) / 1e9 : 0;

      const txData = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueEth,
        gasPrice: gasPrice,
        gasLimit: parseInt(tx.gas, 16),
        blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
        input: tx.input,
        status: 'pending'
      };

      // Get wallet history for risk calculation
      let walletHistory = [];
      try {
        const transfers = await alchemyService.getAssetTransfers({ 
          fromAddress: tx.from, 
          maxCount: '0x14' 
        });
        walletHistory = transfers || [];
      } catch (e) {}

      const risk = riskEngine.calculateRiskScore(txData, walletHistory);

      // Save to DB
      try {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO transactions 
          (tx_hash, from_address, to_address, value_eth, gas_price, block_number, timestamp, risk_score, risk_level, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(tx.hash, tx.from, tx.to, valueEth, gasPrice, txData.blockNumber, 
                 Math.floor(Date.now()/1000), risk.score, risk.level, 'confirmed');

        riskEngine.saveRiskFactors(tx.hash, risk.factors);
      } catch (e) {}

      // Check for alerts
      if (risk.score >= 60) {
        try {
          const alertStmt = db.prepare(`
            INSERT INTO alerts (alert_type, severity, title, description, tx_hash, wallet_address, risk_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          alertStmt.run(
            'RISK_DETECTED',
            risk.level,
            `${risk.level} Risk Transaction Detected`,
            `Transaction ${tx.hash.slice(0, 20)}... scored ${risk.score}/100`,
            tx.hash,
            tx.from,
            risk.score
          );
        } catch (e) {}
      }

      this.broadcast({
        type: 'transaction',
        data: {
          ...txData,
          riskScore: risk.score,
          riskLevel: risk.level,
          factors: risk.factors,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Process transaction error:', error.message);
    }
  }

  getStatus() {
    return { connected: this.isConnected, clients: this.clients.size };
  }
}

module.exports = WebSocketService;
