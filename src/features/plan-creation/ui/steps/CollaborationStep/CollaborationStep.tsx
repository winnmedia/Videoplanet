'use client'

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFormData, updateFormData } from '../../../model/creation.slice'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Icon } from '@/shared/ui/icons'
import styles from './CollaborationStep.module.scss'

interface CollaborationStepProps {
  className?: string
}

interface Collaborator {
  id: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  name?: string
  status: 'pending' | 'accepted' | 'declined'
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: '조회자', description: '기획서를 볼 수만 있습니다' },
  { value: 'editor', label: '편집자', description: '기획서를 편집할 수 있습니다' },
  { value: 'admin', label: '관리자', description: '모든 권한을 가집니다' }
]

export const CollaborationStep: React.FC<CollaborationStepProps> = ({ 
  className = '' 
}) => {
  const dispatch = useDispatch()
  const formData = useSelector(selectFormData)
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    allowComments: true,
    allowDownload: false,
    requireAuth: true
  })

  const collaborators: Collaborator[] = formData?.collaborators || []

  const handleInviteCollaborator = () => {
    if (!inviteEmail.trim()) return
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      alert('올바른 이메일 주소를 입력해주세요.')
      return
    }

    if (collaborators.some(c => c.email === inviteEmail)) {
      alert('이미 초대된 사용자입니다.')
      return
    }

    const newCollaborator: Collaborator = {
      id: `collab_${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      status: 'pending'
    }

    dispatch(updateFormData({
      collaborators: [...collaborators, newCollaborator]
    }))

    setInviteEmail('')
    setInviteRole('editor')
  }

  const handleRemoveCollaborator = (collaboratorId: string) => {
    dispatch(updateFormData({
      collaborators: collaborators.filter(c => c.id !== collaboratorId)
    }))
  }

  const handleRoleChange = (collaboratorId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    dispatch(updateFormData({
      collaborators: collaborators.map(c => 
        c.id === collaboratorId ? { ...c, role: newRole } : c
      )
    }))
  }

  const handleShareSettingChange = (setting: string, value: boolean) => {
    const updatedSettings = { ...shareSettings, [setting]: value }
    setShareSettings(updatedSettings)
    dispatch(updateFormData({ shareSettings: updatedSettings }))
  }

  return (
    <div className={`${styles.collaborationStep} ${className}`}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>협업자 초대</h2>
        <p className={styles.sectionDescription}>
          기획서 작업에 참여할 팀원들을 초대하고 권한을 설정해주세요.
        </p>

        <div className={styles.inviteForm}>
          <div className={styles.formRow}>
            <div className={styles.emailInput}>
              <label htmlFor="inviteEmail" className={styles.label}>
                이메일 주소
              </label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="동료의 이메일 주소를 입력하세요"
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleInviteCollaborator()}
              />
            </div>

            <div className={styles.roleSelect}>
              <label htmlFor="inviteRole" className={styles.label}>
                권한
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className={`${styles.select} ${styles.input}`}
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inviteButton}>
              <Button
                onClick={handleInviteCollaborator}
                disabled={!inviteEmail.trim()}
                variant="primary"
              >
                초대
              </Button>
            </div>
          </div>

          <div className={styles.roleDescriptions}>
            {ROLE_OPTIONS.map(option => (
              <div 
                key={option.value} 
                className={`${styles.roleDescription} ${
                  inviteRole === option.value ? styles.active : ''
                }`}
              >
                <strong>{option.label}:</strong> {option.description}
              </div>
            ))}
          </div>
        </div>
      </div>

      {collaborators.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>초대된 협업자</h3>
          
          <div className={styles.collaboratorsList}>
            {collaborators.map(collaborator => (
              <div key={collaborator.id} className={styles.collaboratorItem}>
                <div className={styles.collaboratorInfo}>
                  <div className={styles.collaboratorEmail}>
                    {collaborator.name || collaborator.email}
                  </div>
                  {collaborator.name && (
                    <div className={styles.collaboratorEmailSub}>
                      {collaborator.email}
                    </div>
                  )}
                  <div className={`${styles.collaboratorStatus} ${styles[collaborator.status]}`}>
                    {collaborator.status === 'pending' && '대기중'}
                    {collaborator.status === 'accepted' && '수락됨'}
                    {collaborator.status === 'declined' && '거절됨'}
                  </div>
                </div>

                <div className={styles.collaboratorRole}>
                  <select
                    value={collaborator.role}
                    onChange={(e) => handleRoleChange(collaborator.id, e.target.value as any)}
                    className={styles.roleSelector}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.collaboratorActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    className={styles.removeButton}
                  >
                    제거
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>공유 설정</h3>
        <p className={styles.sectionDescription}>
          기획서의 공유 범위와 권한을 설정해주세요.
        </p>

        <div className={styles.shareSettings}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>공개 설정</div>
              <div className={styles.settingDescription}>
                링크를 아는 사람은 누구나 볼 수 있습니다
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={shareSettings.isPublic}
                onChange={(e) => handleShareSettingChange('isPublic', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>댓글 허용</div>
              <div className={styles.settingDescription}>
                다른 사용자가 댓글을 남길 수 있습니다
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={shareSettings.allowComments}
                onChange={(e) => handleShareSettingChange('allowComments', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>다운로드 허용</div>
              <div className={styles.settingDescription}>
                다른 사용자가 기획서를 다운로드할 수 있습니다
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={shareSettings.allowDownload}
                onChange={(e) => handleShareSettingChange('allowDownload', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>로그인 필요</div>
              <div className={styles.settingDescription}>
                기획서를 보려면 로그인이 필요합니다
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={shareSettings.requireAuth}
                onChange={(e) => handleShareSettingChange('requireAuth', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>협업 가이드</h3>
        <div className={styles.guideGrid}>
          <div className={styles.guideItem}>
            <div className={styles.guideIcon}>
              <Icon type={IconType.USERS} size="lg" variant="primary" ariaLabel="팀원 아이콘" />
            </div>
            <div className={styles.guideContent}>
              <div className={styles.guideTitle}>역할 구분</div>
              <div className={styles.guideText}>
                조회자는 읽기만, 편집자는 수정 가능, 관리자는 모든 권한을 가집니다.
              </div>
            </div>
          </div>

          <div className={styles.guideItem}>
            <div className={styles.guideIcon}>
              <Icon type={IconType.LOCK} size="lg" variant="info" ariaLabel="보안 아이콘" />
            </div>
            <div className={styles.guideContent}>
              <div className={styles.guideTitle}>보안</div>
              <div className={styles.guideText}>
                민감한 정보가 포함된 기획서는 공개 설정을 해제하는 것을 권장합니다.
              </div>
            </div>
          </div>

          <div className={styles.guideItem}>
            <div className={styles.guideIcon}>
              <Icon type={IconType.COMMENT} size="lg" variant="success" ariaLabel="소통 아이콘" />
            </div>
            <div className={styles.guideContent}>
              <div className={styles.guideTitle}>소통</div>
              <div className={styles.guideText}>
                댓글 기능을 활용해 효율적인 피드백과 소통이 가능합니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}