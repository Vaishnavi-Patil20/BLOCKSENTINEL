package domain

import "time"

// Address represents a blockchain address with intelligence
type Address struct {
	Hash                string     `json:"hash"`
	FirstSeenAt         *time.Time `json:"first_seen_at,omitempty"`
	LastSeenAt          *time.Time `json:"last_seen_at,omitempty"`
	TransactionCount    int64      `json:"transaction_count"`
	IncomingCount       int64      `json:"incoming_count"`
	OutgoingCount       int64      `json:"outgoing_count"`
	UniqueCounterparties int64     `json:"unique_counterparties"`
	TotalIncomingWei    string     `json:"total_incoming_wei"`
	TotalOutgoingWei    string     `json:"total_outgoing_wei"`
	AverageValueWei     string     `json:"average_value_wei"`
	IsContract          bool       `json:"is_contract"`
	ContractName        *string    `json:"contract_name,omitempty"`
	RiskScore           *int       `json:"risk_score,omitempty"`
	Tags                []string   `json:"tags"`
	UpdatedAt           time.Time  `json:"updated_at"`
}
