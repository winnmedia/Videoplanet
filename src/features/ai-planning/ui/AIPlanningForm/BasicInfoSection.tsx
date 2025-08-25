/**
 * 기본 정보 섹션 컴포넌트
 * 영상 제목과 한 줄 스토리 입력을 담당
 */

import React, { useCallback, useState } from 'react'
import { Input } from '@/shared/ui'
import { Button } from '@/shared/ui/Button/Button'
import styles from './BasicInfoSection.module.scss'

interface BasicInfoSectionProps {
  data: {
    title: string
    oneLinerStory: string
  }
  errors: {
    title?: string
    oneLinerStory?: string
  }
  onChange: (field: string, value: string) => void
  disabled?: boolean
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  data,
  errors,
  onChange,
  disabled = false
}) => {
  const [titleLength, setTitleLength] = useState(data.title.length)
  const [storyLength, setStoryLength] = useState(data.oneLinerStory.length)

  // 제목 변경 핸들러
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const sanitized = value.slice(0, 100) // 최대 100자 제한
    
    setTitleLength(sanitized.length)
    onChange('title', sanitized)
  }, [onChange])

  // 스토리 변경 핸들러
  const handleStoryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const sanitized = value.slice(0, 500) // 최대 500자 제한
    
    setStoryLength(sanitized.length)
    onChange('oneLinerStory', sanitized)
  }, [onChange])

  // 특수문자 검증
  const validateSpecialChars = useCallback((value: string): string | undefined => {
    const specialCharsPattern = /[@#$%^&*()]/g
    if (specialCharsPattern.test(value)) {
      return '특수문자는 사용할 수 없습니다'
    }
    return undefined
  }, [])

  return (
    <fieldset className={styles.section} disabled={disabled}>
      <legend className={styles.sectionTitle}>
        <span className={styles.icon}>📝</span>
        기본 정보
        <span className="sr-only">필수 입력 섹션</span>
      </legend>

      <div className={styles.fieldGroup}>
        {/* 영상 제목 입력 */}
        <div className={styles.field}>
          <label htmlFor="video-title" className={styles.label}>
            영상 제목
            <span className={styles.required} aria-label="필수">*</span>
          </label>
          
          <Input
            id="video-title"
            name="title"
            type="text"
            value={data.title}
            onChange={handleTitleChange}
            error={errors.title || validateSpecialChars(data.title)}
            placeholder="예: 브이래닛 브랜드 홍보영상"
            required
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : 'title-hint'}
            minLength={2}
            maxLength={100}
            disabled={disabled}
            data-testid="title-input"
          />

          <div className={styles.fieldFooter}>
            {!errors.title && (
              <span id="title-hint" className={styles.hint}>
                영상의 목적을 명확하게 나타내는 제목을 입력하세요
              </span>
            )}
            {errors.title && (
              <span id="title-error" role="alert" className={styles.error}>
                {errors.title}
              </span>
            )}
            <span className={styles.charCount} aria-label={`${titleLength}자 입력됨, 최대 100자`}>
              {titleLength}/100
            </span>
          </div>
        </div>

        {/* 한 줄 스토리 입력 */}
        <div className={styles.field}>
          <label htmlFor="one-liner-story" className={styles.label}>
            한 줄 스토리
            <span className={styles.required} aria-label="필수">*</span>
          </label>
          
          <textarea
            id="one-liner-story"
            name="oneLinerStory"
            value={data.oneLinerStory}
            onChange={handleStoryChange}
            placeholder="영상의 핵심 내용을 한 줄로 설명해주세요. 예: 영상 제작 협업이 복잡하고 비효율적인 문제를 브이래닛이 어떻게 혁신적으로 해결하는지 보여준다"
            className={styles.textarea}
            required
            aria-required="true"
            aria-invalid={!!errors.oneLinerStory}
            aria-describedby={errors.oneLinerStory ? 'story-error' : 'story-hint'}
            minLength={10}
            maxLength={500}
            rows={3}
            disabled={disabled}
            data-testid="story-input"
          />

          <div className={styles.fieldFooter}>
            {!errors.oneLinerStory && (
              <span id="story-hint" className={styles.hint}>
                시청자가 영상을 통해 얻을 핵심 메시지를 간결하게 표현하세요
              </span>
            )}
            {errors.oneLinerStory && (
              <span id="story-error" role="alert" className={styles.error}>
                {errors.oneLinerStory}
              </span>
            )}
            <span 
              className={styles.charCount} 
              aria-label={`${storyLength}자 입력됨, 최대 500자`}
              role="status"
            >
              {storyLength}/500
            </span>
          </div>
        </div>

        {/* AI 작성 도우미 (선택적 기능) */}
        <div className={styles.aiHelper}>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={() => console.log('AI 도우미 실행')}
            disabled={disabled}
            aria-label="AI 작성 도우미 열기"
            icon={<span>✨</span>}
            iconPosition="left"
          >
            AI 작성 도우미
          </Button>
          <span className={styles.aiHint}>
            키워드만 입력하면 AI가 스토리를 제안해드립니다
          </span>
        </div>
      </div>
    </fieldset>
  )
}

export default BasicInfoSection