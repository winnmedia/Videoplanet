'use client'

import { useRouter } from 'next/navigation'
import styles from './Header.module.scss'

interface HeaderProps {
  user?: {
    name: string
    email: string
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    router.push('/dashboard')
  }

  const handleLogoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleLogoClick()
    }
  }

  return (
    <header className={styles.header} role="banner" aria-label="사이트 헤더">
      <nav className={styles.logo} role="navigation" aria-label="메인 네비게이션">
        <img
          src="/images/Common/b_logo.svg"
          alt="브이래닛 로고 - 대시보드로 이동"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
          style={{ cursor: 'pointer' }}
          tabIndex={0}
          role="button"
          aria-label="대시보드로 이동"
        />
      </nav>
      
      <div className={styles.actions}>
        {user && (
          <div 
            className={styles.profile}
            role="region"
            aria-label="사용자 정보"
          >
            <div 
              className={styles.nick}
              aria-label={`사용자 이름: ${user.name}`}
              title={user.name}
            >
              {user.name.substr(0, 1)}
            </div>
            <div 
              className={styles.mail}
              aria-label={`이메일 주소: ${user.email}`}
            >
              {user.email}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}