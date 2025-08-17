/**
 * Global Error Component
 * VideoPlanet 프로젝트 - 전역 에러 컴포넌트
 */

'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 (필요시 외부 서비스로 전송)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">[경고]</div>
        <h2 className="error-title">오류가 발생했습니다</h2>
        <p className="error-message">
          죄송합니다. 예상치 못한 오류가 발생했습니다.
        </p>
        
        {/* 개발 환경에서만 에러 상세 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>에러 상세 정보</summary>
            <pre className="error-stack">{error.message}</pre>
            {error.stack && (
              <pre className="error-stack">{error.stack}</pre>
            )}
          </details>
        )}
        
        <div className="error-actions">
          <button
            onClick={reset}
            className="submit retry-button"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="submit home-button"
          >
            홈으로 이동
          </button>
        </div>
      </div>
      
      <style>{`
        .error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          padding: 40px 20px;
          background: #f9f9f9;
        }
        
        .error-content {
          text-align: center;
          background: #fff;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .error-title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
        }
        
        .error-message {
          font-size: 16px;
          color: #666;
          margin-bottom: 25px;
          line-height: 1.5;
        }
        
        .error-details {
          margin: 20px 0;
          text-align: left;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
        }
        
        .error-details summary {
          cursor: pointer;
          font-weight: 600;
          color: #dc3545;
          margin-bottom: 10px;
        }
        
        .error-stack {
          background: #2d3748;
          color: #fff;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .retry-button {
          background: #1631F8;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .retry-button:hover {
          background: #0f26cc;
          transform: translateY(-1px);
        }
        
        .retry-button:active {
          transform: scale(0.95);
        }
        
        .home-button {
          background: #6c757d;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .home-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
        
        .home-button:active {
          transform: scale(0.95);
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .error-container {
            padding: 20px;
          }
          
          .error-content {
            padding: 30px 20px;
          }
          
          .error-title {
            font-size: 20px;
          }
          
          .error-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .retry-button,
          .home-button {
            width: 200px;
          }
        }
        
        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .error-container {
            background: #1a1a1a;
          }
          
          .error-content {
            background: #2a2a2a;
            color: #fff;
          }
          
          .error-title {
            color: #fff;
          }
          
          .error-message {
            color: #ccc;
          }
          
          .error-details {
            background: #3a3a3a;
          }
        }
        
        /* 접근성 개선 */
        @media (prefers-reduced-motion: reduce) {
          .retry-button,
          .home-button {
            transition: none;
          }
          
          .retry-button:hover,
          .home-button:hover {
            transform: none;
          }
          
          .retry-button:active,
          .home-button:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}