'use client'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFormData, updateFormData } from '../../../model/creation.slice'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import styles from './BasicInfoStep.module.scss'

interface BasicInfoStepProps {
  className?: string
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ 
  className = '' 
}) => {
  const dispatch = useDispatch()
  const formData = useSelector(selectFormData)
  
  const handleInputChange = (field: string, value: string) => {
    dispatch(updateFormData({ [field]: value }))
  }

  const handleArrayChange = (field: string, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean)
    dispatch(updateFormData({ [field]: arrayValue }))
  }

  return (
    <div className={`${styles.basicInfoStep} ${className}`}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>기본 정보</h2>
        <p className={styles.sectionDescription}>
          영상 기획서의 기본적인 정보를 입력해주세요.
        </p>
        
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            제목 <span className={styles.required}>*</span>
          </label>
          <Input
            id="title"
            type="text"
            value={formData?.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="예: 브랜드 홍보영상 기획서"
            className={styles.input}
            required
            aria-describedby="title-help"
          />
          <div id="title-help" className={styles.helpText}>
            기획서의 제목을 입력해주세요. 프로젝트를 대표하는 명확한 제목을 권장합니다.
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            설명 <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            value={formData?.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="영상의 목적, 타겟 오디언스, 주요 메시지 등을 간략히 설명해주세요"
            className={`${styles.textarea} ${styles.input}`}
            rows={4}
            required
            aria-describedby="description-help"
          />
          <div id="description-help" className={styles.helpText}>
            영상의 목적과 핵심 메시지를 간단히 설명해주세요.
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>
              영상 유형 <span className={styles.required}>*</span>
            </label>
            <select
              id="type"
              value={formData?.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`${styles.select} ${styles.input}`}
              required
              aria-describedby="type-help"
            >
              <option value="">유형을 선택해주세요</option>
              <option value="promotional">홍보영상</option>
              <option value="educational">교육영상</option>
              <option value="commercial">광고영상</option>
              <option value="documentary">다큐멘터리</option>
              <option value="social">소셜미디어</option>
              <option value="corporate">기업영상</option>
              <option value="event">이벤트영상</option>
              <option value="other">기타</option>
            </select>
            <div id="type-help" className={styles.helpText}>
              제작할 영상의 유형을 선택해주세요.
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="priority" className={styles.label}>
              우선순위
            </label>
            <select
              id="priority"
              value={formData?.priority || 'medium'}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={`${styles.select} ${styles.input}`}
              aria-describedby="priority-help"
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
            <div id="priority-help" className={styles.helpText}>
              프로젝트의 우선순위를 설정해주세요.
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="targetAudience" className={styles.label}>
            타겟 오디언스
          </label>
          <Input
            id="targetAudience"
            type="text"
            value={formData?.targetAudience || ''}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            placeholder="예: 20-30대 직장인, B2B 마케터"
            className={styles.input}
            aria-describedby="audience-help"
          />
          <div id="audience-help" className={styles.helpText}>
            영상이 타겟하는 주요 시청자층을 입력해주세요.
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.label}>
            태그
          </label>
          <Input
            id="tags"
            type="text"
            value={formData?.tags ? formData.tags.join(', ') : ''}
            onChange={(e) => handleArrayChange('tags', e.target.value)}
            placeholder="예: 브랜딩, 마케팅, 홍보 (쉼표로 구분)"
            className={styles.input}
            aria-describedby="tags-help"
          />
          <div id="tags-help" className={styles.helpText}>
            프로젝트와 관련된 키워드를 쉼표로 구분하여 입력해주세요.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>예산 및 일정</h3>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="budget" className={styles.label}>
              예상 예산
            </label>
            <Input
              id="budget"
              type="number"
              value={formData?.budget || ''}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="1000000"
              className={styles.input}
              min="0"
              step="100000"
              aria-describedby="budget-help"
            />
            <div id="budget-help" className={styles.helpText}>
              프로젝트 예상 예산을 원 단위로 입력해주세요.
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration" className={styles.label}>
              예상 제작 기간 (일)
            </label>
            <Input
              id="duration"
              type="number"
              value={formData?.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="30"
              className={styles.input}
              min="1"
              max="365"
              aria-describedby="duration-help"
            />
            <div id="duration-help" className={styles.helpText}>
              기획부터 완성까지 예상 소요일을 입력해주세요.
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate" className={styles.label}>
              시작 희망일
            </label>
            <Input
              id="startDate"
              type="date"
              value={formData?.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={styles.input}
              aria-describedby="start-date-help"
            />
            <div id="start-date-help" className={styles.helpText}>
              프로젝트 시작 희망일을 선택해주세요.
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="deadlineDate" className={styles.label}>
              완료 희망일
            </label>
            <Input
              id="deadlineDate"
              type="date"
              value={formData?.deadlineDate || ''}
              onChange={(e) => handleInputChange('deadlineDate', e.target.value)}
              className={styles.input}
              aria-describedby="deadline-help"
            />
            <div id="deadline-help" className={styles.helpText}>
              프로젝트 완료 희망일을 선택해주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}