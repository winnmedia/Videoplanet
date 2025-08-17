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

interface ShotBreakdownProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

const SHOT_TYPES = [
  { value: 'establishing', label: '설정샷', description: '장소/상황 소개' },
  { value: 'wide', label: '와이드샷', description: '전체적인 장면' },
  { value: 'medium', label: '미디엄샷', description: '인물 상반신' },
  { value: 'close_up', label: '클로즈업', description: '얼굴/세부 사항' },
  { value: 'extreme_close_up', label: '익스트림 클로즈업', description: '매우 세밀한 부분' },
  { value: 'over_shoulder', label: '오버 숄더', description: '어깨 너머 시점' },
  { value: 'bird_eye', label: '버드아이', description: '조감도 시점' },
  { value: 'low_angle', label: '로우 앵글', description: '아래에서 위로' },
  { value: 'high_angle', label: '하이 앵글', description: '위에서 아래로' },
  { value: 'insert', label: '인서트', description: '삽입 컷' }
]

const CAMERA_MOVEMENTS = [
  { value: 'static', label: '고정' },
  { value: 'pan', label: '팬' },
  { value: 'tilt', label: '틸트' },
  { value: 'zoom_in', label: '줌인' },
  { value: 'zoom_out', label: '줌아웃' },
  { value: 'dolly_in', label: '돌리인' },
  { value: 'dolly_out', label: '돌리아웃' },
  { value: 'tracking', label: '트래킹' },
  { value: 'handheld', label: '핸드헬드' },
  { value: 'crane', label: '크레인' }
]

const LIGHTING_TYPES = [
  { value: 'natural', label: '자연광' },
  { value: 'soft', label: '소프트 라이팅' },
  { value: 'hard', label: '하드 라이팅' },
  { value: 'back_light', label: '백라이트' },
  { value: 'side_light', label: '사이드 라이트' },
  { value: 'top_light', label: '탑 라이트' },
  { value: 'dramatic', label: '드라마틱' },
  { value: 'flat', label: '플랫 라이팅' }
]

export default function ShotBreakdown({
  project,
  onComplete,
  onValidationChange,
  onLoadingChange
}: ShotBreakdownProps) {
  const [shots, setShots] = useState<Shot[]>(project.shots || [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(!!(project.shots && project.shots.length > 0))
  const [selectedShot, setSelectedShot] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 폼 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {}
    
    if (!shots || shots.length === 0) {
      newErrors.shots = 'AI 숏 분할을 생성해주세요'
    } else {
      // 각 숏의 필수 필드 검사
      const invalidShots = shots.filter(shot => 
        !shot.description.trim() || !shot.type || !shot.duration
      )
      if (invalidShots.length > 0) {
        newErrors.shots = `${invalidShots.length}개 숏에 필수 정보가 누락되었습니다`
      }
    }

    setErrors(newErrors)
    onValidationChange(Object.keys(newErrors).length === 0)
  }, [shots, onValidationChange])

  const generateShots = async () => {
    if (!project.story_content) {
      alert('먼저 스토리를 개발해주세요.')
      return
    }

    setIsGenerating(true)
    onLoadingChange(true)

    try {
      // AI 숏 분할 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 4000))

      const generatedShots = generateShotsFromStory(project)
      setShots(generatedShots)
      setHasGenerated(true)
    } catch (error) {
      console.error('숏 분할 생성 실패:', error)
      alert('숏 분할 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
      onLoadingChange(false)
    }
  }

  const generateShotsFromStory = (project: PlanningProject): Shot[] => {
    // 실제로는 AI API를 호출하지만, 여기서는 템플릿 기반 생성
    const duration = parseDuration(project.duration)
    const shotCount = calculateShotCount(duration, project.genre)
    const shotDuration = Math.round(duration / shotCount)

    const shots: Shot[] = []

    for (let i = 0; i < shotCount; i++) {
      const sequence = i + 1
      const shot: Shot = {
        id: `shot_${sequence}`,
        sequence,
        type: getShotType(sequence, shotCount, project.genre),
        duration: `${shotDuration}초`,
        description: getShotDescription(sequence, shotCount, project),
        camera_angle: getCameraAngle(sequence, shotCount),
        camera_movement: getCameraMovement(sequence, project.tone_manner),
        audio: getAudioType(sequence, project.genre),
        props: getProps(sequence, project.genre),
        location: getLocation(sequence, project.purpose),
        lighting: getLighting(sequence, project.tone_manner),
        notes: getNotes(sequence, project)
      }
      shots.push(shot)
    }

    return shots
  }

  const parseDuration = (duration: string): number => {
    if (duration.includes('30초')) return 30
    if (duration.includes('1분')) return 60
    if (duration.includes('3분')) return 180
    if (duration.includes('5분')) return 300
    if (duration.includes('10분')) return 600
    if (duration.includes('30분')) return 1800
    
    // 사용자 정의 시간 파싱
    const match = duration.match(/(\d+)분?\s*(\d+)?초?/)
    if (match) {
      const minutes = match[1] ? parseInt(match[1]) : 0
      const seconds = match[2] ? parseInt(match[2]) : 0
      return minutes * 60 + seconds
    }
    
    return 60 // 기본값
  }

  const calculateShotCount = (duration: number, genre: string): number => {
    // 장르별 평균 숏 길이 설정
    const avgShotLength: Record<string, number> = {
      'commercial': 3,     // 광고는 빠른 편집
      'music_video': 2,    // 뮤직비디오는 매우 빠름
      'social': 2,         // 소셜미디어도 빠름
      'drama': 8,          // 드라마는 여유있게
      'documentary': 12,   // 다큐는 길게
      'educational': 15,   // 교육은 더 길게
      'corporate': 10,     // 기업은 중간
      'event': 6           // 이벤트는 적당히
    }

    const shotLength = avgShotLength[genre] || 6
    return Math.max(8, Math.min(20, Math.round(duration / shotLength)))
  }

  const getShotType = (sequence: number, total: number, genre: string): string => {
    if (sequence === 1) return 'establishing' // 첫 번째는 항상 설정샷
    if (sequence === total) return 'wide' // 마지막은 와이드샷
    
    // 장르별 숏 타입 분포
    const shotDistribution: Record<string, string[]> = {
      'commercial': ['medium', 'close_up', 'insert', 'wide'],
      'drama': ['medium', 'close_up', 'over_shoulder', 'wide'],
      'documentary': ['medium', 'wide', 'insert', 'close_up'],
      'music_video': ['close_up', 'extreme_close_up', 'bird_eye', 'low_angle']
    }

    const types = shotDistribution[genre] || ['medium', 'close_up', 'wide', 'insert']
    return types[sequence % types.length] || 'medium'
  }

  const getShotDescription = (sequence: number, total: number, project: PlanningProject): string => {
    const storyParts = project.story_content?.split('\n').filter(line => line.trim()) || []
    const partIndex = Math.floor((sequence - 1) / total * storyParts.length)
    const relevantPart = storyParts[partIndex] || `${sequence}번째 장면`

    return `${relevantPart.substring(0, 100)}...`
  }

  const getCameraAngle = (sequence: number, total: number): string => {
    const angles = ['eye_level', 'low_angle', 'high_angle', 'bird_eye']
    if (sequence === 1) return 'eye_level'
    return angles[sequence % angles.length] || 'eye_level'
  }

  const getCameraMovement = (sequence: number, tone: string): string => {
    const movements: Record<string, string[]> = {
      'energetic': ['zoom_in', 'tracking', 'handheld', 'pan'],
      'calm': ['static', 'slow_pan', 'dolly_in', 'tilt'],
      'dramatic': ['zoom_in', 'crane', 'dolly_out', 'tracking']
    }

    const toneMovements = movements[tone] || ['static', 'pan', 'zoom_in', 'dolly_in']
    return toneMovements[sequence % toneMovements.length] || 'static'
  }

  const getAudioType = (sequence: number, genre: string): string => {
    const audioTypes: Record<string, string[]> = {
      'commercial': ['내레이션', 'BGM', '효과음', '침묵'],
      'drama': ['대사', 'BGM', '자연음', '효과음'],
      'documentary': ['내레이션', '인터뷰', '자연음', 'BGM']
    }

    const types = audioTypes[genre] || ['BGM', '내레이션', '자연음', '효과음']
    return types[sequence % types.length] || 'BGM'
  }

  const getProps = (sequence: number, genre: string): string[] => {
    const propSets: Record<string, string[][]> = {
      'commercial': [['제품'], ['포장지'], ['로고'], ['배경소품']],
      'drama': [['소품A'], ['소품B'], ['의상'], ['배경소품']],
      'corporate': [['회사로고'], ['제품'], ['문서'], ['사무용품']]
    }

    const props = propSets[genre] || [['소품1'], ['소품2'], ['배경'], ['기타']]
    return props[sequence % props.length] || ['소품1']
  }

  const getLocation = (sequence: number, purpose: string): string => {
    const locations: Record<string, string[]> = {
      'branding': ['스튜디오', '사무실', '야외', '매장'],
      'education': ['강의실', '실험실', '도서관', '야외'],
      'corporate': ['회의실', '사무실', '로비', '공장']
    }

    const locs = locations[purpose] || ['실내', '야외', '스튜디오', '사무실']
    return locs[sequence % locs.length] || '실내'
  }

  const getLighting = (sequence: number, tone: string): string => {
    const lightings: Record<string, string[]> = {
      'bright': ['natural', 'soft', 'flat', 'top_light'],
      'serious': ['hard', 'dramatic', 'side_light', 'back_light'],
      'emotional': ['soft', 'back_light', 'dramatic', 'natural']
    }

    const lights = lightings[tone] || ['natural', 'soft', 'side_light', 'hard']
    return lights[sequence % lights.length] || 'natural'
  }

  const getNotes = (sequence: number, project: PlanningProject): string => {
    const notes = [
      '감정 표현에 집중',
      '제품이 명확히 보이도록',
      '브랜드 색상 활용',
      '자연스러운 연기',
      '배경음악과 동기화',
      '조명 체크 필요',
      '안전 주의사항',
      '추가 촬영 예비'
    ]

    return notes[sequence % notes.length] || '특이사항 없음'
  }

  const updateShot = (shotId: string, updates: Partial<Shot>) => {
    setShots(prev => prev.map(shot => 
      shot.id === shotId ? { ...shot, ...updates } : shot
    ))
  }

  const deleteShot = (shotId: string) => {
    setShots(prev => prev.filter(shot => shot.id !== shotId))
  }

  const addShot = () => {
    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      sequence: shots.length + 1,
      type: 'medium',
      duration: '5초',
      description: '',
      camera_angle: 'eye_level',
      camera_movement: 'static',
      audio: 'BGM',
      props: [],
      location: '실내',
      lighting: 'natural',
      notes: ''
    }
    setShots(prev => [...prev, newShot])
  }

  const handleComplete = () => {
    if (Object.keys(errors).length === 0) {
      onComplete({ shots })
    }
  }

  return (
    <div className="shot-breakdown">
      <div className="breakdown-header">
        <h3 className="section-title">
          <span className="title-icon">[영상]</span>
          숏 분할 (16개 구성)
        </h3>
        <p className="section-description">
          스토리를 바탕으로 구체적인 촬영 계획을 수립합니다.
        </p>
      </div>

      <div className="breakdown-form">
        {/* AI 숏 분할 생성 */}
        <div className="generation-section">
          <button
            className="generate-btn"
            onClick={generateShots}
            disabled={!project.story_content || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner">[로딩]</span>
                AI가 숏 분할을 생성 중...
              </>
            ) : (
              <>
                <span>[AI]</span>
                {hasGenerated ? 'AI 숏 분할 재생성' : 'AI 숏 분할 생성'}
              </>
            )}
          </button>

          {shots.length > 0 && (
            <div className="shots-summary">
              <div className="summary-header">
                <h4>생성된 숏 목록</h4>
                <div className="summary-stats">
                  <span className="shot-count">총 {shots.length}개 숏</span>
                  <button className="add-shot-btn" onClick={addShot}>
                    + 숏 추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 숏 목록 */}
        {shots.length > 0 && (
          <div className="shots-list">
            {shots.map((shot) => (
              <div key={shot.id} className="shot-card">
                <div className="shot-header">
                  <div className="shot-number">숏 {shot.sequence}</div>
                  <div className="shot-actions">
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedShot(selectedShot === shot.id ? null : shot.id)}
                    >
                      {selectedShot === shot.id ? '[편집]' : '[수정]'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteShot(shot.id)}
                    >
                      [삭제]
                    </button>
                  </div>
                </div>

                <div className="shot-info">
                  <div className="shot-basic">
                    <span className="shot-type">{SHOT_TYPES.find(t => t.value === shot.type)?.label || shot.type}</span>
                    <span className="shot-duration">{shot.duration}</span>
                    <span className="shot-location">{shot.location}</span>
                  </div>
                  <div className="shot-description">
                    {shot.description}
                  </div>
                </div>

                {selectedShot === shot.id && (
                  <div className="shot-editor">
                    <div className="editor-grid">
                      <div className="editor-field">
                        <label>숏 타입</label>
                        <select
                          value={shot.type}
                          onChange={(e) => updateShot(shot.id, { type: e.target.value })}
                        >
                          {SHOT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="editor-field">
                        <label>지속 시간</label>
                        <input
                          type="text"
                          value={shot.duration}
                          onChange={(e) => updateShot(shot.id, { duration: e.target.value })}
                          placeholder="예: 5초"
                        />
                      </div>

                      <div className="editor-field">
                        <label>카메라 움직임</label>
                        <select
                          value={shot.camera_movement}
                          onChange={(e) => updateShot(shot.id, { camera_movement: e.target.value })}
                        >
                          {CAMERA_MOVEMENTS.map(movement => (
                            <option key={movement.value} value={movement.value}>
                              {movement.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="editor-field">
                        <label>조명</label>
                        <select
                          value={shot.lighting}
                          onChange={(e) => updateShot(shot.id, { lighting: e.target.value })}
                        >
                          {LIGHTING_TYPES.map(lighting => (
                            <option key={lighting.value} value={lighting.value}>
                              {lighting.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="editor-field full-width">
                        <label>장면 설명</label>
                        <textarea
                          value={shot.description}
                          onChange={(e) => updateShot(shot.id, { description: e.target.value })}
                          rows={3}
                          placeholder="이 숏에서 무엇을 보여줄지 구체적으로 설명해주세요..."
                        />
                      </div>

                      <div className="editor-field">
                        <label>오디오</label>
                        <input
                          type="text"
                          value={shot.audio}
                          onChange={(e) => updateShot(shot.id, { audio: e.target.value })}
                          placeholder="예: BGM, 내레이션, 효과음"
                        />
                      </div>

                      <div className="editor-field">
                        <label>촬영 장소</label>
                        <input
                          type="text"
                          value={shot.location}
                          onChange={(e) => updateShot(shot.id, { location: e.target.value })}
                          placeholder="예: 사무실, 야외, 스튜디오"
                        />
                      </div>

                      <div className="editor-field full-width">
                        <label>촬영 노트</label>
                        <textarea
                          value={shot.notes}
                          onChange={(e) => updateShot(shot.id, { notes: e.target.value })}
                          rows={2}
                          placeholder="특별한 주의사항이나 연출 의도를 적어주세요..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {errors.shots && <span className="error-message">{errors.shots}</span>}

        {/* 완료 버튼 */}
        <div className="form-actions">
          <button
            className="complete-btn"
            onClick={handleComplete}
            disabled={Object.keys(errors).length > 0}
          >
            <span>[완료]</span>
            숏 분할 완료 및 다음 단계
          </button>
        </div>
      </div>
    </div>
  )
}