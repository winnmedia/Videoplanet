'use client'

import { useEffect, useState } from 'react'

export default function DebugTestPage() {
  const [mounted, setMounted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  useEffect(() => {
    setMounted(true)
    
    // 전역 에러 캐치
    const handleError = (e: ErrorEvent) => {
      setErrors(prev => [...prev, `Error: ${e.message}`])
    }
    
    const handleRejection = (e: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, `Promise rejection: ${e.reason}`])
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    
    // Redux 상태 확인
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      console.log('Redux DevTools detected')
    }
    
    // React 버전 확인
    const React = require('react')
    console.log('React version:', React.version)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
  
  // 테스트 함수들
  const testBasicClick = () => {
    console.log('Basic click works!')
    alert('Basic click works!')
  }
  
  const testNavigation = () => {
    console.log('Testing navigation...')
    window.location.href = '/login'
  }
  
  const testRouter = async () => {
    console.log('Testing Next.js router...')
    try {
      const { useRouter } = await import('next/navigation')
      const router = useRouter()
      router.push('/login')
    } catch (err) {
      console.error('Router error:', err)
      setErrors(prev => [...prev, `Router error: ${err}`])
    }
  }
  
  return (
    <div style={{ padding: '50px', fontFamily: 'monospace' }}>
      <h1>🔍 디버그 테스트 페이지</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>시스템 상태</h2>
        <p>✅ Hydration: {mounted ? '완료' : '대기중'}</p>
        <p>✅ JavaScript: 실행중</p>
        <p>✅ 시간: {new Date().toLocaleTimeString()}</p>
      </div>
      
      {errors.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          <h2 style={{ color: '#c62828' }}>⚠️ 발견된 에러</h2>
          {errors.map((err, i) => (
            <p key={i} style={{ color: '#c62828' }}>{err}</p>
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2>테스트 버튼</h2>
        
        <button
          onClick={testBasicClick}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          1. Basic Click Test (Alert)
        </button>
        
        <button
          onClick={testNavigation}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          2. Window.location Test (로그인 페이지로)
        </button>
        
        <button
          onClick={testRouter}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          3. Next.js Router Test (로그인 페이지로)
        </button>
        
        <button
          onClick={() => {
            const result = eval('1 + 1')
            alert(`JavaScript eval test: 1 + 1 = ${result}`)
          }}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          4. JavaScript Eval Test
        </button>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h2>브라우저 콘솔 명령어</h2>
        <pre style={{ backgroundColor: '#263238', color: '#aed581', padding: '15px', borderRadius: '5px' }}>
{`// 다음 명령어를 브라우저 콘솔에서 실행하세요:

// 1. 모든 버튼 찾기
document.querySelectorAll('button')

// 2. 첫 번째 버튼 클릭
document.querySelector('button').click()

// 3. 이벤트 리스너 확인
getEventListeners(document.querySelector('button'))

// 4. React 컴포넌트 확인
document.querySelector('button')._reactInternalInstance

// 5. 직접 네비게이션
window.location.href = '/login'`}
        </pre>
      </div>
    </div>
  )
}