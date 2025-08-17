/**
 * 향상된 이메일 초대 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useProjects } from '../hooks/useProjects';
import projectsApi from '../api/projectsApi';
import type { InviteInputProps, ProjectInvitation } from '../types';

// 이메일 상태 타입
type EmailValidationStatus = 'idle' | 'valid' | 'invalid' | 'duplicate' | 'sending' | 'sent' | 'error';

interface EmailEntry {
  id: string;
  email: string;
  status: EmailValidationStatus;
  error?: string;
}

/**
 * 이메일 유효성 검사 (향상된 버전)
 */
const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: '이메일을 입력해주세요.' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식이 아닙니다.' };
  }

  if (email.length > 254) {
    return { isValid: false, error: '이메일이 너무 깁니다.' };
  }

  return { isValid: true };
};

/**
 * 대량 이메일 파싱 (쉼표, 세미콜론, 공백, 줄바꿈으로 구분)
 */
const parseEmails = (input: string): string[] => {
  return input
    .split(/[,;\s\n]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

/**
 * 향상된 이메일 초대 컴포넌트
 */
const EmailInvitation: React.FC<InviteInputProps> = memo(({
  project_id,
  set_current_project,
  pending_list,
  disabled = false,
}) => {
  const [emailEntries, setEmailEntries] = useState<EmailEntry[]>([
    { id: '1', email: '', status: 'idle' }
  ]);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const nextIdRef = useRef(2);
  const { fetchProject, inviteMember } = useProjects();

  // 이메일 엔트리 추가
  const addEmailEntry = useCallback(() => {
    const newEntry: EmailEntry = {
      id: nextIdRef.current.toString(),
      email: '',
      status: 'idle'
    };
    
    setEmailEntries(prev => [...prev, newEntry]);
    nextIdRef.current++;
  }, []);

  // 이메일 엔트리 제거
  const removeEmailEntry = useCallback((id: string) => {
    setEmailEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  // 이메일 변경 핸들러
  const handleEmailChange = useCallback((id: string, email: string) => {
    setEmailEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;

      const validation = validateEmail(email);
      let status: EmailValidationStatus = 'idle';
      let error: string | undefined;

      if (email.trim()) {
        if (!validation.isValid) {
          status = 'invalid';
          error = validation.error;
        } else {
          // 중복 체크
          const isDuplicate = pending_list.some(pend => pend.email === email) ||
            prev.some(e => e.id !== id && e.email === email);
          
          if (isDuplicate) {
            status = 'duplicate';
            error = '이미 존재하는 이메일입니다.';
          } else {
            status = 'valid';
          }
        }
      }

      return { ...entry, email, status, error: error || '' };
    }));
  }, [pending_list]);

  // 대량 이메일 추가 처리
  const handleBulkEmailAdd = useCallback(() => {
    if (!bulkInput.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    const emails = parseEmails(bulkInput);
    if (emails.length === 0) {
      toast.error('유효한 이메일이 없습니다.');
      return;
    }

    const newEntries: EmailEntry[] = emails.map((email, index) => {
      const validation = validateEmail(email);
      let status: EmailValidationStatus = 'idle';
      let error: string | undefined;

      if (!validation.isValid) {
        status = 'invalid';
        error = validation.error;
      } else {
        // 중복 체크
        const isDuplicate = pending_list.some(pend => pend.email === email) ||
          emailEntries.some(e => e.email === email);
        
        if (isDuplicate) {
          status = 'duplicate';
          error = '이미 존재하는 이메일입니다.';
        } else {
          status = 'valid';
        }
      }

      return {
        id: (nextIdRef.current + index).toString(),
        email,
        status,
        error: error || ''
      };
    });

    // 기존 빈 엔트리 제거
    setEmailEntries(prev => {
      const nonEmptyEntries = prev.filter(entry => entry.email.trim());
      return [...nonEmptyEntries, ...newEntries];
    });

    nextIdRef.current += emails.length;
    setBulkInput('');
    setShowBulkInput(false);

    toast.success(`${emails.length}개의 이메일이 추가되었습니다.`);
  }, [bulkInput, pending_list, emailEntries]);

  // 단일 이메일 초대 전송
  const sendSingleInvitation = useCallback(async (id: string) => {
    const entry = emailEntries.find(e => e.id === id);
    if (!entry || entry.status !== 'valid') return;

    try {
      setEmailEntries(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'sending' } : e
      ));

      await inviteMember(project_id, entry.email);

      setEmailEntries(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'sent' } : e
      ));

      // 프로젝트 정보 새로고침
      await fetchProject(project_id);

      toast.success(`${entry.email}에 초대를 보냈습니다.`);

      // 성공한 엔트리 제거 (선택사항)
      setTimeout(() => {
        setEmailEntries(prev => prev.filter(e => e.id !== id));
      }, 2000);

    } catch (error) {
      setEmailEntries(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'error', error: '전송 실패' } : e
      ));
    }
  }, [emailEntries, project_id, inviteMember, fetchProject]);

  // 모든 유효한 이메일 초대 전송 (대량 API 사용)
  const sendAllInvitations = useCallback(async () => {
    const validEntries = emailEntries.filter(entry => entry.status === 'valid');
    
    if (validEntries.length === 0) {
      toast.error('보낼 수 있는 유효한 이메일이 없습니다.');
      return;
    }

    const confirmed = window.confirm(`${validEntries.length}개의 이메일에 초대를 보내시겠습니까?`);
    if (!confirmed) return;

    try {
      setIsInviting(true);

      // 모든 유효한 이메일의 상태를 'sending'으로 변경
      setEmailEntries(prev => prev.map(entry => 
        entry.status === 'valid' ? { ...entry, status: 'sending' } : entry
      ));

      const emails = validEntries.map(entry => entry.email);
      
      // 대량 초대 API 호출
      const results = await projectsApi.inviteMultipleMembers(project_id, emails);

      // 결과에 따라 상태 업데이트
      setEmailEntries(prev => prev.map(entry => {
        if (results.successful.includes(entry.email)) {
          return { ...entry, status: 'sent' };
        } else if (results.failed.some(fail => fail.email === entry.email)) {
          const failedItem = results.failed.find(fail => fail.email === entry.email);
          return { 
            ...entry, 
            status: 'error', 
            error: failedItem?.error || '전송 실패' 
          };
        }
        return entry;
      }));

      // 프로젝트 정보 새로고침
      await fetchProject(project_id);

      // 결과 알림
      const { successful, failed } = results;
      if (successful.length > 0 && failed.length === 0) {
        toast.success(`${successful.length}개의 초대가 성공적으로 전송되었습니다.`);
      } else if (successful.length > 0 && failed.length > 0) {
        toast.warn(`${successful.length}개 성공, ${failed.length}개 실패했습니다.`);
        console.warn('실패한 초대:', failed);
      } else {
        toast.error('모든 초대 전송에 실패했습니다.');
        console.error('실패한 초대:', failed);
      }

      // 성공한 엔트리들 제거
      setTimeout(() => {
        setEmailEntries(prev => prev.filter(e => e.status !== 'sent'));
      }, 3000);

    } catch (error) {
      console.error('대량 초대 중 오류:', error);
      toast.error('초대 전송 중 오류가 발생했습니다.');
      
      // 에러 시 모든 sending 상태를 error로 변경
      setEmailEntries(prev => prev.map(entry => 
        entry.status === 'sending' ? { ...entry, status: 'error', error: '전송 실패' } : entry
      ));
    } finally {
      setIsInviting(false);
    }
  }, [emailEntries, project_id, fetchProject]);

  // 초대 취소
  const cancelInvitation = useCallback(async (invitation: ProjectInvitation) => {
    const confirmed = window.confirm(`${invitation.email}의 초대를 취소하시겠습니까?`);
    if (!confirmed) return;

    try {
      await projectsApi.cancelProjectInvitation(project_id, invitation.id);
      
      await fetchProject(project_id);
      toast.success('초대가 취소되었습니다.');
      
    } catch (error) {
      toast.error('초대 취소에 실패했습니다.');
    }
  }, [project_id, fetchProject]);

  // 키보드 접근성
  const handleKeyPress = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendSingleInvitation(id);
    }
  }, [sendSingleInvitation]);

  // 이메일 상태별 스타일 클래스
  const getStatusClass = (status: EmailValidationStatus): string => {
    switch (status) {
      case 'valid': return 'valid';
      case 'invalid': 
      case 'duplicate': 
      case 'error': return 'error';
      case 'sending': return 'sending';
      case 'sent': return 'sent';
      default: return '';
    }
  };

  // 이메일 상태별 아이콘
  const getStatusIcon = (status: EmailValidationStatus): string => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'invalid': 
      case 'duplicate': 
      case 'error': return 'Error';
      case 'sending': return 'Sending';
      case 'sent': return 'Sent';
      default: return '';
    }
  };

  return (
    <div className="email-invitation-container">
      {/* 대기중인 초대 목록 */}
      {pending_list.length > 0 && (
        <div className="pending-invitations mb20">
          <h4 className="section-title">초대 대기중</h4>
          {pending_list.map((invitation) => (
            <div key={`pending-${invitation.id}`} className="invitation-item pending">
              <div className="email-display">
                <span className="email">{invitation.email}</span>
                <span className="status-badge pending">대기중</span>
              </div>
              <div className="actions">
                <span className="invite-date">
                  {new Date(invitation.invited_date).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => cancelInvitation(invitation)}
                  disabled={disabled}
                  aria-label={`${invitation.email} 초대 취소`}
                >
                  취소
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 새 초대 섹션 */}
      <div className="new-invitations">
        <div className="section-header">
          <h4 className="section-title">새 멤버 초대</h4>
          <div className="header-actions">
            <button
              type="button"
              className="btn-bulk"
              onClick={() => setShowBulkInput(!showBulkInput)}
              disabled={disabled}
            >
              {showBulkInput ? '단일 입력' : '대량 입력'}
            </button>
            {emailEntries.some(e => e.status === 'valid') && (
              <button
                type="button"
                className="btn-send-all"
                onClick={sendAllInvitations}
                disabled={disabled || isInviting}
              >
                {isInviting ? '전송중...' : '모두 보내기'}
              </button>
            )}
          </div>
        </div>

        {/* 대량 이메일 입력 */}
        {showBulkInput && (
          <div className="bulk-input-section mb20">
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="bulk-textarea"
              placeholder="여러 이메일을 입력하세요. 쉼표, 세미콜론, 공백, 줄바꿈으로 구분됩니다.&#10;예: user1@example.com, user2@example.com&#10;user3@example.com"
              rows={4}
              disabled={disabled}
            />
            <div className="bulk-actions">
              <button
                type="button"
                className="btn-add-bulk"
                onClick={handleBulkEmailAdd}
                disabled={disabled || !bulkInput.trim()}
              >
                이메일 추가
              </button>
            </div>
          </div>
        )}

        {/* 개별 이메일 입력 필드들 */}
        <div className="email-entries">
          {emailEntries.map((entry) => (
            <div key={entry.id} className={`email-entry ${getStatusClass(entry.status)}`}>
              <div className="input-group">
                <input
                  type="email"
                  value={entry.email}
                  onChange={(e) => handleEmailChange(entry.id, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, entry.id)}
                  className="email-input"
                  placeholder="이메일 주소 입력"
                  disabled={disabled || entry.status === 'sending' || entry.status === 'sent'}
                  aria-label={`멤버 초대 이메일 입력`}
                />
                
                <div className="status-indicator" aria-label={`상태: ${entry.status}`}>
                  {getStatusIcon(entry.status)}
                </div>
                
                <button
                  type="button"
                  className="btn-send"
                  onClick={() => sendSingleInvitation(entry.id)}
                  disabled={
                    disabled || 
                    entry.status !== 'valid' ||
                    ['sending', 'sent'].includes(entry.status)
                  }
                  aria-label="초대 보내기"
                >
                  {entry.status === 'sending' ? '전송중' : '보내기'}
                </button>

                {emailEntries.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeEmailEntry(entry.id)}
                    disabled={disabled || entry.status === 'sending'}
                    aria-label="입력 필드 제거"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* 에러 메시지 */}
              {entry.error && (
                <div className="error-message" role="alert">
                  {entry.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 입력 필드 추가 버튼 */}
        <button
          type="button"
          className="btn-add-entry"
          onClick={addEmailEntry}
          disabled={disabled}
          aria-label="새 이메일 입력 필드 추가"
        >
          + 이메일 추가
        </button>

        {/* 도움말 */}
        <div className="help-text">
          <small>
            • 이메일 주소를 정확히 입력하고 '보내기'를 클릭하세요.<br/>
            • Enter 키로도 초대를 보낼 수 있습니다.<br/>
            • 대량 입력 시 여러 이메일을 한 번에 추가할 수 있습니다.
          </small>
        </div>
      </div>
    </div>
  );
});

EmailInvitation.displayName = 'EmailInvitation';

export default EmailInvitation;