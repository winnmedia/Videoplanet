'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { selectFormData, selectValidation } from '../../../model/creation.slice'
import { Icon, IconType } from '@/shared/ui/icons'
import styles from './ReviewStep.module.scss'

interface ReviewStepProps {
  className?: string
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ 
  className = '' 
}) => {
  const formData = useSelector(selectFormData)
  const validation = useSelector(selectValidation)

  if (!formData) {
    return (
      <div className={`${styles.reviewStep} ${className}`}>
        <div className={styles.errorMessage}>
          기획서 데이터를 불러올 수 없습니다.
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const collaborators = formData.collaborators || []
  const templateSections = formData.templateSections || []

  return (
    <div className={`${styles.reviewStep} ${className}`}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>기획서 최종 검토</h2>
        <p className={styles.sectionDescription}>
          모든 정보를 확인하고 기획서를 생성하세요. 생성 후에도 수정할 수 있습니다.
        </p>

        {!validation?.isValid && (
          <div className={styles.validationAlert} role="alert">
            <div className={styles.alertIcon}>
              <Icon type={IconType.WARNING} size="lg" variant="warning" ariaLabel="경고" />
            </div>
            <div className={styles.alertContent}>
              <div className={styles.alertTitle}>완료되지 않은 항목이 있습니다</div>
              <ul className={styles.alertList}>
                {validation?.errors && Object.entries(validation.errors).map(([field, errors]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Basic Information Summary */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>기본 정보</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>제목</div>
            <div className={styles.summaryValue}>{formData.title || '-'}</div>
          </div>
          
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>영상 유형</div>
            <div className={styles.summaryValue}>
              {formData.type ? {
                promotional: '홍보영상',
                educational: '교육영상',
                commercial: '광고영상',
                documentary: '다큐멘터리',
                social: '소셜미디어',
                corporate: '기업영상',
                event: '이벤트영상',
                other: '기타'
              }[formData.type] || formData.type : '-'}
            </div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>우선순위</div>
            <div className={`${styles.summaryValue} ${styles.priority} ${styles[formData.priority || 'medium']}`}>
              {formData.priority ? {
                low: '낮음',
                medium: '보통',
                high: '높음',
                urgent: '긴급'
              }[formData.priority] : '보통'}
            </div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>타겟 오디언스</div>
            <div className={styles.summaryValue}>{formData.targetAudience || '-'}</div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>예산</div>
            <div className={styles.summaryValue}>{formatCurrency(formData.budget || 0)}</div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>제작 기간</div>
            <div className={styles.summaryValue}>
              {formData.duration ? `${formData.duration}일` : '-'}
            </div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>시작 희망일</div>
            <div className={styles.summaryValue}>{formatDate(formData.startDate || '')}</div>
          </div>

          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>완료 희망일</div>
            <div className={styles.summaryValue}>{formatDate(formData.deadlineDate || '')}</div>
          </div>
        </div>

        <div className={styles.descriptionSection}>
          <div className={styles.summaryLabel}>설명</div>
          <div className={styles.descriptionText}>
            {formData.description || '설명이 입력되지 않았습니다.'}
          </div>
        </div>

        {formData.tags && formData.tags.length > 0 && (
          <div className={styles.tagsSection}>
            <div className={styles.summaryLabel}>태그</div>
            <div className={styles.tagsList}>
              {formData.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template & Structure Summary */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>템플릿 & 구조</h3>
        
        {formData.selectedTemplate ? (
          <div className={styles.templateSummary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>선택된 템플릿</div>
              <div className={styles.summaryValue}>{formData.selectedTemplate}</div>
            </div>
            
            {templateSections.length > 0 && (
              <div className={styles.structurePreview}>
                <div className={styles.summaryLabel}>영상 구조</div>
                <div className={styles.sectionsList}>
                  {templateSections.map((section, index) => (
                    <div key={index} className={styles.sectionItem}>
                      <div className={styles.sectionNumber}>{index + 1}</div>
                      <div className={styles.sectionName}>{section}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyText}>템플릿이 선택되지 않았습니다</div>
          </div>
        )}
      </div>

      {/* Collaboration Summary */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>협업 설정</h3>
        
        {collaborators.length > 0 ? (
          <div className={styles.collaborationSummary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>초대된 협업자</div>
              <div className={styles.summaryValue}>{collaborators.length}명</div>
            </div>
            
            <div className={styles.collaboratorsList}>
              {collaborators.map((collaborator, index) => (
                <div key={index} className={styles.collaboratorCard}>
                  <div className={styles.collaboratorEmail}>
                    {collaborator.email}
                  </div>
                  <div className={styles.collaboratorRole}>
                    {{
                      viewer: '조회자',
                      editor: '편집자',
                      admin: '관리자'
                    }[collaborator.role]}
                  </div>
                  <div className={`${styles.collaboratorStatus} ${styles[collaborator.status]}`}>
                    {{
                      pending: '대기중',
                      accepted: '수락됨',
                      declined: '거절됨'
                    }[collaborator.status]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <div className={styles.emptyText}>협업자가 초대되지 않았습니다</div>
          </div>
        )}

        <div className={styles.shareSettingsSummary}>
          <div className={styles.summaryLabel}>공유 설정</div>
          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <span>공개 설정:</span>
              <span className={formData.shareSettings?.isPublic ? styles.enabled : styles.disabled}>
                {formData.shareSettings?.isPublic ? '공개' : '비공개'}
              </span>
            </div>
            <div className={styles.settingItem}>
              <span>댓글 허용:</span>
              <span className={formData.shareSettings?.allowComments ? styles.enabled : styles.disabled}>
                {formData.shareSettings?.allowComments ? '허용' : '비허용'}
              </span>
            </div>
            <div className={styles.settingItem}>
              <span>다운로드 허용:</span>
              <span className={formData.shareSettings?.allowDownload ? styles.enabled : styles.disabled}>
                {formData.shareSettings?.allowDownload ? '허용' : '비허용'}
              </span>
            </div>
            <div className={styles.settingItem}>
              <span>로그인 필요:</span>
              <span className={formData.shareSettings?.requireAuth ? styles.enabled : styles.disabled}>
                {formData.shareSettings?.requireAuth ? '필요' : '불필요'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Preview */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>생성 정보</h3>
        <div className={styles.creationPreview}>
          <div className={styles.previewCard}>
            <div className={styles.previewIcon}>🎬</div>
            <div className={styles.previewContent}>
              <div className={styles.previewTitle}>영상 기획서가 생성됩니다</div>
              <div className={styles.previewDescription}>
                입력하신 모든 정보를 바탕으로 체계적인 영상 기획서가 생성됩니다.
                생성 후에도 언제든지 수정하고 보완할 수 있습니다.
              </div>
            </div>
          </div>

          <div className={styles.nextSteps}>
            <div className={styles.nextStepsTitle}>생성 후 다음 단계</div>
            <ul className={styles.nextStepsList}>
              <li>
                <Icon type={IconType.EDIT} size="xs" className={styles.stepIcon} ariaLabel="편집" />
                <span>상세 기획서 작성 및 수정</span>
              </li>
              <li>
                <Icon type={IconType.VIDEO} size="xs" className={styles.stepIcon} ariaLabel="비디오" />
                <span>스토리보드 및 샷리스트 작성</span>
              </li>
              <li>
                <Icon type={IconType.USERS} size="xs" className={styles.stepIcon} ariaLabel="팀원" />
                <span>팀원들과 실시간 협업</span>
              </li>
              <li>
                <Icon type={IconType.COMMENT} size="xs" className={styles.stepIcon} ariaLabel="피드백" />
                <span>피드백 수집 및 반영</span>
              </li>
              <li>
                <Icon type={IconType.CHART} size="xs" className={styles.stepIcon} ariaLabel="차트" />
                <span>진행상황 추적 및 관리</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}