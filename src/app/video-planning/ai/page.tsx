'use client'

import { useState } from 'react'
import styles from './AIPlanningPage.module.scss'

interface AIGeneratePlanRequest {
  title: string
  oneLinerStory: string
  toneAndManner: string[]
  genre: string
  target: string
  duration: string
  format: string
  tempo: 'fast' | 'normal' | 'slow'
  developmentMethod: 'hook-immersion-twist-clue' | 'classic-kishōtenketsu' | 'induction' | 'deduction' | 'documentary' | 'pixar-story'
  developmentIntensity: 'as-is' | 'moderate' | 'rich'
}

interface StoryStage {
  title: string
  description: string
  duration: number
  keyPoints: string[]
}

interface ShotBreakdown {
  shotNumber: number
  storyStage: 'introduction' | 'rising' | 'climax' | 'conclusion'
  shotType: string
  cameraMovement: string
  composition: string
  duration: number
  description: string
  dialogue: string
  storyboardImage?: string
}

interface AIGeneratedPlan {
  id: string
  title: string
  genre: string
  duration: number
  budget: string
  targetAudience: string
  concept: string
  purpose: string
  tone: string
  storyStages: {
    introduction: StoryStage
    rising: StoryStage
    climax: StoryStage
    conclusion: StoryStage
  }
  shotBreakdown: ShotBreakdown[]
  generatedAt: string
  status: 'generating' | 'completed' | 'error'
}

export default function AIPlanningPage() {
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'result'>('input')
  const [formData, setFormData] = useState<AIGeneratePlanRequest>({
    title: '',
    oneLinerStory: '',
    toneAndManner: ['친근한'],
    genre: '홍보영상',
    target: '20-30대',
    duration: '60초',
    format: '홍보영상',
    tempo: 'normal',
    developmentMethod: 'classic-kishōtenketsu',
    developmentIntensity: 'moderate'
  })
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleToneAndMannerChange = (tone: string) => {
    setFormData(prev => ({
      ...prev,
      toneAndManner: prev.toneAndManner.includes(tone)
        ? prev.toneAndManner.filter(t => t !== tone)
        : [...prev.toneAndManner, tone]
    }))
  }

  const handleTempoChange = (tempo: 'fast' | 'normal' | 'slow') => {
    setFormData(prev => ({
      ...prev,
      tempo
    }))
  }

  const handleDevelopmentMethodChange = (method: string) => {
    setFormData(prev => ({
      ...prev,
      developmentMethod: method as any
    }))
  }

  const handleDevelopmentIntensityChange = (intensity: 'as-is' | 'moderate' | 'rich') => {
    setFormData(prev => ({
      ...prev,
      developmentIntensity: intensity
    }))
  }

  const simulateGeneration = async () => {
    setIsGenerating(true)
    setCurrentStep('generating')
    setGenerationProgress(0)

    // 시뮬레이션: 단계별 진행
    const steps = [
      { message: '스토리 구조 분석 중...', progress: 25 },
      { message: '4단계 스토리 생성 중...', progress: 50 },
      { message: '12개 숏트 분해 중...', progress: 75 },
      { message: '최종 검토 및 완성 중...', progress: 100 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGenerationProgress(step.progress)
    }

    // AI API 호출
    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedPlan(result.data)
        setCurrentStep('result')
      } else {
        alert('AI 기획서 생성에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('API 호출 오류:', error)
      alert('AI 기획서 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.title || !formData.oneLinerStory) {
      alert('제목과 한 줄 스토리는 필수 입력 항목입니다.')
      return
    }

    simulateGeneration()
  }

  const renderInputForm = () => (
    <div className={styles.inputForm}>
      <h2>AI 영상 기획 생성</h2>
      <p className={styles.subtitle}>
        한 줄 스토리와 기본 메타 정보만 입력하면, AI가 전문적인 영상 기획서를 자동으로 생성합니다.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 기본 정보 */}
        <div className={styles.sectionGroup}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="title">
              영상 제목 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="예: 브이래닛 브랜드 홍보영상"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="oneLinerStory">
              한 줄 스토리 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="oneLinerStory"
              name="oneLinerStory"
              value={formData.oneLinerStory}
              onChange={handleInputChange}
              placeholder="영상의 핵심 내용을 한 줄로 설명해주세요. 예: 영상 제작 협업이 복잡하고 비효율적인 문제를 브이래닛이 어떻게 혁신적으로 해결하는지 보여준다"
              className={styles.textarea}
              rows={3}
              required
            />
          </div>
        </div>

        {/* 메타 정보 */}
        <div className={styles.sectionGroup}>
          <h3 className={styles.sectionTitle}>메타 정보</h3>
          
          <div className={styles.formGroup}>
            <label>톤앤매너 (중복 선택 가능)</label>
            <div className={styles.checkboxGroup}>
              {[
                '친근한', '전문적인', '재미있는', '감성적인', '역동적인', '신뢰감 있는',
                '세련된', '따뜻한', '진중한', '유머러스', '혁신적인', '클래식한',
                '모던한', '자연스러운', '강렬한', '부드러운'
              ].map(tone => (
                <label key={tone} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.toneAndManner.includes(tone)}
                    onChange={() => handleToneAndMannerChange(tone)}
                    className={styles.checkbox}
                  />
                  {tone}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="genre">장르</label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="홍보영상">홍보영상</option>
                <option value="교육영상">교육영상</option>
                <option value="브랜딩영상">브랜딩영상</option>
                <option value="제품소개">제품소개</option>
                <option value="이벤트영상">이벤트영상</option>
                <option value="인터뷰">인터뷰</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="target">타겟</label>
              <select
                id="target"
                name="target"
                value={formData.target}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="10대">10대</option>
                <option value="20대">20대</option>
                <option value="30대">30대</option>
                <option value="40대">40대</option>
                <option value="50대">50대</option>
                <option value="60대 이상">60대 이상</option>
                <option value="20-30대">20-30대</option>
                <option value="30-40대">30-40대</option>
                <option value="40-50대">40-50대</option>
                <option value="직장인">직장인</option>
                <option value="학생">학생</option>
                <option value="주부">주부</option>
                <option value="창업가/CEO">창업가/CEO</option>
                <option value="디자이너">디자이너</option>
                <option value="개발자">개발자</option>
                <option value="마케터">마케터</option>
                <option value="일반 소비자">일반 소비자</option>
                <option value="B2B 고객">B2B 고객</option>
                <option value="전 연령">전 연령</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="duration">분량</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="15초">15초</option>
                <option value="30초">30초</option>
                <option value="45초">45초</option>
                <option value="60초">60초</option>
                <option value="90초">90초</option>
                <option value="2분">2분</option>
                <option value="3분">3분</option>
                <option value="4분">4분</option>
                <option value="5분">5분</option>
                <option value="7분">7분</option>
                <option value="10분">10분</option>
                <option value="15분">15분</option>
                <option value="20분">20분</option>
                <option value="25분">25분</option>
                <option value="30분">30분</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="format">포맷</label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="홍보영상">홍보영상</option>
                <option value="제품소개영상">제품소개영상</option>
                <option value="브랜드필름">브랜드필름</option>
                <option value="튜토리얼">튜토리얼</option>
                <option value="인터뷰">인터뷰</option>
                <option value="다큐멘터리">다큐멘터리</option>
                <option value="애니메이션">애니메이션</option>
                <option value="라이브액션">라이브액션</option>
                <option value="스크린캐스트">스크린캐스트</option>
                <option value="타임랩스">타임랩스</option>
                <option value="스톱모션">스톱모션</option>
                <option value="슬라이드쇼">슬라이드쇼</option>
                <option value="웹진형">웹진형</option>
                <option value="스토리텔링">스토리텔링</option>
                <option value="사례연구">사례연구</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>템포</label>
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={`${styles.optionButton} ${formData.tempo === 'fast' ? styles.selected : ''}`}
                  onClick={() => handleTempoChange('fast')}
                >
                  <div className={styles.optionTitle}>빠르게</div>
                  <div className={styles.optionDesc}>빠른 편집, 역동적인 전개</div>
                </button>
                <button
                  type="button"
                  className={`${styles.optionButton} ${formData.tempo === 'normal' ? styles.selected : ''}`}
                  onClick={() => handleTempoChange('normal')}
                >
                  <div className={styles.optionTitle}>보통</div>
                  <div className={styles.optionDesc}>균형잡힌 페이스</div>
                </button>
                <button
                  type="button"
                  className={`${styles.optionButton} ${formData.tempo === 'slow' ? styles.selected : ''}`}
                  onClick={() => handleTempoChange('slow')}
                >
                  <div className={styles.optionTitle}>느리게</div>
                  <div className={styles.optionDesc}>여유롭고 감성적인 전개</div>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>전개 방식</label>
            <div className={styles.methodGrid}>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'hook-immersion-twist-clue' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('hook-immersion-twist-clue')}
              >
                <div className={styles.methodTitle}>훅-몰입-반전-떡밥</div>
                <div className={styles.methodDesc}>강력한 시작으로 관심을 끌고, 몰입시킨 후 예상치 못한 반전과 다음을 궁금하게 만드는 떡밥 제시</div>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'classic-kishōtenketsu' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('classic-kishōtenketsu')}
              >
                <div className={styles.methodTitle}>클래식 기승전결</div>
                <div className={styles.methodDesc}>전통적인 4단계 구조로 안정감 있고 예측 가능한 스토리텔링. 기본-발전-절정-결말의 완성된 구조</div>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'induction' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('induction')}
              >
                <div className={styles.methodTitle}>귀납법</div>
                <div className={styles.methodDesc}>구체적인 사례들을 제시한 후 일반적인 결론으로 이끌어가는 논리적 전개. 설득력 있는 결론 도출</div>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'deduction' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('deduction')}
              >
                <div className={styles.methodTitle}>연역법</div>
                <div className={styles.methodDesc}>일반적인 원리나 가정에서 시작하여 구체적인 결론으로 논리를 전개. 명확하고 체계적인 설명</div>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'documentary' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('documentary')}
              >
                <div className={styles.methodTitle}>다큐(인터뷰식)</div>
                <div className={styles.methodDesc}>실제 인물의 증언과 현실적인 상황 제시로 신뢰성과 몰입감을 극대화하는 다큐멘터리 방식</div>
              </button>
              <button
                type="button"
                className={`${styles.methodButton} ${formData.developmentMethod === 'pixar-story' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentMethodChange('pixar-story')}
              >
                <div className={styles.methodTitle}>픽사스토리</div>
                <div className={styles.methodDesc}>"옛날에-매일-그런데 어느 날-그래서-마침내-그후로" 구조로 감정적 몰입과 변화를 강조</div>
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>전개 강도</label>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.optionButton} ${formData.developmentIntensity === 'as-is' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentIntensityChange('as-is')}
              >
                <div className={styles.optionTitle}>그대로</div>
                <div className={styles.optionDesc}>간결하고 핵심적인 전달</div>
              </button>
              <button
                type="button"
                className={`${styles.optionButton} ${formData.developmentIntensity === 'moderate' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentIntensityChange('moderate')}
              >
                <div className={styles.optionTitle}>적당히</div>
                <div className={styles.optionDesc}>균형잡힌 묘사와 설명</div>
              </button>
              <button
                type="button"
                className={`${styles.optionButton} ${formData.developmentIntensity === 'rich' ? styles.selected : ''}`}
                onClick={() => handleDevelopmentIntensityChange('rich')}
              >
                <div className={styles.optionTitle}>풍부하게</div>
                <div className={styles.optionDesc}>감정적 묘사와 상세한 환경 설명</div>
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={styles.generateButton}
          disabled={isGenerating}
        >
          {isGenerating ? 'AI 기획서 생성 중...' : 'AI 기획서 생성하기'}
        </button>
      </form>
    </div>
  )

  const renderGenerating = () => (
    <div className={styles.generating}>
      <h2>AI가 영상 기획서를 생성하고 있습니다</h2>
      <div className={styles.progressContainer}>
        <div 
          className={styles.progressBar}
          style={{ width: `${generationProgress}%` }}
        />
      </div>
      <p className={styles.progressText}>{generationProgress}% 완료</p>
      
      <div className={styles.generationSteps}>
        <div className={`${styles.step} ${generationProgress >= 25 ? styles.completed : ''}`}>
          <span className={styles.stepNumber}>1</span>
          <span>스토리 구조 분석</span>
        </div>
        <div className={`${styles.step} ${generationProgress >= 50 ? styles.completed : ''}`}>
          <span className={styles.stepNumber}>2</span>
          <span>4단계 스토리 생성</span>
        </div>
        <div className={`${styles.step} ${generationProgress >= 75 ? styles.completed : ''}`}>
          <span className={styles.stepNumber}>3</span>
          <span>12개 숏트 분해</span>
        </div>
        <div className={`${styles.step} ${generationProgress >= 100 ? styles.completed : ''}`}>
          <span className={styles.stepNumber}>4</span>
          <span>최종 검토 및 완성</span>
        </div>
      </div>
    </div>
  )

  const renderResult = () => {
    if (!generatedPlan) return null

    return (
      <div className={styles.result}>
        <div className={styles.resultHeader}>
          <h2>AI 영상 기획서 생성 완료!</h2>
          <p>"{generatedPlan.title}" 기획서가 성공적으로 생성되었습니다.</p>
          
          <div className={styles.actions}>
            <button 
              className={styles.editButton}
              onClick={() => alert('편집 기능은 개발 중입니다.')}
            >
              기획서 편집
            </button>
            <button 
              className={styles.downloadButton}
              onClick={() => alert('PDF 다운로드 기능은 개발 중입니다.')}
            >
              PDF 다운로드
            </button>
            <button 
              className={styles.newButton}
              onClick={() => {
                setCurrentStep('input')
                setGeneratedPlan(null)
                setGenerationProgress(0)
              }}
            >
              새 기획서 만들기
            </button>
          </div>
        </div>

        <div className={styles.planContent}>
          <div className={styles.planOverview}>
            <h3>기획서 개요</h3>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewItem}>
                <strong>제목:</strong> {generatedPlan.title}
              </div>
              <div className={styles.overviewItem}>
                <strong>장르:</strong> {generatedPlan.genre}
              </div>
              <div className={styles.overviewItem}>
                <strong>길이:</strong> {generatedPlan.duration}초
              </div>
              <div className={styles.overviewItem}>
                <strong>예산:</strong> {generatedPlan.budget}
              </div>
              <div className={styles.overviewItem}>
                <strong>타겟:</strong> {generatedPlan.targetAudience}
              </div>
              <div className={styles.overviewItem}>
                <strong>톤앤매너:</strong> {generatedPlan.tone}
              </div>
            </div>
          </div>

          <div className={styles.storyStages}>
            <h3>4단계 스토리 구조</h3>
            {Object.entries(generatedPlan.storyStages).map(([key, stage]) => (
              <div key={key} className={styles.storyStage}>
                <div className={styles.stageHeader}>
                  <h4>{stage.title}</h4>
                  <span className={styles.duration}>{stage.duration}초</span>
                </div>
                <p className={styles.stageDescription}>{stage.description}</p>
                <div className={styles.keyPoints}>
                  <strong>핵심 포인트:</strong>
                  <ul>
                    {stage.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.shotBreakdown}>
            <h3>12개 숏트 분해</h3>
            <div className={styles.shotGrid}>
              {generatedPlan.shotBreakdown.map((shot) => (
                <div key={shot.shotNumber} className={styles.shotCard}>
                  <div className={styles.shotHeader}>
                    <span className={styles.shotNumber}>Shot {shot.shotNumber}</span>
                    <span className={styles.shotStage}>{shot.storyStage}</span>
                  </div>
                  <div className={styles.shotSpecs}>
                    <div><strong>샷 타입:</strong> {shot.shotType}</div>
                    <div><strong>카메라 움직임:</strong> {shot.cameraMovement}</div>
                    <div><strong>구도:</strong> {shot.composition}</div>
                    <div><strong>길이:</strong> {shot.duration}초</div>
                  </div>
                  <div className={styles.shotDescription}>
                    <strong>장면 설명:</strong> {shot.description}
                  </div>
                  <div className={styles.shotDialogue}>
                    <strong>대사/자막:</strong> {shot.dialogue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.aiPlanningPage}>
      <div className={styles.container}>
        {currentStep === 'input' && renderInputForm()}
        {currentStep === 'generating' && renderGenerating()}
        {currentStep === 'result' && renderResult()}
      </div>
    </div>
  )
}