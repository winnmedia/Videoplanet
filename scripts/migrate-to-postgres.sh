#!/bin/bash
#
# SQLite에서 PostgreSQL로 데이터 마이그레이션 스크립트
# 사용법: ./scripts/migrate-to-postgres.sh
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
BACKUP_DIR="$PROJECT_ROOT/backups"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SQLite → PostgreSQL 마이그레이션${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. 사전 체크
echo -e "${BLUE}[단계 1/8] 환경 검증${NC}"

# Docker 실행 확인
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker가 실행되고 있지 않습니다. Docker를 시작해주세요.${NC}"
    exit 1
fi

# PostgreSQL 컨테이너 확인
if ! docker ps | grep -q videoplanet_postgres; then
    echo -e "${YELLOW}[INFO] PostgreSQL 컨테이너를 시작합니다...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose up -d postgres redis
    echo -e "${GREEN}✓ PostgreSQL 컨테이너 시작 완료${NC}"
    
    # PostgreSQL 준비 대기
    echo -e "${YELLOW}[INFO] PostgreSQL 초기화 대기 중...${NC}"
    sleep 10
fi

# SQLite 데이터베이스 확인
SQLITE_DB="$BACKEND_DIR/db.sqlite3"
if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${RED}[ERROR] SQLite 데이터베이스를 찾을 수 없습니다: $SQLITE_DB${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 환경 검증 완료${NC}"

# 2. 백업 생성
echo -e "${BLUE}[단계 2/8] SQLite 백업 생성${NC}"
"$SCRIPT_DIR/backup-database.sh"
echo -e "${GREEN}✓ 백업 완료${NC}"

# 3. Python 가상환경 활성화
echo -e "${BLUE}[단계 3/8] Python 환경 설정${NC}"
cd "$BACKEND_DIR"

if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# 필요한 패키지 설치
pip install psycopg2-binary django-redis > /dev/null 2>&1
echo -e "${GREEN}✓ Python 환경 준비 완료${NC}"

# 4. Django fixture 추출 (SQLite에서)
echo -e "${BLUE}[단계 4/8] SQLite 데이터 추출${NC}"
FIXTURE_DIR="$BACKUP_DIR/migration_${TIMESTAMP}"
mkdir -p "$FIXTURE_DIR"

# SQLite 사용 설정
export USE_SQLITE=true

# 앱별 데이터 추출
APPS=("users" "projects" "feedbacks" "onlines" "dashboard" "ai_planning")
for app in "${APPS[@]}"; do
    echo -e "  ${YELLOW}→ $app 데이터 추출 중...${NC}"
    python manage.py dumpdata "$app" \
        --natural-foreign \
        --natural-primary \
        --indent=2 > "$FIXTURE_DIR/${app}.json" 2>/dev/null || {
        echo -e "  ${YELLOW}⚠ $app 앱 데이터가 없거나 추출 실패${NC}"
    }
done

# 전체 데이터 추출 (시스템 테이블 제외)
echo -e "  ${YELLOW}→ 전체 데이터 추출 중...${NC}"
python manage.py dumpdata \
    --exclude auth.permission \
    --exclude contenttypes \
    --exclude admin.logentry \
    --exclude sessions \
    --natural-foreign \
    --natural-primary \
    --indent=2 > "$FIXTURE_DIR/complete_data.json"

echo -e "${GREEN}✓ 데이터 추출 완료${NC}"

# 5. PostgreSQL 데이터베이스 초기화
echo -e "${BLUE}[단계 5/8] PostgreSQL 초기화${NC}"

# PostgreSQL 사용 설정
unset USE_SQLITE

# 기존 테이블 삭제 (있는 경우)
echo -e "  ${YELLOW}→ 기존 테이블 정리 중...${NC}"
python manage.py dbshell << EOF 2>/dev/null || true
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO videoplanet_user;
GRANT ALL ON SCHEMA public TO public;
EOF

echo -e "${GREEN}✓ PostgreSQL 초기화 완료${NC}"

# 6. Django 마이그레이션 실행
echo -e "${BLUE}[단계 6/8] Django 마이그레이션 실행${NC}"

# 마이그레이션 파일 생성
python manage.py makemigrations --noinput

# 마이그레이션 실행
python manage.py migrate --noinput

echo -e "${GREEN}✓ 마이그레이션 완료${NC}"

# 7. 데이터 로드 (PostgreSQL로)
echo -e "${BLUE}[단계 7/8] PostgreSQL로 데이터 로드${NC}"

# 순서대로 데이터 로드 (의존성 고려)
LOAD_ORDER=("users" "projects" "feedbacks" "onlines" "dashboard" "ai_planning")

for app in "${LOAD_ORDER[@]}"; do
    if [ -f "$FIXTURE_DIR/${app}.json" ]; then
        echo -e "  ${YELLOW}→ $app 데이터 로드 중...${NC}"
        python manage.py loaddata "$FIXTURE_DIR/${app}.json" 2>/dev/null || {
            echo -e "  ${YELLOW}⚠ $app 로드 실패 (데이터가 없거나 이미 존재)${NC}"
        }
    fi
done

# 슈퍼유저 생성 (없는 경우)
echo -e "  ${YELLOW}→ 관리자 계정 확인 중...${NC}"
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@videoplanet.com', 'admin2024!')
    print("관리자 계정 생성됨: admin / admin2024!")
EOF

echo -e "${GREEN}✓ 데이터 로드 완료${NC}"

# 8. 검증 및 최적화
echo -e "${BLUE}[단계 8/8] 데이터 검증 및 최적화${NC}"

# 데이터 수 확인
echo -e "  ${YELLOW}→ 데이터 검증 중...${NC}"
python manage.py shell << EOF
from users.models import User
from projects.models import Project
from feedbacks.models import Feedback

print(f"사용자 수: {User.objects.count()}")
print(f"프로젝트 수: {Project.objects.count()}")
print(f"피드백 수: {Feedback.objects.count()}")
EOF

# 시퀀스 재설정
echo -e "  ${YELLOW}→ 시퀀스 재설정 중...${NC}"
python manage.py sqlsequencereset users projects feedbacks onlines dashboard ai_planning | python manage.py dbshell 2>/dev/null || true

# 인덱스 생성 (최적화 마이그레이션 실행)
echo -e "  ${YELLOW}→ 인덱스 최적화 중...${NC}"
python manage.py migrate --run-syncdb 2>/dev/null || true

echo -e "${GREEN}✓ 검증 및 최적화 완료${NC}"

# 완료 메시지
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  마이그레이션 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}다음 단계:${NC}"
echo -e "  1. ${YELLOW}Django 서버 재시작:${NC}"
echo -e "     cd $BACKEND_DIR"
echo -e "     python manage.py runserver"
echo ""
echo -e "  2. ${YELLOW}환경변수 설정 (.env):${NC}"
echo -e "     DB_NAME=videoplanet_db"
echo -e "     DB_USER=videoplanet_user"
echo -e "     DB_PASSWORD=videoplanet_pass_2024"
echo -e "     DB_HOST=localhost"
echo -e "     DB_PORT=5432"
echo ""
echo -e "  3. ${YELLOW}pgAdmin 접속:${NC}"
echo -e "     URL: http://localhost:5050"
echo -e "     Email: admin@videoplanet.com"
echo -e "     Password: admin_pass_2024"
echo ""
echo -e "${BLUE}백업 위치: $FIXTURE_DIR${NC}"
echo ""