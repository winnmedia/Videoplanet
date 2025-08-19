# 🚀 STARTWORK.md - VideoPlanet 작업 시작 가이드

> **목적**: 모든 개발 작업 시작 전 필수 체크리스트와 준비 절차를 제공합니다.  
> **원칙**: Plan → Do → See 사이클의 "Plan" 단계를 체계화합니다.

---

## 📚 Step 1: 필수 문서 숙지 (우선순위 순)

### 1.1 MEMORY.md 확인 ⭐⭐⭐
```bash
# 최근 작업 내역 확인 (상위 100줄)
head -n 100 MEMORY.md
```
- [ ] 최근 작업 내역 파악
- [ ] 현재 진행 중인 이슈 확인  
- [ ] 이전 결정 사항 검토
- [ ] 해결된 문제와 패턴 학습

### 1.2 CLAUDE.md 숙지 ⭐⭐⭐
- [ ] 프로젝트 특화 규칙 확인
- [ ] 테스트 전략 (TDD vs BDD) 이해
- [ ] UI/UX 디자인 토큰 확인
- [ ] 에러 처리 표준 숙지

### 1.3 Architecture_fsd.md 확인 ⭐⭐
- [ ] FSD 레이어 구조 이해
  - `app → processes → widgets → features → entities → shared`
- [ ] 의존성 규칙 확인 (상→하만 허용)
- [ ] Public API (index.ts) 원칙 이해
- [ ] 파일 배치 기준 숙지

### 1.4 Frontend_TDD.md 참고 ⭐
- [ ] Red → Green → Refactor 사이클 이해
- [ ] 테스트 우선 개발 루틴 확인
- [ ] 의존성 제거 전략 파악

### 1.5 DEVELOPMENT_RULES.md 참고 ⭐
- [ ] 통합 개발 지침 확인
- [ ] Git/PR 규칙 확인
- [ ] 품질 게이트 기준 확인


## 📝 Step 2: 작업 계획 수립

### 3.1 Definition of Ready (DoR) 체크리스트
- [ ] 요구사항이 명확한가?
- [ ] 수용 기준이 정의되었는가? (3~5개)
- [ ] 테스트 시나리오가 준비되었는가?
- [ ] API 계약(있다면)이 정의되었는가?
- [ ] 디자인/목업(있다면)이 준비되었는가?

### 3.2 작업 유형별 접근법

#### 🐛 버그 수정
1. MEMORY.md에서 유사 이슈 검색
2. 실패하는 테스트 먼저 작성
3. 최소 수정으로 해결
4. 회귀 방지 테스트 추가

#### ✨ 새 기능 개발
1. FSD 레이어 결정 (entities? features? widgets?)
2. Public API 설계
3. 테스트 먼저 작성 (TDD)
4. 구현 → 리팩토링

#### ♻️ 리팩토링
1. 현재 테스트 커버리지 확인
2. 부족한 테스트 보강
3. 작은 단위로 점진적 개선
4. 각 단계마다 테스트 실행

#### 🎨 UI 작업
1. 컴포넌트 복잡도 판단
   - 복잡한 로직 → TDD (테스트 먼저)
   - 단순 표시 → 구현 후 즉시 테스트
2. 디자인 토큰 확인
3. 접근성 체크리스트 준비

---
---

## 📞 도움 요청

문제가 지속되면:
1. MEMORY.md에서 유사 사례 검색
2. 관련 ADR 문서 확인 (`docs/architecture/`)
3. 팀 슬랙 채널에 문의
4. GitHub Issues 생성

---

**마지막 업데이트**: 2025-08-19  
**문서 버전**: 1.0.0  
**관리자**: Claude AI Assistant

---

## 🎬 Quick Reference

### 필수 명령어 모음
```bash
# 개발
npm run dev              # 개발 서버 시작
npm run build           # 프로덕션 빌드
npm run start           # 프로덕션 서버

# 테스트
npm test                # 테스트 실행
npm run test:coverage   # 커버리지 확인
npm run test:watch      # 감시 모드

# 코드 품질
npm run lint            # ESLint 실행
npm run lint:arch       # FSD 경계 검증
npm run type-check      # TypeScript 검증
npm run check:circular  # 순환 의존성 체크

# Git
git status              # 상태 확인
git add .               # 스테이징
git commit -m "메시지"  # 커밋
git push origin master  # 푸시
```

### 파일 구조 빠른 참조
```
src/
├── app/          # 라우팅 (Next.js)
├── processes/    # 복합 플로우
├── widgets/      # 재사용 블록
├── features/     # 사용자 액션
├── entities/     # 도메인 모델
└── shared/       # 공통 유틸
```

---

**"좋은 시작이 반이다" - 체계적인 준비로 안정적인 개발을!** 🚀