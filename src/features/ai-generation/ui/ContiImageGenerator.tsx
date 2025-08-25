/**
 * 콘티 이미지 생성기 컴포넌트
 * Google 이미지 생성 API를 활용한 스토리보드 콘티 생성
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/shared/lib/store'
import {
  generateContiImage,
  selectIsGenerating,
  selectGenerationErrors,
  clearGenerationError,
  type Shot,
  type ImageGenerationRequest
} from '@/entities/storyboard'
import { Button } from '@/shared/ui'
import { Icon, IconType } from '@/shared/ui/Icon/Icon'
import styles from './ContiImageGenerator.module.scss'

// ============================
// 1. Props 인터페이스
// ============================

interface ContiImageGeneratorProps {
  shot: Shot
  onImageGenerated?: (shotId: string, imageUrl: string) => void
  className?: string
}

// ============================
// 2. 콘티 스타일 프리셋들
// ============================

const CONTI_STYLE_PRESETS = {
  default: {
    prompt: 'storyboard pencil sketch, rough, monochrome, hand-drawn style',
    negativePrompt: 'color, photographic, realistic, detailed, polished, digital art, 3d render'
  },
  rough: {
    prompt: 'rough pencil sketch, loose lines, storyboard style, black and white',
    negativePrompt: 'clean lines, color, detailed, finished art, photorealistic'
  },
  clean: {
    prompt: 'clean storyboard sketch, clear lines, professional storyboard, monochrome',
    negativePrompt: 'messy, color, photographic, 3d, overly detailed'
  }
}

// ============================
// 3. 컴포넌트 정의
// ============================

export const ContiImageGenerator: React.FC<ContiImageGeneratorProps> = ({
  shot,
  onImageGenerated,
  className
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const isGenerating = useSelector(selectIsGenerating)
  const generationErrors = useSelector(selectGenerationErrors)
  
  // 로컬 상태
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof CONTI_STYLE_PRESETS>('default')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 현재 샷의 에러 상태
  const shotError = generationErrors[shot.id]
  const isCurrentShotGenerating = isGenerating.contiImage

  // ============================
  // 4. 프롬프트 생성 로직
  // ============================

  const generatePrompt = useCallback(() => {
    const basePrompt = isCustomMode ? customPrompt : CONTI_STYLE_PRESETS[selectedStyle].prompt
    
    // 샷 정보를 기반으로 상세 프롬프트 생성
    const sceneDescription = `${shot.description}, ${shot.shotType} shot, ${shot.cameraAngle} angle`
    const fullPrompt = `${basePrompt}, ${sceneDescription}`
    
    return fullPrompt.trim()
  }, [shot, selectedStyle, customPrompt, isCustomMode])

  const generateNegativePrompt = useCallback(() => {
    const baseNegative = isCustomMode ? 
      'color, photographic, realistic' : 
      CONTI_STYLE_PRESETS[selectedStyle].negativePrompt
    
    return `${baseNegative}, text, watermark, signature, frame, border`
  }, [selectedStyle, isCustomMode])

  // ============================
  // 5. 이벤트 핸들러들
  // ============================

  const handleGenerateImage = async () => {
    if (isCurrentShotGenerating) return

    // 기존 에러 클리어
    if (shotError) {
      dispatch(clearGenerationError(shot.id))
    }

    const request: ImageGenerationRequest = {
      shotId: shot.id,
      prompt: generatePrompt(),
      style: CONTI_STYLE_PRESETS[selectedStyle].prompt,
      negativePrompt: generateNegativePrompt(),
      isRegeneration: !!shot.contiImage
    }

    try {
      const result = await dispatch(generateContiImage(request)).unwrap()
      
      if (result.url) {
        setPreviewUrl(result.url)
        onImageGenerated?.(shot.id, result.url)
      }
    } catch (error) {
      console.error('Failed to generate conti image:', error)
      // 에러는 Redux slice에서 자동 처리됨
    }
  }

  const handleDownloadImage = () => {
    const imageUrl = shot.contiImage?.url || previewUrl
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = shot.contiImage?.filename || `shot-${shot.shotNumber}-conti.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRegenerateImage = () => {
    handleGenerateImage()
  }

  const handleStyleChange = (style: keyof typeof CONTI_STYLE_PRESETS) => {
    setSelectedStyle(style)
    setIsCustomMode(false)
  }

  const handleCustomModeToggle = () => {
    setIsCustomMode(!isCustomMode)
    if (!isCustomMode) {
      setCustomPrompt(generatePrompt())
    }
  }

  const handleClearError = () => {
    if (shotError) {
      dispatch(clearGenerationError(shot.id))
    }
  }

  // ============================
  // 6. 현재 표시할 이미지 URL
  // ============================

  const displayImageUrl = previewUrl || shot.contiImage?.url

  // ============================
  // 7. 렌더링
  // ============================

  return (
    <div className={`${styles.contiGenerator} ${className || ''}`}>
      {/* 이미지 프레임 */}
      <div className={styles.imageFrame}>
        {displayImageUrl ? (
          <img 
            src={displayImageUrl} 
            alt={`Shot ${shot.shotNumber} 콘티`}
            className={styles.contiImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🎬</div>
            <span className={styles.placeholderText}>콘티 이미지</span>
          </div>
        )}
        
        {/* 로딩 오버레이 */}
        {isCurrentShotGenerating && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <span>생성 중...</span>
          </div>
        )}
        
        {/* 버전 표시 */}
        {shot.contiImage && (
          <div className={styles.versionBadge}>
            v{shot.contiImage.version}
          </div>
        )}
      </div>

      {/* 컨트롤 패널 */}
      <div className={styles.controls}>
        {/* 스타일 선택 */}
        <div className={styles.styleSelector}>
          <label className={styles.controlLabel}>스타일:</label>
          <div className={styles.styleButtons}>
            {Object.entries(CONTI_STYLE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleStyleChange(key as keyof typeof CONTI_STYLE_PRESETS)}
                className={`${styles.styleButton} ${
                  selectedStyle === key && !isCustomMode ? styles.active : ''
                }`}
                disabled={isCurrentShotGenerating}
              >
                {key === 'default' ? '기본' : key === 'rough' ? '거친' : '깔끔'}
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 모드 토글 */}
        <div className={styles.customMode}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isCustomMode}
              onChange={handleCustomModeToggle}
              disabled={isCurrentShotGenerating}
              className={styles.checkbox}
            />
            <span>커스텀 프롬프트</span>
          </label>
        </div>

        {/* 커스텀 프롬프트 입력 */}
        {isCustomMode && (
          <div className={styles.customPrompt}>
            <label htmlFor={`custom-prompt-${shot.id}`} className={styles.controlLabel}>
              커스텀 프롬프트:
            </label>
            <textarea
              id={`custom-prompt-${shot.id}`}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="원하는 스타일의 프롬프트를 입력하세요"
              className={styles.promptTextarea}
              rows={2}
              disabled={isCurrentShotGenerating}
            />
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className={styles.actions}>
          {!displayImageUrl ? (
            <Button
              onClick={handleGenerateImage}
              disabled={isCurrentShotGenerating || (isCustomMode && !customPrompt.trim())}
              variant="primary"
              size="small"
              className={styles.generateButton}
            >
              {isCurrentShotGenerating ? '생성 중...' : 'GENERATE'}
            </Button>
          ) : (
            <div className={styles.actionGroup}>
              <Button
                onClick={handleRegenerateImage}
                disabled={isCurrentShotGenerating}
                variant="outline"
                size="small"
                className={styles.actionButton}
              >
                REGENERATE
              </Button>
              <Button
                onClick={handleDownloadImage}
                disabled={isCurrentShotGenerating}
                variant="outline"
                size="small"
                className={styles.actionButton}
              >
                DOWNLOAD
              </Button>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {shotError && (
          <div className={styles.errorMessage} role="alert">
            <Icon 
              type={IconType.WARNING} 
              size="sm" 
              variant="warning"
              className={styles.errorIcon}
              ariaLabel="경고 아이콘"
            />
            <span className={styles.errorText}>{shotError}</span>
            <button
              type="button"
              onClick={handleClearError}
              className={styles.errorClear}
              aria-label="에러 메시지 닫기"
            >
              <Icon type={IconType.CLOSE} size="xs" ariaLabel="닫기" />
            </button>
          </div>
        )}

        {/* 생성 정보 */}
        {shot.contiImage && (
          <div className={styles.generationInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>생성일:</span>
              <span className={styles.infoValue}>
                {new Date(shot.contiImage.generatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>프롬프트:</span>
              <span className={styles.infoValue} title={shot.contiImage.prompt}>
                {shot.contiImage.prompt.length > 50 
                  ? `${shot.contiImage.prompt.substring(0, 50)}...`
                  : shot.contiImage.prompt
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContiImageGenerator