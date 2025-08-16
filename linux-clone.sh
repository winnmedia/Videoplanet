#!/bin/bash

# VideoPlanet - GitHub Clone Script for Linux
# 이 스크립트는 리눅스 환경에서 GitHub 메인 브랜치를 클론하고 설정합니다.

echo "🚀 VideoPlanet GitHub Clone & Setup"
echo "===================================="

# 1. 작업 디렉토리 선택
read -p "설치할 디렉토리 경로를 입력하세요 (기본값: ~/videoplanet): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-~/videoplanet}

# 2. 디렉토리 생성 및 이동
echo "📁 디렉토리 생성: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 3. 기존 프로젝트가 있는지 확인
if [ -d "Videoplanet" ]; then
    echo "⚠️  기존 프로젝트가 발견되었습니다."
    read -p "삭제하고 새로 다운로드하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf Videoplanet
    else
        echo "❌ 설치 취소됨"
        exit 1
    fi
fi

# 4. GitHub에서 클론
echo "📥 GitHub에서 메인 브랜치 다운로드 중..."
git clone https://github.com/winnmedia/Videoplanet.git

# 5. 프로젝트 디렉토리로 이동
cd Videoplanet

# 6. 브랜치 확인
echo "🔍 현재 브랜치 확인..."
git branch
echo "현재 커밋: $(git log --oneline -1)"

# 7. Node.js 버전 확인
echo "📦 Node.js 버전 확인..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js 버전: $NODE_VERSION"
    
    # 버전이 20 미만인 경우 경고
    if [[ ! "$NODE_VERSION" =~ ^v2[0-9] ]]; then
        echo "⚠️  Node.js 20.x 이상 권장합니다."
        echo "업데이트: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "         sudo apt-get install -y nodejs"
    fi
else
    echo "❌ Node.js가 설치되지 않았습니다."
    read -p "Node.js를 설치하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# 8. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 9. Sharp 재설치 (Linux 네이티브 빌드)
echo "🖼️ Sharp 라이브러리 재설치 (Linux 빌드)..."
npm uninstall sharp
npm install sharp

# 10. 환경 변수 설정
echo "🔧 환경 변수 파일 생성..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
# Production Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NODE_ENV=production

# Add your API keys here
# NEXT_PUBLIC_GOOGLE_API_KEY=
# NEXT_PUBLIC_FACEBOOK_APP_ID=
EOF
    echo "✅ .env.local 파일이 생성되었습니다."
else
    echo "ℹ️  .env.local 파일이 이미 존재합니다."
fi

# 11. 빌드 테스트
read -p "프로젝트를 빌드하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏗️ 프로젝트 빌드 중..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ 빌드 성공!"
    else
        echo "❌ 빌드 실패. 로그를 확인하세요."
    fi
fi

# 12. PM2 설치 제안
echo ""
echo "💡 PM2로 프로세스 관리를 권장합니다:"
echo "   npm install -g pm2"
echo "   pm2 start npm --name 'videoplanet' -- start"
echo "   pm2 save"
echo "   pm2 startup"

# 13. 완료 메시지
echo ""
echo "✅ 설치 완료!"
echo "===================================="
echo "📁 프로젝트 위치: $INSTALL_DIR/Videoplanet"
echo ""
echo "🚀 실행 방법:"
echo "   cd $INSTALL_DIR/Videoplanet"
echo "   npm run dev    # 개발 모드"
echo "   npm start      # 프로덕션 모드"
echo ""
echo "📝 환경 변수 수정:"
echo "   nano .env.local"
echo ""
echo "🔍 포트 확인:"
echo "   http://localhost:3000"
echo "===================================="