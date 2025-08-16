'use client'

import { useRouter } from 'next/navigation'

export default function TestButtonPage() {
  const router = useRouter()
  
  const handleClick = () => {
    console.log('버튼 클릭됨!')
    alert('버튼이 작동합니다!')
    router.push('/login')
  }
  
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>버튼 테스트 페이지</h1>
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1631F8',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        로그인 페이지로 이동
      </button>
      <br /><br />
      <p>이 버튼을 클릭하면:</p>
      <ol style={{ textAlign: 'left', display: 'inline-block' }}>
        <li>콘솔에 메시지가 출력됩니다</li>
        <li>알림창이 뜹니다</li>
        <li>로그인 페이지로 이동합니다</li>
      </ol>
    </div>
  )
}