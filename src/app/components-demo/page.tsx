'use client'

import { Button } from '@/shared/ui/Button/Button'
import styles from './page.module.scss'

export default function ComponentsDemoPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>VideoPlanet 컴포넌트 데모</h1>
        <p>버튼 클릭 애니메이션 및 인터랙션 테스트</p>
      </header>

      <section className={styles.section}>
        <h2>버튼 크기</h2>
        <div className={styles.buttonGroup}>
          <Button size="small">작은 버튼</Button>
          <Button size="medium">중간 버튼</Button>
          <Button size="large">큰 버튼</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>버튼 변형</h2>
        <div className={styles.buttonGroup}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>아이콘 버튼</h2>
        <div className={styles.buttonGroup}>
          <Button icon={<span>📊</span>} iconPosition="left">
            대시보드
          </Button>
          <Button icon={<span>📝</span>} iconPosition="left">
            기획하기
          </Button>
          <Button icon={<span>▶️</span>} iconPosition="right">
            재생
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>상태별 버튼</h2>
        <div className={styles.buttonGroup}>
          <Button loading>로딩 중...</Button>
          <Button disabled>비활성화</Button>
          <Button fullWidth>전체 너비 버튼</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>실제 사용 예시</h2>
        <div className={styles.actionExample}>
          <Button 
            variant="primary" 
            size="large"
            onClick={() => alert('영상 기획이 시작되었습니다!')}
            icon={<span>🎬</span>}
          >
            새 영상 기획 시작
          </Button>
          <Button 
            variant="secondary"
            onClick={() => alert('취소되었습니다')}
          >
            취소
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>애니메이션 테스트</h2>
        <p className={styles.description}>
          버튼을 클릭하면 리플 효과와 스케일 애니메이션이 동시에 작동합니다.
          호버 시 살짝 위로 올라가며 그림자가 나타납니다.
        </p>
        <div className={styles.animationTest}>
          <Button 
            variant="primary"
            size="large"
            onClick={() => console.log('클릭 애니메이션 테스트')}
          >
            클릭해보세요! ✨
          </Button>
        </div>
      </section>
    </div>
  )
}