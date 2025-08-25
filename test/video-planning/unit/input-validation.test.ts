import { describe, it, expect, vi, beforeEach } from 'vitest'

// 입력 검증 함수들
function validateTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: '제목은 필수 입력 항목입니다.' }
  }
  if (title.length < 2) {
    return { valid: false, error: '제목은 최소 2자 이상이어야 합니다.' }
  }
  if (title.length > 100) {
    return { valid: false, error: '제목은 최대 100자까지 입력 가능합니다.' }
  }
  return { valid: true }
}

function validateOneLinerStory(story: string): { valid: boolean; error?: string } {
  if (!story || story.trim().length === 0) {
    return { valid: false, error: '한 줄 스토리는 필수 입력 항목입니다.' }
  }
  if (story.length < 10) {
    return { valid: false, error: '한 줄 스토리는 최소 10자 이상이어야 합니다.' }
  }
  if (story.length > 500) {
    return { valid: false, error: '한 줄 스토리는 최대 500자까지 입력 가능합니다.' }
  }
  return { valid: true }
}

function sanitizeInput(input: string): string {
  // 특수문자와 이모지는 허용하되, 위험한 HTML/스크립트 태그는 제거
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function validateDevelopmentMethod(method: string): boolean {
  const validMethods = [
    'hook-immersion-twist-clue',
    'classic-kishōtenketsu',
    'induction',
    'deduction',
    'documentary',
    'pixar-story'
  ]
  return validMethods.includes(method)
}

function validateTempo(tempo: string): boolean {
  return ['fast', 'normal', 'slow'].includes(tempo)
}

function validateDevelopmentIntensity(intensity: string): boolean {
  return ['as-is', 'moderate', 'rich'].includes(intensity)
}

describe('입력 검증 테스트', () => {
  describe('제목 검증 (validateTitle)', () => {
    it('최소 길이 미만 입력 시 오류 반환', () => {
      const result = validateTitle('A')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('최소 2자')
    })

    it('최소 길이 경계값 입력 시 성공', () => {
      const result = validateTitle('AI')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('일반적인 제목 입력 시 성공', () => {
      const result = validateTitle('브이래닛 브랜드 홍보영상')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('최대 길이 경계값 입력 시 성공', () => {
      const result = validateTitle('A'.repeat(100))
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('최대 길이 초과 입력 시 오류 반환', () => {
      const result = validateTitle('A'.repeat(101))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('최대 100자')
    })

    it('빈 문자열 입력 시 오류 반환', () => {
      const result = validateTitle('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('필수 입력')
    })

    it('공백만 입력 시 오류 반환', () => {
      const result = validateTitle('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('필수 입력')
    })

    it('특수문자 포함 제목 입력 시 성공', () => {
      const result = validateTitle('AI 영상 @2025 #혁신')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('이모지 포함 제목 입력 시 성공', () => {
      const result = validateTitle('🎬 AI 영상 제작 🎥')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('다국어 제목 입력 시 성공', () => {
      const result = validateTitle('한글 English 日本語 中文')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('한 줄 스토리 검증 (validateOneLinerStory)', () => {
    it('최소 길이 미만 입력 시 오류 반환', () => {
      const result = validateOneLinerStory('짧은스토리')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('최소 10자')
    })

    it('최소 길이 경계값 입력 시 성공', () => {
      const result = validateOneLinerStory('1234567890')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('일반적인 스토리 입력 시 성공', () => {
      const result = validateOneLinerStory('AI 기술로 영상 제작 과정을 혁신하는 브이래닛의 이야기')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('최대 길이 경계값 입력 시 성공', () => {
      const result = validateOneLinerStory('A'.repeat(500))
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('최대 길이 초과 입력 시 오류 반환', () => {
      const result = validateOneLinerStory('A'.repeat(501))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('최대 500자')
    })

    it('빈 문자열 입력 시 오류 반환', () => {
      const result = validateOneLinerStory('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('필수 입력')
    })

    it('줄바꿈 포함 스토리 입력 시 성공', () => {
      const result = validateOneLinerStory('첫 번째 줄\n두 번째 줄\n세 번째 줄')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('특수문자와 이모지 혼합 입력 시 성공', () => {
      const result = validateOneLinerStory('🎬 AI로 #영상제작 @2025년! 혁신적인 플랫폼 💡')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('입력 정제 (sanitizeInput)', () => {
    it('일반 텍스트는 그대로 유지', () => {
      const input = '일반적인 텍스트 입력'
      expect(sanitizeInput(input)).toBe(input)
    })

    it('HTML 태그 제거', () => {
      const input = '<div>텍스트</div><p>문단</p>'
      expect(sanitizeInput(input)).toBe('텍스트문단')
    })

    it('스크립트 태그 제거', () => {
      const input = '정상 텍스트<script>alert("XSS")</script>끝'
      expect(sanitizeInput(input)).toBe('정상 텍스트끝')
    })

    it('앞뒤 공백 제거', () => {
      const input = '  텍스트  '
      expect(sanitizeInput(input)).toBe('텍스트')
    })

    it('이모지는 유지', () => {
      const input = '🎬 영상 제작 🎥'
      expect(sanitizeInput(input)).toBe(input)
    })

    it('특수문자는 유지', () => {
      const input = '@#$% 특수문자 테스트!'
      expect(sanitizeInput(input)).toBe(input)
    })
  })

  describe('전개방식 검증 (validateDevelopmentMethod)', () => {
    it('유효한 전개방식 입력 시 true 반환', () => {
      const validMethods = [
        'hook-immersion-twist-clue',
        'classic-kishōtenketsu',
        'induction',
        'deduction',
        'documentary',
        'pixar-story'
      ]
      
      validMethods.forEach(method => {
        expect(validateDevelopmentMethod(method)).toBe(true)
      })
    })

    it('잘못된 전개방식 입력 시 false 반환', () => {
      expect(validateDevelopmentMethod('invalid-method')).toBe(false)
      expect(validateDevelopmentMethod('')).toBe(false)
      expect(validateDevelopmentMethod('random')).toBe(false)
    })
  })

  describe('템포 검증 (validateTempo)', () => {
    it('유효한 템포 입력 시 true 반환', () => {
      expect(validateTempo('fast')).toBe(true)
      expect(validateTempo('normal')).toBe(true)
      expect(validateTempo('slow')).toBe(true)
    })

    it('잘못된 템포 입력 시 false 반환', () => {
      expect(validateTempo('very-fast')).toBe(false)
      expect(validateTempo('medium')).toBe(false)
      expect(validateTempo('')).toBe(false)
    })
  })

  describe('전개 강도 검증 (validateDevelopmentIntensity)', () => {
    it('유효한 강도 입력 시 true 반환', () => {
      expect(validateDevelopmentIntensity('as-is')).toBe(true)
      expect(validateDevelopmentIntensity('moderate')).toBe(true)
      expect(validateDevelopmentIntensity('rich')).toBe(true)
    })

    it('잘못된 강도 입력 시 false 반환', () => {
      expect(validateDevelopmentIntensity('minimal')).toBe(false)
      expect(validateDevelopmentIntensity('maximum')).toBe(false)
      expect(validateDevelopmentIntensity('')).toBe(false)
    })
  })

  describe('복합 검증 시나리오', () => {
    it('모든 필드가 유효한 경우', () => {
      const formData = {
        title: '브이래닛 홍보영상',
        oneLinerStory: 'AI 기술로 영상 제작을 혁신하는 브이래닛의 이야기',
        developmentMethod: 'classic-kishōtenketsu',
        tempo: 'normal',
        developmentIntensity: 'moderate'
      }

      expect(validateTitle(formData.title).valid).toBe(true)
      expect(validateOneLinerStory(formData.oneLinerStory).valid).toBe(true)
      expect(validateDevelopmentMethod(formData.developmentMethod)).toBe(true)
      expect(validateTempo(formData.tempo)).toBe(true)
      expect(validateDevelopmentIntensity(formData.developmentIntensity)).toBe(true)
    })

    it('일부 필드만 유효한 경우', () => {
      const formData = {
        title: 'A',  // 너무 짧음
        oneLinerStory: '짧음',  // 너무 짧음
        developmentMethod: 'invalid',  // 잘못된 값
        tempo: 'normal',  // 유효
        developmentIntensity: 'moderate'  // 유효
      }

      expect(validateTitle(formData.title).valid).toBe(false)
      expect(validateOneLinerStory(formData.oneLinerStory).valid).toBe(false)
      expect(validateDevelopmentMethod(formData.developmentMethod)).toBe(false)
      expect(validateTempo(formData.tempo)).toBe(true)
      expect(validateDevelopmentIntensity(formData.developmentIntensity)).toBe(true)
    })

    it('악의적인 입력 정제', () => {
      const maliciousInput = {
        title: '<script>alert("XSS")</script>정상 제목',
        oneLinerStory: '정상적인 스토리 내용입니다<img src=x onerror=alert(1)>'
      }

      const sanitizedTitle = sanitizeInput(maliciousInput.title)
      const sanitizedStory = sanitizeInput(maliciousInput.oneLinerStory)

      expect(sanitizedTitle).toBe('정상 제목')
      expect(sanitizedStory).toBe('정상적인 스토리 내용입니다')
      
      // 정제 후 검증
      expect(validateTitle(sanitizedTitle).valid).toBe(true)
      expect(validateOneLinerStory(sanitizedStory).valid).toBe(true)
    })
  })
})