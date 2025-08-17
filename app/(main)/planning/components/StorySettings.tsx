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
  [key: string]: any
}

interface StorySettingsProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
}

const GENRE_OPTIONS = [
  { value: 'drama', label: '드라마', description: '감정적이고 서사적인 이야기' },
  { value: 'documentary', label: '다큐멘터리', description: '사실적이고 정보 전달적' },
  { value: 'commercial', label: '광고', description: '제품/서비스 홍보 목적' },
  { value: 'music_video', label: '뮤직비디오', description: '음악과 시각적 표현' },
  { value: 'educational', label: '교육', description: '학습과 지식 전달' },
  { value: 'corporate', label: '기업', description: '회사 소개 및 브랜딩' },
  { value: 'event', label: '이벤트', description: '행사 및 기념 영상' },
  { value: 'social', label: '소셜미디어', description: 'SNS 콘텐츠용' }
]

const AUDIENCE_OPTIONS = [
  { value: 'teens', label: '10대', description: '13-19세' },
  { value: 'twenties', label: '20대', description: '20-29세' },
  { value: 'thirties', label: '30대', description: '30-39세' },
  { value: 'forties', label: '40대', description: '40-49세' },
  { value: 'fifties_plus', label: '50대 이상', description: '50세 이상' },
  { value: 'general', label: '전체', description: '전 연령층' },
  { value: 'business', label: 'B2B', description: '기업 대상' },
  { value: 'professionals', label: '전문직', description: '특정 직업군' }
]

const TONE_OPTIONS = [
  { value: 'bright', label: '밝은', emoji: '[밝음]' },
  { value: 'serious', label: '진지한', emoji: '[진지]' },
  { value: 'funny', label: '코믹한', emoji: '[웃음]' },
  { value: 'emotional', label: '감동적인', emoji: '[감동]' },
  { value: 'energetic', label: '역동적인', emoji: '[에너지]' },
  { value: 'calm', label: '차분한', emoji: '[평온]' },
  { value: 'mysterious', label: '미스터리', emoji: '[비밀]' },
  { value: 'trendy', label: '트렌디한', emoji: '[트렌드]' }
]

const DURATION_OPTIONS = [
  { value: '30sec', label: '30초', description: '짧은 광고, SNS' },
  { value: '1min', label: '1분', description: '인스타그램, 틱톡' },
  { value: '3min', label: '3분', description: '유튜브 쇼츠' },
  { value: '5min', label: '5분', description: '일반 콘텐츠' },
  { value: '10min', label: '10분', description: '교육, 설명 영상' },
  { value: '30min', label: '30분', description: '다큐멘터리, 드라마' },
  { value: 'custom', label: '직접 입력', description: '맞춤 설정' }
]

const BUDGET_OPTIONS = [
  { value: 'low', label: '저예산', description: '100만원 이하', icon: '[돈]' },
  { value: 'medium', label: '중간예산', description: '100-500만원', icon: '[돈돈]' },
  { value: 'high', label: '고예산', description: '500만원 이상', icon: '[돈돈돈]' },
  { value: 'unlimited', label: '예산 무제한', description: '최고 품질', icon: '[버석]' }
]

const PURPOSE_OPTIONS = [
  { value: 'branding', label: '브랜딩', description: '브랜드 인지도 향상' },
  { value: 'education', label: '교육', description: '지식 및 정보 전달' },
  { value: 'entertainment', label: '엔터테인먼트', description: '재미와 즐거움' },
  { value: 'information', label: '정보전달', description: '소식 및 공지사항' },
  { value: 'promotion', label: '홍보', description: '제품/서비스 판매' },
  { value: 'recruitment', label: '채용', description: '인재 모집' },
  { value: 'portfolio', label: '포트폴리오', description: '작품 소개' },
  { value: 'documentation', label: '기록', description: '행사 및 과정 기록' }
]

function StorySettings({ 
  project, 
  onComplete, 
  onValidationChange 
}: StorySettingsProps) {
  const [formData, setFormData] = useState<PlanningProject>(project)
  const [customDuration, setCustomDuration] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData(project)
  }, [project])

  // 폼 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title?.trim()) newErrors.title = '프로젝트 제목을 입력해주세요'
    if (!formData.genre) newErrors.genre = '장르를 선택해주세요'
    if (!formData.target_audience) newErrors.target_audience = '타겟 오디언스를 선택해주세요'
    if (!formData.tone_manner) newErrors.tone_manner = '톤앤매너를 선택해주세요'
    if (!formData.duration) newErrors.duration = '영상 길이를 선택해주세요'
    if (formData.duration === 'custom' && !customDuration.trim()) {
      newErrors.duration = '사용자 정의 길이를 입력해주세요'
    }
    if (!formData.budget) newErrors.budget = '예산 규모를 선택해주세요'
    if (!formData.purpose) newErrors.purpose = '제작 목적을 선택해주세요'

    setErrors(newErrors)
    onValidationChange(Object.keys(newErrors).length === 0)
  }, [formData, customDuration, onValidationChange])

  const handleInputChange = (field: keyof PlanningProject, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (Object.keys(errors).length === 0) {
      const submitData = { ...formData }
      if (formData.duration === 'custom') {
        submitData.duration = customDuration
      }
      onComplete(submitData)
    }
  }

  return (
    <div className="story-settings">
      <div className="settings-header">
        <h3 className="section-title">
          <span className="title-icon">[설정]</span>
          기본 설정
        </h3>
        <p className="section-description">
          영상의 기본 정보를 설정해주세요. 이 정보를 바탕으로 AI가 맞춤형 스토리를 생성합니다.
        </p>
      </div>

      <div className="settings-form">
        {/* 프로젝트 제목 */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            프로젝트 제목 <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="예: 신제품 런칭 홍보 영상"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* 장르 선택 */}
        <div className="form-group">
          <label className="form-label">
            장르 <span className="required">*</span>
          </label>
          <div className="option-grid">
            {GENRE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`option-card ${formData.genre === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('genre', option.value)}
              >
                <div className="option-title">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </div>
            ))}
          </div>
          {errors.genre && <span className="error-message">{errors.genre}</span>}
        </div>

        {/* 타겟 오디언스 */}
        <div className="form-group">
          <label className="form-label">
            타겟 오디언스 <span className="required">*</span>
          </label>
          <div className="option-grid">
            {AUDIENCE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`option-card ${formData.target_audience === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('target_audience', option.value)}
              >
                <div className="option-title">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </div>
            ))}
          </div>
          {errors.target_audience && <span className="error-message">{errors.target_audience}</span>}
        </div>

        {/* 톤앤매너 */}
        <div className="form-group">
          <label className="form-label">
            톤앤매너 <span className="required">*</span>
          </label>
          <div className="tone-grid">
            {TONE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`tone-card ${formData.tone_manner === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('tone_manner', option.value)}
              >
                <span className="tone-emoji">{option.emoji}</span>
                <span className="tone-label">{option.label}</span>
              </div>
            ))}
          </div>
          {errors.tone_manner && <span className="error-message">{errors.tone_manner}</span>}
        </div>

        {/* 영상 길이 */}
        <div className="form-group">
          <label className="form-label">
            영상 길이 <span className="required">*</span>
          </label>
          <div className="option-grid">
            {DURATION_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`option-card ${formData.duration === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('duration', option.value)}
              >
                <div className="option-title">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </div>
            ))}
          </div>
          
          {formData.duration === 'custom' && (
            <input
              type="text"
              className="form-input"
              placeholder="예: 7분 30초"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            />
          )}
          {errors.duration && <span className="error-message">{errors.duration}</span>}
        </div>

        {/* 예산 규모 */}
        <div className="form-group">
          <label className="form-label">
            예산 규모 <span className="required">*</span>
          </label>
          <div className="budget-grid">
            {BUDGET_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`budget-card ${formData.budget === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('budget', option.value)}
              >
                <span className="budget-icon">{option.icon}</span>
                <div className="budget-info">
                  <div className="budget-title">{option.label}</div>
                  <div className="budget-description">{option.description}</div>
                </div>
              </div>
            ))}
          </div>
          {errors.budget && <span className="error-message">{errors.budget}</span>}
        </div>

        {/* 제작 목적 */}
        <div className="form-group">
          <label className="form-label">
            제작 목적 <span className="required">*</span>
          </label>
          <div className="option-grid">
            {PURPOSE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`option-card ${formData.purpose === option.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('purpose', option.value)}
              >
                <div className="option-title">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </div>
            ))}
          </div>
          {errors.purpose && <span className="error-message">{errors.purpose}</span>}
        </div>

        {/* 완료 버튼 */}
        <div className="form-actions">
          <button
            className="complete-btn"
            onClick={handleSubmit}
            disabled={Object.keys(errors).length > 0}
          >
            <span>[완료]</span>
            설정 완료 및 다음 단계
          </button>
        </div>
      </div>
    </div>
  )
}

export default StorySettings