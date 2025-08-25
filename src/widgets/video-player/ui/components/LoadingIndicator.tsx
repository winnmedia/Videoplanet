import React from 'react'
import styles from './components.module.scss'

export const LoadingIndicator: React.FC = () => {
  return (
    <div className={styles.loadingContainer} data-testid="video-loading-indicator">
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle}></div>
        <div className={styles.spinnerCircle}></div>
        <div className={styles.spinnerCircle}></div>
      </div>
      <p className={styles.loadingText}>Loading video...</p>
    </div>
  )
}