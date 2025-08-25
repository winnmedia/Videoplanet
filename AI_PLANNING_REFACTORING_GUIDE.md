# AI 영상 기획 UI 리팩토링 가이드

## 📋 현황 분석 요약

### 🔴 주요 문제점
1. **FSD 아키텍처 위반**: Page 레이어에 623줄의 비즈니스 로직 집중
2. **컴포넌트 분리 부재**: 단일 파일에 모든 기능 구현
3. **Redux 미활용**: Entity slice 정의되어 있으나 사용하지 않음
4. **공통 컴포넌트 미사용**: Button, Input 등 shared/ui 컴포넌트 활용 안함
5. **테스트 커버리지 부족**: 엣지 케이스와 접근성 테스트 미비

## 🎯 리팩토링 목표

### 1. FSD 아키텍처 준수
```
app/
└── video-planning/
    └── ai/
        └── page.tsx (30줄 이내, 레이아웃만)

features/
└── ai-planning/
    ├── ui/
    │   ├── AIPlanningForm/
    │   ├── GenerationProgress/
    │   └── PlanResult/
    ├── model/
    │   └── ai-planning.slice.ts
    └── api/
        └── ai-planning.api.ts

entities/
└── video-planning/
    └── (기존 유지)

shared/
└── ui/
    └── (기존 컴포넌트 활용)
```

### 2. 컴포넌트 분리 계획

#### AIPlanningForm 컴포넌트
```typescript
// src/features/ai-planning/ui/AIPlanningForm/AIPlanningForm.tsx
import { Button, Input } from '@/shared/ui'
import { useAIPlanningForm } from '../../model/hooks'
import { BasicInfoSection } from './BasicInfoSection'
import { MetaInfoSection } from './MetaInfoSection'
import { DevelopmentSection } from './DevelopmentSection'

export const AIPlanningForm = () => {
  const {
    formData,
    errors,
    isValid,
    handleSubmit,
    updateField
  } = useAIPlanningForm()

  return (
    <form onSubmit={handleSubmit} aria-label="AI 영상 기획 생성 폼">
      <BasicInfoSection 
        data={formData}
        errors={errors}
        onChange={updateField}
      />
      <MetaInfoSection 
        data={formData}
        onChange={updateField}
      />
      <DevelopmentSection 
        data={formData}
        onChange={updateField}
      />
      <Button 
        type="submit"
        variant="gradient"
        size="lg"
        disabled={!isValid}
        loading={formData.isGenerating}
        aria-busy={formData.isGenerating}
      >
        AI 기획서 생성하기
      </Button>
    </form>
  )
}
```

#### BasicInfoSection 컴포넌트
```typescript
// src/features/ai-planning/ui/AIPlanningForm/BasicInfoSection.tsx
import { Input } from '@/shared/ui'

interface Props {
  data: FormData
  errors: FormErrors
  onChange: (field: string, value: any) => void
}

export const BasicInfoSection = ({ data, errors, onChange }: Props) => {
  return (
    <fieldset>
      <legend>기본 정보</legend>
      
      <Input
        label="영상 제목"
        value={data.title}
        onChange={(e) => onChange('title', e.target.value)}
        error={errors.title}
        required
        aria-required="true"
        minLength={2}
        maxLength={100}
        placeholder="예: 브이래닛 브랜드 홍보영상"
      />

      <Input
        label="한 줄 스토리"
        value={data.oneLinerStory}
        onChange={(e) => onChange('oneLinerStory', e.target.value)}
        error={errors.oneLinerStory}
        required
        aria-required="true"
        minLength={10}
        maxLength={500}
        multiline
        rows={3}
        placeholder="영상의 핵심 내용을 한 줄로 설명해주세요"
      />
      
      <CharacterCount 
        current={data.oneLinerStory.length}
        max={500}
      />
    </fieldset>
  )
}
```

### 3. Redux Slice 통합

```typescript
// src/features/ai-planning/model/ai-planning.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { aiPlanningAPI } from '../api/ai-planning.api'

export const generateAIPlan = createAsyncThunk(
  'aiPlanning/generate',
  async (formData: AIGeneratePlanRequest, { rejectWithValue }) => {
    try {
      const response = await aiPlanningAPI.generatePlan(formData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const aiPlanningSlice = createSlice({
  name: 'aiPlanning',
  initialState: {
    formData: initialFormData,
    generationStep: 'input',
    progress: 0,
    result: null,
    error: null,
    isGenerating: false
  },
  reducers: {
    updateFormField: (state, action) => {
      const { field, value } = action.payload
      state.formData[field] = value
    },
    resetForm: (state) => {
      state.formData = initialFormData
      state.error = null
    },
    setGenerationStep: (state, action) => {
      state.generationStep = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAIPlan.pending, (state) => {
        state.isGenerating = true
        state.error = null
        state.generationStep = 'generating'
      })
      .addCase(generateAIPlan.fulfilled, (state, action) => {
        state.isGenerating = false
        state.result = action.payload
        state.generationStep = 'result'
      })
      .addCase(generateAIPlan.rejected, (state, action) => {
        state.isGenerating = false
        state.error = action.payload
        state.generationStep = 'input'
      })
  }
})
```

### 4. API 레이어 분리

```typescript
// src/features/ai-planning/api/ai-planning.api.ts
import { APIResponse, AIGeneratePlanRequest } from '@/entities/video-planning'

class AIPlanningAPI {
  private baseURL = '/api/ai'
  
  async generatePlan(data: AIGeneratePlanRequest): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  }
  
  async generateStoryStages(metadata: StoryMetadata) {
    // 구현
  }
  
  async generateShotBreakdown(planId: string) {
    // 구현
  }
}

export const aiPlanningAPI = new AIPlanningAPI()
```

### 5. 접근성 개선 사항

```typescript
// 필수 ARIA 속성 추가
<form
  role="form"
  aria-label="AI 영상 기획 생성"
  aria-describedby="form-description"
>
  <div id="form-description" className="sr-only">
    한 줄 스토리와 기본 메타 정보를 입력하면 AI가 전문적인 영상 기획서를 생성합니다
  </div>

  {/* 진행 상태 알림 */}
  <div role="status" aria-live="polite" aria-atomic="true">
    {isGenerating && `생성 진행중: ${progress}%`}
  </div>

  {/* 에러 알림 */}
  <div role="alert" aria-live="assertive">
    {error && error.message}
  </div>

  {/* 키보드 네비게이션 개선 */}
  <button
    type="button"
    aria-pressed={formData.tempo === 'fast'}
    aria-label="빠른 템포 - 역동적인 편집과 빠른 전개"
    onClick={() => setTempo('fast')}
  >
    빠르게
  </button>
</form>
```

### 6. 테스트 전략 개선

#### 유닛 테스트 (70% 커버리지 목표)
- 각 섹션 컴포넌트 개별 테스트
- 입력 유효성 검사 로직
- Redux 액션 및 리듀서

#### 통합 테스트 (핵심 플로우)
- 전체 기획서 생성 프로세스
- 에러 복구 시나리오
- 자동 저장 기능

#### E2E 테스트 (Playwright)
```typescript
// e2e/ai-planning.spec.ts
test('AI 기획서 생성 전체 워크플로우', async ({ page }) => {
  await page.goto('/video-planning/ai')
  
  // 필수 정보 입력
  await page.fill('[aria-label="영상 제목"]', '테스트 영상')
  await page.fill('[aria-label="한 줄 스토리"]', '테스트 스토리입니다')
  
  // 메타 정보 설정
  await page.selectOption('[aria-label="장르"]', '홍보영상')
  
  // 생성 시작
  await page.click('button:has-text("AI 기획서 생성하기")')
  
  // 결과 확인
  await expect(page.locator('text=AI 영상 기획서 생성 완료!')).toBeVisible()
})
```

## 📌 구현 우선순위

### Phase 1: 컴포넌트 분리 (1주)
- [ ] AIPlanningForm 메인 컴포넌트 생성
- [ ] BasicInfoSection 분리
- [ ] MetaInfoSection 분리
- [ ] DevelopmentSection 분리
- [ ] shared/ui 컴포넌트 적용

### Phase 2: 상태 관리 통합 (3일)
- [ ] Redux slice 생성
- [ ] API 레이어 분리
- [ ] 커스텀 훅 구현
- [ ] 자동 저장 로직 구현

### Phase 3: 테스트 구현 (1주)
- [ ] 유닛 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 접근성 테스트 추가
- [ ] E2E 테스트 구현

### Phase 4: 성능 최적화 (3일)
- [ ] React.memo 적용
- [ ] 디바운싱 구현
- [ ] 코드 스플리팅
- [ ] 번들 사이즈 최적화

## 🎯 성공 지표

- **코드 품질**
  - 컴포넌트당 최대 200줄
  - 테스트 커버리지 70% 이상
  - 0개의 ESLint 경고

- **성능**
  - LCP < 2.5초
  - FID < 100ms
  - CLS < 0.1

- **접근성**
  - WCAG 2.1 AA 준수
  - 키보드 네비게이션 100% 지원
  - 스크린 리더 완벽 호환

## 📚 참고 자료

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)