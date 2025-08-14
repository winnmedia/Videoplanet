export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h2>페이지를 찾을 수 없습니다.</h2>
      <p>URL을 확인해주세요.</p>
    </div>
  )
}