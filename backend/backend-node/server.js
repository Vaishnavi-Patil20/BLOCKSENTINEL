const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/live' });

app.use(cors());
app.use(express.json());

const ALCHEMY_WS_URL = process.env.ALCHEMY_WS_URL || '';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
const IS_CONFIGURED = ALCHEMY_API_KEY !== '' && ALCHEMY_WS_URL !== '';
const RISK_ALERT_THRESHOLD = Number(process.env.RISK_ALERT_THRESHOLD || 60);

let connectionState = {
  status: IS_CONFIGURED ? 'CONNECTING' : 'OFFLINE',
  network: 'ethereum-mainnet',
  provider: 'alchemy',
  subscription: 'alchemy_minedTransactions + alchemy_pendingTransactions',
  last_event_at: null,
  last_block: null,
  events_received: 0,
  events_processed: 0,
  reconnect_count: 0,
  connected_at: null,
  latency_ms: 0
};

const transactions = [];
const transactionByHash = new Map();
const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
const alerts = [];
const clients = new Set();
const MAX_TRANSACTIONS = 10000;
const MAX_ALERTS = 2000;

function currentMetrics() {
  return {
    transactions_processed: transactionByHash.size,
    high_risk: riskCounts.HIGH + riskCounts.CRITICAL,
    critical_risk: riskCounts.CRITICAL,
    medium_risk: riskCounts.MEDIUM,
    low_risk: riskCounts.LOW,
    alerts_open: alerts.filter(a => a.status === 'OPEN').length,
    total_alerts: alerts.length,
    risk_analyzed: Array.from(transactionByHash.values()).filter(t => t.risk).length,
    timestamp: new Date().toISOString()
  };
}

function broadcastMessage(message) {
  const data = JSON.stringify(message);
  clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(data);
  });
}

function broadcastTransaction(tx) {
  broadcastMessage({ type: 'transaction', data: tx, timestamp: new Date().toISOString() });
}

function broadcastStateAndMetrics() {
  broadcastMessage({ type: 'connection_state', data: connectionState });
  broadcastMessage({ type: 'metrics', data: currentMetrics() });
}

function makeAlert(tx) {
  if (!tx.risk || !['HIGH', 'CRITICAL'].includes(tx.risk.level) || tx.risk.score < RISK_ALERT_THRESHOLD) return null;
  const id = `alert_${tx.tx_hash}`;
  if (alerts.some(a => a.id === id)) return alerts.find(a => a.id === id);

  const alert = {
    id,
    title: `${tx.risk.level} Risk Transaction Detected`,
    description: tx.risk.explanation || `${tx.value_native.toFixed(4)} ETH transaction crossed the configured risk threshold.`,
    severity: tx.risk.level,
    tx_hash: tx.tx_hash,
    created_at: new Date().toISOString(),
    status: 'OPEN'
  };
  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();
  broadcastMessage({ type: 'alert', data: alert });
  return alert;
}

function applyRiskCounts(risk) {
  if (!risk || !risk.level || riskCounts[risk.level] === undefined) return;
  riskCounts[risk.level]++;
}

function removeRiskCounts(risk) {
  if (!risk || !risk.level || riskCounts[risk.level] === undefined) return;
  riskCounts[risk.level] = Math.max(0, riskCounts[risk.level] - 1);
}

function localRiskAnalysis(tx) {
  let score = 0;
  const factors = [];

  if (tx.value_native > 100) {
    score += 25;
    factors.push({ name: 'high_value', description: `Unusually high transaction value: ${tx.value_native.toFixed(4)} ETH`, weight: 25, category: 'heuristic' });
  } else if (tx.value_native > 10) {
    score += 12;
    factors.push({ name: 'elevated_value', description: `Elevated transaction value: ${tx.value_native.toFixed(4)} ETH`, weight: 12, category: 'heuristic' });
  }

  const inputSize = Math.max(0, Math.floor(((tx.input_data || '0x').length - 2) / 2));
  if (tx.is_contract_interaction && inputSize > 1000) {
    score += 10;
    factors.push({ name: 'complex_contract_call', description: `Complex contract interaction with ${inputSize} bytes calldata`, weight: 10, category: 'heuristic' });
  }

  if (tx.nonce > 10000) {
    score += 8;
    factors.push({ name: 'high_nonce', description: `Very high nonce: ${tx.nonce}`, weight: 8, category: 'statistical' });
  }

  if (!tx.to_address) {
    score += 20;
    factors.push({ name: 'contract_creation', description: 'Transaction creates a contract and has no recipient address', weight: 20, category: 'heuristic' });
  }

  if (tx.status === 'OBSERVED_PENDING' && tx.value_native > 5) {
    score += 12;
    factors.push({ name: 'pending_value', description: 'Pending transaction with elevated value', weight: 12, category: 'heuristic' });
  }

  if (tx.gas_limit > 300000) {
    score += 5;
    factors.push({ name: 'high_gas_limit', description: `High gas limit: ${tx.gas_limit.toLocaleString()}`, weight: 5, category: 'heuristic' });
  }

  score = Math.min(100, score);
  const level = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
  return {
    score,
    level,
    factors,
    model_name: 'BlockSentinel-Rule-Engine-v1',
    model_version: '1.0.0',
    feature_version: '1.0.0',
    confidence: factors.length ? Math.min(0.95, 0.60 + factors.length * 0.05) : 0.60,
    analyzed_at: new Date().toISOString(),
    explanation: factors.length
      ? `Risk calculated from ${factors.length} observable on-chain feature(s).`
      : 'No configured risk indicators were triggered by the observable transaction features.'
  };
}

async function analyzeRisk(tx) {
  const inputDataSize = Math.max(0, Math.floor(((tx.input_data || '0x').length - 2) / 2));
  const payload = {
    tx_hash: tx.tx_hash,
    value_native: tx.value_native,
    gas_limit: tx.gas_limit,
    gas_price: tx.gas_price,
    nonce: tx.nonce,
    input_data_size: inputDataSize,
    is_contract_interaction: tx.is_contract_interaction,
    from_tx_count: 0,
    to_tx_count: 0
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`ML service returned HTTP ${response.status}`);
    const risk = await response.json();
    return {
      ...risk,
      feature_version: risk.feature_version || '1.0.0'
    };
  } catch (error) {
    // Keep live ingestion available when the optional ML service is not running.
    // The fallback is deterministic and explicitly identified as a rule engine.
    return localRiskAnalysis(tx);
  }
}

async function processTransaction(txData, subscription) {
  if (!txData || !txData.hash) return;

  connectionState.events_received++;
  const receivedAt = new Date();
  connectionState.last_event_at = receivedAt.toISOString();

  const valueNative = Number.parseInt(txData.value || '0x0', 16) / 1e18;
  const blockNum = txData.blockNumber ? Number.parseInt(txData.blockNumber, 16) : null;
  const input = txData.input || '0x';

  const tx = {
    id: `tx_${txData.hash}`,
    tx_hash: txData.hash,
    chain_id: txData.chainId ? Number.parseInt(txData.chainId, 16) : 1,
    network: 'ethereum-mainnet',
    block_number: blockNum,
    block_hash: txData.blockHash || null,
    transaction_index: txData.transactionIndex ? Number.parseInt(txData.transactionIndex, 16) : null,
    from_address: (txData.from || '').toLowerCase(),
    to_address: txData.to ? txData.to.toLowerCase() : null,
    value_wei: txData.value || '0x0',
    value_native: valueNative,
    gas_limit: txData.gas ? Number.parseInt(txData.gas, 16) : 0,
    gas_price: txData.gasPrice || null,
    nonce: txData.nonce ? Number.parseInt(txData.nonce, 16) : 0,
    input_data: input,
    transaction_type: txData.type ? Number.parseInt(txData.type, 16) : 0,
    status: blockNum ? 'MINED' : 'OBSERVED_PENDING',
    is_contract_interaction: input.length > 2 && input !== '0x',
    first_seen_at: receivedAt.toISOString(),
    mined_at: blockNum ? receivedAt.toISOString() : null,
    source_provider: 'alchemy',
    source_subscription: subscription,
    received_at: receivedAt.toISOString(),
    ingestion_latency_ms: 0,
    processing_latency_ms: 0,
    risk: null
  };

  const existing = transactionByHash.get(tx.tx_hash);
  if (existing) {
    // A pending transaction can later arrive as mined. Update the same record instead of double-counting it.
    const wasRisked = existing.risk;
    const updated = {
      ...existing,
      ...tx,
      id: existing.id,
      first_seen_at: existing.first_seen_at,
      risk: wasRisked
    };
    if (wasRisked) updated.risk = wasRisked;
    transactionByHash.set(tx.tx_hash, updated);
    const idx = transactions.findIndex(t => t.tx_hash === tx.tx_hash);
    if (idx >= 0) transactions[idx] = updated;
    broadcastTransaction(updated);
    broadcastStateAndMetrics();
    return;
  }

  const risk = await analyzeRisk(tx);
  tx.risk = risk;
  tx.risk_score = risk.score;
  tx.risk_level = risk.level;
  tx.processing_latency_ms = Math.max(0, Date.now() - receivedAt.getTime());

  transactionByHash.set(tx.tx_hash, tx);
  transactions.unshift(tx);
  if (transactions.length > MAX_TRANSACTIONS) {
    const removed = transactions.pop();
    if (removed) {
      transactionByHash.delete(removed.tx_hash);
      removeRiskCounts(removed.risk);
    }
  }

  connectionState.events_processed = transactionByHash.size;
  applyRiskCounts(risk);

  console.log('[RISK]', tx.tx_hash.substring(0, 18) + '...', '|', `${risk.score}/100`, risk.level, '|', risk.model_name);
  broadcastTransaction(tx);
  makeAlert(tx);
  broadcastStateAndMetrics();
}

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connection_state', data: connectionState }));
  ws.send(JSON.stringify({ type: 'metrics', data: currentMetrics() }));
  ws.send(JSON.stringify({ type: 'snapshot', data: { transactions: transactions.slice(0, 500), alerts: alerts.slice(0, 200) } }));
  ws.on('close', () => clients.delete(ws));
});

let alchemyWs = null;
let reconnectAttempts = 0;

function connectAlchemy() {
  if (!IS_CONFIGURED) {
    console.log('[ALCHEMY] Not configured. Blockchain connection OFFLINE.');
    console.log('[ALCHEMY] Add ALCHEMY_API_KEY and ALCHEMY_WS_URL to ../.env');
    connectionState.status = 'OFFLINE';
    broadcastStateAndMetrics();
    return;
  }

  console.log('[ALCHEMY] Connecting...');
  connectionState.status = 'CONNECTING';
  broadcastStateAndMetrics();

  alchemyWs = new WebSocket(ALCHEMY_WS_URL);

  alchemyWs.on('open', () => {
    console.log('[ALCHEMY] WebSocket connected');
    connectionState.status = 'LIVE';
    connectionState.connected_at = new Date().toISOString();
    reconnectAttempts = 0;
    connectionState.reconnect_count = 0;
    broadcastStateAndMetrics();

    alchemyWs.send(JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_subscribe',
      params: ['alchemy_minedTransactions', { addresses: [], includeRemoved: true, hashesOnly: false }]
    }));

    alchemyWs.send(JSON.stringify({
      jsonrpc: '2.0', id: 2,
      method: 'eth_subscribe',
      params: ['alchemy_pendingTransactions', { addresses: [], includeRemoved: true, hashesOnly: false }]
    }));

    alchemyWs.send(JSON.stringify({
      jsonrpc: '2.0', id: 3,
      method: 'eth_subscribe',
      params: ['newHeads']
    }));
  });

  alchemyWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.id && msg.result) return;
      if (msg.method === 'eth_subscription') handleData(msg.params);
    } catch (e) {
      console.error('[ALCHEMY] Message parse error:', e.message);
    }
  });

  alchemyWs.on('close', () => {
    console.log('[ALCHEMY] Disconnected. Reconnecting...');
    connectionState.status = 'RECONNECTING';
    reconnectAttempts++;
    connectionState.reconnect_count = reconnectAttempts;
    broadcastStateAndMetrics();
    const backoff = Math.min(1000 * Math.pow(2, Math.min(reconnectAttempts, 5)), 30000);
    setTimeout(connectAlchemy, backoff);
  });

  alchemyWs.on('error', (err) => console.error('[ALCHEMY] Error:', err.message));
}

function handleData(params) {
  const result = params && params.result;
  if (!result) return;

  if (result.number) {
    connectionState.last_block = result.number;
    connectionState.last_event_at = new Date().toISOString();
    broadcastStateAndMetrics();
    return;
  }

  const txData = result.transaction || result;
  const subscription = result.transaction ? 'alchemy_minedTransactions' : 'alchemy_pendingTransactions';
  processTransaction(txData, subscription).catch(err => console.error('[PIPELINE] Transaction processing failed:', err.message));
}

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    services: {
      api: 'up',
      blockchain: connectionState.status === 'LIVE' ? 'connected' : 'offline',
      risk_engine: 'up',
      ml_service: ML_SERVICE_URL
    }
  });
});

app.get('/api/v1/health/blockchain', (req, res) => res.json(connectionState));

app.get('/api/v1/health/ml', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const body = await response.json();
    res.status(response.ok ? 200 : 503).json(body);
  } catch (error) {
    res.status(503).json({ status: 'unavailable', service: 'ml', error: error.message });
  }
});

app.get('/api/v1/transactions', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 1000);
  res.json({ transactions: transactions.slice(0, limit), count: transactionByHash.size });
});

app.get('/api/v1/transactions/:hash', (req, res) => {
  const tx = transactionByHash.get(req.params.hash);
  tx ? res.json(tx) : res.status(404).json({ error: 'Transaction not found', hash: req.params.hash });
});

app.get('/api/v1/alerts', (req, res) => {
  res.json({ alerts, count: alerts.length });
});

app.patch('/api/v1/alerts/:id', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found', id: req.params.id });

  const nextStatus = req.body && ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].includes(req.body.status)
    ? req.body.status
    : 'ACKNOWLEDGED';
  alert.status = nextStatus;
  broadcastMessage({ type: 'alert', data: alert });
  broadcastStateAndMetrics();
  res.json(alert);
});

app.get('/api/v1/metrics', (req, res) => {
  res.json(currentMetrics());
});

app.get('/api/v1/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });
  const results = transactions.filter(t => t.tx_hash === q || t.from_address === q || t.to_address === q);
  res.json({ query: q, results, count: results.length });
});

const PORT = process.env.SERVER_PORT || 8080;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  BlockSentinel Backend v0.2.0');
  console.log('  Real-Time Blockchain Risk Intelligence');
  console.log('========================================');
  console.log('  API:     http://localhost:' + PORT);
  console.log('  WS:      ws://localhost:' + PORT + '/ws/live');
  console.log('  Health:  http://localhost:' + PORT + '/api/v1/health');
  console.log('  Metrics: http://localhost:' + PORT + '/api/v1/metrics');
  console.log('  ML:      ' + ML_SERVICE_URL);
  console.log('========================================');
  connectAlchemy();
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Closing...');
  if (alchemyWs) alchemyWs.close();
  server.close(() => { console.log('[SHUTDOWN] Done'); process.exit(0); });
});
