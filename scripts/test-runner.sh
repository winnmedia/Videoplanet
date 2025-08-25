#!/bin/bash

# VideoPlanet Test Runner
# 환경별 최적화된 테스트 실행 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 감지
detect_environment() {
    if [ "$CI" = "true" ]; then
        echo "ci"
    elif [ -n "$WSL_DISTRO_NAME" ]; then
        echo "wsl"
    elif [ "$(uname)" = "Darwin" ]; then
        echo "macos"
    elif [ "$(uname)" = "Linux" ]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# 브라우저 종속성 확인
check_browser_deps() {
    print_status "브라우저 종속성 확인 중..."
    
    if command -v google-chrome >/dev/null 2>&1; then
        print_success "Chrome 설치됨"
    elif command -v chromium-browser >/dev/null 2>&1; then
        print_success "Chromium 설치됨"
    else
        print_warning "Chrome/Chromium 없음 - headless 모드 필수"
    fi
}

# 서버 상태 확인
check_server() {
    print_status "개발 서버 상태 확인 중..."
    
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "개발 서버 실행 중 (http://localhost:3000)"
        return 0
    elif curl -s http://localhost:3005 >/dev/null 2>&1; then
        print_success "개발 서버 실행 중 (http://localhost:3005)"
        return 0
    else
        print_warning "개발 서버가 실행되지 않음 (3000, 3005 포트 확인)"
        return 1
    fi
}

# 테스트 실행
run_tests() {
    local test_type="$1"
    local environment="$2"
    
    print_status "테스트 실행: $test_type (환경: $environment)"
    
    # 환경별 설정
    export NODE_ENV=test
    export CI="${CI:-false}"
    
    case $test_type in
        "quick")
            print_status "빠른 테스트 실행 (Chrome만)"
            npx playwright test test/journeys/checkout.spec.ts --project=chrome-desktop --reporter=list
            ;;
        "core")
            print_status "핵심 기능 테스트"
            npx playwright test --grep="@core" --project=chrome-desktop
            ;;
        "cross-browser")
            print_status "크로스 브라우저 테스트"
            npx playwright test --project=chrome-desktop --project=firefox-desktop --project=safari-desktop
            ;;
        "full")
            print_status "전체 테스트 스위트"
            npx playwright test
            ;;
        "websocket")
            print_status "WebSocket 테스트"
            npx playwright test test/websocket/ --project=chrome-desktop
            ;;
        *)
            print_error "알 수 없는 테스트 타입: $test_type"
            print_status "사용 가능한 옵션: quick, core, cross-browser, full, websocket"
            exit 1
            ;;
    esac
}

# 메인 실행
main() {
    echo "🚀 VideoPlanet 테스트 실행기"
    echo "================================"
    
    # 환경 감지
    ENVIRONMENT=$(detect_environment)
    print_status "감지된 환경: $ENVIRONMENT"
    
    # 브라우저 종속성 확인
    check_browser_deps
    
    # 서버 확인
    if ! check_server; then
        print_error "개발 서버가 실행되지 않았습니다."
        print_status "다음 명령으로 서버를 시작하세요: npm run dev"
        exit 1
    fi
    
    # 테스트 타입 결정
    TEST_TYPE="${1:-quick}"
    
    # 환경별 최적화
    case $ENVIRONMENT in
        "ci")
            print_status "CI 환경 최적화 적용"
            export CI=true
            ;;
        "wsl")
            print_status "WSL 환경 최적화 적용"
            export DISPLAY="${DISPLAY:-:0}"
            ;;
    esac
    
    # 테스트 실행
    run_tests "$TEST_TYPE" "$ENVIRONMENT"
    
    # 결과 출력
    if [ $? -eq 0 ]; then
        print_success "✅ 모든 테스트가 성공적으로 완료되었습니다!"
    else
        print_error "❌ 일부 테스트가 실패했습니다."
        exit 1
    fi
}

# 도움말
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "사용법: $0 [테스트_타입]"
    echo ""
    echo "테스트 타입:"
    echo "  quick        - 빠른 테스트 (기본값)"
    echo "  core         - 핵심 기능 테스트"
    echo "  cross-browser - 크로스 브라우저 테스트"
    echo "  full         - 전체 테스트 스위트"
    echo "  websocket    - WebSocket 테스트"
    echo ""
    echo "예시:"
    echo "  $0 quick"
    echo "  $0 core"
    echo "  $0 cross-browser"
    exit 0
fi

# 메인 함수 실행
main "$@"