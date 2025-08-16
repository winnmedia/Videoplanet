// =============================================================================
// FeedbackMessage Component - VideoPlanet 실시간 채팅 메시지 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useWebSocket } from '../hooks';

interface FeedbackMessageProps {
  projectId: string;
  currentUser: {
    email: string;
    nickname: string;
    rating: 'manager' | 'basic';
  } | null;
  onMessage?: (message: ChatMessage) => void;
}

/**
 * 실시간 채팅 메시지 컴포넌트
 * WebSocket을 통한 실시간 메시지 송수신
 */
const FeedbackMessage: React.FC<FeedbackMessageProps> = memo(({
  projectId,
  currentUser,
  onMessage,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebSocket 훅 사용
  const {
    connected,
    messages,
    sendMessage,
    reconnecting,
  } = useWebSocket({
    projectId,
    ...(onMessage && { onMessage }),
  });

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(() => {
    const trimmedText = inputText.trim();
    
    if (!connected) {
      alert('채팅 서버가 불안정합니다. 재접속 해주세요.');
      return;
    }

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!trimmedText) {
      return;
    }

    sendMessage({
      email: currentUser.email,
      nickname: currentUser.nickname,
      rating: currentUser.rating,
      message: trimmedText,
    });

    setInputText('');
    
    // 포커스를 다시 입력창으로 이동
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [inputText, connected, currentUser, sendMessage]);

  // Enter 키 처리
  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 메시지 목록 끝으로 스크롤
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }, []);

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 사용자 등급에 따른 표시 텍스트
  const getRatingText = useCallback((rating: string) => {
    return rating === 'manager' ? '관리자' : '일반';
  }, []);

  // 연결 상태 표시
  const getConnectionStatus = () => {
    if (reconnecting) return '재연결 중...';
    if (!connected) return '연결 끊김';
    return '연결됨';
  };

  return (
    <>
      {/* 연결 상태 표시 */}
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-indicator" aria-label={`채팅 상태: ${getConnectionStatus()}`}>
          {getConnectionStatus()}
        </span>
      </div>

      {/* 메시지 목록 */}
      <div className="comment" role="log" aria-live="polite" aria-label="채팅 메시지">
        <ul>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <li 
                key={`${message.id || index}-${message.email}-${index}`}
                className={`message-item ${message.email === currentUser?.email ? 'own-message' : ''}`}
              >
                <div className="flex align_center">
                  <div
                    className={
                      getRatingText(message.rating) === '관리자'
                        ? 'img_box admin'
                        : 'img_box basic'
                    }
                    aria-hidden="true"
                  />
                  <div className="txt_box">
                    <span className="name">
                      {message.nickname}
                      <small
                        className={
                          getRatingText(message.rating) === '관리자' ? 'admin' : 'basic'
                        }
                      >
                        ({getRatingText(message.rating)})
                      </small>
                    </span>
                    <span className="email">{message.email}</span>
                  </div>
                </div>
                <div className="comment_box">
                  {message.message}
                </div>
              </li>
            ))
          ) : (
            <li className="empty">
              <div className="empty-message">
                웹페이지를 닫을 경우 대화 내용은 저장되지 않습니다.
              </div>
            </li>
          )}
          
          {/* 스크롤 위치 참조 */}
          <div ref={messagesEndRef} />
        </ul>
      </div>

      {/* 메시지 입력 영역 */}
      {currentUser && (
        <div className="pr">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyUp={handleKeyUp}
              placeholder={connected ? "채팅 입력" : "연결 중..."}
              className="ty01"
              style={{ padding: '0 120px 0 15px' }}
              disabled={!connected || !currentUser}
              maxLength={1000}
              aria-label="채팅 메시지 입력"
              aria-describedby="send-button"
            />
            <button 
              id="send-button"
              onClick={handleSendMessage}
              disabled={!connected || !currentUser || !inputText.trim()}
              className="cert"
              aria-label="메시지 전송"
            >
              입력
            </button>
          </div>
          
          {/* 입력 상태 안내 */}
          {!connected && (
            <div className="input-status error" role="alert">
              채팅 서버 연결 중입니다. 잠시만 기다려주세요.
            </div>
          )}
          
          {connected && inputText.length > 900 && (
            <div className="input-status warning" role="alert">
              {1000 - inputText.length}자 남음
            </div>
          )}
        </div>
      )}

      {/* 로그인이 필요한 경우 */}
      {!currentUser && (
        <div className="login-required" role="alert">
          채팅에 참여하려면 로그인이 필요합니다.
        </div>
      )}

      {/* 접근성을 위한 안내 */}
      <div className="sr-only" aria-live="polite">
        {reconnecting && '채팅 서버에 재연결하고 있습니다.'}
        {!connected && !reconnecting && '채팅 서버 연결이 끊어졌습니다.'}
      </div>
    </>
  );
});

FeedbackMessage.displayName = 'FeedbackMessage';

export default FeedbackMessage;