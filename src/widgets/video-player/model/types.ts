/**
 * Enhanced Video Player 타입 정의
 */

export interface VideoPlayerProps {
  videoUrl: string | null
  onVideoUpload: (file: File) => Promise<void>
  onVideoReplace: (file: File) => Promise<void>
  onTimestampFeedback: (timestamp: number) => void
  onScreenshot: (dataUrl: string, timestamp: number) => void
  onShare: (shareData: ShareData) => void
  projectId: string
  isEditable?: boolean
  showEnhancedControls?: boolean
}

export interface VideoTimestamp {
  seconds: number
  formatted: string // "M:SS" or "H:MM:SS"
}

export interface ShareData {
  url: string
  timestamp?: number
  title?: string
  text?: string
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps?: number
}

export interface TooltipPosition {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

export interface PlayerControl {
  id: string
  icon: React.ReactNode
  tooltip: string
  action: () => void
  position?: 'overlay' | 'bottom'
  disabled?: boolean
  ariaLabel: string
}