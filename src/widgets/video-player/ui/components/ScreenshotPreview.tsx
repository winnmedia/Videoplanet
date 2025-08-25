import React from 'react'
import styles from './components.module.scss'

interface ScreenshotPreviewProps {
  imageData: string
  onDownload: () => void
  onClose: () => void
}

export const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({ 
  imageData, 
  onDownload, 
  onClose 
}) => {
  return (
    <div className={styles.previewOverlay} data-testid="screenshot-preview">
      <div className={styles.previewContent}>
        <div className={styles.previewHeader}>
          <h3>Screenshot Captured</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close screenshot preview"
          >
            ×
          </button>
        </div>

        <div className={styles.previewBody}>
          <img 
            src={imageData} 
            alt="Video screenshot" 
            className={styles.previewImage}
          />
        </div>

        <div className={styles.previewActions}>
          <button 
            className={styles.downloadButton}
            onClick={onDownload}
            aria-label="Download screenshot"
          >
            Download Screenshot
          </button>
          <button 
            className={styles.copyButton}
            onClick={() => {
              // Copy image to clipboard (modern browsers)
              fetch(imageData)
                .then(res => res.blob())
                .then(blob => {
                  const item = new ClipboardItem({ 'image/png': blob })
                  navigator.clipboard.write([item])
                    .then(() => alert('Screenshot copied to clipboard'))
                    .catch(() => alert('Failed to copy screenshot'))
                })
            }}
            aria-label="Copy screenshot to clipboard"
          >
            Copy to Clipboard
          </button>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            aria-label="Close preview"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}