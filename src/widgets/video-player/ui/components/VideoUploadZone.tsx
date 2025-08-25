import React, { useState } from 'react'
import styles from './VideoUploadZone.module.scss'

interface VideoUploadZoneProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  uploadInputRef: React.RefObject<HTMLInputElement>
  uploadError: string | null
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({ 
  onUpload, 
  uploadInputRef,
  uploadError 
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && uploadInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(files[0])
      uploadInputRef.current.files = dataTransfer.files
      
      const event = new Event('change', { bubbles: true })
      uploadInputRef.current.dispatchEvent(event)
    }
  }

  return (
    <div 
      className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''}`}
      data-testid="video-upload-prompt"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.uploadContent}>
        <svg 
          className={styles.uploadIcon} 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none"
          aria-hidden="true"
        >
          <path 
            d="M7 10l5-5m0 0l5 5m-5-5v12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>

        <h3 className={styles.uploadTitle}>Upload Video</h3>
        <p className={styles.uploadDescription}>
          Drag and drop your video file here or click to browse
        </p>

        <button 
          className={styles.uploadButton}
          onClick={() => uploadInputRef.current?.click()}
          aria-label="Upload video"
        >
          Upload Video
        </button>

        {uploadError && (
          <div className={styles.uploadError} role="alert">
            {uploadError}
          </div>
        )}

        <div className={styles.uploadInfo}>
          <p>Supported formats: MP4, WebM, OGG, MOV, AVI</p>
          <p>Maximum file size: 500MB</p>
        </div>
      </div>
    </div>
  )
}