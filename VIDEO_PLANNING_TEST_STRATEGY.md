# VideoPlanet 영상 기획 기능 종합 테스트 전략

## 📋 문서 정보
- **작성자**: Grace (QA Lead)
- **작성일**: 2025-08-23
- **버전**: 1.0
- **대상 기능**: AI 기반 영상 기획 생성 시스템

---

## 1. 테스트 범위 및 목표

### 1.1 기능 범위
- **AI 기획 생성**: 한 줄 스토리 → 4단계 구조 → 12개 숏트 분해
- **전개방식 옵션**: 6가지 (훅-몰입-반전-떡밥, 기승전결, 귀납법, 연역법, 다큐, 픽사스토리)
- **메타데이터 설정**: 톤앤매너(16종), 장르(6종), 타겟(19종), 분량(15종), 포맷(15종)
- **템포 조절**: 빠르게/보통/느리게
- **전개 강도**: 그대로/적당히/풍부하게

### 1.2 품질 목표
| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **단위 테스트 커버리지** | 0% | 85% | Vitest Coverage |
| **통합 테스트 커버리지** | 0% | 70% | API Coverage |
| **E2E 테스트 통과율** | N/A | 95% | Playwright |
| **변이 테스트 점수** | N/A | 75% | Stryker |
| **성능 (API 응답)** | N/A | <2s (p95) | K6 |
| **Flaky 테스트 비율** | N/A | <1% | CI 통계 |

---

## 2. 테스트 피라미드 전략

```
         /\
        /E2E\       10% - 핵심 사용자 여정 (5개 시나리오)
       /______\
      /        \
     /Integration\   30% - API/서비스 통합 (15개 테스트)
    /______________\
   /                \
  /   Unit Tests     \ 60% - 비즈니스 로직 (30개 테스트)
 /____________________\
```

---

## 3. 테스트 케이스 매트릭스

### 3.1 단위 테스트 (Unit Tests) - 60%

#### 3.1.1 입력 검증 테스트
```typescript
describe('영상 기획 입력 검증', () => {
  describe('필수 필드 검증', () => {
    test.each([
      { field: 'title', value: '', error: '제목은 필수입니다' },
      { field: 'title', value: 'a', error: '제목은 최소 2자 이상' },
      { field: 'title', value: 'a'.repeat(101), error: '제목은 100자 이하' },
      { field: 'oneLinerStory', value: '', error: '한 줄 스토리는 필수' },
      { field: 'oneLinerStory', value: 'short', error: '최소 10자 이상' },
      { field: 'oneLinerStory', value: 'a'.repeat(501), error: '500자 이하' }
    ])('$field 검증: $value → $error', ({ field, value, error }) => {
      const result = validatePlanningInput({ [field]: value })
      expect(result.errors).toContain(error)
    })
  })

  describe('톤앤매너 조합 검증', () => {
    test('최소 1개 선택 필수', () => {
      const result = validateToneAndManner([])
      expect(result.isValid).toBe(false)
    })
    
    test('최대 5개까지 선택 가능', () => {
      const tones = ['친근한', '전문적인', '재미있는', '감성적인', '역동적인', '신뢰감']
      const result = validateToneAndManner(tones)
      expect(result.errors).toContain('최대 5개까지 선택')
    })
    
    test('상충되는 조합 경고', () => {
      const result = validateToneAndManner(['진중한', '유머러스'])
      expect(result.warnings).toContain('상충되는 톤앤매너')
    })
  })

  describe('분량별 숏트 개수 계산', () => {
    test.each([
      { duration: '15초', expectedShots: 3 },
      { duration: '30초', expectedShots: 6 },
      { duration: '60초', expectedShots: 12 },
      { duration: '90초', expectedShots: 18 },
      { duration: '2분', expectedShots: 24 },
      { duration: '5분', expectedShots: 60 }
    ])('$duration → $expectedShots 숏트', ({ duration, expectedShots }) => {
      const shots = calculateShotCount(duration)
      expect(shots).toBe(expectedShots)
    })
  })
})
```

#### 3.1.2 스토리 구조 생성 테스트
```typescript
describe('4단계 스토리 구조 생성', () => {
  describe('전개방식별 스토리 구조', () => {
    test.each([
      { 
        method: 'hook-immersion-twist-clue',
        stages: ['강력한 훅', '몰입 구간', '예상치 못한 반전', '다음 떡밥']
      },
      {
        method: 'classic-kishōtenketsu',
        stages: ['기 (도입)', '승 (전개)', '전 (절정)', '결 (마무리)']
      },
      {
        method: 'pixar-story',
        stages: ['옛날에', '그런데 어느 날', '그래서', '마침내']
      }
    ])('$method 방식의 스토리 구조', ({ method, stages }) => {
      const story = generateStoryStructure(method, mockInput)
      stages.forEach((stage, index) => {
        expect(story.stages[index].title).toContain(stage)
      })
    })
  })

  describe('분량 배분 로직', () => {
    test('기본 배분: 20-40-30-10', () => {
      const distribution = calculateStageDistribution(60, 'normal')
      expect(distribution).toEqual({
        introduction: 12,
        rising: 24,
        climax: 18,
        conclusion: 6
      })
    })
    
    test('빠른 템포: 15-35-35-15', () => {
      const distribution = calculateStageDistribution(60, 'fast')
      expect(distribution).toEqual({
        introduction: 9,
        rising: 21,
        climax: 21,
        conclusion: 9
      })
    })
  })

  describe('전개 강도별 콘텐츠 생성', () => {
    test('as-is: 간결한 설명', () => {
      const content = generateStageContent('as-is', mockStage)
      expect(content.description.length).toBeLessThan(100)
      expect(content.keyPoints).toHaveLength(2)
    })
    
    test('moderate: 균형잡힌 설명', () => {
      const content = generateStageContent('moderate', mockStage)
      expect(content.description.length).toBeBetween(100, 200)
      expect(content.keyPoints).toHaveLength(3)
    })
    
    test('rich: 풍부한 설명', () => {
      const content = generateStageContent('rich', mockStage)
      expect(content.description.length).toBeGreaterThan(200)
      expect(content.keyPoints).toHaveLength(5)
    })
  })
})
```

#### 3.1.3 숏트 분해 테스트
```typescript
describe('12개 숏트 분해 로직', () => {
  describe('숏트 타입 결정', () => {
    test('도입부: 와이드샷 우선', () => {
      const shots = generateShotsForStage('introduction', 3)
      expect(shots[0].shotType).toBe('와이드샷')
    })
    
    test('절정부: 클로즈업 활용', () => {
      const shots = generateShotsForStage('climax', 3)
      const closeups = shots.filter(s => s.shotType === '클로즈업')
      expect(closeups.length).toBeGreaterThan(0)
    })
  })

  describe('카메라 움직임 할당', () => {
    test('템포별 카메라 움직임 빈도', () => {
      const fastShots = generateShots('fast', 12)
      const slowShots = generateShots('slow', 12)
      
      const fastMovements = fastShots.filter(s => s.cameraMovement !== '고정')
      const slowMovements = slowShots.filter(s => s.cameraMovement !== '고정')
      
      expect(fastMovements.length).toBeGreaterThan(slowMovements.length)
    })
  })

  describe('숏트 시간 분배', () => {
    test('총 시간이 정확히 일치', () => {
      const totalDuration = 60
      const shots = generateShotBreakdown(totalDuration, 12)
      const sum = shots.reduce((acc, shot) => acc + shot.duration, 0)
      expect(sum).toBe(totalDuration)
    })
    
    test('최소/최대 숏트 길이 준수', () => {
      const shots = generateShotBreakdown(60, 12)
      shots.forEach(shot => {
        expect(shot.duration).toBeGreaterThanOrEqual(2)
        expect(shot.duration).toBeLessThanOrEqual(10)
      })
    })
  })
})
```

### 3.2 통합 테스트 (Integration Tests) - 30%

#### 3.2.1 AI API 통합 테스트
```typescript
describe('AI 기획 생성 API 통합', () => {
  describe('정상 플로우', () => {
    test('유효한 요청 → 성공 응답', async () => {
      const request = createValidRequest()
      const response = await api.post('/api/ai/generate-plan', request)
      
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('storyStages')
      expect(response.data.data).toHaveProperty('shotBreakdown')
    })
    
    test('생성 진행률 조회', async () => {
      const { data: { planId } } = await api.post('/api/ai/generate-plan', request)
      
      // 진행률 폴링
      for (let i = 0; i < 5; i++) {
        const progress = await api.get(`/api/ai/generate-plan?planId=${planId}`)
        expect(progress.data.progress).toBeGreaterThanOrEqual(i * 20)
        await sleep(1000)
      }
    })
  })

  describe('에러 처리', () => {
    test('필수 필드 누락 → 400 에러', async () => {
      const response = await api.post('/api/ai/generate-plan', {})
      expect(response.status).toBe(400)
      expect(response.data.error).toContain('필수')
    })
    
    test('AI API 실패 → 폴백 시뮬레이션', async () => {
      // AI API 실패 시뮬레이션
      mockOpenAI.failNext()
      
      const response = await api.post('/api/ai/generate-plan', validRequest)
      expect(response.status).toBe(200)
      expect(response.data.data.generatedBy).toBe('simulation')
    })
    
    test('타임아웃 → 적절한 에러', async () => {
      const response = await api.post('/api/ai/generate-plan', validRequest, {
        timeout: 100 // 100ms 타임아웃
      })
      expect(response.status).toBe(504)
      expect(response.data.error).toContain('시간 초과')
    })
  })

  describe('동시성 처리', () => {
    test('동시 요청 처리', async () => {
      const requests = Array(10).fill(null).map(() => 
        api.post('/api/ai/generate-plan', createValidRequest())
      )
      
      const responses = await Promise.all(requests)
      responses.forEach(res => {
        expect(res.status).toBe(200)
        expect(res.data.data.id).toBeUnique()
      })
    })
    
    test('Rate Limiting 적용', async () => {
      const requests = Array(20).fill(null).map(() => 
        api.post('/api/ai/generate-plan', validRequest)
      )
      
      const responses = await Promise.allSettled(requests)
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      )
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })
})
```

#### 3.2.2 데이터베이스 통합 테스트
```typescript
describe('기획서 저장 및 조회', () => {
  describe('CRUD 작업', () => {
    test('기획서 저장', async () => {
      const plan = await createPlan(validPlanData)
      expect(plan.id).toBeDefined()
      expect(plan.version).toBe(1)
    })
    
    test('기획서 수정 → 버전 증가', async () => {
      const plan = await createPlan(validPlanData)
      const updated = await updatePlan(plan.id, { title: '수정된 제목' })
      expect(updated.version).toBe(2)
      expect(updated.editHistory).toHaveLength(1)
    })
    
    test('기획서 목록 조회 (페이지네이션)', async () => {
      await createMultiplePlans(25)
      
      const page1 = await getPlans({ page: 1, limit: 10 })
      expect(page1.items).toHaveLength(10)
      expect(page1.pagination.total).toBe(25)
      
      const page2 = await getPlans({ page: 2, limit: 10 })
      expect(page2.items).toHaveLength(10)
      expect(page2.items[0].id).not.toBe(page1.items[0].id)
    })
  })

  describe('자동 저장', () => {
    test('30초마다 자동 저장', async () => {
      const plan = await createPlan(validPlanData)
      
      // 편집 시작
      await startEditing(plan.id)
      
      // 30초 대기
      await sleep(30000)
      
      // 자동 저장 확인
      const saved = await getPlan(plan.id)
      expect(saved.autoSavedAt).toBeAfter(plan.createdAt)
    })
  })
})
```

### 3.3 E2E 테스트 (End-to-End Tests) - 10%

#### 3.3.1 핵심 사용자 여정
```typescript
test.describe('AI 영상 기획 완전한 여정', () => {
  test('게스트 → 로그인 → 기획 생성 → 편집 → 다운로드', async ({ page }) => {
    // 1. 게스트 체험
    await page.goto('/video-planning/ai')
    await expect(page.locator('.guest-badge')).toContainText('로그인 없이 체험')
    
    // 2. 기본 정보 입력
    await page.fill('[name="title"]', '브랜드 홍보 영상')
    await page.fill('[name="oneLinerStory"]', '혁신적인 AI 도구로 영상 제작의 패러다임을 바꾸는 VideoPlanet의 이야기')
    
    // 3. 톤앤매너 선택 (복수)
    await page.check('text=전문적인')
    await page.check('text=혁신적인')
    await page.check('text=신뢰감 있는')
    
    // 4. 메타데이터 설정
    await page.selectOption('[name="genre"]', '홍보영상')
    await page.selectOption('[name="target"]', '20-30대')
    await page.selectOption('[name="duration"]', '90초')
    
    // 5. 전개방식 선택
    await page.click('text=훅-몰입-반전-떡밥')
    await expect(page.locator('.method-button.selected')).toContainText('훅-몰입')
    
    // 6. 템포 선택
    await page.click('text=빠르게')
    
    // 7. 전개 강도 선택
    await page.click('text=풍부하게')
    
    // 8. AI 생성 시작
    await page.click('button:has-text("AI 기획서 생성하기")')
    
    // 9. 생성 진행 모니터링
    await expect(page.locator('.progress-bar')).toBeVisible()
    await expect(page.locator('.step').first()).toContainText('스토리 구조 분석')
    
    // 10. 생성 완료 대기 (최대 30초)
    await page.waitForSelector('.result', { timeout: 30000 })
    
    // 11. 4단계 스토리 확인
    const storyStages = page.locator('.storyStage')
    await expect(storyStages).toHaveCount(4)
    await expect(storyStages.first()).toContainText('도입부')
    
    // 12. 12개 숏트 확인
    const shots = page.locator('.shotCard')
    await expect(shots).toHaveCount(12)
    
    // 13. 첫 번째 스토리 편집
    await storyStages.first().click()
    await page.click('button:has-text("편집")')
    await page.fill('.edit-textarea', '더 강력한 오프닝으로 수정')
    await page.click('button:has-text("저장")')
    
    // 14. 로그인 유도 확인
    await expect(page.locator('.login-prompt')).toContainText('영구 저장하려면 로그인')
    
    // 15. 로그인
    await page.click('text=로그인하기')
    await loginFlow(page, 'test@example.com', 'password')
    
    // 16. 기획서 저장
    await page.click('button:has-text("저장")')
    await expect(page.locator('.save-success')).toContainText('저장되었습니다')
    
    // 17. PDF 다운로드
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("PDF 다운로드")')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.pdf')
    
    // 18. 공유 링크 생성
    await page.click('button:has-text("공유")')
    const shareUrl = await page.locator('.share-url').inputValue()
    expect(shareUrl).toMatch(/\/planning\/share\/[\w-]+/)
  })
})
```

---

## 4. 경계값 분석 및 동등 분할

### 4.1 입력값 경계 테스트
| 필드 | 최소값 | 최대값 | 경계 테스트 케이스 |
|------|--------|--------|-------------------|
| 제목 | 2자 | 100자 | 1자(실패), 2자(성공), 100자(성공), 101자(실패) |
| 한줄스토리 | 10자 | 500자 | 9자(실패), 10자(성공), 500자(성공), 501자(실패) |
| 톤앤매너 | 1개 | 5개 | 0개(실패), 1개(성공), 5개(성공), 6개(실패) |
| 분량 | 15초 | 30분 | 14초(실패), 15초(성공), 30분(성공), 31분(실패) |

### 4.2 동등 분할 테스트
```typescript
describe('동등 분할 테스트', () => {
  describe('타겟 연령대별 콘텐츠 차별화', () => {
    test.each([
      { target: '10대', expectedTone: ['재미있는', '역동적인'] },
      { target: '20-30대', expectedTone: ['세련된', '혁신적인'] },
      { target: '40-50대', expectedTone: ['신뢰감', '전문적인'] },
      { target: '60대 이상', expectedTone: ['따뜻한', '자연스러운'] }
    ])('$target 타겟 → $expectedTone 톤 추천', ({ target, expectedTone }) => {
      const recommendation = getRecommendedTone(target)
      expectedTone.forEach(tone => {
        expect(recommendation).toContain(tone)
      })
    })
  })

  describe('장르별 기본 구조 차별화', () => {
    test.each([
      { genre: '홍보영상', structure: 'problem-solution' },
      { genre: '교육영상', structure: 'sequential-learning' },
      { genre: '브랜딩영상', structure: 'emotional-journey' },
      { genre: '제품소개', structure: 'feature-benefit' },
      { genre: '인터뷰', structure: 'question-answer' }
    ])('$genre → $structure 구조', ({ genre, structure }) => {
      const result = getDefaultStructure(genre)
      expect(result.type).toBe(structure)
    })
  })
})
```

---

## 5. 변이 테스트 (Mutation Testing)

### 5.1 변이 연산자 설정
```javascript
// stryker.conf.mjs
export default {
  mutate: [
    'src/app/video-planning/**/*.ts',
    '!src/**/*.test.ts'
  ],
  mutator: {
    name: 'typescript',
    operators: [
      'StringLiteral',      // 문자열 변경
      'ConditionalExpression', // 조건문 변경
      'EqualityOperator',   // 동등 연산자 변경
      'ArrayDeclaration',   // 배열 변경
      'BlockStatement',     // 블록문 제거
      'BooleanLiteral',     // 불린 값 반전
      'LogicalOperator',    // 논리 연산자 변경
      'UnaryOperator',      // 단항 연산자 변경
      'UpdateOperator',     // 증감 연산자 변경
      'ArithmeticOperator'  // 산술 연산자 변경
    ]
  },
  testRunner: 'vitest',
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
}
```

### 5.2 주요 변이 테스트 대상
1. **분량 계산 로직**: 시간 배분 알고리즘
2. **조합 검증 로직**: 톤앤매너 충돌 감지
3. **우선순위 결정**: 숏트 타입 선택 로직
4. **경계 조건**: 최소/최대값 검증

---

## 6. 성능 테스트 시나리오

### 6.1 부하 테스트 (K6)
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Warm-up
    { duration: '5m', target: 50 },  // Normal load
    { duration: '2m', target: 100 }, // Peak load
    { duration: '5m', target: 100 }, // Sustained peak
    { duration: '2m', target: 0 }    // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 요청 2초 이내
    http_req_failed: ['rate<0.05'],    // 실패율 5% 미만
    http_reqs: ['rate>10']             // 초당 10개 이상 처리
  }
}

export default function() {
  const payload = generateRandomPlanRequest()
  
  const response = http.post(
    'http://localhost:3000/api/ai/generate-plan',
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  )
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'has story stages': (r) => JSON.parse(r.body).data?.storyStages !== undefined,
    'has 12 shots': (r) => JSON.parse(r.body).data?.shotBreakdown?.length === 12,
    'response time < 2s': (r) => r.timings.duration < 2000
  })
  
  sleep(1)
}
```

### 6.2 스트레스 테스트 시나리오
```javascript
export const stressOptions = {
  stages: [
    { duration: '1m', target: 200 },  // 급격한 증가
    { duration: '3m', target: 200 },  // 높은 부하 유지
    { duration: '1m', target: 500 },  // 극한 부하
    { duration: '2m', target: 0 }     // 복구
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // 99% 요청 5초 이내
    http_req_failed: ['rate<0.2']      // 실패율 20% 미만
  }
}
```

---

## 7. 실패 우선(Fail-First) 접근법

### 7.1 실패 케이스 우선순위
1. **Critical (P0)**
   - AI API 완전 실패
   - 데이터 손실
   - 무한 루프
   - 메모리 누수

2. **High (P1)**
   - 부분 데이터 손실
   - 잘못된 계산
   - 타임아웃
   - 동시성 문제

3. **Medium (P2)**
   - UI 렌더링 오류
   - 검증 누락
   - 경고 미표시

### 7.2 실패 시나리오 테스트
```typescript
describe('실패 우선 테스트', () => {
  test('AI API 실패 시 폴백 동작', async () => {
    mockAIService.simulateFailure()
    
    const result = await generatePlan(validInput)
    
    expect(result.generatedBy).toBe('fallback')
    expect(result.quality).toBe('basic')
    expect(notificationService.wasNotified).toBe(true)
  })
  
  test('네트워크 단절 시 로컬 저장', async () => {
    await simulateOffline()
    
    const plan = await createPlan(validInput)
    await editPlan(plan.id, changes)
    
    expect(localStorage.getItem('pending_plans')).toContain(plan.id)
    
    await simulateOnline()
    await syncPendingPlans()
    
    expect(localStorage.getItem('pending_plans')).toBe(null)
  })
  
  test('동시 편집 충돌 해결', async () => {
    const plan = await createPlan(validInput)
    
    // 두 사용자가 동시에 편집
    const edit1 = editPlan(plan.id, { title: 'Edit 1' }, 'user1')
    const edit2 = editPlan(plan.id, { title: 'Edit 2' }, 'user2')
    
    const [result1, result2] = await Promise.all([edit1, edit2])
    
    expect(result1.status || result2.status).toBe('conflict')
    expect(plan.conflictResolution).toBeDefined()
  })
})
```

---

## 8. 테스트 데이터 전략

### 8.1 Fixture 구조
```typescript
// fixtures/planning-data.ts
export const testPlanningData = {
  minimal: {
    title: '최소 입력',
    oneLinerStory: '기본 스토리 라인입니다.',
    toneAndManner: ['친근한'],
    genre: '홍보영상',
    target: '20-30대',
    duration: '60초',
    format: '홍보영상',
    tempo: 'normal',
    developmentMethod: 'classic-kishōtenketsu',
    developmentIntensity: 'moderate'
  },
  
  maximal: {
    title: '최대 복잡도 테스트용 매우 긴 제목' + '테스트'.repeat(20),
    oneLinerStory: '복잡한 스토리...' + '내용'.repeat(100),
    toneAndManner: ['친근한', '전문적인', '혁신적인', '감성적인', '신뢰감'],
    // ... 모든 필드 최대값
  },
  
  edgeCases: {
    specialCharacters: {
      title: '특수문자 !@#$%^&*() 테스트',
      oneLinerStory: '이모지 😀🎬 포함 스토리'
    },
    
    unicode: {
      title: '한글 English 日本語 中文 混合',
      oneLinerStory: 'مرحبا עברית'
    },
    
    injection: {
      title: '<script>alert("XSS")</script>',
      oneLinerStory: 'SELECT * FROM users; DROP TABLE--'
    }
  }
}
```

### 8.2 생성기 함수
```typescript
export function generateRandomPlanRequest() {
  return {
    title: faker.commerce.productName(),
    oneLinerStory: faker.lorem.sentences(2),
    toneAndManner: faker.helpers.arrayElements(
      ['친근한', '전문적인', '재미있는', '감성적인'],
      faker.datatype.number({ min: 1, max: 3 })
    ),
    genre: faker.helpers.arrayElement(['홍보영상', '교육영상', '브랜딩영상']),
    target: faker.helpers.arrayElement(['20대', '30대', '20-30대']),
    duration: faker.helpers.arrayElement(['30초', '60초', '90초']),
    format: faker.helpers.arrayElement(['홍보영상', '제품소개영상']),
    tempo: faker.helpers.arrayElement(['fast', 'normal', 'slow']),
    developmentMethod: faker.helpers.arrayElement([
      'hook-immersion-twist-clue',
      'classic-kishōtenketsu',
      'pixar-story'
    ]),
    developmentIntensity: faker.helpers.arrayElement(['as-is', 'moderate', 'rich'])
  }
}
```

---

## 9. CI/CD 통합

### 9.1 GitHub Actions 워크플로우
```yaml
name: Video Planning Test Suite

on:
  push:
    paths:
      - 'src/app/video-planning/**'
      - 'src/entities/video-planning/**'
      - 'src/app/api/ai/generate-plan/**'
  pull_request:
    types: [opened, synchronize]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "Coverage $COVERAGE% is below threshold 85%"
            exit 1
          fi
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Setup test database
        run: npm run db:test:setup
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:testpass@localhost:5432/videoplanet_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  mutation-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Run mutation tests
        run: npm run test:mutation
      
      - name: Check mutation score
        run: |
          SCORE=$(cat reports/mutation/mutation.json | jq '.mutationScore')
          if (( $(echo "$SCORE < 75" | bc -l) )); then
            echo "Mutation score $SCORE% is below threshold 75%"
            exit 1
          fi

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Run performance tests
        run: |
          npm run build
          npm run start &
          sleep 10
          npm run test:performance
      
      - name: Analyze results
        run: |
          P95=$(cat k6-results.json | jq '.metrics.http_req_duration.p95')
          if (( $(echo "$P95 > 2000" | bc -l) )); then
            echo "P95 latency ${P95}ms exceeds 2000ms threshold"
            exit 1
          fi
```

---

## 10. 모니터링 및 관찰성

### 10.1 테스트 메트릭 대시보드
```typescript
interface TestMetrics {
  coverage: {
    lines: number
    branches: number
    functions: number
    statements: number
  }
  
  performance: {
    p50: number
    p95: number
    p99: number
    errorRate: number
  }
  
  quality: {
    mutationScore: number
    flakyTestRate: number
    testExecutionTime: number
    failureRate: number
  }
  
  trends: {
    coverageTrend: number[] // 최근 10개 빌드
    performanceTrend: number[]
    flakyTestTrend: number[]
  }
}
```

### 10.2 알림 규칙
- 커버리지 5% 이상 하락 시
- 변이 점수 10% 이상 하락 시
- Flaky 테스트 3개 이상 발생 시
- P95 응답시간 2초 초과 시
- 테스트 실행 시간 10분 초과 시

---

## 11. 테스트 실행 계획

### Phase 1: 기초 구축 (Week 1)
- [ ] 단위 테스트 프레임워크 설정
- [ ] 입력 검증 테스트 작성
- [ ] 기본 통합 테스트 설정

### Phase 2: 핵심 로직 (Week 2)
- [ ] 스토리 구조 생성 테스트
- [ ] 숏트 분해 로직 테스트
- [ ] AI API 통합 테스트

### Phase 3: E2E 및 성능 (Week 3)
- [ ] 5개 핵심 시나리오 E2E 테스트
- [ ] 부하 테스트 구현
- [ ] 변이 테스트 설정

### Phase 4: 최적화 (Week 4)
- [ ] Flaky 테스트 제거
- [ ] 테스트 실행 시간 최적화
- [ ] CI/CD 파이프라인 완성

---

## 12. 위험 관리

### 12.1 식별된 위험
| 위험 | 가능성 | 영향도 | 완화 전략 |
|------|--------|--------|----------|
| AI API 의존성 | 높음 | 높음 | 폴백 시뮬레이션, 캐싱 |
| 테스트 데이터 관리 | 중간 | 중간 | Fixture 자동화, Faker 활용 |
| Flaky 테스트 | 높음 | 낮음 | 재시도 로직, 격리 실행 |
| 성능 저하 | 중간 | 높음 | 지속적 모니터링, 임계값 설정 |

### 12.2 복구 계획
1. **AI 서비스 장애**: 로컬 시뮬레이션 활성화
2. **데이터베이스 장애**: 읽기 전용 모드 전환
3. **성능 저하**: 자동 스케일링, 캐시 활성화

---

## 13. 성공 지표

### 13.1 단기 목표 (1개월)
- 단위 테스트 커버리지 85% 달성
- 모든 Critical 버그 해결
- E2E 테스트 통과율 95%

### 13.2 장기 목표 (3개월)
- 변이 테스트 점수 75% 이상
- Zero Escaped Defect
- 평균 테스트 실행 시간 5분 이내

---

## 14. 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Playwright 테스팅 가이드](https://playwright.dev/docs/best-practices)
- [K6 성능 테스트](https://k6.io/docs/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [테스트 피라미드 원칙](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**문서 버전**: 1.0  
**작성자**: Grace (QA Lead)  
**승인자**: Isabelle (Product Owner)  
**다음 리뷰**: 2025-08-30

> "테스트는 버그를 찾는 것이 아니라, 품질을 구축하는 과정이다."