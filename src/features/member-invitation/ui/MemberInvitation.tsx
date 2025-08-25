'use client'

import React, { useState, useCallback } from 'react'
import styles from './MemberInvitation.module.scss'

interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  sentAt: string
  role: 'viewer' | 'commenter' | 'editor' | 'admin'
  invitedBy: string
  lastSentAt?: string
  resendCount: number
}

interface MemberInvitationProps {
  invitations: Invitation[]
  onSendInvitation: (email: string, role: string) => void
  onResendInvitation: (invitationId: string) => void
  onRevokeInvitation: (invitationId: string) => void
  isLoading?: boolean
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: '뷰어', description: '영상 시청만 가능' },
  { value: 'commenter', label: '코멘터', description: '영상 시청 및 코멘트 작성 가능' },
  { value: 'editor', label: '편집자', description: '영상 편집 및 코멘트 작성 가능' },
  { value: 'admin', label: '관리자', description: '모든 권한 보유' }
]

export function MemberInvitation({
  invitations,
  onSendInvitation,
  onResendInvitation,
  onRevokeInvitation,
  isLoading = false
}: MemberInvitationProps) {
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('commenter')
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [bulkEmails, setBulkEmails] = useState('')

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSingleInvite = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) return

    onSendInvitation(email, selectedRole)
    setEmail('')
  }, [email, selectedRole, onSendInvitation])

  const handleBulkInvite = useCallback(() => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email))

    emails.forEach(email => {
      onSendInvitation(email, selectedRole)
    })

    setBulkEmails('')
    setShowBulkInvite(false)
  }, [bulkEmails, selectedRole, onSendInvitation])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '대기중', class: styles.pending },
      accepted: { label: '수락됨', class: styles.accepted },
      declined: { label: '거절됨', class: styles.declined },
      expired: { label: '만료됨', class: styles.expired }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap]
    return (
      <span className={`${styles.statusBadge} ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(option => option.value === role)
    return roleOption ? roleOption.label : role
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canResend = (invitation: Invitation) => {
    if (invitation.status !== 'pending') return false
    if (!invitation.lastSentAt) return true
    
    const lastSent = new Date(invitation.lastSentAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff >= 1 // Can resend after 1 hour
  }

  return (
    <div className={styles.memberInvitation}>
      <div className={styles.header}>
        <h3 className={styles.title}>멤버 초대</h3>
        <div className={styles.summary}>
          총 {invitations.length}개의 초대 • 
          수락됨 {invitations.filter(i => i.status === 'accepted').length}개 • 
          대기중 {invitations.filter(i => i.status === 'pending').length}개
        </div>
      </div>

      {/* Single Invitation Form */}
      <div className={styles.inviteForm}>
        <form onSubmit={handleSingleInvite} className={styles.singleInvite}>
          <div className={styles.inputGroup}>
            <div className={styles.emailInput}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.roleSelect}>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={styles.select}
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className={styles.inviteButton}
              disabled={!email || !isValidEmail(email) || isLoading}
            >
              {isLoading ? '전송중...' : '초대 보내기'}
            </button>
          </div>

          <div className={styles.roleDescription}>
            {ROLE_OPTIONS.find(r => r.value === selectedRole)?.description}
          </div>
        </form>

        {/* Bulk Invite Toggle */}
        <div className={styles.bulkInviteToggle}>
          <button
            type="button"
            onClick={() => setShowBulkInvite(!showBulkInvite)}
            className={styles.toggleButton}
          >
            {showBulkInvite ? '단일 초대로 전환' : '다수 초대'}
          </button>
        </div>

        {/* Bulk Invitation Form */}
        {showBulkInvite && (
          <div className={styles.bulkInvite}>
            <div className={styles.bulkHeader}>
              <h4>다수 멤버 초대</h4>
              <p>여러 이메일을 한 번에 입력하세요 (줄바꿈, 쉼표, 세미콜론으로 구분)</p>
            </div>
            
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder={`user1@example.com\nuser2@example.com\nuser3@example.com`}
              className={styles.bulkTextarea}
              rows={5}
            />
            
            <div className={styles.bulkActions}>
              <span className={styles.emailCount}>
                {bulkEmails.split(/[\n,;]/).filter(email => 
                  email.trim() && isValidEmail(email.trim())
                ).length}개의 유효한 이메일
              </span>
              
              <button
                type="button"
                onClick={handleBulkInvite}
                className={styles.bulkInviteButton}
                disabled={!bulkEmails.trim() || isLoading}
              >
                {isLoading ? '전송중...' : '일괄 초대'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invitations List */}
      <div className={styles.invitationsList}>
        <div className={styles.listHeader}>
          <h4>초대 내역</h4>
        </div>

        {invitations.length > 0 ? (
          <div className={styles.invitationsTable}>
            {invitations.map((invitation) => (
              <div key={invitation.id} className={styles.invitationRow}>
                <div className={styles.invitationInfo}>
                  <div className={styles.emailInfo}>
                    <span className={styles.email}>{invitation.email}</span>
                    {getStatusBadge(invitation.status)}
                  </div>
                  
                  <div className={styles.invitationMeta}>
                    <span className={styles.role}>
                      {getRoleLabel(invitation.role)}
                    </span>
                    <span className={styles.sentDate}>
                      {formatDate(invitation.sentAt)}에 전송
                    </span>
                    {invitation.resendCount > 0 && (
                      <span className={styles.resendCount}>
                        재전송 {invitation.resendCount}회
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.invitationActions}>
                  {invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onResendInvitation(invitation.id)}
                        disabled={!canResend(invitation) || isLoading}
                        className={styles.resendButton}
                        title={canResend(invitation) ? '초대 재전송' : '1시간 후 재전송 가능'}
                      >
RESEND
                      </button>
                      
                      <button
                        onClick={() => onRevokeInvitation(invitation.id)}
                        className={styles.revokeButton}
                        title="초대 취소"
                      >
CANCEL
                      </button>
                    </>
                  )}
                  
                  {invitation.status === 'accepted' && (
                    <span className={styles.acceptedLabel}>JOINED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>INVITE</div>
            <p>아직 보낸 초대가 없습니다.</p>
            <p>팀원을 초대하여 협업을 시작하세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}