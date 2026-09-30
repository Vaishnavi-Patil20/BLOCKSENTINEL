package alchemy

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/blocksentine/blocksentinel/internal/config"
	"github.com/blocksentine/blocksentinel/internal/domain"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Provider implements the BlockchainProvider interface for Alchemy
type Provider struct {
	cfg            *config.Config
	logger         *zap.Logger
	wsConn         *websocket.Conn
	httpClient     *http.Client
	state          *domain.ConnectionState
	stateMu        sync.RWMutex
	txChannel      chan<- domain.Transaction
	stopCh         chan struct{}
	reconnectCount int32
	isRunning      int32
}

// NewProvider creates a new Alchemy blockchain provider
func NewProvider(cfg *config.Config, logger *zap.Logger, txCh chan<- domain.Transaction) *Provider {
	return &Provider{
		cfg:        cfg,
		logger:     logger,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		state: &domain.ConnectionState{
			Status:       "OFFLINE",
			Network:      cfg.Network,
			Provider:     "alchemy",
			Subscription: "none",
		},
		txChannel: txCh,
		stopCh:    make(chan struct{}),
	}
}

// Start begins the WebSocket connection and subscriptions
func (p *Provider) Start(ctx context.Context) error {
	if !p.cfg.IsBlockchainConfigured() {
		p.logger.Warn("Alchemy not configured. Blockchain connection will remain OFFLINE.")
		p.updateState("OFFLINE", "Alchemy API key missing")
		return nil
	}

	atomic.StoreInt32(&p.isRunning, 1)

	go p.connectionManager(ctx)
	return nil
}

// Stop gracefully shuts down the provider
func (p *Provider) Stop() error {
	atomic.StoreInt32(&p.isRunning, 0)
	close(p.stopCh)
	if p.wsConn != nil {
		p.wsConn.Close()
	}
	return nil
}

// GetState returns the current connection state (thread-safe)
func (p *Provider) GetState() domain.ConnectionState {
	p.stateMu.RLock()
	defer p.stateMu.RUnlock()
	return *p.state
}

func (p *Provider) connectionManager(ctx context.Context) {
	backoff := time.Second
	maxBackoff := 30 * time.Second

	for atomic.LoadInt32(&p.isRunning) == 1 {
		select {
		case <-ctx.Done():
			return
		case <-p.stopCh:
			return
		default:
		}

		p.updateState("CONNECTING", fmt.Sprintf("Connecting to %s", p.cfg.AlchemyWSURL))

		if err := p.connectAndSubscribe(ctx); err != nil {
			p.logger.Error("Connection failed", zap.Error(err), zap.Duration("backoff", backoff))
			p.updateState("RECONNECTING", err.Error())
			atomic.AddInt32(&p.reconnectCount, 1)

			select {
			case <-time.After(backoff):
				backoff *= 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
			case <-p.stopCh:
				return
			}
		} else {
			// Connection succeeded, reset backoff
			backoff = time.Second
		}
	}
}

func (p *Provider) connectAndSubscribe(ctx context.Context) error {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(p.cfg.AlchemyWSURL, nil)
	if err != nil {
		return fmt.Errorf("websocket dial failed: %w", err)
	}
	p.wsConn = conn

	// Configure pong handler and read deadline
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	now := time.Now()
	p.updateStateFull("LIVE", "Connected", &now, nil, atomic.LoadInt32(&p.reconnectCount))

	// Subscribe to mined transactions
	if err := p.subscribeMinedTransactions(); err != nil {
		conn.Close()
		return fmt.Errorf("subscribe failed: %w", err)
	}

	// Subscribe to pending transactions
	if err := p.subscribePendingTransactions(); err != nil {
		p.logger.Warn("Pending transaction subscription failed", zap.Error(err))
		// Non-fatal: continue with mined transactions
	}

	// Subscribe to new heads for block tracking
	if err := p.subscribeNewHeads(); err != nil {
		p.logger.Warn("New heads subscription failed", zap.Error(err))
	}

	// Start heartbeat
	go p.heartbeat(ctx)

	// Read loop
	return p.readLoop(ctx)
}

func (p *Provider) subscribeMinedTransactions() error {
	subReq := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "eth_subscribe",
		"params": []interface{}{
			"alchemy_minedTransactions",
			map[string]interface{}{
				"addresses":          []interface{}{},
				"includeRemoved":     true,
				"hashesOnly":         false,
			},
		},
	}
	return p.wsConn.WriteJSON(subReq)
}

func (p *Provider) subscribePendingTransactions() error {
	subReq := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      2,
		"method":  "eth_subscribe",
		"params": []interface{}{
			"alchemy_pendingTransactions",
			map[string]interface{}{
				"addresses":          []interface{}{},
				"includeRemoved":     true,
				"hashesOnly":         false,
			},
		},
	}
	return p.wsConn.WriteJSON(subReq)
}

func (p *Provider) subscribeNewHeads() error {
	subReq := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      3,
		"method":  "eth_subscribe",
		"params":  []interface{}{"newHeads"},
	}
	return p.wsConn.WriteJSON(subReq)
}

func (p *Provider) heartbeat(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-p.stopCh:
			return
		case <-ticker.C:
			if p.wsConn != nil {
				if err := p.wsConn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second)); err != nil {
					p.logger.Warn("Ping failed", zap.Error(err))
					return // Will trigger reconnect
				}
			}
		}
	}
}

func (p *Provider) readLoop(ctx context.Context) error {
	for atomic.LoadInt32(&p.isRunning) == 1 {
		p.wsConn.SetReadDeadline(time.Now().Add(60 * time.Second))

		_, message, err := p.wsConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				p.logger.Error("WebSocket error", zap.Error(err))
			}
			return err
		}

		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			p.logger.Warn("Failed to unmarshal message", zap.Error(err))
			continue
		}

		// Handle subscription response
		if id, ok := msg["id"].(float64); ok {
			if result, ok := msg["result"].(string); ok {
				p.logger.Info("Subscription established", zap.Float64("id", id), zap.String("subId", result))
			}
			continue
		}

		// Handle subscription data
		if method, ok := msg["method"].(string); ok && method == "eth_subscription" {
			p.handleSubscription(msg)
		}
	}
	return nil
}

func (p *Provider) handleSubscription(msg map[string]interface{}) {
	params, ok := msg["params"].(map[string]interface{})
	if !ok {
		return
	}

	result, ok := params["result"].(map[string]interface{})
	if !ok {
		return
	}

	// Determine subscription type from result structure
	subscription := params["subscription"].(string)

	receivedAt := time.Now()

	// Check if this is a newHeads subscription
	if _, hasNumber := result["number"]; hasNumber {
		p.handleNewHead(result)
		return
	}

	// Handle transaction data
	if transaction, ok := result["transaction"].(map[string]interface{}); ok {
		p.processTransaction(transaction, "alchemy_minedTransactions", receivedAt)
	} else {
		// Direct transaction object (pendingTransactions format)
		p.processTransaction(result, "alchemy_pendingTransactions", receivedAt)
	}

	// Update metrics
	p.stateMu.Lock()
	p.state.EventsReceived++
	p.state.LastEventAt = &receivedAt
	p.stateMu.Unlock()
}

func (p *Provider) processTransaction(txData map[string]interface{}, subscription string, receivedAt time.Time) {
	tx := p.normalizeTransaction(txData, subscription, receivedAt)

	p.logger.Info("LIVE TRANSACTION RECEIVED",
		zap.String("tx_hash", tx.TxHash),
		zap.String("from", tx.FromAddress),
		zap.String("to", safeString(tx.ToAddress)),
		zap.String("value_eth", fmt.Sprintf("%.6f", tx.ValueNative)),
		zap.String("subscription", subscription),
	)

	// Non-blocking send
	select {
	case p.txChannel <- tx:
		p.stateMu.Lock()
		p.state.EventsProcessed++
		p.stateMu.Unlock()
	default:
		p.logger.Warn("Transaction channel full, dropping transaction", zap.String("tx_hash", tx.TxHash))
	}
}

func (p *Provider) normalizeTransaction(txData map[string]interface{}, subscription string, receivedAt time.Time) domain.Transaction {
	tx := domain.Transaction{
		ID:                 generateID(),
		Network:            p.cfg.Network,
		SourceProvider:     "alchemy",
		SourceSubscription: subscription,
		ReceivedAt:         receivedAt,
		FirstSeenAt:        receivedAt,
	}

	// Extract hash
	if hash, ok := txData["hash"].(string); ok {
		tx.TxHash = hash
	}

	// Extract from
	if from, ok := txData["from"].(string); ok {
		tx.FromAddress = strings.ToLower(from)
	}

	// Extract to (may be null for contract creation)
	if to, ok := txData["to"].(string); ok && to != "" {
		lowerTo := strings.ToLower(to)
		tx.ToAddress = &lowerTo
	}

	// Extract value and convert to ETH
	if value, ok := txData["value"].(string); ok {
		tx.ValueWei = value
		wei := new(big.Int)
		wei.SetString(value, 0)
		eth := new(big.Float).Quo(new(big.Float).SetInt(wei), big.NewFloat(1e18))
		ethFloat, _ := eth.Float64()
		tx.ValueNative = ethFloat
	}

	// Extract gas
	if gas, ok := txData["gas"].(string); ok {
		gasInt := new(big.Int)
		gasInt.SetString(gas, 0)
		tx.GasLimit = gasInt.Uint64()
	}

	// Extract gas price
	if gasPrice, ok := txData["gasPrice"].(string); ok {
		tx.GasPrice = &gasPrice
	}

	// Extract nonce
	if nonce, ok := txData["nonce"].(string); ok {
		nonceInt := new(big.Int)
		nonceInt.SetString(nonce, 0)
		tx.Nonce = nonceInt.Uint64()
	}

	// Extract input data
	if input, ok := txData["input"].(string); ok {
		tx.InputData = input
		tx.IsContractInteraction = len(input) > 2 && input != "0x"
	}

	// Extract block info for mined transactions
	if blockNum, ok := txData["blockNumber"].(string); ok && blockNum != "" {
		bn := new(big.Int)
		bn.SetString(blockNum, 0)
		bnInt := bn.Int64()
		tx.BlockNumber = &bnInt
		tx.Status = domain.StatusMined
		now := time.Now()
		tx.MinedAt = &now
	} else {
		tx.Status = domain.StatusObservedPending
	}

	if blockHash, ok := txData["blockHash"].(string); ok && blockHash != "" {
		tx.BlockHash = &blockHash
	}

	if txIndex, ok := txData["transactionIndex"].(string); ok && txIndex != "" {
		ti := new(big.Int)
		ti.SetString(txIndex, 0)
		tiInt := int(ti.Int64())
		tx.TransactionIndex = &tiInt
	}

	// Extract chain ID
	if chainID, ok := txData["chainId"].(string); ok {
		cid := new(big.Int)
		cid.SetString(chainID, 0)
		tx.ChainID = cid.Int64()
	}

	// Calculate ingestion latency
	tx.IngestionLatencyMs = time.Since(receivedAt).Milliseconds()

	return tx
}

func (p *Provider) handleNewHead(head map[string]interface{}) {
	if number, ok := head["number"].(string); ok {
		p.stateMu.Lock()
		p.state.LastBlock = &number
		p.stateMu.Unlock()
	}
}

func (p *Provider) updateState(status, message string) {
	p.stateMu.Lock()
	defer p.stateMu.Unlock()
	p.state.Status = status
	p.logger.Info("Connection state changed", zap.String("status", status), zap.String("message", message))
}

func (p *Provider) updateStateFull(status, message string, connectedAt *time.Time, lastBlock *string, reconnectCount int32) {
	p.stateMu.Lock()
	defer p.stateMu.Unlock()
	p.state.Status = status
	p.state.ConnectedAt = connectedAt
	p.state.LastBlock = lastBlock
	p.state.ReconnectCount = int(reconnectCount)
}

func generateID() string {
	return fmt.Sprintf("tx_%d", time.Now().UnixNano())
}

func safeString(s *string) string {
	if s == nil {
		return "contract_creation"
	}
	return *s
}
