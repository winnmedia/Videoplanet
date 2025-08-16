#!/bin/bash

# WSL2 Ubuntu 내에서 실행할 VideoPlanet 설정 스크립트

echo "🐧 WSL2 Ubuntu VideoPlanet 설정"
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 시스템 업데이트
echo -e "${BLUE}📦 시스템 패키지 업데이트...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. 필수 도구 설치
echo -e "${BLUE}🔧 필수 도구 설치...${NC}"
sudo apt install -y curl git build-essential

# 3. Node.js 20.x 설치
echo -e "${BLUE}📦 Node.js 20.x 설치...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node 버전 확인
echo -e "${GREEN}✅ Node.js 버전: $(node -v)${NC}"
echo -e "${GREEN}✅ npm 버전: $(npm -v)${NC}"

# 4. 프로젝트 디렉토리 생성
echo -e "${BLUE}📁 프로젝트 디렉토리 생성...${NC}"
mkdir -p ~/projects
cd ~/projects

# 5. GitHub에서 프로젝트 클론
echo -e "${BLUE}📥 GitHub에서 VideoPlanet 클론...${NC}"
if [ -d "Videoplanet" ]; then
    echo -e "${YELLOW}⚠️  기존 프로젝트 발견. 업데이트 중...${NC}"
    cd Videoplanet
    git pull origin master
else
    git clone https://github.com/winnmedia/Videoplanet.git
    cd Videoplanet
fi

# 6. 의존성 설치
echo -e "${BLUE}📦 프로젝트 의존성 설치...${NC}"
npm install

# 7. Sharp 재설치 (Linux 네이티브)
echo -e "${BLUE}🖼️ Sharp 라이브러리 재설치...${NC}"
npm uninstall sharp 2>/dev/null
npm install sharp

# 8. 환경 변수 설정
echo -e "${BLUE}🔧 환경 변수 파일 생성...${NC}"
if [ ! -f .env.local ]; then
cat > .env.local << 'EOF'
# WSL2 Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NODE_ENV=development

# Database (if using local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/videoplanet

# Redis (if using local Redis)
REDIS_URL=redis://localhost:6379
EOF
    echo -e "${GREEN}✅ .env.local 파일 생성 완료${NC}"
else
    echo -e "${YELLOW}ℹ️  .env.local 파일이 이미 존재합니다${NC}"
fi

# 9. PM2 설치 (선택사항)
echo -e "${BLUE}🔧 PM2 프로세스 매니저 설치...${NC}"
sudo npm install -g pm2

# 10. 빌드 테스트
echo -e "${BLUE}🏗️ 프로젝트 빌드 테스트...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 빌드 성공!${NC}"
else
    echo -e "${RED}❌ 빌드 실패. 로그를 확인하세요.${NC}"
fi

# 11. 방화벽 설정 (Windows에서 접근 허용)
echo -e "${BLUE}🔥 방화벽 규칙 추가 (포트 3000)...${NC}"
sudo ufw allow 3000/tcp 2>/dev/null

# 12. IP 주소 정보
echo -e "${BLUE}🌐 네트워크 정보...${NC}"
WSL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}WSL2 IP 주소: $WSL_IP${NC}"

# 13. 알림 생성
echo -e "${YELLOW}=================================="
echo -e "✅ WSL2 VideoPlanet 설정 완료!"
echo -e "=================================="
echo -e "📁 프로젝트 위치: ~/projects/Videoplanet"
echo -e ""
echo -e "🚀 실행 방법:"
echo -e "   ${GREEN}cd ~/projects/Videoplanet${NC}"
echo -e "   ${GREEN}npm run dev${NC}    # 개발 서버"
echo -e "   ${GREEN}npm start${NC}      # 프로덕션 서버"
echo -e ""
echo -e "🌐 접속 주소:"
echo -e "   WSL2 내부: ${BLUE}http://localhost:3000${NC}"
echo -e "   Windows:   ${BLUE}http://$WSL_IP:3000${NC}"
echo -e ""
echo -e "💡 PM2로 백그라운드 실행:"
echo -e "   ${GREEN}pm2 start npm --name videoplanet -- start${NC}"
echo -e "   ${GREEN}pm2 logs videoplanet${NC}  # 로그 확인"
echo -e "   ${GREEN}pm2 stop videoplanet${NC}  # 중지"
echo -e "=================================="${NC}

# 14. 개발 서버 실행 옵션
read -p "개발 서버를 지금 실행하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 개발 서버 시작...${NC}"
    npm run dev
fi