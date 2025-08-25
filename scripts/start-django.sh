#!/bin/bash

# Django 백엔드 실행 스크립트
# 이 스크립트는 시스템에 python3-venv가 설치된 경우에만 작동합니다.

echo "🚀 VideoPlanet Django Backend 시작 스크립트"
echo "========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.." || exit 1
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/vridge_back"

echo "📁 프로젝트 디렉토리: $PROJECT_ROOT"
echo "📁 백엔드 디렉토리: $BACKEND_DIR"
echo ""

# 백엔드 디렉토리 확인
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ 백엔드 디렉토리를 찾을 수 없습니다: $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR" || exit 1

# Python 버전 확인
echo "🐍 Python 버전 확인..."
python3 --version

# 가상환경 확인 및 생성
VENV_DIR="$BACKEND_DIR/venv"

if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}📦 가상환경 생성 중...${NC}"
    echo "다음 명령어를 수동으로 실행해주세요:"
    echo ""
    echo -e "${GREEN}sudo apt update${NC}"
    echo -e "${GREEN}sudo apt install python3-venv python3-pip${NC}"
    echo -e "${GREEN}python3 -m venv venv${NC}"
    echo -e "${GREEN}source venv/bin/activate${NC}"
    echo -e "${GREEN}pip install -r requirements.txt${NC}"
    echo ""
    echo "그 다음 이 스크립트를 다시 실행하세요."
    exit 1
fi

# 가상환경 활성화
echo "🔧 가상환경 활성화..."
source "$VENV_DIR/bin/activate"

# .env 파일 확인
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env 파일이 없습니다. .env.example을 복사합니다...${NC}"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "✅ .env 파일이 생성되었습니다. 필요한 경우 수정하세요."
fi

# 데이터베이스 마이그레이션
echo ""
echo "🗄️  데이터베이스 마이그레이션 확인..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# 정적 파일 수집 (선택사항)
# echo "📁 정적 파일 수집..."
# python manage.py collectstatic --noinput

# 서버 실행
echo ""
echo -e "${GREEN}✨ Django 개발 서버를 시작합니다...${NC}"
echo "🌐 서버 주소: http://localhost:8000"
echo "📚 API 문서: http://localhost:8000/api/docs/"
echo "🧪 Health Check: http://localhost:8000/api/health/"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo "========================================="
echo ""

# Django 개발 서버 실행
python manage.py runserver 0.0.0.0:8000