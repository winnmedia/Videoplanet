# AI 영상 기획 시스템 FSD 아키텍처 설계서

## 📋 개요

이 문서는 INSTRUCTION.md의 요구사항을 기반으로 설계된 AI 영상 기획 시스템의 Feature-Sliced Design (FSD) 아키텍처 전체 구조를 설명합니다.

### 🎯 시스템 목적
- **입력**: 한 줄 스토리 + 기본 메타데이터
- **처리**: 3단계 위저드 워크플로우 (입력 → 4단계 → 12숏트)
- **출력**: 콘티 이미지 포함 전문 기획안 PDF

### 🔧 핵심 기능
1. **3단계 위저드**: 단계별 안내형 UI 워크플로우
2. **LLM 오케스트레이션**: 4단계 생성 → 12숏트 분해
3. **Google 이미지 API**: 스토리보드 콘티 자동 생성
4. **PDF 출력**: 여백 0, A4 가로 전문 기획안
5. **실시간 편집**: 자동저장 및 실시간 협업

---

## 🏗️ FSD 아키텍처 구조

### 의존성 플로우
```
app → widgets → features → entities → shared
```

### 전체 디렉토리 구조
```
src/
├── entities/                    # 도메인 모델 및 비즈니스 로직
│   └── storyboard/
│       ├── model/
│       │   ├── types.ts         # 500+ 라인 타입 시스템
│       │   └── storyboard.slice.ts  # Redux 상태 관리
│       └── index.ts             # Public API
│
├── features/                    # 사용자 상호작용 기능
│   ├── storyboard-wizard/       # 3단계 위저드
│   │   ├── model/
│   │   │   └── wizard.slice.ts  # 위저드 상태 관리
│   │   ├── ui/
│   │   │   ├── StoryInputForm.tsx
│   │   │   └── StoryInputForm.module.scss
│   │   └── index.ts
│   └── ai-generation/           # AI 생성 기능
│       ├── ui/
│       │   ├── ContiImageGenerator.tsx
│       │   └── ContiImageGenerator.module.scss
│       └── index.ts
│
├── widgets/                     # 복합 컴포넌트 조립
│   └── ai-planning-wizard/      # 통합 위저드
│       ├── ui/
│       │   ├── PlanningWizard.tsx
│       │   └── ShotEditingStep.tsx
│       └── index.ts
│
├── app/                         # 애플리케이션 레이어
│   ├── api/ai/                  # AI 생성 API
│   │   ├── generate-story/route.ts
│   │   ├── generate-shots/route.ts
│   │   ├── generate-image/route.ts
│   │   └── generate-inserts/route.ts
│   └── ai-planning/             # 메인 페이지
│       ├── page.tsx
│       └── AIPlanningPage.module.scss
│
└── shared/                      # 공통 인프라
    ├── lib/
    │   └── store/               # Redux 설정
    └── ui/                      # 공통 컴포넌트
```

---

## 🎯 Entity 레이어: 도메인 모델

### Storyboard Entity
**경로**: `/src/entities/storyboard/`

#### 핵심 타입 시스템 (500+ 라인)
```typescript
// 기본 메타데이터
export type ToneOption = 'formal' | 'casual' | 'professional' | 'emotional' // ... 8개
export type GenreOption = 'commercial' | 'documentary' | 'tutorial' // ... 8개
export type VideoFormat = 'vertical' | 'horizontal' | 'square'
export type TempoOption = 'fast' | 'normal' | 'slow'
export type NarrativeStyle = 'hook-immersion-twist-cliffhanger' | 'classic-four-act' // ... 6개
export type DevelopmentIntensity = 'minimal' | 'moderate' | 'rich'

// 4단계 스토리 구조
export interface StorySection {
  id: string
  stage: 'opening' | 'development' | 'climax' | 'resolution'
  title: string
  summary: string
  content: string
  objective: string
  lengthHint: string
  keyPoints: string[]
  isEdited: boolean
  originalContent?: string
  editedAt?: Date
}

// 12개 숏트 구조
export interface Shot {
  id: string
  shotNumber: number
  storyStage: StoryStage
  title: string
  description: string
  shotType: ShotType
  cameraMovement: CameraMovement
  cameraAngle: CameraAngle
  duration: number
  transition: Transition
  contiImage?: ContiImage
  insertShots: InsertShot[]
  // ... 더 많은 필드
}

// 전체 프로젝트
export interface StoryboardProject {
  id: string
  title: string
  storyline: string
  tones: ToneOption[]
  genres: GenreOption[]
  // ... 메타데이터
  storySection: StorySection[]
  shots: Shot[]
  status: ProjectStatus
  currentStep: 1 | 2 | 3
  // ... 더 많은 필드
}
```

#### Redux Slice (800+ 라인)
- **상태 관리**: 프로젝트, 스토리, 숏트 상태
- **비동기 액션**: LLM 생성, 이미지 생성, PDF 생성
- **선택자**: 메모이제이션된 데이터 선택
- **캐시 관리**: 중복 요청 방지

#### Public API
- 타입 정의 전체 export
- Redux 액션 및 선택자
- 상수 및 에러 클래스

---

## ⚡ Feature 레이어: 사용자 기능

### 1. Storyboard Wizard Feature
**경로**: `/src/features/storyboard-wizard/`

#### 위저드 상태 관리
- **3단계 진행**: 입력 → 4단계 검토 → 12숏트 편집
- **검증 시스템**: 실시간 필드 검증, 에러 표시
- **자동저장**: 변경사항 자동 감지 및 저장

#### StoryInputForm 컴포넌트
- **복합 입력**: 톤앤매너(복수), 장르(복수), 고급 설정
- **실시간 검증**: 필드별 에러 표시, 진행 가능 여부
- **접근성**: ARIA 레이블, 키보드 내비게이션
- **반응형**: 모바일 최적화 레이아웃

### 2. AI Generation Feature
**경로**: `/src/features/ai-generation/`

#### ContiImageGenerator 컴포넌트
- **Google API 연동**: 이미지 생성 요청/응답 처리
- **스타일 프리셋**: 기본/거친/깔끔 스타일
- **커스텀 프롬프트**: 사용자 정의 생성 옵션
- **버전 관리**: 재생성 버전 추적
- **다운로드**: PNG/JPEG 형식 지원

---

## 🧩 Widget 레이어: 복합 조립

### AI Planning Wizard Widget
**경로**: `/src/widgets/ai-planning-wizard/`

#### PlanningWizard (메인 오케스트레이터)
```typescript
// 3단계 통합 관리
const PlanningWizard = () => {
  // 1단계: StoryInputForm
  // 2단계: StoryReviewStep (4단계 검토)
  // 3단계: ShotEditingStep (12숏트 편집)
  
  // AI 생성 오케스트레이션
  const handleGenerateFourStage = () => { /* LLM 호출 */ }
  const handleGenerateTwelveShots = () => { /* 12숏트 분해 */ }
  
  return (
    <div className={styles.wizard}>
      <WizardProgress />
      {renderCurrentStep()}
      <WizardNavigation />
    </div>
  )
}
```

#### ShotEditingStep (3단계 핵심)
- **12숏트 관리**: 그리드/리스트 뷰, 필터링, 정렬
- **콘티 생성**: 개별/일괄 이미지 생성
- **인서트 샷**: AI 추천 3개씩 생성
- **통계 대시보드**: 완성률, 진행률 표시
- **PDF 내보내기**: 완성 시 기획안 생성

---

## 🌐 App 레이어: 시스템 통합

### API Routes
**경로**: `/src/app/api/ai/`

#### 1. Story Generation API (`/api/ai/generate-story`)
```typescript
// OpenAI GPT-4 기반 4단계 스토리 생성
POST /api/ai/generate-story
{
  "type": "4-stage",
  "title": "영상 제목",
  "storyline": "한 줄 스토리",
  "tones": ["professional", "emotional"],
  "genres": ["commercial"],
  "target": "20-30대 직장인",
  "duration": 60,
  "format": "horizontal",
  "tempo": "normal",
  "narrativeStyle": "classic-four-act",
  "developmentIntensity": "moderate"
}

// 응답
{
  "success": true,
  "data": {
    "generatedContent": [/* 4개 StorySection */],
    "prompt": "사용된 프롬프트",
    "tokensUsed": 1500,
    "generationTime": 3000
  }
}
```

#### 2. Image Generation API (`/api/ai/generate-image`)
```typescript
// Google Imagen API 기반 콘티 이미지 생성
POST /api/ai/generate-image
{
  "shotId": "shot_001",
  "prompt": "medium shot of person talking, storyboard style",
  "style": "storyboard pencil sketch, rough, monochrome",
  "negativePrompt": "color, photographic, realistic",
  "isRegeneration": false
}

// 응답
{
  "success": true,
  "data": {
    "imageId": "img_shot_001_12345",
    "url": "/uploads/conti/shot-001-v1-12345.png",
    "filename": "shot-001-v1-12345.png",
    "version": 1,
    "prompt": "최적화된 프롬프트",
    "generatedAt": "2025-08-22T10:30:00Z"
  }
}
```

### Main Page
**경로**: `/src/app/ai-planning/page.tsx`

#### 페이지 구성
1. **히어로 섹션**: 시스템 소개, 3단계 안내
2. **주요 기능**: 6개 핵심 기능 카드
3. **사용법 안내**: 단계별 상세 설명
4. **메인 위저드**: PlanningWizard 컴포넌트
5. **추가 정보**: 팁 및 주의사항

---

## 🔒 의존성 규칙 및 보안

### FSD 의존성 규칙
```javascript
// ESLint 설정
"no-restricted-imports": [
  "error", {
    "patterns": [
      {
        "group": ["../../../*"],
        "message": "Use absolute imports from src/ instead"
      },
      {
        "group": ["**/entities/*/ui/*", "**/entities/*/model/*"],
        "message": "Import entities through public API only"
      },
      {
        "group": ["**/features/*/ui/*", "**/features/*/model/*"],
        "message": "Import features through public API only"
      },
      {
        "group": ["**/widgets/*/ui/*", "**/widgets/*/model/*"],
        "message": "Import widgets through public API only"
      }
    ]
  }
]
```

### API 보안
- **API Key 관리**: 서버사이드 환경변수
- **입력 검증**: 모든 API 엔드포인트 필드 검증
- **파일 업로드**: 크기 제한, 형식 검증, 경로 보안
- **캐시 보안**: 메모리 캐시, TTL 적용

### 에러 처리
```typescript
// 계층별 에러 처리
try {
  await dispatch(generateFourStageStory(request)).unwrap()
} catch (error) {
  // 1. Redux에서 에러 상태 업데이트
  // 2. UI에서 사용자 친화적 메시지 표시
  // 3. 로그에 상세 오류 기록
  // 4. 재시도 옵션 제공
}
```

---

## 🚀 성능 최적화

### 1. Redux 최적화
- **메모이제이션**: createSelector 활용
- **정규화**: 데이터 구조 플래튼화
- **지연 로딩**: 필요시에만 로드

### 2. 컴포넌트 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 비용 최적화
- **코드 스플리팅**: 동적 import

### 3. API 최적화
- **캐싱**: 동일 요청 결과 재사용
- **디바운싱**: 연속 API 호출 방지
- **배치 처리**: 다중 이미지 생성 최적화

### 4. 이미지 최적화
- **압축**: PNG/JPEG 최적화
- **지연 로딩**: 필요시에만 로드
- **CDN**: 정적 파일 캐싱 (확장 계획)

---

## 📊 데이터 플로우

### 1단계: 스토리 입력
```
User Input → Wizard Slice → Form Validation → Ready for Generation
```

### 2단계: 4단계 생성
```
Generate Request → OpenAI API → Parse Response → Update Entity → UI Update
```

### 3단계: 12숏트 편집
```
Generate Shots → Parse 12 Shots → Individual Edit → Conti Generation → PDF Export
```

### 이미지 생성 플로우
```
Shot Data → Prompt Optimization → Google API → Image Save → URL Return → UI Update
```

---

## 🔧 개발 및 테스트

### TypeScript 엄격성
- **타입 안전성**: 500+ 라인 타입 정의
- **런타임 검증**: API 응답 검증
- **에러 타입화**: 커스텀 에러 클래스

### 테스트 전략
- **Unit Tests**: 비즈니스 로직 (entities)
- **Component Tests**: UI 상호작용 (features)
- **Integration Tests**: 워크플로우 (widgets)
- **E2E Tests**: 전체 사용자 여정 (app)

### 품질 보증
- **ESLint**: FSD 규칙 자동 검증
- **Prettier**: 코드 포맷팅
- **Husky**: 커밋 전 검증
- **CI/CD**: 자동화된 테스트 및 배포

---

## 🔮 확장 계획

### Phase 1: 기본 구현 (현재)
- [x] Entity 레이어 완성
- [x] Feature 레이어 핵심 기능
- [x] Widget 통합 컴포넌트
- [x] App API 및 페이지

### Phase 2: 고도화
- [ ] 실시간 협업 (WebSocket)
- [ ] 고급 편집 도구
- [ ] 템플릿 시스템
- [ ] 사용자 권한 관리

### Phase 3: AI 강화
- [ ] GPT-4V 이미지 분석
- [ ] 음성 내레이션 생성
- [ ] 자동 편집 제안
- [ ] 스타일 학습

### Phase 4: 플랫폼화
- [ ] API 공개
- [ ] 플러그인 시스템
- [ ] 다국어 지원
- [ ] 모바일 앱

---

## 📈 성공 지표

### 기술적 지표
- **타입 안전성**: 100% TypeScript 커버리지
- **성능**: 3초 이내 4단계 생성
- **안정성**: 99% API 응답 성공률
- **확장성**: 1000+ 동시 사용자 지원

### 사용자 지표
- **완성률**: 95% 사용자가 PDF까지 완성
- **만족도**: 4.5/5.0 이상
- **재사용률**: 70% 사용자 재방문
- **효율성**: 기존 대비 80% 시간 단축

---

## 🎯 결론

이 FSD 아키텍처는 다음과 같은 핵심 가치를 제공합니다:

1. **확장성**: 계층별 독립적 개발 가능
2. **유지보수성**: 명확한 책임 분리
3. **재사용성**: Public API 기반 모듈화
4. **타입 안전성**: 컴파일 타임 에러 방지
5. **성능**: 최적화된 상태 관리 및 렌더링

INSTRUCTION.md의 모든 요구사항을 충족하면서, 미래 확장을 고려한 견고한 아키텍처로 설계되었습니다. 

개발팀은 이 설계서를 기반으로 각 레이어별로 병렬 개발을 진행할 수 있으며, Public API 계약을 통해 안전하게 통합할 수 있습니다.