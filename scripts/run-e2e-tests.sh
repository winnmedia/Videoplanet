#!/bin/bash

# VideoPlanet E2E Test Runner Script
# 
# Usage:
#   ./scripts/run-e2e-tests.sh [options]
#
# Options:
#   --suite <name>    Run specific test suite (auth, projects, feedback, all)
#   --browser <name>  Run tests in specific browser (chromium, firefox, webkit, all)
#   --headed          Run tests in headed mode (with browser UI)
#   --debug           Run tests in debug mode
#   --update-snapshots Update visual regression snapshots
#   --report          Generate and open HTML report
#   --ci              Run in CI mode

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SUITE="all"
BROWSER="chromium"
HEADED=""
DEBUG=""
UPDATE_SNAPSHOTS=""
REPORT=""
CI_MODE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --suite)
      SUITE="$2"
      shift 2
      ;;
    --browser)
      BROWSER="$2"
      shift 2
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    --update-snapshots)
      UPDATE_SNAPSHOTS="--update-snapshots"
      shift
      ;;
    --report)
      REPORT="true"
      shift
      ;;
    --ci)
      CI_MODE="true"
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     VideoPlanet E2E Test Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
  lsof -i:$1 >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
  local url=$1
  local max_attempts=30
  local attempt=0
  
  echo -e "${YELLOW}Waiting for $url to be ready...${NC}"
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
      echo -e "${GREEN}✓ Service is ready${NC}"
      return 0
    fi
    
    attempt=$((attempt + 1))
    sleep 2
  done
  
  echo -e "${RED}✗ Service failed to start${NC}"
  return 1
}

# Function to cleanup background processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Cleaning up...${NC}"
  
  # Kill Next.js server
  if [ -n "$NEXTJS_PID" ]; then
    kill $NEXTJS_PID 2>/dev/null || true
  fi
  
  # Kill Django server
  if [ -n "$DJANGO_PID" ]; then
    kill $DJANGO_PID 2>/dev/null || true
  fi
  
  # Kill any remaining processes on ports
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  
  echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Set up trap to cleanup on exit
trap cleanup EXIT

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
  echo -e "${RED}✗ Node.js is not installed${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}✗ npm is not installed${NC}"
  exit 1
fi

if ! command_exists python3; then
  echo -e "${YELLOW}⚠ Python 3 is not installed (backend will use mock data)${NC}"
  USE_MOCK_API="true"
else
  USE_MOCK_API="false"
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}Installing dependencies...${NC}"
  npm ci
fi

# Install Playwright browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
  echo -e "${BLUE}Installing Playwright browsers...${NC}"
  npx playwright install --with-deps
fi

# Build the application
echo -e "${BLUE}Building application...${NC}"
npm run build

# Start backend server (if Python is available)
if [ "$USE_MOCK_API" = "false" ] && [ -d "vridge_back" ]; then
  echo -e "${BLUE}Starting Django backend server...${NC}"
  
  cd vridge_back
  
  # Create virtual environment if it doesn't exist
  if [ ! -d "venv" ]; then
    python3 -m venv venv 2>/dev/null || {
      echo -e "${YELLOW}⚠ Could not create virtual environment, using system Python${NC}"
    }
  fi
  
  # Activate virtual environment if it exists
  if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
  fi
  
  # Install backend dependencies
  pip install -r requirements.txt 2>/dev/null || {
    echo -e "${YELLOW}⚠ Some backend dependencies could not be installed${NC}"
  }
  
  # Run migrations
  python manage.py migrate --noinput 2>/dev/null || true
  
  # Start Django server
  python manage.py runserver 0.0.0.0:8000 &
  DJANGO_PID=$!
  
  cd ..
  
  # Wait for Django to be ready
  wait_for_service "http://localhost:8000/api/health" || {
    echo -e "${YELLOW}⚠ Django server failed to start, using mock API${NC}"
    USE_MOCK_API="true"
  }
else
  echo -e "${YELLOW}Using mock API for testing${NC}"
fi

# Start Next.js server
echo -e "${BLUE}Starting Next.js server...${NC}"

if [ "$CI_MODE" = "true" ]; then
  npm run start &
else
  npm run start &
fi

NEXTJS_PID=$!

# Wait for Next.js to be ready
wait_for_service "http://localhost:3000" || {
  echo -e "${RED}✗ Next.js server failed to start${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Running E2E Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Build test command
TEST_CMD="npx playwright test"

# Add test suite selection
case $SUITE in
  auth)
    TEST_CMD="$TEST_CMD test/e2e/auth-flow.spec.ts"
    ;;
  projects)
    TEST_CMD="$TEST_CMD test/e2e/project-management.spec.ts"
    ;;
  feedback)
    TEST_CMD="$TEST_CMD test/e2e/feedback-comment.spec.ts"
    ;;
  accessibility)
    TEST_CMD="$TEST_CMD test/e2e/accessibility/"
    ;;
  performance)
    TEST_CMD="$TEST_CMD test/performance/"
    ;;
  all)
    TEST_CMD="$TEST_CMD test/e2e/ test/journeys/"
    ;;
  *)
    TEST_CMD="$TEST_CMD test/e2e/$SUITE"
    ;;
esac

# Add browser selection
if [ "$BROWSER" != "all" ]; then
  TEST_CMD="$TEST_CMD --project=${BROWSER}-desktop"
fi

# Add other options
TEST_CMD="$TEST_CMD $HEADED $DEBUG $UPDATE_SNAPSHOTS"

# Add reporters
if [ "$CI_MODE" = "true" ]; then
  TEST_CMD="$TEST_CMD --reporter=json,junit"
else
  TEST_CMD="$TEST_CMD --reporter=list,html"
fi

# Set environment variables
export BASE_URL="http://localhost:3000"
export API_URL="http://localhost:8000"
export USE_MOCK_API="$USE_MOCK_API"
export NODE_ENV="test"

# Run tests
echo -e "${BLUE}Test command: $TEST_CMD${NC}"
echo ""

# Execute tests and capture exit code
set +e
$TEST_CMD
TEST_EXIT_CODE=$?
set -e

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Test Results${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
else
  echo -e "${RED}✗ Some tests failed${NC}"
fi

# Generate and open report if requested
if [ "$REPORT" = "true" ] && [ "$CI_MODE" != "true" ]; then
  echo ""
  echo -e "${BLUE}Opening test report...${NC}"
  npx playwright show-report
fi

# Print summary
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Suite: ${SUITE}"
echo -e "  Browser: ${BROWSER}"
echo -e "  Backend: $([ "$USE_MOCK_API" = "true" ] && echo "Mock API" || echo "Django")"
echo -e "  Exit code: ${TEST_EXIT_CODE}"

# Exit with test exit code
exit $TEST_EXIT_CODE