/**
 * Global Loading Component
 * VideoPlanet 프로젝트 - 전역 로딩 컴포넌트
 */

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '40px 20px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1631F8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
      <p style={{
        fontSize: '16px',
        color: '#666',
        margin: 0
      }}>
        페이지를 불러오는 중...
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          p {
            color: #ccc !important;
          }
          
          div[style*="border-top: 4px solid #1631F8"] {
            border-color: #444 !important;
            border-top-color: #1631F8 !important;
          }
        }
        
        /* 애니메이션 축소 지원 */
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation: spin"] {
            animation: none !important;
            border-color: #1631F8 !important;
          }
        }
      `}</style>
    </div>
  );
}