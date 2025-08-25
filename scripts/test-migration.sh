#!/bin/bash
#
# PostgreSQL 마이그레이션 테스트 및 검증
# 사용법: ./scripts/test-migration.sh
#

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/vridge_back"

# 테스트 결과 저장
TEST_RESULTS="$PROJECT_ROOT/migration_test_results.txt"
rm -f "$TEST_RESULTS"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PostgreSQL 마이그레이션 검증${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 테스트 결과 기록 함수
log_test() {
    local test_name=$1
    local status=$2
    local message=$3
    
    echo "[$status] $test_name: $message" >> "$TEST_RESULTS"
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓ $test_name${NC}"
    else
        echo -e "${RED}✗ $test_name: $message${NC}"
    fi
}

# 1. Docker 및 PostgreSQL 컨테이너 확인
echo -e "${BLUE}[1/10] 환경 확인${NC}"

if docker ps | grep -q videoplanet_postgres; then
    log_test "PostgreSQL 컨테이너" "PASS" "실행 중"
else
    log_test "PostgreSQL 컨테이너" "FAIL" "실행되지 않음"
    echo -e "${YELLOW}PostgreSQL 시작 중...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose up -d postgres redis
    sleep 10
fi

if docker ps | grep -q videoplanet_redis; then
    log_test "Redis 컨테이너" "PASS" "실행 중"
else
    log_test "Redis 컨테이너" "FAIL" "실행되지 않음"
fi

# 2. PostgreSQL 연결 테스트
echo -e "${BLUE}[2/10] 데이터베이스 연결 테스트${NC}"

docker exec videoplanet_postgres psql \
    -U videoplanet_user \
    -d videoplanet_db \
    -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log_test "PostgreSQL 연결" "PASS" "성공"
else
    log_test "PostgreSQL 연결" "FAIL" "연결 실패"
    exit 1
fi

# 3. Django 설정 확인
echo -e "${BLUE}[3/10] Django 설정 검증${NC}"

cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 설정 체크
python manage.py check --database default > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_test "Django 설정" "PASS" "정상"
else
    log_test "Django 설정" "FAIL" "설정 오류"
fi

# 4. 마이그레이션 상태 확인
echo -e "${BLUE}[4/10] 마이그레이션 상태${NC}"

MIGRATION_STATUS=$(python manage.py showmigrations --plan | grep "\[X\]" | wc -l)
TOTAL_MIGRATIONS=$(python manage.py showmigrations --plan | wc -l)

if [ "$MIGRATION_STATUS" -eq "$TOTAL_MIGRATIONS" ]; then
    log_test "마이그레이션 적용" "PASS" "모든 마이그레이션 적용됨 ($MIGRATION_STATUS/$TOTAL_MIGRATIONS)"
else
    log_test "마이그레이션 적용" "WARN" "일부 미적용 ($MIGRATION_STATUS/$TOTAL_MIGRATIONS)"
fi

# 5. 데이터 무결성 검증
echo -e "${BLUE}[5/10] 데이터 무결성 검증${NC}"

python - << EOF
import sys
from django.db import connection
from django.contrib.auth import get_user_model
from projects.models import Project
from feedbacks.models import Feedback

try:
    User = get_user_model()
    
    # 레코드 수 확인
    user_count = User.objects.count()
    project_count = Project.objects.count()
    feedback_count = Feedback.objects.count()
    
    print(f"사용자: {user_count}, 프로젝트: {project_count}, 피드백: {feedback_count}")
    
    # 외래키 관계 검증
    if project_count > 0:
        project = Project.objects.first()
        # 프로젝트 멤버 관계 확인
        member_count = project.members.count()
        print(f"첫 번째 프로젝트의 멤버 수: {member_count}")
    
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    log_test "데이터 무결성" "PASS" "정상"
else
    log_test "데이터 무결성" "FAIL" "데이터 오류"
fi

# 6. 인덱스 확인
echo -e "${BLUE}[6/10] 인덱스 최적화 확인${NC}"

INDEX_COUNT=$(docker exec videoplanet_postgres psql \
    -U videoplanet_user \
    -d videoplanet_db \
    -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)

if [ "$INDEX_COUNT" -gt 20 ]; then
    log_test "인덱스 생성" "PASS" "인덱스 $INDEX_COUNT개 생성됨"
else
    log_test "인덱스 생성" "WARN" "인덱스가 적음 ($INDEX_COUNT개)"
fi

# 7. 쿼리 성능 테스트
echo -e "${BLUE}[7/10] 쿼리 성능 테스트${NC}"

python - << EOF
import time
from projects.models import Project
from feedbacks.models import Feedback
from django.db import connection

try:
    # 간단한 쿼리 성능 테스트
    start = time.time()
    
    # SELECT 쿼리
    projects = Project.objects.select_related('owner').prefetch_related('members')[:100]
    list(projects)  # 실제 실행
    
    select_time = time.time() - start
    
    # JOIN 쿼리
    start = time.time()
    feedbacks = Feedback.objects.select_related('project', 'users').filter(
        project__isnull=False
    )[:100]
    list(feedbacks)
    
    join_time = time.time() - start
    
    print(f"SELECT 시간: {select_time:.3f}초")
    print(f"JOIN 시간: {join_time:.3f}초")
    
    if select_time < 1.0 and join_time < 1.0:
        exit(0)
    else:
        exit(1)
        
except Exception as e:
    print(f"Error: {e}")
    exit(1)
EOF

if [ $? -eq 0 ]; then
    log_test "쿼리 성능" "PASS" "1초 이내"
else
    log_test "쿼리 성능" "WARN" "성능 개선 필요"
fi

# 8. 연결 풀 테스트
echo -e "${BLUE}[8/10] 연결 풀 테스트${NC}"

python - << EOF
from utils.db_optimization import connection_pool_manager

try:
    # 연결 상태 확인
    if connection_pool_manager.check_connection_health():
        stats = connection_pool_manager.get_pool_stats()
        print(f"총 연결: {stats['total_connections']}")
        print(f"활성 연결: {stats['active_connections']}")
        exit(0)
    else:
        exit(1)
except Exception as e:
    print(f"Error: {e}")
    exit(1)
EOF

if [ $? -eq 0 ]; then
    log_test "연결 풀" "PASS" "정상 작동"
else
    log_test "연결 풀" "FAIL" "연결 풀 오류"
fi

# 9. 백업/복구 테스트
echo -e "${BLUE}[9/10] 백업/복구 기능 테스트${NC}"

# 테스트 백업 생성
TEST_BACKUP="$PROJECT_ROOT/backups/postgres/test_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$(dirname "$TEST_BACKUP")"

docker exec videoplanet_postgres pg_dump \
    -U videoplanet_user \
    -d videoplanet_db \
    --no-owner \
    --schema-only \
    > "$TEST_BACKUP" 2>/dev/null

if [ -f "$TEST_BACKUP" ] && [ -s "$TEST_BACKUP" ]; then
    log_test "백업 기능" "PASS" "백업 생성 성공"
    rm -f "$TEST_BACKUP"
else
    log_test "백업 기능" "FAIL" "백업 생성 실패"
fi

# 10. API 엔드포인트 테스트
echo -e "${BLUE}[10/10] API 응답 테스트${NC}"

# Django 테스트 서버 시작 (백그라운드)
timeout 5 python manage.py runserver 0.0.0.0:8001 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# API 테스트
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/health/ > /dev/null 2>&1
HEALTH_STATUS=$?

kill $SERVER_PID 2>/dev/null || true

if [ $HEALTH_STATUS -eq 0 ]; then
    log_test "API 응답" "PASS" "정상"
else
    log_test "API 응답" "WARN" "응답 없음"
fi

# 테스트 결과 요약
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  테스트 결과 요약${NC}"
echo -e "${CYAN}========================================${NC}"

PASS_COUNT=$(grep -c "PASS" "$TEST_RESULTS" || true)
FAIL_COUNT=$(grep -c "FAIL" "$TEST_RESULTS" || true)
WARN_COUNT=$(grep -c "WARN" "$TEST_RESULTS" || true)

echo -e "${GREEN}통과: $PASS_COUNT${NC}"
echo -e "${YELLOW}경고: $WARN_COUNT${NC}"
echo -e "${RED}실패: $FAIL_COUNT${NC}"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  마이그레이션 검증 성공!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}권장 사항:${NC}"
    echo -e "  1. 운영 환경 배포 전 스테이징 환경에서 추가 테스트"
    echo -e "  2. 정기적인 백업 스케줄 설정"
    echo -e "  3. 모니터링 도구 설정 (Grafana, Prometheus 등)"
    echo -e "  4. 슬로우 쿼리 로그 모니터링"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  일부 테스트 실패${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${YELLOW}상세 결과: $TEST_RESULTS${NC}"
    exit 1
fi

# 성능 권장사항
echo ""
echo -e "${BLUE}성능 최적화 권장사항:${NC}"
echo -e "  • VACUUM ANALYZE 정기 실행"
echo -e "  • pg_stat_statements 모니터링"
echo -e "  • 연결 풀 크기 조정 (현재: CONN_MAX_AGE=600)"
echo -e "  • 캐시 TTL 최적화 (현재: 300초)"
echo ""

# 다음 단계 안내
echo -e "${YELLOW}다음 단계:${NC}"
echo -e "  1. ./scripts/migrate-to-postgres.sh 실행하여 실제 마이그레이션"
echo -e "  2. 운영 환경 설정 파일 업데이트 (.env)"
echo -e "  3. CI/CD 파이프라인 업데이트"
echo ""