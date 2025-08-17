#!/bin/bash
# CORS 테스트 스크립트
# Railway 백엔드 서버의 CORS 설정을 다양한 도메인으로 테스트

API_BASE="https://videoplanet.up.railway.app"
ENDPOINTS=(
    "/api/v1/auth/login/"
    "/api/v1/auth/register/"
    "/api/v1/projects/"
    "/api/v1/feedbacks/"
)

# 테스트할 도메인 목록
DOMAINS=(
    "https://videoplanet.vercel.app"
    "https://www.vlanet.net"
    "https://vlanet.net"
    "https://api.vlanet.net"
    "https://videoplanet-git-master-winnmedia.vercel.app"
    "https://videoplanet-123abc.vercel.app"
    "http://localhost:3000"
    "http://127.0.0.1:3000"
)

echo "=================="
echo "CORS 테스트 시작"
echo "API 서버: $API_BASE"
echo "=================="
echo

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 함수
test_cors() {
    local origin=$1
    local endpoint=$2
    local url="${API_BASE}${endpoint}"
    
    echo -n "Testing $origin -> $endpoint ... "
    
    # OPTIONS preflight 요청
    response=$(curl -s -I -X OPTIONS "$url" \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        --connect-timeout 10)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}FAILED (Connection Error)${NC}"
        return 1
    fi
    
    # CORS 헤더 확인
    access_control_origin=$(echo "$response" | grep -i "access-control-allow-origin" | tr -d '\r')
    access_control_methods=$(echo "$response" | grep -i "access-control-allow-methods" | tr -d '\r')
    access_control_headers=$(echo "$response" | grep -i "access-control-allow-headers" | tr -d '\r')
    
    if [[ -n "$access_control_origin" ]]; then
        echo -e "${GREEN}ALLOWED${NC}"
        if [[ "$access_control_origin" == *"$origin"* ]] || [[ "$access_control_origin" == *"*"* ]]; then
            echo "  ✓ Origin: $(echo "$access_control_origin" | cut -d':' -f2- | tr -d ' ')"
        else
            echo -e "  ${YELLOW}⚠ Origin Mismatch: $(echo "$access_control_origin" | cut -d':' -f2- | tr -d ' ')${NC}"
        fi
        
        if [[ -n "$access_control_methods" ]]; then
            echo "  ✓ Methods: $(echo "$access_control_methods" | cut -d':' -f2- | tr -d ' ')"
        fi
        
        if [[ -n "$access_control_headers" ]]; then
            echo "  ✓ Headers: $(echo "$access_control_headers" | cut -d':' -f2- | tr -d ' ')"
        fi
    else
        echo -e "${RED}BLOCKED${NC}"
        echo "  ✗ No Access-Control-Allow-Origin header found"
    fi
    
    echo
}

# 실제 POST 요청 테스트
test_post_request() {
    local origin=$1
    local endpoint="/api/v1/auth/login/"
    local url="${API_BASE}${endpoint}"
    
    echo -n "Testing POST request from $origin ... "
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Origin: $origin" \
        -H "Content-Type: application/json" \
        -H "Referer: $origin" \
        -d '{"username":"test","password":"test"}' \
        --connect-timeout 10)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        echo -e "${GREEN}SUCCESS (HTTP $http_code)${NC}"
        if [[ "$body" == *"CORS"* ]] || [[ "$body" == *"Origin"* ]]; then
            echo -e "  ${RED}⚠ CORS related error in response${NC}"
        fi
    else
        echo -e "${RED}FAILED (HTTP $http_code)${NC}"
        if [ "$http_code" = "403" ] && [[ "$body" == *"CORS"* ]]; then
            echo "  ✗ CORS policy violation"
        fi
    fi
    
    echo
}

# 메인 테스트 실행
for domain in "${DOMAINS[@]}"; do
    echo "----------------------------------------"
    echo "도메인: $domain"
    echo "----------------------------------------"
    
    # 각 엔드포인트에 대해 OPTIONS 테스트
    for endpoint in "${ENDPOINTS[@]}"; do
        test_cors "$domain" "$endpoint"
    done
    
    # POST 요청 테스트
    test_post_request "$domain"
    
    echo
done

echo "=================="
echo "CORS 테스트 완료"
echo "=================="

# Django 설정에 추가해야 할 도메인 제안
echo
echo "=================="
echo "권장 CORS 설정"
echo "=================="
echo "Django settings.py에 다음 도메인들을 추가하세요:"
echo
echo "CORS_ALLOWED_ORIGINS = ["
echo "    'https://vlanet.net',"
echo "    'https://www.vlanet.net',"
echo "    'https://api.vlanet.net',"
echo "    'https://videoplanet.vercel.app',"
echo "    'https://videoplanet-git-master-winnmedia.vercel.app',"
echo "]"
echo
echo "개발 환경에서만 localhost 추가:"
echo "if DEBUG:"
echo "    CORS_ALLOWED_ORIGINS.extend(["
echo "        'http://localhost:3000',"
echo "        'http://127.0.0.1:3000',"
echo "    ])"
echo
echo "동적 Vercel preview 도메인 처리:"
echo "CORS_ALLOW_ALL_ORIGINS = False"
echo "CORS_ALLOWED_ORIGIN_REGEXES = ["
echo "    r'^https://videoplanet-.*\.vercel\.app$',"
echo "]"