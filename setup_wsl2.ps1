# WSL2 Ubuntu 설치 및 VideoPlanet 설정 스크립트
# 관리자 권한으로 실행 필요

Write-Host "🚀 WSL2 Ubuntu 설치 및 VideoPlanet 설정 시작" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow

# 1. WSL2 기능 활성화
Write-Host "`n1️⃣ WSL2 기능 활성화 중..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 2. WSL2를 기본 버전으로 설정
Write-Host "`n2️⃣ WSL2를 기본 버전으로 설정..." -ForegroundColor Cyan
wsl --set-default-version 2

# 3. WSL 커널 업데이트
Write-Host "`n3️⃣ WSL 커널 업데이트..." -ForegroundColor Cyan
wsl --update

# 4. Ubuntu 설치
Write-Host "`n4️⃣ Ubuntu 22.04 LTS 설치 중..." -ForegroundColor Cyan
Write-Host "   이 작업은 몇 분 소요될 수 있습니다." -ForegroundColor Yellow
wsl --install -d Ubuntu-22.04

# 5. 설치 확인
Write-Host "`n5️⃣ 설치 확인..." -ForegroundColor Cyan
wsl --list --verbose

Write-Host "`n✅ WSL2 Ubuntu 설치 완료!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "`n다음 단계:" -ForegroundColor Magenta
Write-Host "1. 컴퓨터를 재시작하세요" -ForegroundColor White
Write-Host "2. Ubuntu를 실행하고 사용자 계정을 설정하세요" -ForegroundColor White
Write-Host "3. setup_in_wsl.sh 스크립트를 실행하세요" -ForegroundColor White
Write-Host "`n명령어: wsl -d Ubuntu-22.04" -ForegroundColor Yellow