package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds all application configuration
type Config struct {
	AlchemyAPIKey     string
	AlchemyWSURL      string
	AlchemyHTTPURL    string
	DatabaseURL       string
	ClickHouseURL     string
	Neo4jURI          string
	Neo4jUsername     string
	Neo4jPassword     string
	MLServiceURL      string
	ServerPort        string
	LogLevel          string
	Network           string
	JWTSecret         string
	APIRateLimit      int
	MetricsEnabled    bool
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		AlchemyAPIKey:  getEnv("ALCHEMY_API_KEY", ""),
		AlchemyWSURL:   getEnv("ALCHEMY_WS_URL", ""),
		AlchemyHTTPURL: getEnv("ALCHEMY_HTTP_URL", ""),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://blocksentinel:blocksentinel@localhost:5432/blocksentinel?sslmode=disable"),
		ClickHouseURL:  getEnv("CLICKHOUSE_URL", "clickhouse://default:@localhost:9000/blocksentinel"),
		Neo4jURI:       getEnv("NEO4J_URI", "bolt://localhost:7687"),
		Neo4jUsername:  getEnv("NEO4J_USERNAME", "neo4j"),
		Neo4jPassword:  getEnv("NEO4J_PASSWORD", "blocksentinel"),
		MLServiceURL:   getEnv("ML_SERVICE_URL", "http://localhost:8000"),
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		Network:        getEnv("NETWORK", "ethereum-mainnet"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		APIRateLimit:   100,
		MetricsEnabled: getEnv("METRICS_ENABLED", "true") == "true",
	}

	// Validate required config
	if cfg.AlchemyAPIKey == "" || cfg.AlchemyWSURL == "" {
		fmt.Println("WARNING: ALCHEMY_API_KEY or ALCHEMY_WS_URL not set. Blockchain connection will be OFFLINE.")
		fmt.Println("To enable live blockchain monitoring:")
		fmt.Println("  1. Create an account at https://alchemy.com")
		fmt.Println("  2. Create an Ethereum Mainnet app")
		fmt.Println("  3. Copy your API key and WebSocket URL to .env")
	}

	return cfg, nil
}

// IsBlockchainConfigured returns true if Alchemy credentials are present
func (c *Config) IsBlockchainConfigured() bool {
	return c.AlchemyAPIKey != "" && c.AlchemyWSURL != ""
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return strings.TrimSpace(val)
	}
	return defaultVal
}
