package domain

import "time"

// AlertSeverity represents the severity level
type AlertSeverity string

const (
	SeverityLow      AlertSeverity = "LOW"
	SeverityMedium   AlertSeverity = "MEDIUM"
	SeverityHigh     AlertSeverity = "HIGH"
	SeverityCritical AlertSeverity = "CRITICAL"
)

// AlertStatus represents the investigation status
type AlertStatus string

const (
	AlertStatusNew           AlertStatus = "NEW"
	AlertStatusAcknowledged  AlertStatus = "ACKNOWLEDGED"
	AlertStatusInvestigating AlertStatus = "INVESTIGATING"
	AlertStatusResolved      AlertStatus = "RESOLVED"
	AlertStatusFalsePositive AlertStatus = "FALSE_POSITIVE"
)

// Alert represents a security alert
type Alert struct {
	ID            string        `json:"id"`
	TransactionHash string      `json:"transaction_hash"`
	Address       string        `json:"address"`
	Severity      AlertSeverity `json:"severity"`
	RiskScore     int           `json:"risk_score"`
	Reason        string        `json:"reason"`
	Status        AlertStatus   `json:"status"`
	AssignedTo    *string       `json:"assigned_to,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	ResolvedAt    *time.Time    `json:"resolved_at,omitempty"`
}
