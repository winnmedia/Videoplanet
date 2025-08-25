'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  selectCurrentStep, 
  selectFormData, 
  selectValidation,
  selectIsCreating,
  selectCreationError,
  selectCanProceedToNextStep,
  selectCreationProgress,
  nextStep,
  previousStep,
  validateStep,
  startCreation,
  completeCreation,
  resetCreation
} from '../model/creation.slice'
import { Button } from '@/shared/ui/Button'
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner'
import styles from './PlanCreationForm.module.scss'

// Step Components
import { BasicInfoStep } from './steps/BasicInfoStep'
import { TemplateSelectionStep } from './steps/TemplateSelectionStep'
import { CollaborationStep } from './steps/CollaborationStep'
import { ReviewStep } from './steps/ReviewStep'

interface PlanCreationFormProps {
  onComplete?: (planId: string) => void
  onCancel?: () => void
  projectId?: number
  className?: string
}

const STEP_TITLES = [
  '기본 정보',
  '템플릿 & 구조',
  '협업 설정',
  '검토 & 완료'
]

const STEP_DESCRIPTIONS = [
  '기획서의 기본 정보를 입력하세요',
  '템플릿을 선택하고 섹션을 구성하세요',
  '협업자를 초대하고 권한을 설정하세요',
  '모든 설정을 검토하고 기획서를 생성하세요'
]

export const PlanCreationForm: React.FC<PlanCreationFormProps> = ({
  onComplete,
  onCancel,
  projectId,
  className = ''
}) => {
  const dispatch = useDispatch()
  const currentStep = useSelector(selectCurrentStep)
  const formData = useSelector(selectFormData)
  const validation = useSelector(selectValidation)
  const isCreating = useSelector(selectIsCreating)
  const creationError = useSelector(selectCreationError)
  const canProceed = useSelector(selectCanProceedToNextStep)
  const progress = useSelector(selectCreationProgress)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize project ID if provided
  useEffect(() => {
    if (projectId && formData && !formData.projectId) {
      dispatch({ type: 'planCreation/setProjectId', payload: projectId })
    }
  }, [projectId, formData, dispatch])

  // Validate current step when it changes
  useEffect(() => {
    dispatch(validateStep(currentStep))
  }, [currentStep, formData, dispatch])

  const handleNext = useCallback(() => {
    dispatch(validateStep(currentStep))
    if (canProceed) {
      dispatch(nextStep())
    }
  }, [dispatch, currentStep, canProceed])

  const handlePrevious = useCallback(() => {
    dispatch(previousStep())
  }, [dispatch])

  const handleSubmit = useCallback(async () => {
    if (!formData) return
    
    setIsSubmitting(true)
    dispatch(startCreation())
    
    try {
      // Here would be the actual API call to create the plan
      // const createdPlan = await createPlan(formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockPlanId = `plan_${Date.now()}`
      
      dispatch(completeCreation())
      onComplete?.(mockPlanId)
      
    } catch (error) {
      dispatch({
        type: 'planCreation/setCreationError',
        payload: error instanceof Error ? error.message : '기획서 생성 중 오류가 발생했습니다.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [dispatch, formData, onComplete])

  const handleCancel = useCallback(() => {
    if (window.confirm('작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?')) {
      dispatch(resetCreation())
      onCancel?.()
    }
  }, [dispatch, onCancel])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />
      case 2:
        return <TemplateSelectionStep />
      case 3:
        return <CollaborationStep />
      case 4:
        return <ReviewStep />
      default:
        return null
    }
  }

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={styles.steps}>
        {STEP_TITLES.map((title, index) => (
          <div
            key={index}
            className={`${styles.step} ${
              index + 1 < currentStep ? styles.completed : ''
            } ${index + 1 === currentStep ? styles.current : ''}`}
          >
            <div className={styles.stepNumber}>
              {index + 1 < currentStep ? (
                <span className={styles.checkmark}>✓</span>
              ) : (
                index + 1
              )}
            </div>
            <div className={styles.stepLabel}>
              <div className={styles.stepTitle}>{title}</div>
              <div className={styles.stepDescription}>
                {STEP_DESCRIPTIONS[index]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderNavigationButtons = () => (
    <div className={styles.navigation}>
      <div className={styles.leftButtons}>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isCreating || isSubmitting}
        >
          취소
        </Button>
      </div>
      
      <div className={styles.rightButtons}>
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isCreating || isSubmitting}
            className={styles.previousButton}
          >
            이전
          </Button>
        )}
        
        {currentStep < 4 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed || isCreating}
            className={styles.nextButton}
          >
            다음
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!validation?.isValid || isCreating || isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting || isCreating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>기획서 생성 중...</span>
              </>
            ) : (
              '기획서 생성'
            )}
          </Button>
        )}
      </div>
    </div>
  )

  const renderValidationErrors = () => {
    if (!validation?.errors || Object.keys(validation.errors).length === 0) {
      return null
    }

    return (
      <div className={styles.validationErrors}>
        {Object.entries(validation.errors).map(([field, errors]) => (
          <div key={field} className={styles.errorGroup}>
            <strong>{field}:</strong>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`${styles.planCreationForm} ${className}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>새 영상 기획서 만들기</h1>
        <p className={styles.subtitle}>
          단계별로 안내에 따라 영상 기획서를 작성해보세요
        </p>
      </div>

      {renderStepIndicator()}

      <div className={styles.content}>
        {creationError && (
          <div className={styles.errorMessage} role="alert">
            <strong>오류:</strong> {creationError}
          </div>
        )}

        {renderValidationErrors()}

        <div className={styles.stepContent}>
          {renderStepContent()}
        </div>
      </div>

      {renderNavigationButtons()}
    </div>
  )
}