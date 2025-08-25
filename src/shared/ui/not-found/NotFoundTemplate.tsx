'use client'

import Link from 'next/link'
import styles from './NotFoundTemplate.module.scss'
import { Button } from '@/shared/ui/Button/Button'

interface NotFoundTemplateProps {
  title?: string
  description?: string
  showSuggestions?: boolean
  customActions?: React.ReactNode
}

const suggestions = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/planning', label: '영상 기획', icon: '📝' },
  { href: '/projects', label: '프로젝트', icon: '🎬' },
  { href: '/feedback', label: '피드백', icon: '💬' }
]

export default function NotFoundTemplate({
  title = '페이지를 찾을 수 없습니다',
  description = '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
  showSuggestions = true,
  customActions
}: NotFoundTemplateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        
        {showSuggestions && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>다음 페이지를 찾고 계신가요?</p>
            <div className={styles.linkGrid}>
              {suggestions.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={styles.suggestionLink}
                >
                  <span className={styles.linkIcon}>{item.icon}</span>
                  <span className={styles.linkLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.actions}>
          {customActions || (
            <>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="medium">
                  홈으로 돌아가기
                </Button>
              </Link>
              <Button 
                onClick={() => window.history.back()}
                variant="ghost"
                size="medium"
              >
                이전 페이지로
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className={styles.illustration}>
        <svg viewBox="0 0 400 300" className={styles.svg}>
          <circle cx="200" cy="150" r="80" fill="#f0f4ff" />
          <path 
            d="M160 130 Q200 110 240 130" 
            stroke="#1631F8" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="170" cy="140" r="8" fill="#1631F8" />
          <circle cx="230" cy="140" r="8" fill="#1631F8" />
          <path 
            d="M160 180 Q200 160 240 180" 
            stroke="#1631F8" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
            transform="rotate(180 200 170)"
          />
        </svg>
      </div>
    </div>
  )
}