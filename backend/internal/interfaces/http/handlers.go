package http

import (
	"net/http"
	"time"

	"github.com/blocksentine/blocksentinel/internal/config"
	"strconv"
	"sync"
	"github.com/blocksentine/blocksentinel/internal/domain"
	"github.com/blocksentine/blocksentinel/internal/infrastructure/alchemy"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Handler holds all HTTP handlers
type Handler struct {
	cfg      *config.Config
	logger   *zap.Logger
	provider *alchemy.Provider
	txStore  *TransactionStore
}

// TransactionStore is a simple in-memory ring buffer for recent transactions
type TransactionStore struct {
	transactions []domain.Transaction
	maxSize      int
	mu           sync.RWMutex
}

// NewTransactionStore creates a new transaction store
func NewTransactionStore(maxSize int) *TransactionStore {
	return &TransactionStore{
		transactions: make([]domain.Transaction, 0, maxSize),
		maxSize:      maxSize,
	}
}

// Add adds a transaction to the store
func (s *TransactionStore) Add(tx domain.Transaction) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.transactions = append(s.transactions, tx)
	if len(s.transactions) > s.maxSize {
		s.transactions = s.transactions[1:]
	}
}

// GetRecent returns the most recent n transactions
func (s *TransactionStore) GetRecent(n int) []domain.Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if n > len(s.transactions) {
		n = len(s.transactions)
	}

	// Return copy in reverse order (newest first)
	result := make([]domain.Transaction, n)
	for i := 0; i < n; i++ {
		result[i] = s.transactions[len(s.transactions)-1-i]
	}
	return result
}

// GetAll returns all transactions
func (s *TransactionStore) GetAll() []domain.Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]domain.Transaction, len(s.transactions))
	copy(result, s.transactions)
	return result
}

// GetByHash returns a transaction by hash
func (s *TransactionStore) GetByHash(hash string) (*domain.Transaction, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for i := len(s.transactions) - 1; i >= 0; i-- {
		if s.transactions[i].TxHash == hash {
			return &s.transactions[i], true
		}
	}
	return nil, false
}

// NewHandler creates a new HTTP handler
func NewHandler(cfg *config.Config, logger *zap.Logger, provider *alchemy.Provider, txStore *TransactionStore) *Handler {
	return &Handler{
		cfg:      cfg,
		logger:   logger,
		provider: provider,
		txStore:  txStore,
	}
}

// RegisterRoutes registers all API routes
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.GET("/health", h.Health)
		api.GET("/health/blockchain", h.BlockchainHealth)
		api.GET("/transactions", h.GetTransactions)
		api.GET("/transactions/:hash", h.GetTransaction)
		api.GET("/addresses/:address", h.GetAddress)
		api.GET("/alerts", h.GetAlerts)
		api.GET("/search", h.Search)
		api.GET("/metrics", h.GetMetrics)
	}
}

// Health returns the overall system health
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "0.1.0",
		"services": gin.H{
			"api":       "up",
			"blockchain": h.getBlockchainStatus(),
		},
	})
}

// BlockchainHealth returns detailed blockchain connection status
func (h *Handler) BlockchainHealth(c *gin.Context) {
	state := h.provider.GetState()
	c.JSON(http.StatusOK, state)
}

// GetTransactions returns recent transactions
func (h *Handler) GetTransactions(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		// Simple parsing, in production use proper validation
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}

	txs := h.txStore.GetRecent(limit)
	c.JSON(http.StatusOK, gin.H{
		"transactions": txs,
		"count":        len(txs),
	})
}

// GetTransaction returns a single transaction by hash
func (h *Handler) GetTransaction(c *gin.Context) {
	hash := c.Param("hash")
	if tx, found := h.txStore.GetByHash(hash); found {
		c.JSON(http.StatusOK, tx)
		return
	}
	c.JSON(http.StatusNotFound, gin.H{
		"error": "Transaction not found",
		"hash":  hash,
	})
}

// GetAddress returns address intelligence
func (h *Handler) GetAddress(c *gin.Context) {
	address := c.Param("address")
	c.JSON(http.StatusOK, gin.H{
		"address": address,
		"status":  "Address intelligence requires database persistence. Implement in Phase 3.",
	})
}

// GetAlerts returns security alerts
func (h *Handler) GetAlerts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"alerts": []interface{}{},
		"count":  0,
		"status": "Alert engine requires risk analysis. Implement in Phase 6.",
	})
}

// Search performs global search
func (h *Handler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	// Search in transaction store
	results := []domain.Transaction{}
	for _, tx := range h.txStore.GetAll() {
		if tx.TxHash == query || tx.FromAddress == query || (tx.ToAddress != nil && *tx.ToAddress == query) {
			results = append(results, tx)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"query":   query,
		"results": results,
		"count":   len(results),
	})
}

// GetMetrics returns system metrics
func (h *Handler) GetMetrics(c *gin.Context) {
	state := h.provider.GetState()
	c.JSON(http.StatusOK, gin.H{
		"blockchain": state,
		"transactions_stored": len(h.txStore.GetAll()),
		"timestamp": time.Now().UTC(),
	})
}

func (h *Handler) getBlockchainStatus() string {
	state := h.provider.GetState()
	if state.Status == "LIVE" {
		return "connected"
	}
	return "offline"
}
