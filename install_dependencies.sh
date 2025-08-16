#!/bin/bash

# VideoPlanet 프로젝트 의존성 설치 스크립트
echo "=========================================="
echo "VideoPlanet 프로젝트 의존성 설치"
echo "=========================================="

# 프로젝트 루트 디렉토리 설정
PROJECT_ROOT=~/videoplanet/project
if [ ! -d "$PROJECT_ROOT" ]; then
    PROJECT_ROOT="/mnt/c/Users/유석근PD/Desktop/developments/Videoplanet"
fi

cd "$PROJECT_ROOT"

# Django 백엔드 의존성 설치
echo ""
echo "1. Django 백엔드 설정..."
echo "=========================================="
cd "$PROJECT_ROOT/vridge_back"

# Python 가상환경 생성
echo "Python 가상환경 생성 중..."
python3 -m venv venv
source venv/bin/activate

# pip 업그레이드
pip install --upgrade pip

# requirements.txt 생성 (기존 파일이 없는 경우)
if [ ! -f "requirements.txt" ]; then
    echo "requirements.txt 생성 중..."
    cat > requirements.txt << 'EOF'
Django==4.2.7
django-cors-headers==4.3.0
djangorestframework==3.14.0
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
python-decouple==3.8
Pillow==10.1.0
gunicorn==21.2.0
whitenoise==6.6.0
dj-database-url==2.1.0
python-dotenv==1.0.0
EOF
fi

# 의존성 설치
echo "Python 패키지 설치 중..."
pip install -r requirements.txt

# Django 초기 설정
echo "Django 데이터베이스 마이그레이션 중..."
python manage.py makemigrations
python manage.py migrate

# 정적 파일 수집
echo "Django 정적 파일 수집 중..."
python manage.py collectstatic --noinput

deactivate

# Next.js 프론트엔드 의존성 설치
echo ""
echo "2. Next.js 프론트엔드 설정..."
echo "=========================================="
cd "$PROJECT_ROOT/vridge_front"

# package.json이 있는지 확인
if [ -f "package.json" ]; then
    echo "Node.js 패키지 설치 중..."
    npm install
    
    # .env.local 파일 생성 (없는 경우)
    if [ ! -f ".env.local" ]; then
        echo ".env.local 파일 생성 중..."
        cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
    fi
else
    echo "package.json 파일을 찾을 수 없습니다."
fi

echo ""
echo "=========================================="
echo "의존성 설치 완료!"
echo "=========================================="
echo ""
echo "개발 서버 실행 방법:"
echo ""
echo "1. Django 백엔드 (터미널 1):"
echo "   cd $PROJECT_ROOT/vridge_back"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. Next.js 프론트엔드 (터미널 2):"
echo "   cd $PROJECT_ROOT/vridge_front"
echo "   npm run dev"
echo ""
echo "서비스 접속:"
echo "  - 프론트엔드: http://localhost:3000"
echo "  - 백엔드 API: http://localhost:8000/api"