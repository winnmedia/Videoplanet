'use client'

import { useState, useEffect } from 'react'

interface PlanningProject {
  id?: string
  title: string
  genre: string
  target_audience: string
  tone_manner: string
  duration: string
  budget: string
  purpose: string
  story_structure: string
  development_level: string
  story_content?: string
  shots?: Shot[]
  storyboard?: Storyboard
  [key: string]: any
}

interface Shot {
  id: string
  sequence: number
  type: string
  duration: string
  description: string
  camera_angle: string
  camera_movement: string
  audio: string
  props: string[]
  location: string
  lighting: string
  notes: string
}

interface StoryboardFrame {
  id: string
  shotId: string
  sequence: number
  thumbnail: string
  description: string
  technical_notes: string
  timing: string
}

interface Storyboard {
  id: string
  title: string
  frames: StoryboardFrame[]
  style: string
  created_at: string
}

interface ContiGeneratorProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

const STORYBOARD_STYLES = [
  {
    value: 'realistic',
    label: '실사형',
    description: '사실적인 스케치 스타일',
    preview: '실사형',
    example: '상세한 명암과 비례를 갖춘 리얼한 드로잉'
  },
  {
    value: 'cartoon',
    label: '카툰형',
    description: '만화적인 스타일',
    preview: '카툰형',
    example: '단순화된 라인과 밝은 색감의 카툰 스타일'
  },
  {
    value: 'minimalist',
    label: '미니멀',
    description: '최소한의 선으로 표현',
    preview: '미니멀',
    example: '핵심 요소만 간단한 선으로 표현'
  },
  {
    value: 'detailed',
    label: '상세형',
    description: '배경까지 자세히 표현',
    preview: '상세형',
    example: '배경, 소품, 조명까지 상세하게 묘사'
  }
]

function ContiGenerator({
  project,
  onComplete,
  onValidationChange,
  onLoadingChange
}: ContiGeneratorProps) {
  const [storyboard, setStoryboard] = useState<Storyboard | null>(project.storyboard || null)
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(!!project.storyboard)
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 폼 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {}
    
    if (!project.shots || project.shots.length === 0) {
      newErrors.shots = '먼저 숏 분할을 완료해주세요'
    }
    
    if (!storyboard || !storyboard.frames || storyboard.frames.length === 0) {
      newErrors.storyboard = 'AI 콘티를 생성해주세요'
    }

    setErrors(newErrors)
    onValidationChange(Object.keys(newErrors).length === 0)
  }, [project.shots, storyboard, onValidationChange])

  const generateStoryboard = async () => {
    if (!project.shots || project.shots.length === 0) {
      alert('먼저 숏 분할을 완료해주세요.')
      return
    }

    setIsGenerating(true)
    onLoadingChange(true)

    try {
      // AI 콘티 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 5000))

      const generatedStoryboard = await generateStoryboardFromShots(project.shots, selectedStyle)
      setStoryboard(generatedStoryboard)
      setHasGenerated(true)
    } catch (error) {
      console.error('콘티 생성 실패:', error)
      alert('콘티 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
      onLoadingChange(false)
    }
  }

  const generateStoryboardFromShots = async (shots: Shot[], style: string): Promise<Storyboard> => {
    // 실제로는 AI 이미지 생성 API를 호출하지만, 여기서는 시뮬레이션
    const frames: StoryboardFrame[] = shots.map((shot, index) => ({
      id: `frame_${shot.id}`,
      shotId: shot.id,
      sequence: index + 1,
      thumbnail: generateThumbnailPlaceholder(shot, style),
      description: generateFrameDescription(shot),
      technical_notes: generateTechnicalNotes(shot),
      timing: calculateTiming(shot, index, shots)
    }))

    return {
      id: `storyboard_${Date.now()}`,
      title: project.title || '무제',
      frames,
      style,
      created_at: new Date().toISOString()
    }
  }

  const generateThumbnailPlaceholder = (shot: Shot, style: string): string => {
    // 실제로는 AI가 생성한 이미지 URL을 반환
    // 여기서는 스타일별로 다른 플레이스홀더를 생성
    const styleLabels: Record<string, string> = {
      'realistic': '실사',
      'cartoon': '카툰',
      'minimalist': '미니멀',
      'detailed': '상세'
    }
    
    const styleLabel = styleLabels[style] || '실사'
    const shotTypeLabels: Record<string, string> = {
      'establishing': '전경',
      'wide': '와이드',
      'medium': '미디엄',
      'close_up': '클로즈업',
      'extreme_close_up': '익스트림클로즈업',
      'over_shoulder': '오버숄더',
      'bird_eye': '버즈아이',
      'low_angle': '로우앵글',
      'high_angle': '하이앵글',
      'insert': '인서트'
    }
    
    return `[${styleLabel}] ${shotTypeLabels[shot.type] || '기본'} 숏 ${shot.sequence}`
  }

  const generateFrameDescription = (shot: Shot): string => {
    return `${shot.type} 샷으로 ${shot.description.substring(0, 50)}... 
카메라: ${shot.camera_movement}, 조명: ${shot.lighting}`
  }

  const generateTechnicalNotes = (shot: Shot): string => {
    return `앵글: ${shot.camera_angle}
움직임: ${shot.camera_movement}
조명: ${shot.lighting}
오디오: ${shot.audio}
장소: ${shot.location}
${shot.notes ? `주의사항: ${shot.notes}` : ''}`
  }

  const calculateTiming = (shot: Shot, index: number, allShots: Shot[]): string => {
    // 이전 숏들의 총 시간 계산
    let totalSeconds = 0
    for (let i = 0; i < index; i++) {
      const shot = allShots[i]
      if (shot && shot.duration) {
        const duration = shot.duration
        const seconds = parseDurationToSeconds(duration)
        totalSeconds += seconds
      }
    }
    
    const currentDuration = parseDurationToSeconds(shot.duration)
    const startTime = formatTime(totalSeconds)
    const endTime = formatTime(totalSeconds + currentDuration)
    
    return `${startTime} - ${endTime}`
  }

  const parseDurationToSeconds = (duration: string): number => {
    const match = duration.match(/(\d+)초/)
    return match && match[1] ? parseInt(match[1]) : 5
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const updateFrameDescription = (frameId: string, description: string) => {
    if (!storyboard) return
    
    const updatedFrames = storyboard.frames.map(frame =>
      frame.id === frameId ? { ...frame, description } : frame
    )
    
    setStoryboard({ ...storyboard, frames: updatedFrames })
  }

  const updateFrameNotes = (frameId: string, notes: string) => {
    if (!storyboard) return
    
    const updatedFrames = storyboard.frames.map(frame =>
      frame.id === frameId ? { ...frame, technical_notes: notes } : frame
    )
    
    setStoryboard({ ...storyboard, frames: updatedFrames })
  }

  const deleteFrame = (frameId: string) => {
    if (!storyboard) return
    
    const updatedFrames = storyboard.frames.filter(frame => frame.id !== frameId)
    setStoryboard({ ...storyboard, frames: updatedFrames })
  }

  const duplicateFrame = (frameId: string) => {
    if (!storyboard) return
    
    const frameIndex = storyboard.frames.findIndex(frame => frame.id === frameId)
    if (frameIndex === -1) return
    
    const originalFrame = storyboard.frames[frameIndex]
    if (!originalFrame) return
    
    const newFrame: StoryboardFrame = {
      ...originalFrame,
      id: `frame_${Date.now()}`,
      sequence: originalFrame.sequence + 0.5,
      description: `${originalFrame.description} (복사본)`,
      shotId: originalFrame.shotId || `shot_${Date.now()}`,
      thumbnail: originalFrame.thumbnail || '',
      technical_notes: originalFrame.technical_notes || '',
      timing: originalFrame.timing || ''
    }
    
    const updatedFrames = [...storyboard.frames]
    updatedFrames.splice(frameIndex + 1, 0, newFrame)
    
    setStoryboard({ ...storyboard, frames: updatedFrames })
  }

  const downloadStoryboard = () => {
    if (!storyboard) return
    
    const storyboardData = {
      ...storyboard,
      project_info: {
        title: project.title,
        genre: project.genre,
        duration: project.duration,
        purpose: project.purpose
      }
    }
    
    const dataStr = JSON.stringify(storyboardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `storyboard_${project.title || 'untitled'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const handleComplete = () => {
    if (Object.keys(errors).length === 0 && storyboard) {
      onComplete({ storyboard })
    }
  }

  return (
    <div className="conti-generator">
      <div className="generator-header">
        <h3 className="section-title">
          <span className="title-icon">콘티</span>
          콘티 생성
        </h3>
        <p className="section-description">
          숏 분할을 바탕으로 시각적인 콘티보드를 생성합니다.
        </p>
      </div>

      <div className="generator-form">
        {/* 스타일 선택 */}
        <div className="form-group">
          <label className="form-label">
            콘티 스타일 선택
          </label>
          <div className="style-grid">
            {STORYBOARD_STYLES.map((style) => (
              <div
                key={style.value}
                className={`style-card ${selectedStyle === style.value ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style.value)}
              >
                <div className="style-preview">{style.preview}</div>
                <div className="style-info">
                  <h4 className="style-title">{style.label}</h4>
                  <p className="style-description">{style.description}</p>
                  <div className="style-example">{style.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 콘티 생성 */}
        <div className="generation-section">
          <button
            className="generate-btn"
            onClick={generateStoryboard}
            disabled={!project.shots || project.shots.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner">⏳</span>
                AI가 콘티를 생성 중... (약 30초 소요)
              </>
            ) : (
              <>
                <span>AI</span>
                {hasGenerated ? 'AI 콘티 재생성' : 'AI 콘티 생성'}
              </>
            )}
          </button>

          {storyboard && (
            <div className="storyboard-actions">
              <button className="download-btn" onClick={downloadStoryboard}>
                콘티 다운로드
              </button>
              <div className="storyboard-info">
                <span>{storyboard.frames.length}개 프레임</span>
                <span>스타일: {STORYBOARD_STYLES.find(s => s.value === storyboard.style)?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* 콘티 프레임 목록 */}
        {storyboard && storyboard.frames.length > 0 && (
          <div className="storyboard-frames">
            <div className="frames-header">
              <h4>콘티보드 프레임</h4>
              <div className="frames-controls">
                <button className="view-mode-btn active">그리드 뷰</button>
                <button className="view-mode-btn">리스트 뷰</button>
              </div>
            </div>

            <div className="frames-grid">
              {storyboard.frames.map((frame) => (
                <div key={frame.id} className="frame-card">
                  <div className="frame-header">
                    <span className="frame-number">#{frame.sequence}</span>
                    <div className="frame-timing">{frame.timing}</div>
                    <div className="frame-actions">
                      <button
                        className="edit-btn"
                        onClick={() => setSelectedFrame(selectedFrame === frame.id ? null : frame.id)}
                        title="편집"
                      >
                        편집
                      </button>
                      <button
                        className="duplicate-btn"
                        onClick={() => duplicateFrame(frame.id)}
                        title="복제"
                      >
                        복사
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteFrame(frame.id)}
                        title="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="frame-thumbnail">
                    <div className="thumbnail-placeholder">
                      {frame.thumbnail}
                    </div>
                    <div className="regenerate-thumbnail">
                      <button className="regenerate-btn" title="썸네일 재생성">
                        재생성
                      </button>
                    </div>
                  </div>

                  <div className="frame-content">
                    <div className="frame-description">
                      {frame.description}
                    </div>
                    <div className="frame-technical">
                      {frame.technical_notes.split('\n')[0]}...
                    </div>
                  </div>

                  {selectedFrame === frame.id && (
                    <div className="frame-editor">
                      <div className="editor-section">
                        <label>프레임 설명</label>
                        <textarea
                          value={frame.description}
                          onChange={(e) => updateFrameDescription(frame.id, e.target.value)}
                          rows={3}
                          placeholder="이 프레임에서 보여줄 내용을 설명해주세요..."
                        />
                      </div>

                      <div className="editor-section">
                        <label>기술적 노트</label>
                        <textarea
                          value={frame.technical_notes}
                          onChange={(e) => updateFrameNotes(frame.id, e.target.value)}
                          rows={4}
                          placeholder="카메라 앵글, 조명, 오디오 등 기술적 사항을 적어주세요..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 프레임 추가 버튼 */}
            <div className="add-frame-section">
              <button className="add-frame-btn">
                + 새 프레임 추가
              </button>
            </div>
          </div>
        )}

        {Object.keys(errors).map(key => (
          <span key={key} className="error-message">{errors[key]}</span>
        ))}

        {/* 완료 버튼 */}
        <div className="form-actions">
          <button
            className="complete-btn"
            onClick={handleComplete}
            disabled={Object.keys(errors).length > 0}
          >
            <span>완료</span>
            콘티 완료 및 다음 단계
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContiGenerator