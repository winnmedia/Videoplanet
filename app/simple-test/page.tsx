'use client'

export default function SimpleTestPage() {
  const handleClick = () => {
    alert('버튼이 작동합니다!')
    console.log('Button clicked!')
  }
  
  return (
    <div style={{ padding: '50px' }}>
      <h1>간단한 테스트</h1>
      <button onClick={handleClick}>
        클릭 테스트
      </button>
      <br /><br />
      <button onClick={() => alert('인라인 핸들러 작동!')}>
        인라인 클릭 테스트
      </button>
      <br /><br />
      <button onClick={() => window.location.href = '/login'}>
        window.location으로 이동
      </button>
    </div>
  )
}