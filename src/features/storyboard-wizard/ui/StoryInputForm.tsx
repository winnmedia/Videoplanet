/**
 * 1단계: 스토리 입력 폼 컴포넌트
 * 기본 정보 및 메타데이터 입력
 */

'use client'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/shared/lib/store'
import {
  updateFormField,
  toggleTone,
  toggleGenre,
  setFieldTouched,
  selectWizardFormData,
  selectFieldError,
  selectFormField
} from '../model/wizard.slice'
import type {
  ToneOption,
  GenreOption,
  VideoFormat,
  TempoOption,
  NarrativeStyle,
  DevelopmentIntensity
} from '@/entities/storyboard'
import styles from './StoryInputForm.module.scss'

// ============================
// 1. 옵션 데이터 정의
// ============================

const TONE_OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'formal', label: '격식있는', description: '공식적이고 정중한 톤' },
  { value: 'casual', label: '친근한', description: '편안하고 친밀한 톤' },
  { value: 'professional', label: '전문적인', description: '신뢰감 있는 전문가 톤' },
  { value: 'emotional', label: '감성적인', description: '감동적이고 따뜻한 톤' },
  { value: 'humorous', label: '유머러스한', description: '재미있고 유쾌한 톤' },
  { value: 'serious', label: '진지한', description: '엄숙하고 무게감 있는 톤' },
  { value: 'energetic', label: '활기찬', description: '역동적이고 생동감 있는 톤' },
  { value: 'calm', label: '차분한', description: '안정적이고 평온한 톤' }
]

const GENRE_OPTIONS: { value: GenreOption; label: string; description: string }[] = [
  { value: 'commercial', label: '광고', description: '제품/서비스 홍보' },
  { value: 'documentary', label: '다큐멘터리', description: '사실 기반 정보 전달' },
  { value: 'tutorial', label: '튜토리얼', description: '교육 및 안내' },
  { value: 'entertainment', label: '엔터테인먼트', description: '오락 및 재미' },
  { value: 'news', label: '뉴스', description: '시사 및 정보' },
  { value: 'corporate', label: '기업홍보', description: '회사 소개 및 브랜딩' },
  { value: 'education', label: '교육', description: '학습 및 지식 전달' },
  { value: 'lifestyle', label: '라이프스타일', description: '일상 및 문화' }
]

const FORMAT_OPTIONS: { value: VideoFormat; label: string; description: string }[] = [
  { value: 'vertical', label: '세로형 (9:16)', description: '모바일 최적화' },
  { value: 'horizontal', label: '가로형 (16:9)', description: '데스크톱/TV 최적화' },
  { value: 'square', label: '정사각형 (1:1)', description: '소셜미디어 최적화' }
]

const TEMPO_OPTIONS: { value: TempoOption; label: string; description: string }[] = [
  { value: 'fast', label: '빠르게', description: '4-6초 컷, 빠른 전개' },
  { value: 'normal', label: '보통', description: '6-8초 컷, 안정적 전개' },
  { value: 'slow', label: '느리게', description: '8-12초 컷, 여유로운 전개' }
]

const NARRATIVE_OPTIONS: { value: NarrativeStyle; label: string; description: string }[] = [
  { value: 'hook-immersion-twist-cliffhanger', label: '훅-몰입-반전-떡밥', description: '강한 임팩트와 호기심 유발' },
  { value: 'classic-four-act', label: '클래식 기승전결', description: '전통적인 스토리텔링 구조' },
  { value: 'inductive', label: '귀납법', description: '구체적 사례에서 일반화' },
  { value: 'deductive', label: '연역법', description: '일반론에서 구체적 결론' },
  { value: 'documentary-interview', label: '다큐(인터뷰식)', description: '증언과 사실 중심 전개' },
  { value: 'pixar-storytelling', label: '픽사스토리', description: '감정적 몰입과 성장 스토리' }
]

const INTENSITY_OPTIONS: { value: DevelopmentIntensity; label: string; description: string }[] = [
  { value: 'minimal', label: '그대로', description: '간결하고 직접적인 표현' },
  { value: 'moderate', label: '적당히', description: '균형 잡힌 묘사와 설명' },
  { value: 'rich', label: '풍부하게', description: '감정과 환경을 상세히 묘사' }
]

// ============================
// 2. 컴포넌트 정의
// ============================

export const StoryInputForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const formData = useSelector(selectWizardFormData)
  
  // 필드별 에러 선택자들
  const titleError = useSelector(selectFieldError('title'))
  const storylineError = useSelector(selectFieldError('storyline'))
  const tonesError = useSelector(selectFieldError('tones'))
  const genresError = useSelector(selectFieldError('genres'))
  const targetError = useSelector(selectFieldError('target'))
  const durationError = useSelector(selectFieldError('duration'))

  // ============================
  // 3. 이벤트 핸들러들
  // ============================

  const handleFieldChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    dispatch(updateFormField({ field, value }))
  }

  const handleFieldBlur = (field: string) => {
    dispatch(setFieldTouched(field))
  }

  const handleToneToggle = (tone: ToneOption) => {
    dispatch(toggleTone(tone))
  }

  const handleGenreToggle = (genre: GenreOption) => {
    dispatch(toggleGenre(genre))
  }

  // ============================
  // 4. 렌더링
  // ============================

  return (
    <div className={styles.storyInputForm}>
      <div className={styles.header}>
        <h2>1단계: 스토리 입력</h2>
        <p>영상의 기본 정보와 스토리를 입력해주세요.</p>
      </div>

      <form className={styles.form}>
        {/* 기본 정보 섹션 */}
        <section className={styles.section}>
          <h3>기본 정보</h3>
          
          {/* 제목 */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => handleFieldBlur('title')}
              placeholder="영상 제목을 입력하세요"
              className={`${styles.input} ${titleError ? styles.error : ''}`}
              maxLength={100}
            />
            {titleError && (
              <span className={styles.errorMessage} role="alert">
                {titleError}
              </span>
            )}
          </div>

          {/* 한 줄 스토리 */}
          <div className={styles.formGroup}>
            <label htmlFor="storyline" className={styles.label}>
              한 줄 스토리 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="storyline"
              value={formData.storyline}
              onChange={(e) => handleFieldChange('storyline', e.target.value)}
              onBlur={() => handleFieldBlur('storyline')}
              placeholder="영상의 핵심 스토리를 한 줄로 요약해주세요"
              className={`${styles.textarea} ${storylineError ? styles.error : ''}`}
              rows={3}
              maxLength={500}
            />
            <div className={styles.textCount}>
              {formData.storyline.length}/500
            </div>
            {storylineError && (
              <span className={styles.errorMessage} role="alert">
                {storylineError}
              </span>
            )}
          </div>

          {/* 타겟 */}
          <div className={styles.formGroup}>
            <label htmlFor="target" className={styles.label}>
              타겟 <span className={styles.required}>*</span>
            </label>
            <input
              id="target"
              type="text"
              value={formData.target}
              onChange={(e) => handleFieldChange('target', e.target.value)}
              onBlur={() => handleFieldBlur('target')}
              placeholder="예: 20-30대 직장인, 학부모, 스타트업 창업자"
              className={`${styles.input} ${targetError ? styles.error : ''}`}
            />
            {targetError && (
              <span className={styles.errorMessage} role="alert">
                {targetError}
              </span>
            )}
          </div>
        </section>

        {/* 톤앤매너 섹션 */}
        <section className={styles.section}>
          <h3>톤앤매너 <span className={styles.required}>*</span></h3>
          <p className={styles.sectionDescription}>
            원하는 톤앤매너를 선택하세요 (복수 선택 가능)
          </p>
          
          <div className={styles.optionGrid}>
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToneToggle(option.value)}
                className={`${styles.optionCard} ${
                  formData.tones.includes(option.value) ? styles.selected : ''
                }`}
                aria-pressed={formData.tones.includes(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionDescription}>{option.description}</span>
              </button>
            ))}
          </div>
          
          {tonesError && (
            <span className={styles.errorMessage} role="alert">
              {tonesError}
            </span>
          )}
        </section>

        {/* 장르 섹션 */}
        <section className={styles.section}>
          <h3>장르 <span className={styles.required}>*</span></h3>
          <p className={styles.sectionDescription}>
            해당하는 장르를 선택하세요 (복수 선택 가능)
          </p>
          
          <div className={styles.optionGrid}>
            {GENRE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleGenreToggle(option.value)}
                className={`${styles.optionCard} ${
                  formData.genres.includes(option.value) ? styles.selected : ''
                }`}
                aria-pressed={formData.genres.includes(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionDescription}>{option.description}</span>
              </button>
            ))}
          </div>
          
          {genresError && (
            <span className={styles.errorMessage} role="alert">
              {genresError}
            </span>
          )}
        </section>

        {/* 영상 설정 섹션 */}
        <section className={styles.section}>
          <h3>영상 설정</h3>
          
          {/* 분량 */}
          <div className={styles.formGroup}>
            <label htmlFor="duration" className={styles.label}>
              분량 <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputGroup}>
              <input
                id="duration"
                type="number"
                min="15"
                max="300"
                value={formData.duration}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
                onBlur={() => handleFieldBlur('duration')}
                className={`${styles.input} ${durationError ? styles.error : ''}`}
              />
              <span className={styles.inputSuffix}>초</span>
            </div>
            <div className={styles.fieldHelp}>
              15초~300초(5분) 사이로 설정해주세요
            </div>
            {durationError && (
              <span className={styles.errorMessage} role="alert">
                {durationError}
              </span>
            )}
          </div>

          {/* 포맷 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>포맷</label>
            <div className={styles.radioGroup}>
              {FORMAT_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={formData.format === option.value}
                    onChange={() => handleFieldChange('format', option.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDescription}>{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 템포 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>템포</label>
            <div className={styles.radioGroup}>
              {TEMPO_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tempo"
                    value={option.value}
                    checked={formData.tempo === option.value}
                    onChange={() => handleFieldChange('tempo', option.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDescription}>{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 고급 설정 섹션 */}
        <section className={styles.section}>
          <h3>고급 설정</h3>
          
          {/* 전개 방식 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>전개 방식</label>
            <select
              value={formData.narrativeStyle}
              onChange={(e) => handleFieldChange('narrativeStyle', e.target.value as NarrativeStyle)}
              className={styles.select}
            >
              {NARRATIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* 전개 강도 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>전개 강도</label>
            <div className={styles.radioGroup}>
              {INTENSITY_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="developmentIntensity"
                    value={option.value}
                    checked={formData.developmentIntensity === option.value}
                    onChange={() => handleFieldChange('developmentIntensity', option.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDescription}>{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}

export default StoryInputForm