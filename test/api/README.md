# VideoPlanet API 테스트 가이드

## 📋 개요

VideoPlanet 프로젝트의 백엔드 API에 대한 종합적인 테스트 스위트입니다.

## 🏗️ 테스트 구조

```
test/api/
├── types/              # 테스트 타입 정의
│   └── api-test.types.ts
├── helpers/            # 테스트 헬퍼 유틸리티
│   └── test-helpers.ts
├── unit/               # 단위 테스트
│   ├── ai-generate-plan.test.ts
│   └── plans-crud.test.ts
├── performance/        # 성능 및 부하 테스트
│   └── concurrency-load.test.ts
├── integration/        # 통합 테스트
│   └── e2e-workflow.test.ts
└── run-api-tests.ts    # 테스트 실행 스크립트
```

## 🚀 빠른 시작

### 전제 조건

1. 개발 서버 실행:
```bash
npm run dev
```

2. 모든 API 테스트 실행:
```bash
npm run test:api:all
```

## 📊 테스트 명령어

### 전체 테스트
```bash
# 모든 API 테스트 실행
npm run test:api

# 종합 테스트 및 리포트 생성
npm run test:api:all

# 커버리지 포함
npm run test:api:coverage
```

### 개별 테스트
```bash
# AI 기획 생성 API 테스트
npm run test:api:ai

# CRUD API 테스트
npm run test:api:crud

# 동시성 테스트
npm run test:api:concurrent

# E2E 워크플로우 테스트
npm run test:api:e2e
```

### 카테고리별 테스트
```bash
# 단위 테스트만
npm run test:api:unit

# 통합 테스트만
npm run test:api:integration

# 성능 테스트만
npm run test:api:performance
```

### 개발 모드
```bash
# Watch 모드로 테스트 실행
npm run test:api:watch
```

## 📈 테스트 범위

### 1. AI 기획 생성 API (`/api/ai/generate-plan`)

#### 정상 케이스
- ✅ 유효한 한 줄 스토리 입력
- ✅ 4단계 스토리 구조 생성
- ✅ 12개 숏트 분해 생성

#### 경계값 테스트
- ✅ 최소/최대 제목 길이 (1-200자)
- ✅ 최소/최대 영상 길이 (10-600초)

#### 이상 케이스
- ✅ 특수문자 처리
- ✅ 이모지 처리
- ✅ 다국어 입력 (한글, 영어, 일본어, 중국어)

#### 에러 케이스
- ✅ 빈 값 입력
- ✅ null/undefined 처리
- ✅ 음수 영상 길이
- ✅ 범위 초과 값

### 2. 기획서 CRUD API (`/api/plans`)

#### CREATE (POST)
- ✅ 기획서 생성
- ✅ 필수 필드 검증
- ✅ 제목 길이 제한
- ✅ 기획서 유형 검증

#### READ (GET)
- ✅ 전체 목록 조회
- ✅ 개별 기획서 조회
- ✅ 페이지네이션
- ✅ 필터링 (상태, 태그, 검색)
- ✅ 정렬 기능

#### UPDATE (PUT/PATCH)
- ✅ 메타데이터 수정
- ✅ 콘텐츠 부분 수정
- ✅ 상태 변경
- ✅ 편집 이력 추적

#### DELETE
- ✅ 기획서 삭제
- ✅ 게시된 기획서 삭제 방지
- ✅ 권한 검증

### 3. 동시성 테스트

- ✅ 동시 요청 10개 처리
- ✅ 점진적 부하 증가 (Ramp-up)
- ✅ 레이스 컨디션 체크
- ✅ 읽기/쓰기 동시 작업
- ✅ 동시 삭제 방지

### 4. 부하 테스트

- ✅ 1분간 지속적 부하 (10 RPS)
- ✅ 스파이크 부하 테스트
- ✅ 메모리 누수 테스트
- ✅ API 엔드포인트별 벤치마크

### 5. 통합 테스트

- ✅ 완전한 영상 기획 워크플로우
- ✅ 협업 워크플로우
- ✅ 오류 복구 워크플로우

## 🎯 성능 기준

### 응답 시간
- AI 기획 생성: P95 < 10초
- 기획서 CRUD: P95 < 2초
- 전체 워크플로우: < 15초

### 성공률
- 단위 테스트: 100%
- 동시성 테스트: > 80%
- 부하 테스트: > 95%

### 처리량
- 기획서 조회: > 50 req/s
- 기획서 생성: > 10 req/s
- AI 기획 생성: > 1 req/s

## 📊 테스트 결과 분석

테스트 실행 후 `test-results/` 디렉토리에 상세 리포트가 생성됩니다:

```
test-results/
└── api-test-report-[timestamp].md
```

리포트 내용:
- 테스트 요약
- 각 테스트 스위트별 결과
- 성능 메트릭
- 권장 개선사항

## 🔍 디버깅

### 상세 로그 확인
```bash
# Vitest UI로 테스트 실행
npm run test:api:ui
```

### 특정 테스트만 실행
```bash
# 특정 테스트 파일
npx vitest test/api/unit/ai-generate-plan.test.ts

# 특정 테스트 케이스
npx vitest test/api/unit/ai-generate-plan.test.ts -t "유효한 한 줄 스토리"
```

## 📝 테스트 작성 가이드

### 새 테스트 추가하기

1. 적절한 디렉토리에 테스트 파일 생성:
   - 단위 테스트: `test/api/unit/`
   - 통합 테스트: `test/api/integration/`
   - 성능 테스트: `test/api/performance/`

2. 테스트 헬퍼 활용:
```typescript
import { APITestClient, TestDataFactory } from '../helpers/test-helpers'

const apiClient = new APITestClient()
const testData = TestDataFactory.generateAIPlanRequest()
```

3. 테스트 케이스 작성:
```typescript
describe('API 테스트', () => {
  it('테스트 케이스', async () => {
    const { data, metrics } = await apiClient.post('/api/endpoint', testData)
    
    expect(data.success).toBe(true)
    expect(metrics.responseTime).toBeLessThan(1000)
  })
})
```

## 🚨 CI/CD 통합

GitHub Actions나 다른 CI 도구에서 사용:

```yaml
- name: API 테스트 실행
  run: |
    npm run dev &
    sleep 5
    npm run test:api:all
```

## 📞 문의

테스트 관련 문의사항:
- Backend Lead: Benjamin
- 프로젝트: VideoPlanet

---

*마지막 업데이트: 2025-08-23*