#!/bin/bash
#
# PostgreSQL 백업 스크립트
# 사용법: ./scripts/postgres-backup.sh [full|incremental|data-only]
#

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 백업 타입 (기본값: full)
BACKUP_TYPE=${1:-full}

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups/postgres"

# PostgreSQL 연결 정보
DB_NAME="videoplanet_db"
DB_USER="videoplanet_user"
DB_PASSWORD="videoplanet_pass_2024"
DB_HOST="localhost"
DB_PORT="5432"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PostgreSQL 백업 도구${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}백업 타입: $BACKUP_TYPE${NC}"
echo ""

# PostgreSQL 컨테이너 확인
if ! docker ps | grep -q videoplanet_postgres; then
    echo -e "${RED}[ERROR] PostgreSQL 컨테이너가 실행되고 있지 않습니다.${NC}"
    echo -e "${YELLOW}다음 명령으로 시작하세요: docker-compose up -d postgres${NC}"
    exit 1
fi

# 환경변수 설정 (pg_dump용)
export PGPASSWORD="$DB_PASSWORD"

case "$BACKUP_TYPE" in
    full)
        echo -e "${BLUE}[전체 백업] 데이터베이스 전체 백업 시작...${NC}"
        
        # 1. SQL 덤프 (스키마 + 데이터)
        BACKUP_FILE="$BACKUP_DIR/full_backup_${TIMESTAMP}.sql"
        docker exec videoplanet_postgres pg_dump \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            --create \
            --no-owner \
            --no-privileges \
            > "$BACKUP_FILE"
        
        echo -e "${GREEN}✓ SQL 덤프 완료: $BACKUP_FILE${NC}"
        
        # 2. 커스텀 포맷 백업 (병렬 복구 가능)
        CUSTOM_FILE="$BACKUP_DIR/full_backup_${TIMESTAMP}.dump"
        docker exec videoplanet_postgres pg_dump \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --format=custom \
            --compress=9 \
            --file="/tmp/backup.dump"
        
        docker cp videoplanet_postgres:/tmp/backup.dump "$CUSTOM_FILE"
        docker exec videoplanet_postgres rm /tmp/backup.dump
        
        echo -e "${GREEN}✓ 커스텀 포맷 백업 완료: $CUSTOM_FILE${NC}"
        ;;
        
    incremental)
        echo -e "${BLUE}[증분 백업] WAL 아카이브 기반 백업...${NC}"
        
        # WAL 아카이브 백업 (Point-in-Time Recovery용)
        WAL_BACKUP_DIR="$BACKUP_DIR/wal_${TIMESTAMP}"
        mkdir -p "$WAL_BACKUP_DIR"
        
        # 베이스 백업 생성
        docker exec videoplanet_postgres pg_basebackup \
            -U "$DB_USER" \
            -D "/tmp/basebackup" \
            -Ft \
            -z \
            -P \
            -Xs 2>/dev/null || {
                echo -e "${YELLOW}[INFO] pg_basebackup이 지원되지 않습니다. 전체 백업으로 대체합니다.${NC}"
                "$0" full
                exit 0
            }
        
        docker cp videoplanet_postgres:/tmp/basebackup "$WAL_BACKUP_DIR/"
        docker exec videoplanet_postgres rm -rf /tmp/basebackup
        
        echo -e "${GREEN}✓ WAL 아카이브 백업 완료: $WAL_BACKUP_DIR${NC}"
        ;;
        
    data-only)
        echo -e "${BLUE}[데이터 전용 백업] 데이터만 백업...${NC}"
        
        DATA_FILE="$BACKUP_DIR/data_only_${TIMESTAMP}.sql"
        docker exec videoplanet_postgres pg_dump \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --data-only \
            --column-inserts \
            --no-owner \
            > "$DATA_FILE"
        
        echo -e "${GREEN}✓ 데이터 전용 백업 완료: $DATA_FILE${NC}"
        ;;
        
    schema-only)
        echo -e "${BLUE}[스키마 전용 백업] 스키마만 백업...${NC}"
        
        SCHEMA_FILE="$BACKUP_DIR/schema_only_${TIMESTAMP}.sql"
        docker exec videoplanet_postgres pg_dump \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --schema-only \
            --no-owner \
            > "$SCHEMA_FILE"
        
        echo -e "${GREEN}✓ 스키마 전용 백업 완료: $SCHEMA_FILE${NC}"
        ;;
        
    *)
        echo -e "${RED}[ERROR] 알 수 없는 백업 타입: $BACKUP_TYPE${NC}"
        echo -e "${YELLOW}사용 가능한 옵션: full, incremental, data-only, schema-only${NC}"
        exit 1
        ;;
esac

# Django fixture 백업 (추가)
echo -e "${BLUE}[추가] Django fixture 백업...${NC}"
FIXTURE_DIR="$BACKUP_DIR/fixtures_${TIMESTAMP}"
mkdir -p "$FIXTURE_DIR"

cd "$PROJECT_ROOT/vridge_back"
if [ -d "venv" ]; then
    source venv/bin/activate
fi

python manage.py dumpdata \
    --natural-foreign \
    --natural-primary \
    --indent=2 \
    --exclude auth.permission \
    --exclude contenttypes \
    --exclude admin.logentry \
    > "$FIXTURE_DIR/all_data.json" 2>/dev/null || true

echo -e "${GREEN}✓ Fixture 백업 완료${NC}"

# 백업 압축
echo -e "${BLUE}[압축] 백업 파일 압축 중...${NC}"
cd "$BACKUP_DIR"
ARCHIVE_NAME="postgres_${BACKUP_TYPE}_${TIMESTAMP}.tar.gz"

case "$BACKUP_TYPE" in
    full)
        tar -czf "$ARCHIVE_NAME" \
            "$(basename "$BACKUP_FILE")" \
            "$(basename "$CUSTOM_FILE")" \
            "$(basename "$FIXTURE_DIR")"
        rm -f "$BACKUP_FILE" "$CUSTOM_FILE"
        ;;
    incremental)
        tar -czf "$ARCHIVE_NAME" \
            "$(basename "$WAL_BACKUP_DIR")" \
            "$(basename "$FIXTURE_DIR")"
        rm -rf "$WAL_BACKUP_DIR"
        ;;
    data-only|schema-only)
        tar -czf "$ARCHIVE_NAME" \
            "$(basename "${BACKUP_FILE:-$DATA_FILE:-$SCHEMA_FILE}")" \
            "$(basename "$FIXTURE_DIR")"
        rm -f "${BACKUP_FILE:-$DATA_FILE:-$SCHEMA_FILE}"
        ;;
esac

rm -rf "$FIXTURE_DIR"
echo -e "${GREEN}✓ 압축 완료: $BACKUP_DIR/$ARCHIVE_NAME${NC}"

# 백업 정보 기록
INFO_FILE="$BACKUP_DIR/backup_log.txt"
{
    echo "==================================="
    echo "백업 일시: $(date)"
    echo "백업 타입: $BACKUP_TYPE"
    echo "백업 파일: $ARCHIVE_NAME"
    echo "데이터베이스: $DB_NAME"
    echo "크기: $(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)"
    echo "==================================="
} >> "$INFO_FILE"

# 오래된 백업 정리 (30일 이상)
echo -e "${BLUE}[정리] 30일 이상 된 백업 파일 정리...${NC}"
find "$BACKUP_DIR" -name "postgres_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

# 백업 검증
echo -e "${BLUE}[검증] 백업 무결성 검증...${NC}"
tar -tzf "$BACKUP_DIR/$ARCHIVE_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 백업 검증 성공${NC}"
else
    echo -e "${RED}✗ 백업 검증 실패${NC}"
    exit 1
fi

# 완료 메시지
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  백업 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${CYAN}백업 파일: $BACKUP_DIR/$ARCHIVE_NAME${NC}"
echo -e "${CYAN}백업 크기: $(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}복구 명령:${NC}"
echo -e "  ./scripts/postgres-restore.sh $ARCHIVE_NAME"
echo ""