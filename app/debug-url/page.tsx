'use client';

import { API_BASE_URL, SOCKET_URL, APP_URL, getEnvironmentInfo } from '@/lib/config';

export default function DebugUrlPage() {
  const envInfo = getEnvironmentInfo();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔗 URL 설정 디버그 페이지</h1>
      
      <div style={{ background: '#f5f5f5', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>📋 현재 설정된 URL들</h2>
        <ul>
          <li><strong>API_BASE_URL:</strong> <code>{API_BASE_URL}</code></li>
          <li><strong>SOCKET_URL:</strong> <code>{SOCKET_URL}</code></li>
          <li><strong>APP_URL:</strong> <code>{APP_URL}</code></li>
        </ul>
      </div>

      <div style={{ background: '#e8f5e8', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>🔍 환경변수 원본 값들</h2>
        <ul>
          <li><strong>NEXT_PUBLIC_API_URL:</strong> <code>{process.env.NEXT_PUBLIC_API_URL || '(없음)'}</code></li>
          <li><strong>NEXT_PUBLIC_BACKEND_API_URL:</strong> <code>{process.env.NEXT_PUBLIC_BACKEND_API_URL || '(없음)'}</code></li>
          <li><strong>REACT_APP_BACKEND_API_URL:</strong> <code>{process.env.REACT_APP_BACKEND_API_URL || '(없음)'}</code></li>
          <li><strong>NODE_ENV:</strong> <code>{process.env.NODE_ENV}</code></li>
        </ul>
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>✅ URL 유효성 검사</h2>
        <ul>
          <li><strong>API URL 유효:</strong> {envInfo.validation.apiValid ? '✅' : '❌'}</li>
          <li><strong>Socket URL 유효:</strong> {envInfo.validation.socketValid ? '✅' : '❌'}</li>
          <li><strong>App URL 유효:</strong> {envInfo.validation.appValid ? '✅' : '❌'}</li>
        </ul>
      </div>

      <div style={{ background: '#d1ecf1', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>🌐 환경 정보</h2>
        <ul>
          <li><strong>개발 환경:</strong> {envInfo.isDevelopment ? '✅' : '❌'}</li>
          <li><strong>프로덕션 환경:</strong> {envInfo.isProduction ? '✅' : '❌'}</li>
        </ul>
      </div>

      <div style={{ background: '#f8d7da', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>🔧 원본 환경변수 값들</h2>
        <ul>
          <li><strong>원본 API URL:</strong> <code>{envInfo.raw.api}</code></li>
          <li><strong>원본 Socket URL:</strong> <code>{envInfo.raw.socket}</code></li>
          <li><strong>원본 App URL:</strong> <code>{envInfo.raw.app}</code></li>
        </ul>
      </div>

      <div style={{ background: '#d4edda', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>🧪 테스트 API 호출</h2>
        <button 
          onClick={async () => {
            try {
              console.log('API 호출 테스트 시작...');
              console.log('API_BASE_URL:', API_BASE_URL);
              
              const response = await fetch(`${API_BASE_URL}/users/check-health`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log('응답 상태:', response.status);
              console.log('응답 URL:', response.url);
              
              const text = await response.text();
              console.log('응답 내용:', text);
              
              alert(`API 호출 성공!\n상태: ${response.status}\nURL: ${response.url}`);
            } catch (error) {
              console.error('API 호출 실패:', error);
              const errorMessage = error instanceof Error ? error.message : String(error);
              alert(`API 호출 실패: ${errorMessage}`);
            }
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          API 호출 테스트 실행
        </button>
      </div>
    </div>
  );
}