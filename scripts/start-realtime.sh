#!/bin/bash

# Redis 및 WebSocket 실시간 통신 시작 스크립트
# 사용법: ./scripts/start-realtime.sh

set -e

echo "🚀 VideoP lanet 실시간 서비스 시작..."
echo "=========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

# 1. Docker 및 Docker Compose 확인
echo -e "${YELLOW}1. Docker 환경 확인...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
    echo "Docker를 설치해주세요: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되지 않았습니다.${NC}"
    echo "Docker Compose를 설치해주세요: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker 환경 준비 완료${NC}"

# 2. 환경 변수 파일 확인
echo -e "\n${YELLOW}2. 환경 변수 설정 확인...${NC}"
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 생성합니다...${NC}"
    cat > .env.local << EOF
# Next.js 환경 변수
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
EOF
    echo -e "${GREEN}✅ .env.local 파일 생성 완료${NC}"
else
    echo -e "${GREEN}✅ 환경 변수 파일 존재${NC}"
fi

# 3. Docker Compose로 Redis 시작
echo -e "\n${YELLOW}3. Redis 서버 시작...${NC}"
docker-compose up -d redis

# Redis 연결 확인 (최대 30초 대기)
echo -e "${YELLOW}Redis 연결 대기 중...${NC}"
COUNTER=0
while [ $COUNTER -lt 30 ]; do
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "${GREEN}✅ Redis 서버 정상 작동${NC}"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done

if [ $COUNTER -eq 30 ]; then
    echo -e "\n${RED}❌ Redis 서버 시작 실패${NC}"
    exit 1
fi

# 4. Python 가상환경 및 Django 설정
echo -e "\n${YELLOW}4. Django 백엔드 설정...${NC}"
cd vridge_back

# 가상환경 확인 및 생성
if [ ! -d "venv" ]; then
    echo "Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 필수 패키지 설치
echo "필수 패키지 설치 중..."
pip install -q channels channels-redis daphne

# Django 설정에 channels_settings 추가 확인
if ! grep -q "channels_settings" config/settings.py; then
    echo -e "${YELLOW}Django 설정에 Channels 설정 추가...${NC}"
    cat >> config/settings.py << 'EOF'

# Channels 설정 추가
try:
    from .channels_settings import *
except ImportError:
    print("Warning: channels_settings.py not found")
EOF
fi

# 5. Django 마이그레이션
echo -e "\n${YELLOW}5. 데이터베이스 마이그레이션...${NC}"
python manage.py migrate --no-input 2>/dev/null || true

# 6. Django Channels 서버 시작 (Daphne)
echo -e "\n${YELLOW}6. Django Channels 서버 시작...${NC}"
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  포트 8000이 이미 사용 중입니다. 기존 서버를 종료합니다...${NC}"
    kill $(lsof -Pi :8000 -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 2
fi

# Daphne로 ASGI 서버 시작 (백그라운드)
nohup daphne -b 0.0.0.0 -p 8000 config.asgi:application > ../logs/daphne.log 2>&1 &
DAPHNE_PID=$!
echo "Daphne 서버 PID: $DAPHNE_PID"

# 서버 시작 확인
sleep 3
if kill -0 $DAPHNE_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Django Channels 서버 시작 완료${NC}"
else
    echo -e "${RED}❌ Django Channels 서버 시작 실패${NC}"
    echo "로그 확인: tail -f logs/daphne.log"
    exit 1
fi

cd ..

# 7. Next.js 개발 서버 시작
echo -e "\n${YELLOW}7. Next.js 개발 서버 시작...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  포트 3000이 이미 사용 중입니다.${NC}"
else
    npm run dev > logs/nextjs.log 2>&1 &
    NEXTJS_PID=$!
    echo "Next.js 서버 PID: $NEXTJS_PID"
    sleep 5
    
    if kill -0 $NEXTJS_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Next.js 서버 시작 완료${NC}"
    else
        echo -e "${RED}❌ Next.js 서버 시작 실패${NC}"
        echo "로그 확인: tail -f logs/nextjs.log"
    fi
fi

# 8. 서비스 상태 요약
echo -e "\n${GREEN}=========================================="
echo "✅ VideoP lanet 실시간 서비스 시작 완료!"
echo "=========================================="
echo -e "${NC}"
echo "🌐 서비스 URL:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - WebSocket: ws://localhost:8000"
echo "  - Redis: localhost:6379"
echo ""
echo "📊 서비스 상태 확인:"
echo "  - Redis: docker-compose ps redis"
echo "  - Django: curl http://localhost:8000/api/health/"
echo "  - WebSocket: wscat -c ws://localhost:8000/ws/notifications/"
echo ""
echo "🛑 서비스 종료:"
echo "  - ./scripts/stop-realtime.sh"
echo ""
echo "📝 로그 확인:"
echo "  - Django: tail -f logs/daphne.log"
echo "  - Next.js: tail -f logs/nextjs.log"
echo "  - Redis: docker-compose logs -f redis"
echo ""
echo "=========================================="

# PID 파일 저장
echo "$DAPHNE_PID" > .daphne.pid
echo "$NEXTJS_PID" > .nextjs.pid

echo -e "${GREEN}실시간 서비스가 성공적으로 시작되었습니다!${NC}"