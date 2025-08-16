/**
 * 프로젝트 멤버 초대 입력 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useProjects } from '../hooks/useProjects';
import type { InviteInputProps } from '../types';

/**
 * 이메일 유효성 검사
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 프로젝트 멤버 초대 입력 컴포넌트
 */
const InviteInput: React.FC<InviteInputProps> = memo(({
  project_id,
  set_current_project,
  pending_list,
  disabled = false,
}) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  
  const { fetchProject, inviteMember } = useProjects();

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  }, [emails]);

  // 입력 필드 추가
  const addInput = useCallback(() => {
    setEmails(prev => [...prev, '']);
  }, []);

  // 입력 필드 제거
  const removeInput = useCallback((index: number) => {
    if (emails.length <= 1) return;
    
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
  }, [emails]);

  // 초대 전송
  const sendInvitation = useCallback(async (index: number, email: string) => {
    if (!email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 이미 초대된 이메일인지 확인
    const isAlreadyInvited = pending_list.some(pend => pend.email === email);
    if (isAlreadyInvited) {
      toast.error('이미 초대된 이메일입니다.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [index]: true }));
      
      await inviteMember(project_id, email);
      
      // 입력 필드 초기화
      handleInputChange(index, '');
      
      // 프로젝트 정보 새로고침
      await fetchProject(project_id);
      
    } catch (error) {
      // 에러는 useProjects에서 처리됨
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  }, [project_id, pending_list, inviteMember, fetchProject, set_current_project, handleInputChange]);

  // 초대 취소
  const cancelInvitation = useCallback(async (invitationId: number) => {
    const confirmed = window.confirm('초대를 취소하시겠습니까?');
    if (!confirmed) return;

    try {
      // TODO: 초대 취소 API 구현
      // await cancelProjectInvitation(project_id, invitationId);
      
      // 임시로 직접 API 호출
      const { cancelProjectInvitation } = await import('../api/projectsApi');
      await cancelProjectInvitation(project_id, invitationId);
      
      // 프로젝트 정보 새로고침
      await fetchProject(project_id);
      
      toast.success('초대가 취소되었습니다.');
      
    } catch (error) {
      toast.error('초대 취소에 실패했습니다.');
    }
  }, [project_id, fetchProject, set_current_project]);

  // 키보드 접근성 핸들러
  const handleKeyPress = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    email: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendInvitation(index, email);
    }
  }, [sendInvitation]);

  return (
    <div className="invite-input-container">
      {/* 대기중인 초대 목록 */}
      {pending_list.map((invitation, index) => (
        <div key={`pending-${invitation.id}`} className="pr mt10">
          <input
            type="email"
            value={invitation.email}
            className="ty01 pending"
            placeholder="이메일 입력"
            readOnly
            aria-label={`초대 대기중인 이메일: ${invitation.email}`}
          />
          <span className="pend" aria-label="초대 상태">
            초대됨
          </span>
          <button
            type="button"
            className="del"
            onClick={() => cancelInvitation(invitation.id)}
            disabled={disabled}
            aria-label={`${invitation.email} 초대 취소`}
          >
            삭제
          </button>
        </div>
      ))}

      {/* 새 초대 입력 필드들 */}
      {emails.map((email, index) => (
        <div key={`email-${index}`} className="pr mt10">
          <input
            type="email"
            value={email}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, index, email)}
            className="ty01"
            placeholder="이메일 입력"
            disabled={disabled}
            aria-label={`멤버 초대 이메일 ${index + 1}`}
            aria-describedby={`email-help-${index}`}
          />
          
          <button
            type="button"
            className="cert"
            onClick={() => sendInvitation(index, email)}
            disabled={disabled || loading[index] || !email.trim()}
            aria-label="초대 보내기"
          >
            {loading[index] ? '전송중...' : '보내기'}
          </button>
          
          {emails.length > 1 && (
            <button
              type="button"
              className="del"
              onClick={() => removeInput(index)}
              disabled={disabled}
              aria-label="입력 필드 삭제"
            >
              삭제
            </button>
          )}
          
          <div id={`email-help-${index}`} className="sr-only">
            Enter 키를 눌러서 초대를 보낼 수 있습니다.
          </div>
        </div>
      ))}

      {/* 멤버 추가 버튼 */}
      <button
        type="button"
        className="add"
        onClick={addInput}
        disabled={disabled}
        aria-label="새 멤버 초대 필드 추가"
      >
        + 멤버 추가
      </button>

      {/* 도움말 텍스트 */}
      <div className="invite-help mt10">
        <small>
          올바른 이메일 주소를 입력하고 '보내기'를 클릭하면 초대 메일이 발송됩니다.
        </small>
      </div>
    </div>
  );
});

InviteInput.displayName = 'InviteInput';

export default InviteInput;