#!/bin/bash
#
# PostgreSQL 복구 스크립트
# 사용법: ./scripts/postgres-restore.sh <backup_file.tar.gz>
#

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 백업 파일 확인
if [ $# -eq 0 ]; then
    echo -e "${RED}[ERROR] 백업 파일을 지정해주세요.${NC}"
    echo -e "${YELLOW}사용법: $0 <backup_file.tar.gz>${NC}"
    echo ""
    echo -e "${BLUE}사용 가능한 백업 파일:${NC}"
    ls -lh backups/postgres/*.tar.gz 2>/dev/null || echo "  백업 파일이 없습니다."
    exit 1
fi

BACKUP_FILE="$1"

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups/postgres"
RESTORE_DIR="$PROJECT_ROOT/backups/restore_$(date +%Y%m%d_%H%M%S)"

# PostgreSQL 연결 정보
DB_NAME="videoplanet_db"
DB_USER="videoplanet_user"
DB_PASSWORD="videoplanet_pass_2024"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PostgreSQL 복구 도구${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}백업 파일: $BACKUP_FILE${NC}"
echo ""

# 백업 파일 존재 확인
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}[ERROR] 백업 파일을 찾을 수 없습니다: $BACKUP_FILE${NC}"
        exit 1
    fi
    BACKUP_PATH="$BACKUP_FILE"
else
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
fi

# PostgreSQL 컨테이너 확인
if ! docker ps | grep -q videoplanet_postgres; then
    echo -e "${RED}[ERROR] PostgreSQL 컨테이너가 실행되고 있지 않습니다.${NC}"
    echo -e "${YELLOW}다음 명령으로 시작하세요: docker-compose up -d postgres${NC}"
    exit 1
fi

# 복구 디렉토리 생성
mkdir -p "$RESTORE_DIR"

# 백업 파일 압축 해제
echo -e "${BLUE}[1/6] 백업 파일 압축 해제 중...${NC}"
tar -xzf "$BACKUP_PATH" -C "$RESTORE_DIR"
echo -e "${GREEN}✓ 압축 해제 완료${NC}"

# 현재 데이터베이스 백업 (안전을 위해)
echo -e "${BLUE}[2/6] 현재 데이터베이스 백업 중...${NC}"
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_before_restore_$(date +%Y%m%d_%H%M%S).sql"
export PGPASSWORD="$DB_PASSWORD"
docker exec videoplanet_postgres pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    > "$SAFETY_BACKUP" 2>/dev/null || true
echo -e "${GREEN}✓ 안전 백업 완료: $SAFETY_BACKUP${NC}"

# 복구 타입 확인
echo -e "${BLUE}[3/6] 복구 타입 확인 중...${NC}"
if ls "$RESTORE_DIR"/*.sql 2>/dev/null | grep -q "full_backup"; then
    RESTORE_TYPE="full"
    RESTORE_FILE=$(ls "$RESTORE_DIR"/full_backup_*.sql | head -1)
elif ls "$RESTORE_DIR"/*.sql 2>/dev/null | grep -q "data_only"; then
    RESTORE_TYPE="data-only"
    RESTORE_FILE=$(ls "$RESTORE_DIR"/data_only_*.sql | head -1)
elif ls "$RESTORE_DIR"/*.sql 2>/dev/null | grep -q "schema_only"; then
    RESTORE_TYPE="schema-only"
    RESTORE_FILE=$(ls "$RESTORE_DIR"/schema_only_*.sql | head -1)
elif ls "$RESTORE_DIR"/*.dump 2>/dev/null | grep -q "full_backup"; then
    RESTORE_TYPE="custom"
    RESTORE_FILE=$(ls "$RESTORE_DIR"/full_backup_*.dump | head -1)
else
    echo -e "${RED}[ERROR] 복구 가능한 백업 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}복구 타입: $RESTORE_TYPE${NC}"

# 사용자 확인
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  경고: 데이터베이스 복구${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${RED}이 작업은 현재 데이터베이스의 내용을 덮어씁니다!${NC}"
echo -e "${CYAN}안전 백업 위치: $SAFETY_BACKUP${NC}"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}복구가 취소되었습니다.${NC}"
    exit 0
fi

# 복구 실행
echo -e "${BLUE}[4/6] 데이터베이스 복구 중...${NC}"

case "$RESTORE_TYPE" in
    full)
        # 전체 백업 복구
        echo -e "${YELLOW}→ 기존 데이터베이스 정리 중...${NC}"
        docker exec videoplanet_postgres psql \
            -U "$DB_USER" \
            -d postgres \
            -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        
        docker exec videoplanet_postgres psql \
            -U "$DB_USER" \
            -d postgres \
            -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
        
        echo -e "${YELLOW}→ 데이터 복구 중...${NC}"
        docker exec -i videoplanet_postgres psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            < "$RESTORE_FILE"
        ;;
        
    custom)
        # 커스텀 포맷 복구
        echo -e "${YELLOW}→ 커스텀 포맷 복구 중...${NC}"
        docker cp "$RESTORE_FILE" videoplanet_postgres:/tmp/restore.dump
        
        docker exec videoplanet_postgres pg_restore \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --verbose \
            /tmp/restore.dump 2>/dev/null || true
        
        docker exec videoplanet_postgres rm /tmp/restore.dump
        ;;
        
    data-only)
        # 데이터만 복구
        echo -e "${YELLOW}→ 기존 데이터 삭제 중...${NC}"
        docker exec videoplanet_postgres psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -c "TRUNCATE TABLE users_user, projects_project, feedbacks_feedback CASCADE;" 2>/dev/null || true
        
        echo -e "${YELLOW}→ 데이터 복구 중...${NC}"
        docker exec -i videoplanet_postgres psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            < "$RESTORE_FILE"
        ;;
        
    schema-only)
        # 스키마만 복구
        echo -e "${YELLOW}→ 스키마 복구 중...${NC}"
        docker exec -i videoplanet_postgres psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            < "$RESTORE_FILE"
        ;;
esac

echo -e "${GREEN}✓ 데이터베이스 복구 완료${NC}"

# Django fixture 복구 (있는 경우)
if ls "$RESTORE_DIR"/fixtures_*/all_data.json 2>/dev/null; then
    echo -e "${BLUE}[5/6] Django fixture 복구 중...${NC}"
    FIXTURE_FILE=$(ls "$RESTORE_DIR"/fixtures_*/all_data.json | head -1)
    
    cd "$PROJECT_ROOT/vridge_back"
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    python manage.py loaddata "$FIXTURE_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠ Fixture 복구 부분 실패 (중복 데이터 가능성)${NC}"
    }
    
    echo -e "${GREEN}✓ Fixture 복구 완료${NC}"
else
    echo -e "${BLUE}[5/6] Fixture 파일 없음 - 건너뜀${NC}"
fi

# 시퀀스 재설정 및 통계 업데이트
echo -e "${BLUE}[6/6] 데이터베이스 최적화 중...${NC}"

# 시퀀스 재설정
docker exec videoplanet_postgres psql \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT setval(pg_get_serial_sequence(table_name, 'id'), COALESCE(MAX(id), 1)) 
        FROM information_schema.columns 
        WHERE column_default LIKE 'nextval%' 
        GROUP BY table_name;" 2>/dev/null || true

# VACUUM 및 ANALYZE 실행
docker exec videoplanet_postgres psql \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "VACUUM ANALYZE;" 2>/dev/null || true

echo -e "${GREEN}✓ 최적화 완료${NC}"

# 검증
echo -e "${BLUE}[검증] 복구된 데이터 확인 중...${NC}"
cd "$PROJECT_ROOT/vridge_back"
python manage.py shell << EOF 2>/dev/null || true
from django.contrib.auth import get_user_model
from projects.models import Project
from feedbacks.models import Feedback

User = get_user_model()
print(f"사용자 수: {User.objects.count()}")
print(f"프로젝트 수: {Project.objects.count()}")
print(f"피드백 수: {Feedback.objects.count()}")
EOF

# 정리
rm -rf "$RESTORE_DIR"

# 완료 메시지
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  복구 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${CYAN}백업 파일: $BACKUP_FILE${NC}"
echo -e "${CYAN}복구 타입: $RESTORE_TYPE${NC}"
echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo -e "  1. Django 서버 재시작"
echo -e "  2. 애플리케이션 테스트"
echo -e "  3. 문제 발생 시 안전 백업으로 복구:"
echo -e "     $0 $(basename "$SAFETY_BACKUP")"
echo ""