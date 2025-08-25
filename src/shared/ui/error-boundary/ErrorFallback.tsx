'use client'

import { useEffect } from 'react'
import styles from './ErrorFallback.module.scss'
import { Button } from '@/shared/ui/Button/Button'
import { Icon, IconType } from '@/shared/ui/icons'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  type?: 'page' | 'component' | 'global'
}

interface ErrorMessage {
  title: string
  description: string
  iconType: IconType
  iconVariant: 'error' | 'warning'
}

export default function ErrorFallback({ 
  error, 
  reset, 
  type = 'page' 
}: ErrorFallbackProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error('Error caught by boundary:', error)
  }, [error])

  const getErrorMessage = (): ErrorMessage => {
    switch (type) {
      case 'global':
        return {
          title: '앗! 문제가 발생했습니다',
          description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          iconType: IconType.EXCLAMATION,
          iconVariant: 'error'
        }
      case 'component':
        return {
          title: '콘텐츠를 불러올 수 없습니다',
          description: '이 섹션을 표시하는 중 문제가 발생했습니다.',
          iconType: IconType.WARNING,
          iconVariant: 'warning'
        }
      default:
        return {
          title: '페이지를 불러올 수 없습니다',
          description: '요청하신 페이지를 표시하는 중 오류가 발생했습니다.',
          iconType: IconType.ERROR_CIRCLE,
          iconVariant: 'error'
        }
    }
  }

  const { title, description, iconType, iconVariant } = getErrorMessage()

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.icon}>
          <Icon 
            type={iconType} 
            size="xl" 
            variant={iconVariant}
            ariaLabel="오류 아이콘"
          />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className={styles.errorDetails}>
            <summary>에러 상세 정보 (개발 모드)</summary>
            <pre className={styles.errorStack}>
              {error.message}
              {error.stack && '\n\n' + error.stack}
              {error.digest && '\n\nDigest: ' + error.digest}
            </pre>
          </details>
        )}
        
        <div className={styles.actions}>
          <Button 
            onClick={reset}
            variant="primary"
            size="medium"
          >
            다시 시도
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="secondary"
            size="medium"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}