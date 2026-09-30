package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"fmt"
	"github.com/blocksentine/blocksentinel/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Broadcaster manages WebSocket connections and broadcasts live transactions
type Broadcaster struct {
	logger    *zap.Logger
	upgrader  websocket.Upgrader
	clients   map[*Client]bool
	register  chan *Client
	unregister chan *Client
	broadcast chan domain.Transaction
	mu        sync.RWMutex
}

// Client represents a WebSocket client
type Client struct {
	conn     *websocket.Conn
	send     chan []byte
	id       string
	joinedAt time.Time
}

// NewBroadcaster creates a new WebSocket broadcaster
func NewBroadcaster(logger *zap.Logger) *Broadcaster {
	return &Broadcaster{
		logger: logger,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Configure properly in production
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan domain.Transaction, 256),
	}
}

// Start begins the broadcaster event loop
func (b *Broadcaster) Start(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case client := <-b.register:
			b.mu.Lock()
			b.clients[client] = true
			b.mu.Unlock()
			b.logger.Info("Client connected", zap.String("client_id", client.id), zap.Int("total_clients", len(b.clients)))

		case client := <-b.unregister:
			b.mu.Lock()
			if _, ok := b.clients[client]; ok {
				delete(b.clients, client)
				close(client.send)
			}
			b.mu.Unlock()
			b.logger.Info("Client disconnected", zap.String("client_id", client.id), zap.Int("total_clients", len(b.clients)))

		case tx := <-b.broadcast:
			b.broadcastTransaction(tx)
		}
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func (b *Broadcaster) HandleWebSocket(c *gin.Context) {
	conn, err := b.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		b.logger.Error("WebSocket upgrade failed", zap.Error(err))
		return
	}

	client := &Client{
		conn:     conn,
		send:     make(chan []byte, 256),
		id:       generateClientID(),
		joinedAt: time.Now(),
	}

	b.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump(b)
}

// Broadcast sends a transaction to all connected clients
func (b *Broadcaster) Broadcast(tx domain.Transaction) {
	select {
	case b.broadcast <- tx:
	default:
		b.logger.Warn("Broadcast channel full, dropping transaction")
	}
}

func (b *Broadcaster) broadcastTransaction(tx domain.Transaction) {
	data, err := json.Marshal(map[string]interface{}{
		"type":        "transaction",
		"data":        tx,
		"timestamp":   time.Now().UTC(),
	})
	if err != nil {
		b.logger.Error("Failed to marshal transaction", zap.Error(err))
		return
	}

	b.mu.RLock()
	clients := make([]*Client, 0, len(b.clients))
	for client := range b.clients {
		clients = append(clients, client)
	}
	b.mu.RUnlock()

	for _, client := range clients {
		select {
		case client.send <- data:
		default:
			// Client buffer full, close connection
			b.unregister <- client
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) readPump(b *Broadcaster) {
	defer func() {
		b.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512 * 1024) // 512KB
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				b.logger.Warn("WebSocket read error", zap.Error(err))
			}
			return
		}
	}
}

func generateClientID() string {
	return fmt.Sprintf("client_%d", time.Now().UnixNano())
}
