'use client'

import { useState, useEffect } from 'react'

interface PlanningProject {
  id?: string
  title: string
  genre: string
  target_audience: string
  tone_manner: string
  duration: string
  budget: string
  purpose: string
  story_structure: string
  development_level: string
  story_content?: string
  [key: string]: any
}

interface StoryDevelopmentProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

const STORY_STRUCTURES = [
  {
    value: 'deductive',
    label: '연역식',
    description: '일반적인 내용에서 구체적인 내용으로',
    example: '문제 제시 → 해결 방법 → 구체적 사례',
    icon: '[차트]'
  },
  {
    value: 'inductive',
    label: '귀납식', 
    description: '구체적인 사례에서 일반적인 결론으로',
    example: '구체적 사례 → 공통점 발견 → 일반적 결론',
    icon: '[검색]'
  },
  {
    value: 'conflict_resolution',
    label: '문피아식',
    description: '갈등 발생에서 해결까지',
    example: '평화 → 갈등 발생 → 위기 심화 → 해결',
    icon: '[갈등]'
  },
  {
    value: 'hero_journey',
    label: '히어로 저니',
    description: '영웅의 여정 구조',
    example: '일상 → 모험 시작 → 시련 → 성장 → 귀환',
    icon: '[영웅]'
  }
]

const DEVELOPMENT_LEVELS = [
  {
    value: 'simple',
    label: '간단히',
    description: '핵심만 간략하게',
    detail: '주요 메시지와 핵심 내용만 포함',
    icon: '[빠름]'
  },
  {
    value: 'normal',
    label: '보통',
    description: '적절한 디테일',
    detail: '배경 설명과 세부 내용을 적당히 포함',
    icon: '[균형]'
  },
  {
    value: 'detailed',
    label: '풍부하게',
    description: '상세한 묘사',
    detail: '캐릭터, 배경, 감정 등을 상세히 묘사',
    icon: '[예술]'
  }
]

function StoryDevelopment({
  project,
  onComplete,
  onValidationChange,
  onLoadingChange
}: StoryDevelopmentProps) {
  const [storyStructure, setStoryStructure] = useState(project.story_structure || '')
  const [developmentLevel, setDevelopmentLevel] = useState(project.development_level || '')
  const [storyContent, setStoryContent] = useState(project.story_content || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(!!project.story_content)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 폼 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {}
    
    if (!storyStructure) newErrors.structure = '스토리 전개 방식을 선택해주세요'
    if (!developmentLevel) newErrors.level = '디벨롭 수준을 선택해주세요'
    if (!storyContent.trim()) newErrors.content = 'AI 스토리를 생성해주세요'

    setErrors(newErrors)
    onValidationChange(Object.keys(newErrors).length === 0)
  }, [storyStructure, developmentLevel, storyContent, onValidationChange])

  const generateStory = async () => {
    if (!storyStructure || !developmentLevel) {
      alert('스토리 전개 방식과 디벨롭 수준을 먼저 선택해주세요.')
      return
    }

    setIsGenerating(true)
    onLoadingChange(true)

    try {
      // AI 스토리 생성 시뮬레이션 (실제로는 API 호출)
      await new Promise(resolve => setTimeout(resolve, 3000))

      const generatedStory = generateStoryContent(project, storyStructure, developmentLevel)
      setStoryContent(generatedStory)
      setHasGenerated(true)
    } catch (error) {
      console.error('스토리 생성 실패:', error)
      alert('스토리 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
      onLoadingChange(false)
    }
  }

  const generateStoryContent = (project: PlanningProject, structure: string, level: string) => {
    // 실제로는 AI API를 호출하지만, 여기서는 템플릿 기반 생성
    const basePrompt = `장르: ${getGenreLabel(project.genre)}
타겟: ${getAudienceLabel(project.target_audience)}
톤앤매너: ${getToneLabel(project.tone_manner)}
길이: ${project.duration}
목적: ${getPurposeLabel(project.purpose)}`

    let storyTemplate = ''

    switch (structure) {
      case 'deductive':
        storyTemplate = generateDeductiveStory(project, level)
        break
      case 'inductive':
        storyTemplate = generateInductiveStory(project, level)
        break
      case 'conflict_resolution':
        storyTemplate = generateConflictStory(project, level)
        break
      case 'hero_journey':
        storyTemplate = generateHeroStory(project, level)
        break
      default:
        storyTemplate = generateDefaultStory(project, level)
    }

    return `${basePrompt}\n\n${storyTemplate}`
  }

  // 각 구조별 스토리 생성 함수들
  const generateDeductiveStory = (project: PlanningProject, level: string) => {
    const complexity = level === 'simple' ? '간단한' : level === 'normal' ? '적절한' : '상세한'
    
    return `【연역식 스토리 구조】

1. 문제/상황 제시 (0-10%)
   ${getToneBasedOpening(project.tone_manner)}

2. 해결 방법 소개 (10-60%)
   ${getSolutionContent(project, complexity)}

3. 구체적 사례/증명 (60-85%)
   ${getEvidenceContent(project, complexity)}

4. 결론 및 행동 유도 (85-100%)
   ${getCallToAction(project.purpose, project.tone_manner)}`
  }

  const generateInductiveStory = (project: PlanningProject, level: string) => {
    return `【귀납식 스토리 구조】

1. 구체적 사례 제시 (0-25%)
   실제 사용자들의 경험과 사례를 통해 시작

2. 공통점 발견 (25-50%)
   여러 사례에서 발견되는 패턴과 공통점

3. 패턴 분석 (50-75%)
   데이터와 분석을 통한 인사이트 도출

4. 일반적 결론 (75-100%)
   모든 사례가 증명하는 최종 메시지`
  }

  const generateConflictStory = (project: PlanningProject, level: string) => {
    return `【갈등-해결 스토리 구조】

1. 평화로운 일상 (0-15%)
   ${getNormalSituation(project)}

2. 갈등/문제 발생 (15-35%)
   ${getConflictSituation(project)}

3. 위기 심화 (35-65%)
   ${getCrisisSituation(project)}

4. 해결/극복 (65-100%)
   ${getResolutionSituation(project)}`
  }

  const generateHeroStory = (project: PlanningProject, level: string) => {
    return `【영웅의 여정 스토리 구조】

1. 일상의 세계 (0-15%)
   주인공의 평범한 일상과 현재 상황

2. 모험으로의 부름 (15-25%)
   변화가 필요한 순간, 새로운 기회의 발견

3. 시련과 도전 (25-70%)
   목표 달성 과정에서 겪는 어려움과 성장

4. 보상과 귀환 (70-100%)
   성공적인 변화와 새로운 일상의 시작`
  }

  const generateDefaultStory = (project: PlanningProject, level: string) => {
    return `【기본 스토리 구조】

1. 도입 (0-20%)
   상황 설정과 주제 소개

2. 전개 (20-70%)
   핵심 내용과 메시지 전달

3. 결말 (70-100%)
   마무리와 행동 유도`
  }

  // 헬퍼 함수들
  const getGenreLabel = (genre: string) => {
    const labels: Record<string, string> = {
      'drama': '드라마',
      'documentary': '다큐멘터리',
      'commercial': '광고',
      'music_video': '뮤직비디오',
      'educational': '교육',
      'corporate': '기업',
      'event': '이벤트',
      'social': '소셜미디어'
    }
    return labels[genre] || genre
  }

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      'teens': '10대',
      'twenties': '20대',
      'thirties': '30대',
      'forties': '40대',
      'fifties_plus': '50대 이상',
      'general': '전체',
      'business': 'B2B',
      'professionals': '전문직'
    }
    return labels[audience] || audience
  }

  const getToneLabel = (tone: string) => {
    const labels: Record<string, string> = {
      'bright': '밝은',
      'serious': '진지한',
      'funny': '코믹한',
      'emotional': '감동적인',
      'energetic': '역동적인',
      'calm': '차분한',
      'mysterious': '미스터리',
      'trendy': '트렌디한'
    }
    return labels[tone] || tone
  }

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'branding': '브랜딩',
      'education': '교육',
      'entertainment': '엔터테인먼트',
      'information': '정보전달',
      'promotion': '홍보',
      'recruitment': '채용',
      'portfolio': '포트폴리오',
      'documentation': '기록'
    }
    return labels[purpose] || purpose
  }

  const getToneBasedOpening = (tone: string) => {
    const openings: Record<string, string> = {
      'bright': '밝고 긍정적인 분위기로 문제 상황을 부드럽게 제시',
      'serious': '진중하고 신뢰할 수 있는 톤으로 현실적 문제 제기',
      'funny': '유머러스하고 재미있는 방식으로 일상적 문제 소개',
      'emotional': '감정적 공감대를 형성하며 진심 어린 문제 제시',
      'energetic': '역동적이고 활기찬 에너지로 도전적 상황 제시',
      'calm': '차분하고 안정적인 분위기로 현상 관찰 및 제시'
    }
    return openings[tone] || '상황에 맞는 적절한 톤으로 문제 제시'
  }

  const getSolutionContent = (project: PlanningProject, complexity: string) => {
    if (complexity === '간단한') {
      return '핵심 해결책을 명확하고 간결하게 제시'
    } else if (complexity === '적절한') {
      return '해결책의 원리와 방법을 구체적으로 설명하며 신뢰성 구축'
    } else {
      return '해결책의 배경, 원리, 방법론을 상세히 설명하고 다양한 관점에서 접근'
    }
  }

  const getEvidenceContent = (project: PlanningProject, complexity: string) => {
    if (complexity === '간단한') {
      return '대표적인 성공 사례 1-2개 간략 소개'
    } else if (complexity === '적절한') {
      return '다양한 성공 사례와 데이터를 통한 효과 입증'
    } else {
      return '구체적 사례, 통계 데이터, 전문가 의견, 사용자 후기 등 다각도 검증'
    }
  }

  const getCallToAction = (purpose: string, tone: string) => {
    const actions: Record<string, string> = {
      'branding': '브랜드와 함께하는 새로운 경험 시작',
      'education': '지금 바로 학습을 시작하고 성장하세요',
      'entertainment': '더 많은 재미있는 콘텐츠를 만나보세요',
      'information': '더 자세한 정보를 확인해보세요',
      'promotion': '지금 바로 경험하고 혜택을 받아보세요',
      'recruitment': '우리와 함께 성장할 기회를 잡으세요'
    }
    return actions[purpose] || '지금 바로 행동을 시작하세요'
  }

  const getNormalSituation = (project: PlanningProject) => {
    return `${project.target_audience}가 일상에서 경험하는 평범한 상황`
  }

  const getConflictSituation = (project: PlanningProject) => {
    return `예상치 못한 문제나 도전 상황의 등장`
  }

  const getCrisisSituation = (project: PlanningProject) => {
    return `문제가 심화되어 해결이 더욱 시급해지는 상황`
  }

  const getResolutionSituation = (project: PlanningProject) => {
    return `창의적이고 효과적인 해결책을 통한 문제 해결`
  }

  const handleComplete = () => {
    if (Object.keys(errors).length === 0) {
      onComplete({
        story_structure: storyStructure,
        development_level: developmentLevel,
        story_content: storyContent
      })
    }
  }

  return (
    <div className="story-development">
      <div className="development-header">
        <h3 className="section-title">
          <span className="title-icon">[스토리]</span>
          스토리 개발
        </h3>
        <p className="section-description">
          AI가 선택하신 설정을 바탕으로 4단계 스토리를 개발합니다.
        </p>
      </div>

      <div className="development-form">
        {/* 스토리 전개 방식 */}
        <div className="form-group">
          <label className="form-label">
            스토리 전개 방식 <span className="required">*</span>
          </label>
          <div className="structure-grid">
            {STORY_STRUCTURES.map((structure) => (
              <div
                key={structure.value}
                className={`structure-card ${storyStructure === structure.value ? 'selected' : ''}`}
                onClick={() => setStoryStructure(structure.value)}
              >
                <div className="structure-header">
                  <span className="structure-icon">{structure.icon}</span>
                  <h4 className="structure-title">{structure.label}</h4>
                </div>
                <p className="structure-description">{structure.description}</p>
                <div className="structure-example">
                  <strong>예시:</strong> {structure.example}
                </div>
              </div>
            ))}
          </div>
          {errors.structure && <span className="error-message">{errors.structure}</span>}
        </div>

        {/* 디벨롭 수준 */}
        <div className="form-group">
          <label className="form-label">
            디벨롭 수준 <span className="required">*</span>
          </label>
          <div className="level-grid">
            {DEVELOPMENT_LEVELS.map((level) => (
              <div
                key={level.value}
                className={`level-card ${developmentLevel === level.value ? 'selected' : ''}`}
                onClick={() => setDevelopmentLevel(level.value)}
              >
                <span className="level-icon">{level.icon}</span>
                <div className="level-info">
                  <h4 className="level-title">{level.label}</h4>
                  <p className="level-description">{level.description}</p>
                  <div className="level-detail">{level.detail}</div>
                </div>
              </div>
            ))}
          </div>
          {errors.level && <span className="error-message">{errors.level}</span>}
        </div>

        {/* AI 스토리 생성 */}
        <div className="form-group">
          <label className="form-label">
            AI 스토리 생성 <span className="required">*</span>
          </label>
          
          <div className="generation-section">
            <button
              className="generate-btn"
              onClick={generateStory}
              disabled={!storyStructure || !developmentLevel || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner">[로딩]</span>
                  AI가 스토리를 생성 중...
                </>
              ) : (
                <>
                  <span>[AI]</span>
                  {hasGenerated ? 'AI 스토리 재생성' : 'AI 스토리 생성'}
                </>
              )}
            </button>

            {storyContent && (
              <div className="story-content">
                <div className="content-header">
                  <h4>생성된 스토리</h4>
                  <span className="content-status">[완료] 생성 완료</span>
                </div>
                <textarea
                  className="story-textarea"
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  rows={15}
                  placeholder="AI가 생성한 스토리가 여기에 표시됩니다..."
                />
                <div className="content-actions">
                  <button 
                    className="regenerate-btn"
                    onClick={generateStory}
                    disabled={isGenerating}
                  >
                    [새로고침] 다시 생성
                  </button>
                </div>
              </div>
            )}
          </div>
          {errors.content && <span className="error-message">{errors.content}</span>}
        </div>

        {/* 완료 버튼 */}
        <div className="form-actions">
          <button
            className="complete-btn"
            onClick={handleComplete}
            disabled={Object.keys(errors).length > 0}
          >
            <span>[완료]</span>
            스토리 완료 및 다음 단계
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoryDevelopment