'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import styles from './PageTemplate.module.scss'

export interface PageTemplateProps {
  children: ReactNode
  user?: {
    name: string
    email: string
  }
  header?: boolean
  ariaLabel?: string
  skipLinkTarget?: string
}

export function PageTemplate({ 
  children, 
  user, 
  header = true,
  ariaLabel = '페이지 템플릿',
  skipLinkTarget = '#main-content'
}: PageTemplateProps) {
  return (
    <div 
      className={styles.pageTemplate}
      role="document"
      aria-label={ariaLabel}
    >
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href={skipLinkTarget}
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const target = document.querySelector(skipLinkTarget)
            if (target) {
              (target as HTMLElement).focus()
              target.scrollIntoView()
            }
          }
        }}
      >
        본문으로 바로가기
      </a>
      
      {header && <Header user={user} />}
      
      <main 
        id="main-content"
        role="main"
        aria-label="메인 콘텐츠"
        tabIndex={-1}
        className={styles.mainContent}
      >
        {children}
      </main>
    </div>
  )
}