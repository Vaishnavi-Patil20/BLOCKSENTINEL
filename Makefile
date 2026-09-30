.PHONY: help build up down logs ps clean dev backend frontend ml test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all services
	docker compose build

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f

ps: ## Show running containers
	docker compose ps

clean: ## Remove all containers and volumes
	docker compose down -v
	 docker system prune -f

dev: ## Start development environment
	docker compose up postgres clickhouse neo4j -d
	@echo "Databases ready. Start backend, frontend, and ml-service manually."

backend: ## Run Go backend locally
	cd backend && go run ./cmd/blocksentinel

frontend: ## Run Next.js frontend locally
	cd frontend && npm run dev

ml: ## Run ML service locally
	cd ml-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test: ## Run all tests
	cd backend && go test ./...
	cd ml-service && pytest

migrate: ## Run database migrations
	cd backend && go run ./cmd/migrate

seed: ## Seed initial data
	cd backend && go run ./cmd/seed
