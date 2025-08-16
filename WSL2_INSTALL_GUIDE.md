# 🐧 WSL2 Ubuntu 설치 및 VideoPlanet 설정 가이드

## 📋 전제 조건
- Windows 10 버전 2004 이상 (빌드 19041 이상)
- Windows 11 (모든 버전)
- 관리자 권한

## 🚀 빠른 설치 (3단계)

### 1️⃣ PowerShell 관리자 권한으로 실행
```powershell
# Windows 키 + X → Windows PowerShell(관리자)
# 또는 시작 메뉴에서 PowerShell 검색 → 관리자로 실행
```

### 2️⃣ WSL2 및 Ubuntu 설치
```powershell
# 한 줄로 설치 (가장 간단)
wsl --install

# 또는 준비된 스크립트 실행
.\setup_wsl2.ps1
```

### 3️⃣ 재부팅 후 Ubuntu 설정
```bash
# Ubuntu 터미널에서 실행
curl -fsSL https://raw.githubusercontent.com/winnmedia/Videoplanet/master/setup_in_wsl.sh | bash
```

## 📖 상세 설치 가이드

### Step 1: WSL2 기능 활성화

#### 옵션 A: 자동 설치 (권장)
```powershell
wsl --install
```

#### 옵션 B: 수동 설치
```powershell
# 1. WSL 기능 활성화
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. 가상 머신 기능 활성화
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. WSL2를 기본으로 설정
wsl --set-default-version 2

# 4. 커널 업데이트
wsl --update
```

### Step 2: Ubuntu 설치

```powershell
# Ubuntu 22.04 LTS 설치 (권장)
wsl --install -d Ubuntu-22.04

# 설치 가능한 배포판 목록 확인
wsl --list --online

# 설치된 배포판 확인
wsl --list --verbose
```

### Step 3: Ubuntu 초기 설정

Ubuntu 첫 실행 시:
1. 사용자 이름 입력 (소문자)
2. 비밀번호 설정
3. 비밀번호 확인

### Step 4: VideoPlanet 설치

```bash
# 1. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 2. Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Git 설치
sudo apt install -y git

# 4. 프로젝트 클론
cd ~
git clone https://github.com/winnmedia/Videoplanet.git
cd Videoplanet

# 5. 의존성 설치
npm install

# 6. 개발 서버 실행
npm run dev
```

## 🔧 WSL2 관리 명령어

### 기본 명령어
```powershell
# WSL 시작
wsl

# 특정 배포판 시작
wsl -d Ubuntu-22.04

# WSL 종료
wsl --shutdown

# 배포판 목록 확인
wsl -l -v

# 기본 배포판 설정
wsl --set-default Ubuntu-22.04
```

### 파일 시스템 접근
```powershell
# Windows에서 WSL 파일 접근
\\wsl$\Ubuntu-22.04\home\사용자명\

# WSL에서 Windows 파일 접근
cd /mnt/c/Users/사용자명/Desktop
```

## 🌐 네트워크 설정

### WSL2 IP 주소 확인
```bash
# WSL2 내부에서
hostname -I

# Windows에서
wsl hostname -I
```

### Windows에서 WSL2 서비스 접근
- 개발 서버: `http://localhost:3000`
- WSL2 IP 직접 접근: `http://[WSL2_IP]:3000`

### 포트 포워딩 (외부 접근 허용)
```powershell
# Windows PowerShell (관리자)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=[WSL2_IP]
```

## 📝 환경 변수 설정

`.env.local` 파일 생성:
```bash
cd ~/Videoplanet
nano .env.local
```

내용:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NODE_ENV=development
```

## 🚨 문제 해결

### 1. WSL2가 설치되지 않음
```powershell
# Windows 버전 확인
winver

# 최소 요구사항: Windows 10 버전 2004 (빌드 19041)
```

### 2. 가상화 비활성화 오류
BIOS에서 가상화 기능 활성화:
- Intel: VT-x
- AMD: AMD-V

### 3. Ubuntu가 시작되지 않음
```powershell
# WSL 재설정
wsl --unregister Ubuntu-22.04
wsl --install -d Ubuntu-22.04
```

### 4. 메모리 부족
`.wslconfig` 파일 생성:
```powershell
notepad "$env:USERPROFILE\.wslconfig"
```

내용:
```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
```

### 5. npm 권한 오류
```bash
# npm 전역 디렉토리 변경
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 🎯 성능 최적화

### 1. WSL2 메모리 설정
```ini
# %USERPROFILE%\.wslconfig
[wsl2]
memory=6GB
processors=4
localhostForwarding=true
```

### 2. 파일 시스템 성능
- 프로젝트는 WSL2 파일 시스템에 저장 (`/home/user/`)
- Windows 파일 시스템 (`/mnt/c/`) 접근 최소화

### 3. Docker 통합
```bash
# Docker Desktop 설치 후
# Settings → Resources → WSL Integration → Ubuntu 활성화
```

## ✅ 설치 확인 체크리스트

- [ ] WSL2 설치 확인: `wsl --version`
- [ ] Ubuntu 설치 확인: `wsl -l -v`
- [ ] Node.js 설치 확인: `node -v` (v20.x)
- [ ] npm 설치 확인: `npm -v`
- [ ] Git 설치 확인: `git --version`
- [ ] 프로젝트 클론 완료
- [ ] npm install 성공
- [ ] npm run dev 실행
- [ ] http://localhost:3000 접속 확인

## 📞 추가 지원

- WSL2 공식 문서: https://docs.microsoft.com/ko-kr/windows/wsl/
- Node.js 문서: https://nodejs.org/
- VideoPlanet Issues: https://github.com/winnmedia/Videoplanet/issues

---

**작성일**: 2025-08-16
**버전**: 1.0.0