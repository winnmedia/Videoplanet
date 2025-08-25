/**
 * AI 영상 기획 생성 폼 컴포넌트
 * FSD 아키텍처에 따라 리팩토링된 버전
 */

import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/shared/ui'
import { BasicInfoSection } from './BasicInfoSection'
import { MetaInfoSection } from './MetaInfoSection'
import { DevelopmentSection } from './DevelopmentSection'
import { ToneAndMannerSection } from './ToneAndMannerSection'
import { 
  generateAIPlan, 
  updateFormField, 
  resetForm,
  selectFormData,
  selectIsGenerating,
  selectFormErrors
} from '../../model/ai-planning.slice'
import { useFormValidation } from '../../model/hooks/useFormValidation'
import { useAutoSave } from '../../model/hooks/useAutoSave'
import styles from './AIPlanningForm.module.scss'

interface AIPlanningFormProps {
  onSuccess?: (planId: string) => void
  onError?: (error: Error) => void
  autoSaveInterval?: number
}

export const AIPlanningForm: React.FC<AIPlanningFormProps> = ({
  onSuccess,
  onError,
  autoSaveInterval = 3000
}) => {
  const dispatch = useDispatch()
  const formData = useSelector(selectFormData)
  const isGenerating = useSelector(selectIsGenerating)
  const errors = useSelector(selectFormErrors)
  
  // 폼 유효성 검사 훅
  const { isValid, validateField, validateForm } = useFormValidation(formData)
  
  // 자동 저장 훅
  useAutoSave(formData, autoSaveInterval)

  // 필드 업데이트 핸들러
  const handleFieldChange = useCallback((field: string, value: any) => {
    dispatch(updateFormField({ field, value }))
    validateField(field, value)
  }, [dispatch, validateField])

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 전체 폼 유효성 검사
    const validationResult = validateForm()
    if (!validationResult.isValid) {
      // 첫 번째 에러 필드로 포커스 이동
      const firstErrorField = document.querySelector(`[name="${validationResult.firstError}"]`)
      if (firstErrorField instanceof HTMLElement) {
        firstErrorField.focus()
      }
      return
    }

    try {
      const result = await dispatch(generateAIPlan(formData)).unwrap()
      onSuccess?.(result.id)
    } catch (error) {
      onError?.(error as Error)
    }
  }, [dispatch, formData, validateForm, onSuccess, onError])

  // 폼 초기화 핸들러
  const handleReset = useCallback(() => {
    if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
      dispatch(resetForm())
    }
  }, [dispatch])

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter로 제출
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isValid) {
        handleSubmit(e as any)
      }
      // Escape로 초기화
      if (e.key === 'Escape' && !isGenerating) {
        handleReset()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isValid, isGenerating, handleSubmit, handleReset])

  return (
    <form 
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="AI 영상 기획 생성 폼"
      aria-describedby="form-description"
      noValidate
    >
      {/* 스크린 리더용 설명 */}
      <div id="form-description" className="sr-only">
        한 줄 스토리와 기본 메타 정보를 입력하면 AI가 전문적인 영상 기획서를 자동으로 생성합니다.
        필수 입력 항목은 별표로 표시되어 있습니다.
      </div>

      {/* 진행 상태 알림 (스크린 리더용) */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isGenerating && '기획서를 생성하고 있습니다. 잠시만 기다려주세요.'}
      </div>

      {/* 에러 알림 영역 */}
      {errors.general && (
        <div 
          role="alert" 
          aria-live="assertive"
          className={styles.errorAlert}
        >
          <strong>오류:</strong> {errors.general}
        </div>
      )}

      {/* 섹션별 컴포넌트 */}
      <div className={styles.sections}>
        <BasicInfoSection
          data={formData}
          errors={errors}
          onChange={handleFieldChange}
          disabled={isGenerating}
        />

        <ToneAndMannerSection
          selectedTones={formData.toneAndManner}
          onChange={(tones) => handleFieldChange('toneAndManner', tones)}
          disabled={isGenerating}
        />

        <MetaInfoSection
          data={formData}
          errors={errors}
          onChange={handleFieldChange}
          disabled={isGenerating}
        />

        <DevelopmentSection
          data={formData}
          onChange={handleFieldChange}
          disabled={isGenerating}
        />
      </div>

      {/* 액션 버튼 */}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isGenerating}
          aria-label="폼 초기화"
        >
          초기화
        </Button>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={!isValid || isGenerating}
          loading={isGenerating}
          aria-busy={isGenerating}
          aria-label={isGenerating ? '생성 중...' : 'AI 기획서 생성하기'}
        >
          {isGenerating ? 'AI 기획서 생성 중...' : 'AI 기획서 생성하기'}
        </Button>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className={styles.shortcuts} aria-label="키보드 단축키">
        <span>단축키: </span>
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> 제출 | 
        <kbd>Esc</kbd> 초기화
      </div>
    </form>
  )
}

// 기본 내보내기
export default AIPlanningForm