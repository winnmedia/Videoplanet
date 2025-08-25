#!/bin/bash
#
# SQLite 데이터베이스 백업 스크립트
# 사용법: ./scripts/backup-database.sh
#

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/vridge_back"
BACKUP_DIR="$PROJECT_ROOT/backups"
SQLITE_DB="$BACKEND_DIR/db.sqlite3"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  VideoPlayer 데이터베이스 백업 도구${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# SQLite 데이터베이스 확인
if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${RED}[ERROR] SQLite 데이터베이스를 찾을 수 없습니다: $SQLITE_DB${NC}"
    exit 1
fi

# 데이터베이스 크기 확인
DB_SIZE=$(du -h "$SQLITE_DB" | cut -f1)
echo -e "${YELLOW}[INFO] 데이터베이스 크기: $DB_SIZE${NC}"

# 1. SQLite 바이너리 백업
echo -e "${BLUE}[1/4] SQLite 바이너리 백업 생성 중...${NC}"
SQLITE_BACKUP="$BACKUP_DIR/sqlite_backup_${TIMESTAMP}.db"
cp "$SQLITE_DB" "$SQLITE_BACKUP"
echo -e "${GREEN}✓ 바이너리 백업 완료: $SQLITE_BACKUP${NC}"

# 2. SQL 덤프 백업
echo -e "${BLUE}[2/4] SQL 덤프 생성 중...${NC}"
SQL_DUMP="$BACKUP_DIR/sqlite_dump_${TIMESTAMP}.sql"
sqlite3 "$SQLITE_DB" ".dump" > "$SQL_DUMP"
echo -e "${GREEN}✓ SQL 덤프 완료: $SQL_DUMP${NC}"

# 3. Django fixture 백업 (JSON 형식)
echo -e "${BLUE}[3/4] Django fixture 백업 중...${NC}"
FIXTURE_DIR="$BACKUP_DIR/fixtures_${TIMESTAMP}"
mkdir -p "$FIXTURE_DIR"

cd "$BACKEND_DIR"

# Python 환경 활성화 (가상환경이 있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 각 앱별로 fixture 생성
APPS=("users" "projects" "feedbacks" "onlines" "dashboard" "ai_planning")
for app in "${APPS[@]}"; do
    echo -e "  ${YELLOW}→ $app 앱 데이터 추출 중...${NC}"
    python manage.py dumpdata "$app" --indent=2 > "$FIXTURE_DIR/${app}.json" 2>/dev/null || true
done

# 전체 데이터베이스 fixture (auth 제외)
echo -e "  ${YELLOW}→ 전체 데이터베이스 추출 중...${NC}"
python manage.py dumpdata \
    --exclude auth.permission \
    --exclude contenttypes \
    --exclude admin.logentry \
    --indent=2 > "$FIXTURE_DIR/all_data.json" 2>/dev/null || true

echo -e "${GREEN}✓ Fixture 백업 완료: $FIXTURE_DIR${NC}"

# 4. 압축 백업 생성
echo -e "${BLUE}[4/4] 압축 백업 생성 중...${NC}"
ARCHIVE_NAME="backup_complete_${TIMESTAMP}.tar.gz"
cd "$BACKUP_DIR"
tar -czf "$ARCHIVE_NAME" \
    "$(basename "$SQLITE_BACKUP")" \
    "$(basename "$SQL_DUMP")" \
    "$(basename "$FIXTURE_DIR")"

# 원본 파일 정리 (압축 파일만 남김)
rm -f "$SQLITE_BACKUP" "$SQL_DUMP"
rm -rf "$FIXTURE_DIR"

echo -e "${GREEN}✓ 압축 백업 완료: $BACKUP_DIR/$ARCHIVE_NAME${NC}"

# 백업 정보 저장
BACKUP_INFO="$BACKUP_DIR/backup_info.txt"
{
    echo "==================================="
    echo "백업 정보"
    echo "==================================="
    echo "백업 일시: $(date)"
    echo "백업 파일: $ARCHIVE_NAME"
    echo "원본 DB 크기: $DB_SIZE"
    echo "백업 크기: $(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)"
    echo ""
    echo "포함된 앱:"
    for app in "${APPS[@]}"; do
        echo "  - $app"
    done
    echo ""
    echo "복구 명령:"
    echo "  tar -xzf $ARCHIVE_NAME"
    echo "  sqlite3 new_db.sqlite3 < sqlite_dump_${TIMESTAMP}.sql"
    echo "  python manage.py loaddata fixtures_${TIMESTAMP}/all_data.json"
    echo "==================================="
} >> "$BACKUP_INFO"

# 오래된 백업 정리 (30일 이상)
echo -e "${BLUE}[INFO] 30일 이상 된 백업 파일 정리 중...${NC}"
find "$BACKUP_DIR" -name "backup_complete_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

# 완료 메시지
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  백업 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}백업 위치: $BACKUP_DIR/$ARCHIVE_NAME${NC}"
echo -e "${YELLOW}백업 크기: $(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)${NC}"
echo ""
echo -e "${BLUE}복구 방법:${NC}"
echo -e "  1. cd $BACKUP_DIR"
echo -e "  2. tar -xzf $ARCHIVE_NAME"
echo -e "  3. sqlite3 복구할DB.sqlite3 < sqlite_dump_${TIMESTAMP}.sql"
echo ""