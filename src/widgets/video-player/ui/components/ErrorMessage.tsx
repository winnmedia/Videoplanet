import React from 'react'
import styles from './components.module.scss'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer} role="alert">
      <div className={styles.errorContent}>
        <svg 
          className={styles.errorIcon} 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path 
            d="M12 8v4m0 4h.01" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        
        <h3 className={styles.errorTitle}>Video Error</h3>
        <p className={styles.errorMessage}>{message}</p>
        
        {onRetry && (
          <button 
            className={styles.retryButton}
            onClick={onRetry}
            aria-label="Retry loading video"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}