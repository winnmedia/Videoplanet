import { describe, it, expect, vi } from 'vitest'

// 스토리 구조 타입 정의
interface StoryStage {
  title: string
  description: string
  duration: number
  keyPoints: string[]
  percentage: number
}

interface StoryStructure {
  introduction: StoryStage
  rising: StoryStage
  climax: StoryStage
  conclusion: StoryStage
}

interface Shot {
  shotNumber: number
  storyStage: 'introduction' | 'rising' | 'climax' | 'conclusion'
  duration: number
  shotType?: string
  cameraMovement?: string
  composition?: string
  description?: string
}

// 4단계 스토리 구조 생성 함수
function generateStoryStructure(
  totalDuration: number,
  developmentMethod: string,
  intensity: string
): StoryStructure {
  // 전개방식에 따른 비율 조정
  let percentages = { intro: 20, rising: 40, climax: 30, conclusion: 10 }
  
  if (developmentMethod === 'hook-immersion-twist-clue') {
    percentages = { intro: 15, rising: 35, climax: 40, conclusion: 10 }
  } else if (developmentMethod === 'documentary') {
    percentages = { intro: 25, rising: 35, climax: 25, conclusion: 15 }
  }

  const structure: StoryStructure = {
    introduction: {
      title: '도입부',
      description: '시청자의 관심을 끌고 주제를 소개',
      duration: Math.ceil(totalDuration * (percentages.intro / 100)),
      keyPoints: ['주목 끌기', '주제 소개', '톤 설정'],
      percentage: percentages.intro
    },
    rising: {
      title: '전개부',
      description: '핵심 내용을 단계적으로 전개',
      duration: Math.ceil(totalDuration * (percentages.rising / 100)),
      keyPoints: ['정보 전달', '참여 유도', '감정 구축'],
      percentage: percentages.rising
    },
    climax: {
      title: '절정부',
      description: '핵심 메시지가 가장 강력하게 드러남',
      duration: Math.ceil(totalDuration * (percentages.climax / 100)),
      keyPoints: ['최고 임팩트', '핵심 전달', '감정 최고조'],
      percentage: percentages.climax
    },
    conclusion: {
      title: '결말부',
      description: '메시지 정리 및 행동 유도',
      duration: Math.ceil(totalDuration * (percentages.conclusion / 100)),
      keyPoints: ['정리', 'CTA', '여운'],
      percentage: percentages.conclusion
    }
  }

  // 전개 강도에 따른 키포인트 추가
  if (intensity === 'rich') {
    structure.introduction.keyPoints.push('배경 설명', '인물 소개')
    structure.rising.keyPoints.push('세부 전개', '사례 제시')
    structure.climax.keyPoints.push('전환점', '반전')
    structure.conclusion.keyPoints.push('미래 전망', '감사 인사')
  }

  return structure
}

// 12개 숏트를 4단계 스토리에 분배하는 함수
function distributeShots(
  totalDuration: number,
  tempo: 'fast' | 'normal' | 'slow',
  storyStructure: StoryStructure
): Shot[] {
  const shots: Shot[] = []
  
  // 템포에 따른 숏트 분배 설정
  const shotDistribution = {
    introduction: tempo === 'fast' ? 2 : 3,
    rising: tempo === 'slow' ? 5 : 4,
    climax: tempo === 'fast' ? 4 : 3,
    conclusion: tempo === 'slow' ? 2 : 1
  }
  
  // 전체 12개가 되도록 조정
  const totalAssigned = Object.values(shotDistribution).reduce((a, b) => a + b, 0)
  if (totalAssigned < 12) {
    shotDistribution.rising += 12 - totalAssigned
  } else if (totalAssigned > 12) {
    shotDistribution.rising -= totalAssigned - 12
  }
  
  // 각 숏트의 기본 지속 시간 계산
  const baseShotDuration = totalDuration / 12
  
  // 템포에 따른 시간 변화율
  const tempoMultiplier = {
    fast: 0.8,
    normal: 1.0,
    slow: 1.2
  }
  
  let shotNumber = 1
  let accumulatedDuration = 0
  
  // 각 스토리 단계별로 숏트 생성
  const stages: Array<{
    stage: 'introduction' | 'rising' | 'climax' | 'conclusion',
    data: StoryStage,
    shotCount: number
  }> = [
    { stage: 'introduction', data: storyStructure.introduction, shotCount: shotDistribution.introduction },
    { stage: 'rising', data: storyStructure.rising, shotCount: shotDistribution.rising },
    { stage: 'climax', data: storyStructure.climax, shotCount: shotDistribution.climax },
    { stage: 'conclusion', data: storyStructure.conclusion, shotCount: shotDistribution.conclusion }
  ]
  
  for (const { stage, data, shotCount } of stages) {
    const stageTotalDuration = data.duration
    const avgShotDuration = stageTotalDuration / shotCount
    
    for (let i = 0; i < shotCount; i++) {
      // 각 숏트의 지속 시간을 약간 변화시켜 자연스럽게
      const variation = 0.8 + Math.random() * 0.4 // 0.8 ~ 1.2 배율
      let shotDuration = Math.round(avgShotDuration * variation * tempoMultiplier[tempo])
      
      // 마지막 숏트는 시간을 맞추기 위해 조정
      if (shotNumber === 12) {
        shotDuration = totalDuration - accumulatedDuration
      }
      
      // 최소 1초 보장
      shotDuration = Math.max(1, shotDuration)
      
      shots.push({
        shotNumber,
        storyStage: stage,
        duration: shotDuration,
        shotType: getShotType(stage, i),
        cameraMovement: getCameraMovement(tempo, stage),
        composition: getComposition(stage),
        description: `${stage} shot ${i + 1}`
      })
      
      accumulatedDuration += shotDuration
      shotNumber++
    }
  }
  
  // 총 시간 조정 (오차 보정)
  const timeDiff = totalDuration - accumulatedDuration
  if (Math.abs(timeDiff) > 2) {
    // 마지막 숏트의 시간을 조정하여 총 시간 맞추기
    shots[shots.length - 1].duration += timeDiff
  }
  
  return shots
}

// 헬퍼 함수들
function getShotType(stage: string, index: number): string {
  const types = {
    introduction: ['wide', 'establishing', 'medium'],
    rising: ['medium', 'close-up', 'over-shoulder', 'medium'],
    climax: ['close-up', 'extreme-close-up', 'medium'],
    conclusion: ['medium', 'wide']
  }
  return types[stage as keyof typeof types]?.[index] || 'medium'
}

function getCameraMovement(tempo: string, stage: string): string {
  if (tempo === 'fast') return 'handheld'
  if (tempo === 'slow' && stage === 'conclusion') return 'dolly-out'
  if (stage === 'climax') return 'push-in'
  return 'static'
}

function getComposition(stage: string): string {
  const compositions = {
    introduction: 'rule-of-thirds',
    rising: 'center',
    climax: 'tight-frame',
    conclusion: 'balanced'
  }
  return compositions[stage as keyof typeof compositions] || 'center'
}

// 스토리 구조 검증 함수
function validateStoryStructure(structure: StoryStructure, totalDuration: number): boolean {
  const stages = [structure.introduction, structure.rising, structure.climax, structure.conclusion]
  
  // 모든 단계가 존재하는지 확인
  if (stages.some(stage => !stage)) return false
  
  // 시간 합계가 총 시간과 일치하는지 확인 (±2초 허용)
  const totalStageDuration = stages.reduce((sum, stage) => sum + stage.duration, 0)
  if (Math.abs(totalStageDuration - totalDuration) > 2) return false
  
  // 각 단계가 최소 시간을 가지는지 확인
  if (stages.some(stage => stage.duration < 1)) return false
  
  return true
}

// 숏트 분배 검증 함수
function validateShotDistribution(shots: Shot[], structure: StoryStructure): boolean {
  // 정확히 12개인지 확인
  if (shots.length !== 12) return false
  
  // 숏트 번호가 순차적인지 확인
  for (let i = 0; i < shots.length; i++) {
    if (shots[i].shotNumber !== i + 1) return false
  }
  
  // 각 단계별 숏트 개수 확인
  const distribution = {
    introduction: shots.filter(s => s.storyStage === 'introduction').length,
    rising: shots.filter(s => s.storyStage === 'rising').length,
    climax: shots.filter(s => s.storyStage === 'climax').length,
    conclusion: shots.filter(s => s.storyStage === 'conclusion').length
  }
  
  // 최소 분배 기준
  if (distribution.introduction < 2 || distribution.introduction > 3) return false
  if (distribution.rising < 4 || distribution.rising > 5) return false
  if (distribution.climax < 3 || distribution.climax > 4) return false
  if (distribution.conclusion < 1 || distribution.conclusion > 2) return false
  
  return true
}

describe('스토리 구조 생성 테스트', () => {
  describe('4단계 스토리 구조 생성', () => {
    it('기본 기승전결 구조 생성 (60초)', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      
      expect(structure.introduction.duration).toBe(12) // 20%
      expect(structure.rising.duration).toBe(24) // 40%
      expect(structure.climax.duration).toBe(18) // 30%
      expect(structure.conclusion.duration).toBe(6) // 10%
      
      expect(validateStoryStructure(structure, 60)).toBe(true)
    })

    it('훅 전개방식 구조 생성 (60초)', () => {
      const structure = generateStoryStructure(60, 'hook-immersion-twist-clue', 'moderate')
      
      expect(structure.introduction.duration).toBe(9) // 15%
      expect(structure.rising.duration).toBe(21) // 35%
      expect(structure.climax.duration).toBe(24) // 40%
      expect(structure.conclusion.duration).toBe(6) // 10%
      
      expect(validateStoryStructure(structure, 60)).toBe(true)
    })

    it('다큐멘터리 구조 생성 (90초)', () => {
      const structure = generateStoryStructure(90, 'documentary', 'moderate')
      
      expect(structure.introduction.duration).toBe(23) // 25%
      expect(structure.rising.duration).toBe(32) // 35%
      expect(structure.climax.duration).toBe(23) // 25%
      expect(structure.conclusion.duration).toBe(14) // 15%
      
      expect(validateStoryStructure(structure, 90)).toBe(true)
    })

    it('짧은 영상 구조 생성 (30초)', () => {
      const structure = generateStoryStructure(30, 'classic-kishōtenketsu', 'as-is')
      
      expect(structure.introduction.duration).toBe(6) // 20%
      expect(structure.rising.duration).toBe(12) // 40%
      expect(structure.climax.duration).toBe(9) // 30%
      expect(structure.conclusion.duration).toBe(3) // 10%
      
      expect(validateStoryStructure(structure, 30)).toBe(true)
    })

    it('긴 영상 구조 생성 (180초)', () => {
      const structure = generateStoryStructure(180, 'classic-kishōtenketsu', 'rich')
      
      expect(structure.introduction.duration).toBe(36) // 20%
      expect(structure.rising.duration).toBe(72) // 40%
      expect(structure.climax.duration).toBe(54) // 30%
      expect(structure.conclusion.duration).toBe(18) // 10%
      
      // 풍부한 전개일 때 키포인트 추가 확인
      expect(structure.introduction.keyPoints.length).toBeGreaterThan(3)
      expect(structure.rising.keyPoints.length).toBeGreaterThan(3)
      
      expect(validateStoryStructure(structure, 180)).toBe(true)
    })
  })

  describe('전개 강도별 키포인트 생성', () => {
    it('as-is 강도: 기본 키포인트만', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'as-is')
      
      expect(structure.introduction.keyPoints).toHaveLength(3)
      expect(structure.rising.keyPoints).toHaveLength(3)
      expect(structure.climax.keyPoints).toHaveLength(3)
      expect(structure.conclusion.keyPoints).toHaveLength(3)
    })

    it('moderate 강도: 기본 키포인트', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      
      expect(structure.introduction.keyPoints).toHaveLength(3)
      expect(structure.rising.keyPoints).toHaveLength(3)
    })

    it('rich 강도: 추가 키포인트 포함', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'rich')
      
      expect(structure.introduction.keyPoints).toHaveLength(5)
      expect(structure.rising.keyPoints).toHaveLength(5)
      expect(structure.climax.keyPoints).toHaveLength(5)
      expect(structure.conclusion.keyPoints).toHaveLength(5)
      
      expect(structure.introduction.keyPoints).toContain('배경 설명')
      expect(structure.climax.keyPoints).toContain('반전')
    })
  })

  describe('12개 숏트 분배 테스트', () => {
    it('normal 템포로 60초 영상에 숏트 분배', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(60, 'normal', structure)
      
      expect(shots).toHaveLength(12)
      expect(validateShotDistribution(shots, structure)).toBe(true)
      
      // 총 시간 확인
      const totalShotDuration = shots.reduce((sum, shot) => sum + shot.duration, 0)
      expect(Math.abs(totalShotDuration - 60)).toBeLessThanOrEqual(2)
    })

    it('fast 템포로 30초 영상에 숏트 분배', () => {
      const structure = generateStoryStructure(30, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(30, 'fast', structure)
      
      expect(shots).toHaveLength(12)
      expect(validateShotDistribution(shots, structure)).toBe(true)
      
      // 빠른 템포일 때 대부분의 숏트가 짧은지 확인
      const shortShots = shots.filter(shot => shot.duration <= 4)
      expect(shortShots.length).toBeGreaterThanOrEqual(8) // 최소 8개 이상
    })

    it('slow 템포로 180초 영상에 숏트 분배', () => {
      const structure = generateStoryStructure(180, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(180, 'slow', structure)
      
      expect(shots).toHaveLength(12)
      expect(validateShotDistribution(shots, structure)).toBe(true)
      
      // 느린 템포일 때 대부분의 숏트가 충분히 긴지 확인
      const longShots = shots.filter(shot => shot.duration >= 10)
      expect(longShots.length).toBeGreaterThanOrEqual(8) // 최소 8개 이상
    })

    it('스토리 단계별 숏트 순서 확인', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(60, 'normal', structure)
      
      // 도입부 숏트가 처음에 오는지
      const firstShots = shots.slice(0, 3)
      expect(firstShots.every(s => s.storyStage === 'introduction')).toBe(true)
      
      // 결말부 숏트가 마지막에 오는지
      const lastShots = shots.slice(-2)
      expect(lastShots.some(s => s.storyStage === 'conclusion')).toBe(true)
    })
  })

  describe('스토리 구조 검증', () => {
    it('유효한 구조 검증', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      expect(validateStoryStructure(structure, 60)).toBe(true)
    })

    it('시간 합계 불일치 감지', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      structure.introduction.duration = 100 // 잘못된 값
      expect(validateStoryStructure(structure, 60)).toBe(false)
    })

    it('음수 시간 감지', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      structure.conclusion.duration = -1
      expect(validateStoryStructure(structure, 60)).toBe(false)
    })
  })

  describe('숏트 분배 검증', () => {
    it('올바른 숏트 분배 검증', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(60, 'normal', structure)
      expect(validateShotDistribution(shots, structure)).toBe(true)
    })

    it('잘못된 숏트 개수 감지', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      const shots: Shot[] = [] // 빈 배열
      expect(validateShotDistribution(shots, structure)).toBe(false)
    })

    it('잘못된 숏트 번호 순서 감지', () => {
      const structure = generateStoryStructure(60, 'classic-kishōtenketsu', 'moderate')
      const shots = distributeShots(60, 'normal', structure)
      if (shots.length > 0) {
        shots[5].shotNumber = 99 // 잘못된 번호
        expect(validateShotDistribution(shots, structure)).toBe(false)
      }
    })
  })
})