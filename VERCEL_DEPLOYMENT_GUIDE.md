# Vercel 배포 설정 가이드

## 🚨 중요: Root Directory 설정 변경 필요

### 문제
- Vercel 프로젝트 설정에서 Root Directory가 `vridge_front`로 설정되어 있음
- 실제 Next.js 프로젝트는 리포지토리 루트에 위치

### 해결 방법

#### 방법 1: Vercel 대시보드에서 설정 변경 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com 로그인
   - 해당 프로젝트 선택

2. **Settings 탭 이동**
   - 상단 메뉴에서 `Settings` 클릭

3. **General 섹션**
   - 좌측 메뉴에서 `General` 선택

4. **Root Directory 수정**
   - Root Directory 필드 찾기
   - 현재 값: `vridge_front`
   - **변경할 값: 비워두기 또는 `./` 입력**

5. **저장**
   - `Save` 버튼 클릭

6. **재배포**
   - Deployments 탭으로 이동
   - 최신 커밋에서 `Redeploy` 클릭
   - "Use existing Build Cache" 체크 해제
   - `Redeploy` 확인

#### 방법 2: 새 프로젝트로 다시 연결

1. **현재 프로젝트 삭제** (선택사항)
   - Settings → Advanced → Delete Project

2. **새 프로젝트 Import**
   - Vercel 대시보드에서 `New Project`
   - GitHub 리포지토리 선택
   - **Root Directory: 비워두기**
   - Framework Preset: Next.js
   - Deploy 클릭

### 프로젝트 구조 확인

```
Videoplanet/ (리포지토리 루트)
├── app/           # Next.js App Router
├── components/    # React 컴포넌트
├── features/      # 기능별 모듈
├── src/           # 소스 코드
├── public/        # 정적 파일
├── package.json   # 의존성 관리
├── next.config.js # Next.js 설정
├── vercel.json    # Vercel 설정
└── .vercelignore  # Vercel 무시 파일
```

### vercel.json 설정

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["icn1"],
  "installCommand": "npm install"
}
```

### 체크리스트

- [ ] Vercel 대시보드에서 Root Directory 설정 확인
- [ ] Root Directory가 비어있거나 `./`로 설정되어 있는지 확인
- [ ] Framework Preset이 Next.js로 설정되어 있는지 확인
- [ ] Build & Development Settings 확인
- [ ] Environment Variables 설정 확인 (필요한 경우)

### 환경 변수 (필요시)

```
NEXT_PUBLIC_API_BASE_URL=https://api.videoplanet.com
```

### 문제 해결

#### 빌드 에러 발생 시

1. **캐시 삭제 후 재배포**
   - Deployments → Redeploy
   - "Use existing Build Cache" 체크 해제

2. **로그 확인**
   - Build Logs에서 상세 에러 메시지 확인
   - Function Logs에서 런타임 에러 확인

### 지원

- Vercel 문서: https://vercel.com/docs
- Next.js 문서: https://nextjs.org/docs
- 프로젝트 GitHub: https://github.com/winnmedia/Videoplanet

---

**마지막 업데이트**: 2025-08-16
**작성자**: Claude Code Assistant