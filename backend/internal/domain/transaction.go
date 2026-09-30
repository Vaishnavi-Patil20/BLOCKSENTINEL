package domain

import (
	"time"
)

// TransactionStatus represents the lifecycle state of a transaction
type TransactionStatus string

const (
	StatusObservedPending TransactionStatus = "OBSERVED_PENDING"
	StatusRiskAnalyzed    TransactionStatus = "RISK_ANALYZED"
	StatusMined           TransactionStatus = "MINED"
	StatusConfirmed       TransactionStatus = "CONFIRMED"
	StatusDropped         TransactionStatus = "DROPPED"
	StatusReorged         TransactionStatus = "REORGED"
)

// Transaction is the canonical internal model for blockchain transactions
type Transaction struct {
	ID                    string            `json:"id"`
	TxHash                string            `json:"tx_hash"`
	ChainID               int64             `json:"chain_id"`
	Network               string            `json:"network"`
	BlockNumber           *int64            `json:"block_number,omitempty"`
	BlockHash             *string           `json:"block_hash,omitempty"`
	TransactionIndex      *int              `json:"transaction_index,omitempty"`
	FromAddress           string            `json:"from_address"`
	ToAddress             *string           `json:"to_address,omitempty"`
	ValueWei              string            `json:"value_wei"`
	ValueNative           float64           `json:"value_native"`
	GasLimit              uint64            `json:"gas_limit"`
	GasPrice              *string           `json:"gas_price,omitempty"`
	MaxFeePerGas          *string           `json:"max_fee_per_gas,omitempty"`
	MaxPriorityFeePerGas  *string           `json:"max_priority_fee_per_gas,omitempty"`
	Nonce                 uint64            `json:"nonce"`
	InputData             string            `json:"input_data"`
	TransactionType       int               `json:"transaction_type"`
	Status                TransactionStatus `json:"status"`
	IsContractInteraction bool              `json:"is_contract_interaction"`
	FirstSeenAt           time.Time         `json:"first_seen_at"`
	MinedAt               *time.Time        `json:"mined_at,omitempty"`
	ConfirmedAt           *time.Time        `json:"confirmed_at,omitempty"`
	RemovedAt             *time.Time        `json:"removed_at,omitempty"`
	SourceProvider        string            `json:"source_provider"`
	SourceSubscription    string            `json:"source_subscription"`
	ReceivedAt            time.Time         `json:"received_at"`
	IngestionLatencyMs    int64             `json:"ingestion_latency_ms"`
	ProcessingLatencyMs   int64             `json:"processing_latency_ms"`
	RiskScore             *RiskAssessment   `json:"risk,omitempty"`
}

// RiskAssessment contains the complete risk evaluation
type RiskAssessment struct {
	Score           int               `json:"score"`
	Level           string            `json:"level"` // LOW, MEDIUM, HIGH, CRITICAL
	Factors         []RiskFactor      `json:"factors"`
	ModelName       string            `json:"model_name"`
	ModelVersion    string            `json:"model_version"`
	FeatureVersion  string            `json:"feature_version"`
	Confidence      float64           `json:"confidence"`
	AnalyzedAt      time.Time         `json:"analyzed_at"`
	Explanation     string            `json:"explanation"`
}

// RiskFactor represents a single contributing factor
type RiskFactor struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Weight      int     `json:"weight"`
	Category    string  `json:"category"` // heuristic, statistical, ml, graph
}

// ConnectionState tracks the blockchain provider connection
type ConnectionState struct {
	Status           string    `json:"status"` // LIVE, CONNECTING, RECONNECTING, OFFLINE, DEGRADED
	Network          string    `json:"network"`
	Provider         string    `json:"provider"`
	Subscription     string    `json:"subscription"`
	LastEventAt      *time.Time `json:"last_event_at,omitempty"`
	LastBlock        *string   `json:"last_block,omitempty"`
	EventsReceived   int64     `json:"events_received"`
	EventsProcessed  int64     `json:"events_processed"`
	ReconnectCount   int       `json:"reconnect_count"`
	ConnectedAt      *time.Time `json:"connected_at,omitempty"`
	LatencyMs        int64     `json:"latency_ms"`
}
