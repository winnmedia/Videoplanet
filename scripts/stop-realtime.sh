#!/bin/bash

# Redis 및 WebSocket 실시간 통신 종료 스크립트
# 사용법: ./scripts/stop-realtime.sh

set -e

echo "🛑 VideoP lanet 실시간 서비스 종료..."
echo "=========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

# 1. Next.js 서버 종료
echo -e "${YELLOW}1. Next.js 서버 종료...${NC}"
if [ -f .nextjs.pid ]; then
    NEXTJS_PID=$(cat .nextjs.pid)
    if kill -0 $NEXTJS_PID 2>/dev/null; then
        kill $NEXTJS_PID
        echo -e "${GREEN}✅ Next.js 서버 종료 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  Next.js 서버가 실행 중이 아닙니다${NC}"
    fi
    rm .nextjs.pid
else
    # 포트로 찾아서 종료
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null || true
        echo -e "${GREEN}✅ Next.js 서버 종료 완료 (포트 3000)${NC}"
    else
        echo -e "${YELLOW}⚠️  Next.js 서버가 실행 중이 아닙니다${NC}"
    fi
fi

# 2. Django Channels 서버 종료
echo -e "${YELLOW}2. Django Channels 서버 종료...${NC}"
if [ -f .daphne.pid ]; then
    DAPHNE_PID=$(cat .daphne.pid)
    if kill -0 $DAPHNE_PID 2>/dev/null; then
        kill $DAPHNE_PID
        echo -e "${GREEN}✅ Django Channels 서버 종료 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  Django Channels 서버가 실행 중이 아닙니다${NC}"
    fi
    rm .daphne.pid
else
    # 포트로 찾아서 종료
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill $(lsof -Pi :8000 -sTCP:LISTEN -t) 2>/dev/null || true
        echo -e "${GREEN}✅ Django Channels 서버 종료 완료 (포트 8000)${NC}"
    else
        echo -e "${YELLOW}⚠️  Django Channels 서버가 실행 중이 아닙니다${NC}"
    fi
fi

# 3. Redis 서버 종료
echo -e "${YELLOW}3. Redis 서버 종료...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose stop redis
    echo -e "${GREEN}✅ Redis 서버 종료 완료${NC}"
else
    echo -e "${RED}❌ Docker Compose가 설치되지 않았습니다${NC}"
fi

# 4. 로그 파일 정리 (선택적)
echo -e "${YELLOW}4. 로그 파일 정리...${NC}"
if [ -d logs ]; then
    read -p "로그 파일을 삭제하시겠습니까? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f logs/*.log
        echo -e "${GREEN}✅ 로그 파일 삭제 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  로그 파일 유지${NC}"
    fi
fi

echo -e "\n${GREEN}=========================================="
echo "✅ VideoP lanet 실시간 서비스 종료 완료!"
echo "=========================================="
echo -e "${NC}"