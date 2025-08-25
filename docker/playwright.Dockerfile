# Playwright Docker Container for VideoPlanet Testing
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=test
ENV CI=true
ENV DISPLAY=:99

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Node.js 의존성 복사 및 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사
COPY . .

# Playwright 브라우저 설치 (이미 설치되어 있지만 확인)
RUN npx playwright install --with-deps

# 테스트 실행 스크립트에 권한 부여
RUN chmod +x scripts/test-runner.sh

# 가상 디스플레이 설정 및 테스트 실행
CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 & npm run test:e2e"]