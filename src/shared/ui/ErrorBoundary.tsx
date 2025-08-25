'use client'

import React from 'react'
import { Button } from './Button/Button'
import styles from './ErrorBoundary.module.scss'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className={styles.errorBoundary}>
      <div className={styles.errorContent}>
        <h2>문제가 발생했습니다</h2>
        <p>페이지를 로드하는 중 오류가 발생했습니다.</p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className={styles.errorDetails}>
            <summary>오류 상세 정보</summary>
            <pre>{error.message}</pre>
          </details>
        )}
        
        <div className={styles.actions}>
          <Button
            onClick={resetError}
            variant="primary"
          >
            다시 시도
          </Button>
          
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="secondary"
          >
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      console.error('Production error:', error)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured:', error)
    setError(error)
  }, [])

  // Throw error to trigger error boundary
  if (error) {
    throw error
  }

  return { captureError, resetError }
}

export { ErrorBoundary, DefaultErrorFallback }
export type { ErrorBoundaryProps, ErrorFallbackProps }