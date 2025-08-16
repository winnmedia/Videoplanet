# VideoPlanet WSL 개발 환경 설정 가이드

## 📋 사전 요구사항
- Windows 10 버전 2004 이상 또는 Windows 11
- 관리자 권한

## 🚀 빠른 시작

### 1단계: WSL2 설치
PowerShell을 **관리자 권한**으로 실행한 후:

```powershell
# PowerShell에서 실행
cd C:\Users\유석근PD\Desktop\developments\Videoplanet
.\setup_wsl.ps1
```

설치 완료 후 **시스템을 재부팅**하세요.

### 2단계: Ubuntu 초기 설정
재부팅 후:
1. 시작 메뉴에서 "Ubuntu" 실행
2. 사용자명과 비밀번호 설정 (기억해 두세요!)

### 3단계: 개발 환경 구성
Ubuntu 터미널에서:

```bash
# Windows 프로젝트 디렉토리로 이동
cd /mnt/c/Users/유석근PD/Desktop/developments/Videoplanet

# 실행 권한 부여
chmod +x setup_wsl_env.sh install_dependencies.sh

# WSL 환경 설정 실행
./setup_wsl_env.sh

# 환경 변수 적용
source ~/.bashrc

# 프로젝트 의존성 설치
./install_dependencies.sh
```

## 📦 설치되는 구성 요소

### 시스템 도구
- Git, Curl, Wget
- Build-essential (컴파일러)

### 개발 환경
- **Python 3.11** + pip + venv
- **Node.js 20.x** (NVM 사용)
- **PostgreSQL 15**
- **Redis**

### 데이터베이스 설정
- 데이터베이스명: `videoplanet_db`
- 사용자: `videoplanet`
- 비밀번호: `videoplanet123`

## 🎯 유용한 명령어

### 디렉토리 이동
```bash
vp        # 프로젝트 루트로 이동
vpback    # Django 백엔드로 이동
vpfront   # Next.js 프론트엔드로 이동
```

### 개발 서버 실행
```bash
# 터미널 1: Django 백엔드
vpback
source venv/bin/activate
python manage.py runserver

# 터미널 2: Next.js 프론트엔드
vpfront
npm run dev
```

### 서비스 관리
```bash
# PostgreSQL
sudo service postgresql start
sudo service postgresql stop
sudo service postgresql status

# Redis
sudo service redis-server start
sudo service redis-server stop
sudo service redis-server status
```

## 🌐 접속 URL
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## 🔧 문제 해결

### WSL2가 설치되지 않는 경우
1. Windows 기능 활성화 확인:
   - 제어판 → 프로그램 → Windows 기능 켜기/끄기
   - "Linux용 Windows 하위 시스템" 체크
   - "가상 머신 플랫폼" 체크
2. BIOS에서 가상화 기능 활성화 확인

### PostgreSQL 연결 오류
```bash
# PostgreSQL 서비스 재시작
sudo service postgresql restart

# 연결 테스트
psql -U videoplanet -d videoplanet_db -h localhost
```

### Node.js/npm 명령을 찾을 수 없는 경우
```bash
# NVM 재설정
source ~/.nvm/nvm.sh
nvm use 20
```

### 권한 문제
```bash
# Windows 파일 시스템에서 작업 시 권한 문제가 발생할 수 있음
# WSL 파일 시스템으로 프로젝트 복사 권장
cp -r /mnt/c/Users/유석근PD/Desktop/developments/Videoplanet ~/videoplanet/
```

## 📝 추가 설정 (선택사항)

### VS Code 연동
```bash
# WSL 내에서 VS Code 실행
code .
```

### Docker 설치 (추후 필요시)
```bash
# Docker Desktop for Windows 설치 후
# WSL2 백엔드 활성화 설정
```

## 🔄 환경 초기화
문제가 발생한 경우 완전히 초기화하려면:

```powershell
# PowerShell (관리자 권한)
wsl --unregister Ubuntu
wsl --install -d Ubuntu
```

---

## 📌 주의사항
1. WSL2는 Windows 파일 시스템 접근 시 성능이 저하될 수 있습니다
2. 가능하면 WSL 파일 시스템 내에서 작업하는 것을 권장합니다
3. Windows와 WSL 간 줄바꿈 문자 차이(CRLF vs LF)에 주의하세요

## 🆘 도움이 필요한 경우
1. WSL 공식 문서: https://docs.microsoft.com/ko-kr/windows/wsl/
2. 프로젝트 이슈 트래커 확인
3. MEMORY.md 파일 참조