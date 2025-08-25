#!/bin/bash

# VideoPlanet 통합 테스트 스크립트
# 프론트엔드와 백엔드 API 연동 상태를 테스트합니다.

echo "🧪 VideoPlanet 통합 테스트"
echo "=================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT" || exit 1

# 테스트 결과 저장
PASSED=0
FAILED=0
WARNINGS=0

# 테스트 함수
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "📍 $name 테스트 중... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5 2>/dev/null)
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✅ 성공 (HTTP $response)${NC}"
        ((PASSED++))
        return 0
    elif [ "$response" == "000" ]; then
        echo -e "${RED}❌ 연결 실패${NC}"
        ((FAILED++))
        return 1
    else
        echo -e "${YELLOW}⚠️  예상과 다른 응답 (예상: $expected_status, 실제: $response)${NC}"
        ((WARNINGS++))
        return 2
    fi
}

# 프로세스 확인 함수
check_process() {
    local name=$1
    local port=$2
    
    echo -n "🔍 $name (포트 $port) 확인 중... "
    
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 실행 중${NC}"
        return 0
    else
        echo -e "${RED}❌ 실행되지 않음${NC}"
        return 1
    fi
}

# 파일 존재 확인 함수
check_file() {
    local name=$1
    local path=$2
    
    echo -n "📄 $name 확인 중... "
    
    if [ -f "$path" ]; then
        echo -e "${GREEN}✅ 존재함${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  파일이 없습니다${NC}"
        return 1
    fi
}

echo "1️⃣  환경 설정 확인"
echo "-------------------"
check_file ".env.local" ".env.local"
check_file "Django .env" "vridge_back/.env"
check_file "package.json" "package.json"
check_file "requirements.txt" "vridge_back/requirements.txt"
echo ""

echo "2️⃣  서비스 상태 확인"
echo "--------------------"
check_process "Next.js 개발 서버" 3000
NEXTJS_RUNNING=$?
check_process "Django 개발 서버" 8000
DJANGO_RUNNING=$?
echo ""

echo "3️⃣  API 엔드포인트 테스트"
echo "------------------------"

if [ $NEXTJS_RUNNING -eq 0 ]; then
    echo -e "${BLUE}[Next.js Mock API]${NC}"
    test_endpoint "API 테스트 페이지" "http://localhost:3000/api/test" "200"
    test_endpoint "대시보드 통계" "http://localhost:3000/api/dashboard/stats" "200"
    test_endpoint "알림 목록" "http://localhost:3000/api/notifications/feedback" "200"
    test_endpoint "프로젝트 알림" "http://localhost:3000/api/notifications/project" "200"
    echo ""
fi

if [ $DJANGO_RUNNING -eq 0 ]; then
    echo -e "${BLUE}[Django Backend API]${NC}"
    test_endpoint "Health Check" "http://localhost:8000/api/health/" "200"
    test_endpoint "API Info" "http://localhost:8000/api/info/" "200"
    test_endpoint "Admin 페이지" "http://localhost:8000/admin/" "200"
    test_endpoint "프로젝트 목록" "http://localhost:8000/api/projects/" "200"
    test_endpoint "피드백 목록" "http://localhost:8000/api/feedbacks/" "200"
    echo ""
fi

echo "4️⃣  웹 페이지 접근성 테스트"
echo "-------------------------"
if [ $NEXTJS_RUNNING -eq 0 ]; then
    test_endpoint "홈페이지" "http://localhost:3000/" "200"
    test_endpoint "대시보드" "http://localhost:3000/dashboard" "200"
    test_endpoint "프로젝트 목록" "http://localhost:3000/projects" "200"
    test_endpoint "영상 기획" "http://localhost:3000/video-planning" "200"
fi
echo ""

echo "5️⃣  통합 테스트 결과"
echo "===================="
echo -e "✅ 성공: ${GREEN}$PASSED${NC}"
echo -e "⚠️  경고: ${YELLOW}$WARNINGS${NC}"
echo -e "❌ 실패: ${RED}$FAILED${NC}"
echo ""

# 권장사항 출력
echo "📋 권장사항"
echo "-----------"

if [ $NEXTJS_RUNNING -ne 0 ]; then
    echo "• Next.js 서버를 시작하세요:"
    echo "  ${GREEN}npm run dev${NC}"
    echo ""
fi

if [ $DJANGO_RUNNING -ne 0 ]; then
    echo "• Django 서버를 시작하세요:"
    echo "  ${GREEN}cd vridge_back && python3 manage.py runserver${NC}"
    echo "  또는"
    echo "  ${GREEN}./scripts/start-django.sh${NC}"
    echo ""
fi

if [ $NEXTJS_RUNNING -eq 0 ] && [ $DJANGO_RUNNING -eq 0 ]; then
    echo "• 모든 서비스가 실행 중입니다! 🎉"
    echo "• API 테스트 페이지를 확인하세요:"
    echo "  ${BLUE}http://localhost:3000/api/test${NC}"
fi

echo ""
echo "테스트 완료: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================="