'use client'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFormData, updateFormData } from '../../../model/creation.slice'
import { Button } from '@/shared/ui/Button'
import styles from './TemplateSelectionStep.module.scss'

interface TemplateSelectionStepProps {
  className?: string
}

interface Template {
  id: string
  name: string
  description: string
  sections: string[]
  thumbnail: string
  category: string
}

const TEMPLATE_CATEGORIES = [
  { id: 'promotional', name: '홍보영상', icon: '📢' },
  { id: 'educational', name: '교육영상', icon: '📚' },
  { id: 'commercial', name: '광고영상', icon: '🎯' },
  { id: 'social', name: '소셜미디어', icon: '📱' }
]

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: 'promo-basic',
    name: '기본 홍보영상',
    description: '제품이나 서비스를 간단히 소개하는 표준 홍보영상 구조',
    sections: ['인트로', '문제 제기', '솔루션 제시', '혜택 설명', '행동 유도', '아웃트로'],
    thumbnail: '/images/templates/promo-basic.png',
    category: 'promotional'
  },
  {
    id: 'edu-tutorial',
    name: '튜토리얼',
    description: '단계별 설명이 포함된 교육용 영상 구조',
    sections: ['목표 제시', '준비물 소개', '단계별 설명', '주의사항', '마무리 정리'],
    thumbnail: '/images/templates/edu-tutorial.png',
    category: 'educational'
  },
  {
    id: 'social-short',
    name: '숏폼 콘텐츠',
    description: '인스타그램, 틱톡용 짧은 영상 구조',
    sections: ['강력한 시작', '핵심 내용', '감정적 마무리'],
    thumbnail: '/images/templates/social-short.png',
    category: 'social'
  }
]

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({ 
  className = '' 
}) => {
  const dispatch = useDispatch()
  const formData = useSelector(selectFormData)
  
  const [selectedCategory, setSelectedCategory] = React.useState<string>('promotional')
  const [customSections, setCustomSections] = React.useState<string[]>([])

  const handleTemplateSelect = (template: Template) => {
    dispatch(updateFormData({
      selectedTemplate: template.id,
      templateSections: template.sections
    }))
  }

  const filteredTemplates = SAMPLE_TEMPLATES.filter(
    template => template.category === selectedCategory
  )

  // TODO(human): 템플릿 선택 로직과 커스텀 섹션 관리 구현 필요
  const handleCustomSectionManagement = () => {
    // TODO(human): 이 함수에서 다음 기능들을 구현해주세요:
    // 1. 커스텀 섹션 추가/삭제/순서 변경
    // 2. 드래그 앤 드롭으로 섹션 순서 조정
    // 3. 섹션명 유효성 검사 (중복 방지, 길이 제한)
    // 4. Redux 상태 업데이트
    console.log('TODO: 커스텀 섹션 관리 로직 구현 필요')
  }

  return (
    <div className={`${styles.templateSelectionStep} ${className}`}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>템플릿 선택</h2>
        <p className={styles.sectionDescription}>
          영상 구조에 맞는 템플릿을 선택하거나 직접 구성해보세요.
        </p>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {TEMPLATE_CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${
                selectedCategory === category.id ? styles.active : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className={styles.categoryIcon}>{category.icon}</span>
              <span className={styles.categoryName}>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className={styles.templateGrid}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`${styles.templateCard} ${
                formData?.selectedTemplate === template.id ? styles.selected : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className={styles.templateThumbnail}>
                <div className={styles.placeholderImage}>
                  {template.name.charAt(0)}
                </div>
              </div>
              <div className={styles.templateInfo}>
                <h3 className={styles.templateName}>{template.name}</h3>
                <p className={styles.templateDescription}>
                  {template.description}
                </p>
                <div className={styles.sectionPreview}>
                  <strong>구성:</strong> {template.sections.join(' → ')}
                </div>
              </div>
              {formData?.selectedTemplate === template.id && (
                <div className={styles.selectedIndicator}>
                  <span>✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>섹션 구성</h3>
        <p className={styles.sectionDescription}>
          선택한 템플릿의 섹션을 확인하고 필요에 따라 수정해보세요.
        </p>

        <div className={styles.sectionsList}>
          {(formData?.templateSections || []).map((section, index) => (
            <div key={index} className={styles.sectionItem}>
              <div className={styles.sectionNumber}>{index + 1}</div>
              <div className={styles.sectionName}>{section}</div>
              <div className={styles.sectionActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Edit section:', section)}
                >
                  수정
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.customSectionControls}>
          <Button
            variant="outline"
            onClick={handleCustomSectionManagement}
            className={styles.addSectionButton}
          >
            + 섹션 추가
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('TODO: 전체 구조 재정렬')}
          >
            구조 재정렬
          </Button>
        </div>
      </div>

      {formData?.selectedTemplate && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>선택된 구성 미리보기</h3>
          <div className={styles.previewContainer}>
            <div className={styles.timelinePreview}>
              {(formData?.templateSections || []).map((section, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>{index + 1}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineName}>{section}</div>
                    <div className={styles.timelineDuration}>
                      예상 소요시간: {Math.ceil(Math.random() * 3) + 1}분
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}