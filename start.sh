#!/bin/bash

# ============================================
# AI Auto Body & Collision Estimator
# Start Script - Initializes and runs the app
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║   AI Auto Body & Collision Estimator         ║"
echo "║   Professional Damage Assessment Platform    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
DB_NAME=${DB_NAME:-autobody_estimator}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# ============================================
# Clean up used ports
# ============================================
echo -e "\n${YELLOW}[1/6] Cleaning up used ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are clean${NC}"

# ============================================
# Check PostgreSQL
# ============================================
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ PostgreSQL is not installed. Please install it first.${NC}"
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  else
    sudo service postgresql start 2>/dev/null || true
  fi
  sleep 2
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# ============================================
# Create database if not exists
# ============================================
echo -e "\n${YELLOW}[3/6] Setting up database...${NC}"

# Create database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null

echo -e "${GREEN}✓ Database '$DB_NAME' ready${NC}"

# ============================================
# Install dependencies
# ============================================
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

cd backend
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo -e "  Backend dependencies already installed"
fi
cd ..

cd frontend
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo -e "  Frontend dependencies already installed"
fi
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================
# Seed database
# ============================================
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"
cd backend
node db/seed.js
cd ..
echo -e "${GREEN}✓ Database seeded with sample data${NC}"

# ============================================
# Start application with hot reload
# ============================================
echo -e "\n${YELLOW}[6/6] Starting application...${NC}"

# Create uploads directory
mkdir -p backend/uploads

# Start backend with nodemon (hot reload)
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..

# Start frontend with Vite (hot reload built-in)
cd frontend
npx vite --host &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Application started successfully!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e "  ${CYAN}API:${NC}       http://localhost:$BACKEND_PORT/api"
echo -e ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "  Email: admin@autobody.com"
echo -e "  Password: password123"
echo -e ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e ""

# Trap to clean up on exit
trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both processes
wait
