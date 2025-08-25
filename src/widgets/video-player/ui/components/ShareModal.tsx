import React, { useState } from 'react'
import styles from './components.module.scss'

interface ShareModalProps {
  onClose: () => void
  onShare: (includeTimestamp: boolean) => void
  currentTime: number
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  onClose, 
  onShare, 
  currentTime 
}) => {
  const [includeTimestamp, setIncludeTimestamp] = useState(false)
  const shareUrl = window.location.href
  const finalUrl = includeTimestamp 
    ? `${shareUrl}?t=${Math.floor(currentTime)}`
    : shareUrl

  const handleCopyLink = () => {
    onShare(includeTimestamp)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.modalOverlay} data-testid="share-modal">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Share Video</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close share modal"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.urlPreview}>
            <input 
              type="text" 
              value={finalUrl} 
              readOnly 
              className={styles.urlInput}
              aria-label="Share URL"
            />
          </div>

          <div className={styles.options}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                aria-label="Include timestamp"
              />
              <span>Include timestamp ({formatTime(currentTime)})</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.primaryButton}
              onClick={handleCopyLink}
              aria-label="Copy link"
            >
              Copy Link
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={() => onShare(true)}
              aria-label="Share with timestamp"
            >
              Share with Timestamp
            </button>
          </div>

          <div className={styles.shareOptions}>
            <h4>Share via:</h4>
            <div className={styles.socialButtons}>
              <button 
                className={styles.socialButton}
                aria-label="Share via email"
                onClick={() => {
                  window.location.href = `mailto:?subject=Check out this video&body=${encodeURIComponent(finalUrl)}`
                }}
              >
                Email
              </button>
              <button 
                className={styles.socialButton}
                aria-label="Share on Twitter"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(finalUrl)}`, '_blank')
                }}
              >
                Twitter
              </button>
              <button 
                className={styles.socialButton}
                aria-label="Share on LinkedIn"
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalUrl)}`, '_blank')
                }}
              >
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}