# BlockSentinel

AI-Based Blockchain Transaction Risk Intelligence Platform for real-time Ethereum Mainnet monitoring.

## What is wired in this version

- Real Ethereum Mainnet transaction ingestion through Alchemy WebSocket.
- One transaction record per transaction hash; pending -> mined updates do not double-count the transaction.
- Server-side risk analysis through the ML service when available.
- Deterministic server-side rule-engine fallback when the ML service is unavailable. The fallback is explicitly labeled and does not fabricate blockchain data.
- Risk assessment is attached to each transaction with score, level, factors, model metadata, confidence, and explanation.
- Real-time dashboard metrics: processed transactions, high/critical risk, and open alerts.
- Real-time `connection_state`, `metrics`, `transaction`, `alert`, and initial `snapshot` WebSocket messages.
- Alerts API plus working alert acknowledgement endpoint.
- Frontend hydrates from the backend APIs on load and then stays live over WebSocket.
- Hard-coded demo alert counts and fabricated model-performance/data-quality numbers removed from the touched screens.
- `.env` and dependency directories are ignored by Git.

## Important: no fake transaction data

The application does not generate random or simulated blockchain transactions. Transaction hashes, addresses, values, blocks, and status come from the configured Alchemy Ethereum Mainnet stream.

A risk score is an analytical output of the configured risk engine; it is not a claim that a transaction is fraudulent. A zero high-risk/alert count is valid when no observed transaction crosses the configured thresholds.

## Local development in VS Code

### 1. Environment

Copy `.env.example` to `.env` and add your real Alchemy values. Never commit `.env` or paste the key into GitHub.

Required:

```env
ALCHEMY_API_KEY=YOUR_REAL_ALCHEMY_KEY
ALCHEMY_WS_URL=wss://eth-mainnet.g.alchemy.com/v2/YOUR_REAL_ALCHEMY_KEY
ALCHEMY_HTTP_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_REAL_ALCHEMY_KEY
ML_SERVICE_URL=http://localhost:8000
RISK_ALERT_THRESHOLD=60
```

### 2. Node live backend (the active local live-stream implementation)

```powershell
cd backend\backend-node
npm install
npm start
```

It serves:

- API: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws/live`
- Metrics: `http://localhost:8080/api/v1/metrics`

### 3. ML service (recommended)

In a second terminal:

```powershell
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app\main.py
```

The backend calls `POST /analyze`. If this service is unavailable, the Node backend keeps live ingestion running using its explicitly labeled deterministic rule-engine fallback.

### 4. Frontend

In a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:3000`).

Optional frontend overrides:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## Dashboard data flow

```text
Ethereum Mainnet
      |
      v
    Alchemy
      |
      | WebSocket subscriptions
      v
 Node live ingestion
      |
      +--> normalize + deduplicate by tx hash
      |
      v
 Risk analysis
      |
      +--> ML service / deterministic rule-engine fallback
      |
      v
 Risk score + factors + explanation
      |
      +--> transaction store
      +--> alert engine
      +--> WebSocket broadcast
      |
      v
 React Command Center
```

## API endpoints added/used by the live dashboard

- `GET /api/v1/health`
- `GET /api/v1/health/blockchain`
- `GET /api/v1/health/ml`
- `GET /api/v1/transactions?limit=500`
- `GET /api/v1/transactions/:hash`
- `GET /api/v1/alerts`
- `PATCH /api/v1/alerts/:id`
- `GET /api/v1/metrics`
- `GET /api/v1/search?q=...`

## GitHub safety

Before pushing:

```powershell
git status
git add .
git commit -m "Wire live risk intelligence metrics and alerts"
git push
```

Confirm that `.env` and `node_modules` are not included in the commit.
