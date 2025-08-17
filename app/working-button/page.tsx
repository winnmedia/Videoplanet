'use client'

import { useState, useEffect } from 'react'

export default function WorkingButtonPage() {
  const [mounted, setMounted] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  
  // Hydration 완료 확인
  useEffect(() => {
    setMounted(true)
    console.log('Component mounted and hydrated')
  }, [])
  
  // 다양한 방식의 버튼 테스트
  const handleRouterPush = () => {
    console.log('Router push attempted')
    // router import 없이 테스트
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  
  const handleDirectNavigation = () => {
    console.log('Direct navigation')
    window.location.href = '/login'
  }
  
  const handleCount = () => {
    console.log('Count button clicked')
    setClickCount(prev => prev + 1)
  }
  
  return (
    <div style={{ padding: '50px', fontFamily: 'system-ui' }}>
      <h1>작동하는 버튼 테스트</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Hydration 상태: {mounted ? '[OK] 완료' : '[LOADING] 대기중'}</p>
        <p>클릭 횟수: {clickCount}</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        {/* 1. 기본 카운터 버튼 */}
        <button 
          onClick={handleCount}
          style={{
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          카운터 증가 (현재: {clickCount})
        </button>
        
        {/* 2. Alert 테스트 */}
        <button 
          onClick={() => alert('알림이 작동합니다!')}
          style={{
            padding: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Alert 테스트
        </button>
        
        {/* 3. Console 로그 테스트 */}
        <button 
          onClick={() => console.log('콘솔 로그 출력됨:', new Date().toISOString())}
          style={{
            padding: '10px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          콘솔 로그 테스트 (F12 확인)
        </button>
        
        {/* 4. 조건부 window.location */}
        <button 
          onClick={handleRouterPush}
          style={{
            padding: '10px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
          disabled={!mounted}
        >
          로그인 페이지로 (조건부)
        </button>
        
        {/* 5. 직접 window.location */}
        <button 
          onClick={handleDirectNavigation}
          style={{
            padding: '10px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          로그인 페이지로 (직접)
        </button>
        
        {/* 6. 인라인 핸들러 */}
        <button 
          onClick={() => {
            console.log('인라인 핸들러 작동')
            window.location.href = '/login'
          }}
          style={{
            padding: '10px',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          로그인 페이지로 (인라인)
        </button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>테스트 방법:</h3>
        <ol>
          <li>각 버튼을 클릭하여 작동 확인</li>
          <li>F12 → Console 탭에서 로그 확인</li>
          <li>카운터가 증가하는지 확인</li>
          <li>로그인 페이지로 이동되는지 확인</li>
        </ol>
        <p style={{ marginTop: '10px', color: '#666' }}>
          만약 이 버튼들이 작동한다면, 문제는 메인 페이지의 특정 코드에 있습니다.
        </p>
      </div>
    </div>
  )
}