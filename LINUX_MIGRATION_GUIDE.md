# 🐧 Linux 환경 마이그레이션 가이드

## 📋 전제 조건
- Linux 서버 (Ubuntu 20.04+ 또는 CentOS 8+ 권장)
- Node.js 20.x
- Git
- Docker & Docker Compose (선택사항)

## 🚀 방법 1: Git Clone (권장)

```bash
# 1. 코드 클론
git clone https://github.com/winnmedia/Videoplanet.git
cd Videoplanet

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 환경 변수 설정

# 4. 빌드
npm run build

# 5. 실행
npm start  # Production
npm run dev  # Development
```

## 🐳 방법 2: Docker 사용

```bash
# 1. 코드 클론
git clone https://github.com/winnmedia/Videoplanet.git
cd Videoplanet

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f
```

## 📦 방법 3: 수동 이전

### Windows에서 압축
```powershell
# PowerShell에서 실행
tar -czf videoplanet.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .
```

### Linux에서 압축 해제
```bash
# 1. 파일 전송 (SCP, FTP, 또는 클라우드 스토리지 사용)
scp videoplanet.tar.gz user@linux-server:/home/user/

# 2. 압축 해제
tar -xzf videoplanet.tar.gz
cd Videoplanet

# 3. 설정 스크립트 실행
chmod +x linux-setup.sh
./linux-setup.sh
```

## 🔧 Linux 특정 설정

### 1. 파일 권한 설정
```bash
# 프로젝트 디렉토리 권한
chmod -R 755 .
chmod -R 777 .next/cache  # Next.js 캐시 디렉토리

# 업로드 디렉토리 (있는 경우)
mkdir -p public/uploads
chmod -R 777 public/uploads
```

### 2. PM2로 프로세스 관리
```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 시작
pm2 start npm --name "videoplanet" -- start
pm2 save
pm2 startup  # 시스템 재부팅 시 자동 시작
```

### 3. Nginx 리버스 프록시 설정
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 호환성 체크리스트

### ✅ 완전 호환
- Next.js 14 App Router
- React 18
- TypeScript
- Redux Toolkit
- Jest & Testing Library
- SCSS Modules

### ⚠️ 주의 필요
- 파일 경로: Windows의 백슬래시(`\`)를 슬래시(`/`)로 변경
- 환경 변수: `.env.local` 파일 확인
- Sharp 라이브러리: Linux에서 재설치 필요
```bash
npm uninstall sharp
npm install sharp
```

### 🔄 플랫폼별 차이점
| 항목 | Windows | Linux |
|------|---------|-------|
| 경로 구분자 | `\` | `/` |
| 환경 변수 | `set` | `export` |
| 프로세스 관리 | Task Manager | PM2/systemd |
| 파일 권한 | 제한적 | chmod 필요 |

## 🛠️ 문제 해결

### 1. EACCES 권한 오류
```bash
# npm 전역 디렉토리 권한 수정
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2. Sharp 관련 오류
```bash
# Sharp 재빌드
npm rebuild sharp
# 또는
npm install sharp --force
```

### 3. 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3000
# 프로세스 종료
kill -9 [PID]
```

## 📊 성능 최적화

### 1. Node.js 메모리 설정
```bash
# package.json scripts 수정
"start": "NODE_OPTIONS='--max_old_space_size=4096' next start"
```

### 2. 빌드 캐시 활용
```bash
# .next 캐시 유지
rsync -av --exclude='.next/cache/webpack' .next/ /backup/.next/
```

## 🔐 보안 설정

```bash
# 1. 방화벽 설정 (UFW)
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable

# 2. SSL 인증서 (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📝 체크리스트

- [ ] Node.js 20.x 설치
- [ ] Git 설치
- [ ] 코드 클론/전송
- [ ] npm install 실행
- [ ] 환경 변수 설정
- [ ] 빌드 테스트
- [ ] 포트 설정 확인
- [ ] 프로세스 관리자 설정
- [ ] 리버스 프록시 설정
- [ ] SSL 인증서 설정
- [ ] 모니터링 설정

## 🚨 주의사항

1. **데이터베이스 연결**: PostgreSQL 연결 정보 업데이트 필요
2. **Redis 설정**: 캐시 서버 연결 정보 확인
3. **미디어 파일**: 업로드된 파일 경로 확인
4. **로그 디렉토리**: 쓰기 권한 확인

## 📞 지원

문제 발생 시:
1. 로그 확인: `pm2 logs videoplanet`
2. 시스템 로그: `journalctl -u videoplanet`
3. GitHub Issues: https://github.com/winnmedia/Videoplanet/issues

---

**작성일**: 2025-08-16
**버전**: 1.0.0