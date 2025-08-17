/**
 * 404 Not Found Page
 * VideoPlanet 프로젝트 - 404 페이지
 */

'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">[검색]</div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">페이지를 찾을 수 없습니다</h2>
        <p className="not-found-message">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        
        <div className="not-found-actions">
          <Link href="/" className="submit home-link">
            홈으로 이동
          </Link>
          <button
            onClick={() => window.history.back()}
            className="submit back-button"
          >
            이전 페이지
          </button>
        </div>
        
        <div className="helpful-links">
          <h3>자주 찾는 페이지</h3>
          <ul>
            <li><Link href="/login">로그인</Link></li>
            <li><Link href="/projects">프로젝트 관리</Link></li>
            <li><Link href="/calendar">전체 일정</Link></li>
            <li><Link href="/dashboard">대시보드</Link></li>
          </ul>
        </div>
      </div>
      
      <style>{`
        .not-found-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .not-found-content {
          text-align: center;
          background: #fff;
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }
        
        .not-found-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        
        .not-found-title {
          font-size: 72px;
          font-weight: bold;
          color: #1631F8;
          margin-bottom: 10px;
          line-height: 1;
        }
        
        .not-found-subtitle {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin-bottom: 15px;
        }
        
        .not-found-message {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        
        .not-found-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        
        .home-link,
        .back-button {
          background: #1631F8;
          color: #fff;
          text-decoration: none;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-block;
        }
        
        .home-link:hover,
        .back-button:hover {
          background: #0f26cc;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22, 49, 248, 0.3);
        }
        
        .home-link:active,
        .back-button:active {
          transform: scale(0.95);
        }
        
        .back-button {
          background: #6c757d;
        }
        
        .back-button:hover {
          background: #5a6268;
          box-shadow: 0 6px 20px rgba(108, 117, 125, 0.3);
        }
        
        .helpful-links {
          border-top: 1px solid #eee;
          padding-top: 30px;
        }
        
        .helpful-links h3 {
          font-size: 18px;
          color: #333;
          margin-bottom: 15px;
        }
        
        .helpful-links ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .helpful-links li {
          margin-bottom: 8px;
        }
        
        .helpful-links a {
          color: #1631F8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }
        
        .helpful-links a:hover {
          color: #0f26cc;
          text-decoration: underline;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .not-found-container {
            padding: 20px;
          }
          
          .not-found-content {
            padding: 40px 25px;
          }
          
          .not-found-title {
            font-size: 56px;
          }
          
          .not-found-subtitle {
            font-size: 24px;
          }
          
          .not-found-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .home-link,
          .back-button {
            width: 200px;
          }
        }
        
        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .not-found-container {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
          
          .not-found-content {
            background: #2a2a2a;
            color: #fff;
          }
          
          .not-found-subtitle {
            color: #fff;
          }
          
          .not-found-message {
            color: #ccc;
          }
          
          .helpful-links {
            border-top-color: #444;
          }
          
          .helpful-links h3 {
            color: #fff;
          }
        }
        
        /* 접근성 개선 */
        @media (prefers-reduced-motion: reduce) {
          .home-link,
          .back-button {
            transition: none;
          }
          
          .home-link:hover,
          .back-button:hover {
            transform: none;
          }
          
          .home-link:active,
          .back-button:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}