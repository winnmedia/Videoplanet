# VideoPlanet Development Makefile
.PHONY: help install dev build test deploy clean

# Colors for terminal output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)VideoPlanet Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ==========================================
# Installation & Setup
# ==========================================

install: ## Install all dependencies
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd vridge_back && poetry install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd vridge_front && npm install
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

setup: ## Initial project setup
	@echo "$(GREEN)Setting up VideoPlanet project...$(NC)"
	cp .env.example .env 2>/dev/null || true
	cd vridge_back && cp .env.example .env 2>/dev/null || true
	cd vridge_front && cp .env.example .env.local 2>/dev/null || true
	@echo "$(GREEN)Creating database...$(NC)"
	cd vridge_back && python manage.py migrate
	@echo "$(GREEN)Setup complete!$(NC)"

# ==========================================
# Development
# ==========================================

dev: ## Start development servers
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose up -d postgres redis
	@echo "$(GREEN)Starting backend server...$(NC)"
	cd vridge_back && python manage.py runserver &
	@echo "$(GREEN)Starting frontend server...$(NC)"
	cd vridge_front && npm start

dev-docker: ## Start development with Docker
	@echo "$(GREEN)Starting Docker development environment...$(NC)"
	docker-compose up

dev-backend: ## Start backend server only
	@echo "$(GREEN)Starting backend server...$(NC)"
	cd vridge_back && python manage.py runserver

dev-frontend: ## Start frontend server only
	@echo "$(GREEN)Starting frontend server...$(NC)"
	cd vridge_front && npm start

# ==========================================
# Database
# ==========================================

migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	cd vridge_back && python manage.py migrate

makemigrations: ## Create new migrations
	@echo "$(GREEN)Creating migrations...$(NC)"
	cd vridge_back && python manage.py makemigrations

db-reset: ## Reset database
	@echo "$(RED)Resetting database...$(NC)"
	cd vridge_back && python manage.py flush --no-input
	cd vridge_back && python manage.py migrate

superuser: ## Create superuser
	@echo "$(GREEN)Creating superuser...$(NC)"
	cd vridge_back && python manage.py createsuperuser

# ==========================================
# Testing
# ==========================================

test: ## Run all tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd vridge_back && python manage.py test
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd vridge_front && npm test -- --watchAll=false

test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd vridge_back && python manage.py test

test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd vridge_front && npm test

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running backend tests with coverage...$(NC)"
	cd vridge_back && coverage run --source='.' manage.py test && coverage report
	@echo "$(GREEN)Running frontend tests with coverage...$(NC)"
	cd vridge_front && npm test -- --coverage --watchAll=false

# ==========================================
# Code Quality
# ==========================================

lint: ## Run linters
	@echo "$(GREEN)Linting backend code...$(NC)"
	cd vridge_back && poetry run black . --check
	cd vridge_back && poetry run flake8 .
	@echo "$(GREEN)Linting frontend code...$(NC)"
	cd vridge_front && npx eslint src/

format: ## Format code
	@echo "$(GREEN)Formatting backend code...$(NC)"
	cd vridge_back && poetry run black .
	@echo "$(GREEN)Formatting frontend code...$(NC)"
	cd vridge_front && npx prettier --write "src/**/*.{js,jsx,json,css,scss}"

security: ## Run security checks
	@echo "$(GREEN)Checking backend security...$(NC)"
	cd vridge_back && poetry run bandit -r . -ll
	@echo "$(GREEN)Checking frontend security...$(NC)"
	cd vridge_front && npm audit

# ==========================================
# Build & Deploy
# ==========================================

build: ## Build for production
	@echo "$(GREEN)Building backend...$(NC)"
	cd vridge_back && docker build -t videoplanet-backend:latest .
	@echo "$(GREEN)Building frontend...$(NC)"
	cd vridge_front && npm run build

build-docker: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build

deploy-staging: ## Deploy to staging
	@echo "$(YELLOW)Deploying to staging...$(NC)"
	git push origin develop
	@echo "$(GREEN)Deployment triggered! Check GitHub Actions for progress.$(NC)"

deploy-production: ## Deploy to production
	@echo "$(RED)Deploying to production...$(NC)"
	@echo "$(YELLOW)Are you sure? [y/N]$(NC)"
	@read -r REPLY; \
	if [ "$$REPLY" = "y" ]; then \
		git push origin main; \
		echo "$(GREEN)Production deployment triggered!$(NC)"; \
	else \
		echo "$(YELLOW)Deployment cancelled.$(NC)"; \
	fi

# ==========================================
# Docker Commands
# ==========================================

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-shell-backend: ## Shell into backend container
	docker exec -it videoplanet-backend /bin/bash

docker-shell-frontend: ## Shell into frontend container
	docker exec -it videoplanet-frontend /bin/sh

docker-clean: ## Clean Docker resources
	docker-compose down -v
	docker system prune -f

# ==========================================
# Utilities
# ==========================================

clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".DS_Store" -delete 2>/dev/null || true
	rm -rf vridge_back/staticfiles
	rm -rf vridge_back/media
	rm -rf vridge_front/build
	rm -rf vridge_front/node_modules/.cache
	@echo "$(GREEN)Clean complete!$(NC)"

logs: ## View application logs
	@echo "$(GREEN)Backend logs:$(NC)"
	tail -f vridge_back/*.log 2>/dev/null || echo "No backend logs found"
	@echo "$(GREEN)Frontend logs:$(NC)"
	cd vridge_front && npm run logs 2>/dev/null || echo "No frontend logs found"

shell: ## Django shell
	cd vridge_back && python manage.py shell

dbshell: ## Database shell
	cd vridge_back && python manage.py dbshell

collectstatic: ## Collect static files
	@echo "$(GREEN)Collecting static files...$(NC)"
	cd vridge_back && python manage.py collectstatic --noinput

requirements: ## Generate requirements.txt from poetry
	@echo "$(GREEN)Generating requirements.txt...$(NC)"
	cd vridge_back && poetry export -f requirements.txt --output requirements.txt --without-hashes

# ==========================================
# Git Workflow
# ==========================================

feature: ## Create a new feature branch
	@read -p "Enter feature name: " feature; \
	git checkout develop; \
	git pull origin develop; \
	git checkout -b feature/$$feature; \
	echo "$(GREEN)Created feature branch: feature/$$feature$(NC)"

hotfix: ## Create a hotfix branch
	@read -p "Enter hotfix name: " hotfix; \
	git checkout main; \
	git pull origin main; \
	git checkout -b hotfix/$$hotfix; \
	echo "$(GREEN)Created hotfix branch: hotfix/$$hotfix$(NC)"

pr: ## Create pull request
	@echo "$(GREEN)Creating pull request...$(NC)"
	gh pr create --web

# ==========================================
# Project Info
# ==========================================

status: ## Show project status
	@echo "$(GREEN)=== VideoPlanet Project Status ===$(NC)"
	@echo ""
	@echo "$(YELLOW)Git Status:$(NC)"
	@git status --short
	@echo ""
	@echo "$(YELLOW)Docker Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)Python Version:$(NC)"
	@python --version
	@echo ""
	@echo "$(YELLOW)Node Version:$(NC)"
	@node --version
	@echo ""
	@echo "$(YELLOW)Database Status:$(NC)"
	@cd vridge_back && python manage.py showmigrations --plan | head -10

version: ## Show versions
	@echo "$(GREEN)=== Version Information ===$(NC)"
	@echo "Python: $$(python --version)"
	@echo "Node: $$(node --version)"
	@echo "NPM: $$(npm --version)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"
	@cd vridge_back && echo "Django: $$(python -c 'import django; print(django.get_version())')"
	@cd vridge_front && echo "React: $$(npm list react | grep react@ | head -1)"

# Default target
.DEFAULT_GOAL := help