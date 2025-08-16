# 🚀 Linux 빠른 시작 가이드

## 1️⃣ 원라이너 설치 (가장 간단)

```bash
# 한 줄로 모든 것을 설치
curl -fsSL https://raw.githubusercontent.com/winnmedia/Videoplanet/master/linux-clone.sh | bash
```

## 2️⃣ 수동 설치 (3단계)

```bash
# Step 1: 클론
git clone https://github.com/winnmedia/Videoplanet.git

# Step 2: 의존성 설치
cd Videoplanet && npm install

# Step 3: 실행
npm run dev
```

## 3️⃣ Docker 원라이너 (컨테이너 환경)

```bash
# Docker가 설치되어 있다면
git clone https://github.com/winnmedia/Videoplanet.git && cd Videoplanet && docker-compose up -d
```

## 📋 최소 요구사항

- Ubuntu 20.04+ 또는 CentOS 8+
- Node.js 20.x
- 2GB RAM
- 10GB 디스크 공간

## 🔥 즉시 실행 명령어

### Ubuntu/Debian
```bash
# Node.js 20 설치 + 프로젝트 클론 + 실행
sudo apt update && \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && \
sudo apt-get install -y nodejs git && \
git clone https://github.com/winnmedia/Videoplanet.git && \
cd Videoplanet && \
npm install && \
npm run dev
```

### CentOS/RHEL
```bash
# Node.js 20 설치 + 프로젝트 클론 + 실행
sudo yum update -y && \
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && \
sudo yum install -y nodejs git && \
git clone https://github.com/winnmedia/Videoplanet.git && \
cd Videoplanet && \
npm install && \
npm run dev
```

## ✅ 설치 확인

```bash
# 설치 확인
cd Videoplanet
npm run build

# 성공 메시지가 나오면 완료!
```

## 🌐 접속 방법

- 로컬: http://localhost:3000
- 원격: http://[서버IP]:3000

## 🛠️ 문제 해결

### 포트 3000이 사용 중인 경우
```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 권한 문제
```bash
# npm 권한 수정
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### 메모리 부족
```bash
# 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

**🎉 이제 리눅스에서 VideoPlanet이 실행됩니다!**