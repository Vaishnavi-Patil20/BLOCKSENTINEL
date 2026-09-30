package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/blocksentine/blocksentinel/internal/config"
	"github.com/blocksentine/blocksentinel/internal/domain"
	"github.com/blocksentine/blocksentinel/internal/infrastructure/alchemy"
	httpHandlers "github.com/blocksentine/blocksentinel/internal/interfaces/http"
	wsHandlers "github.com/blocksentine/blocksentinel/internal/interfaces/websocket"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("BlockSentinel starting...",
		zap.String("version", "0.1.0"),
		zap.Time("started_at", time.Now()),
	)

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Transaction channel shared between provider and ingestion pipeline
	txChannel := make(chan domain.Transaction, 1000)

	// Transaction store for recent transactions
	txStore := httpHandlers.NewTransactionStore(10000)

	// Create Alchemy provider with shared channel
	provider := alchemy.NewProvider(cfg, logger, txChannel)

	// Create WebSocket broadcaster
	broadcaster := wsHandlers.NewBroadcaster(logger)

	// Create HTTP handler
	handler := httpHandlers.NewHandler(cfg, logger, provider, txStore)

	// Setup Gin
	if cfg.LogLevel == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.Default())

	handler.RegisterRoutes(r)
	r.GET("/ws/live", broadcaster.HandleWebSocket)

	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start ingestion pipeline (reads from txChannel)
	go ingestionPipeline(ctx, txChannel, txStore, broadcaster, logger)

	// Start WebSocket broadcaster
	go broadcaster.Start(ctx)

	// Start Alchemy provider (writes to txChannel)
	if err := provider.Start(ctx); err != nil {
		logger.Error("Failed to start blockchain provider", zap.Error(err))
	}

	go func() {
		logger.Info("HTTP server starting", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down BlockSentinel...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("HTTP server shutdown error", zap.Error(err))
	}

	provider.Stop()
	close(txChannel)
	cancel()

	logger.Info("BlockSentinel stopped")
}

func ingestionPipeline(ctx context.Context, txChannel <-chan domain.Transaction, txStore *httpHandlers.TransactionStore, broadcaster *wsHandlers.Broadcaster, logger *zap.Logger) {
	logger.Info("Ingestion pipeline started - waiting for live blockchain transactions")

	for {
		select {
		case <-ctx.Done():
			logger.Info("Ingestion pipeline shutting down")
			return
		case tx, ok := <-txChannel:
			if !ok {
				logger.Info("Transaction channel closed")
				return
			}

			processStart := time.Now()

			// Store transaction
			txStore.Add(tx)

			// Calculate processing latency
			tx.ProcessingLatencyMs = time.Since(processStart).Milliseconds()

			// Broadcast to WebSocket clients
			broadcaster.Broadcast(tx)

			logger.Debug("Transaction processed",
				zap.String("tx_hash", tx.TxHash),
				zap.Int64("ingestion_latency_ms", tx.IngestionLatencyMs),
				zap.Int64("processing_latency_ms", tx.ProcessingLatencyMs),
			)
		}
	}
}
