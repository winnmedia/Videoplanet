/**
 * AI 영상 기획서 검증 로직
 * 입력값 검증, 비즈니스 룰 검증, 데이터 무결성 보장
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import type {
  AIGenerationPlanRequest,
  VideoPlanning,
  VideoPlanContent,
  PlanCollaborator,
  PlanComment
} from '@/entities/video-planning'

// ============================
// 검증 결과 타입 정의
// ============================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
}

export interface ValidationWarning {
  field: string
  code: string
  message: string
  suggestion?: string
}

// ============================
// 비즈니스 룰 상수
// ============================

export const VALIDATION_RULES = {
  PLAN_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    PATTERN: /^[a-zA-Z0-9가-힣\s\-_()[\]{}.,!?]+$/
  },
  CONCEPT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
    REQUIRED_KEYWORDS: ['영상', '콘텐츠', '브랜드', '제품', '서비스'] // 최소 1개 포함
  },
  PURPOSE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 300,
    COMMON_PURPOSES: ['홍보', '마케팅', '교육', '브랜드링', '제품소개', '서비스소개']
  },
  TARGET: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
    REQUIRED_ELEMENTS: ['연령', '직업', '관심사'] // 권장 요소
  },
  DURATION: {
    MIN_SECONDS: 15,
    MAX_SECONDS: 600,
    COMMON_DURATIONS: ['15초', '30초', '60초', '90초', '120초', '180초', '300초']
  },
  STYLE: {
    MIN_COUNT: 1,
    MAX_COUNT: 5,
    VALID_STYLES: [
      '모던', '클래식', '미니멀', '럭셔리', '캐주얼', '전문적', '친근한', '세련된',
      '역동적', '차분한', '따뜻한', '시원한', '밝은', '어두운', '컬러풀', '모노톤'
    ]
  },
  TONE: {
    MIN_COUNT: 1,
    MAX_COUNT: 4,
    VALID_TONES: [
      '전문적', '친근한', '신뢰감', '혁신적', '안정적', '역동적', '따뜻한', '쿨한',
      '유머러스', '진지한', '감성적', '이성적', '고급스러운', '접근하기 쉬운'
    ]
  },
  KEY_MESSAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 5,
    MIN_LENGTH_EACH: 2,
    MAX_LENGTH_EACH: 50
  },
  TAGS: {
    MAX_COUNT: 10,
    MIN_LENGTH_EACH: 2,
    MAX_LENGTH_EACH: 20,
    PATTERN: /^[a-zA-Z0-9가-힣\-_]+$/
  }
} as const

// ============================
// AI 기획서 생성 요청 검증
// ============================

export function validateAIGenerationRequest(request: AIGenerationPlanRequest): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 필수 필드 검증
  validateRequiredFields(request, errors)
  
  // 개별 필드 검증
  validateConcept(request.concept, errors, warnings)
  validatePurpose(request.purpose, errors, warnings)
  validateTarget(request.target, errors, warnings)
  validateDuration(request.duration, errors, warnings)
  validateStyle(request.style, errors, warnings)
  validateTone(request.tone, errors, warnings)
  validateKeyMessages(request.keyMessages, errors, warnings)
  
  // 선택적 필드 검증
  if (request.requirements) {
    validateRequirements(request.requirements, errors, warnings)
  }
  
  if (request.preferences) {
    validatePreferences(request.preferences, errors, warnings)
  }
  
  if (request.budget) {
    validateBudget(request.budget, errors, warnings)
  }

  // 조합 검증 (필드 간 일관성)
  validateFieldCombinations(request, errors, warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================
// 개별 필드 검증 함수들
// ============================

function validateRequiredFields(request: AIGenerationPlanRequest, errors: ValidationError[]): void {
  const requiredFields: (keyof AIGenerationPlanRequest)[] = [
    'concept', 'purpose', 'target', 'duration', 'style', 'tone', 'keyMessages'
  ]

  requiredFields.forEach(field => {
    const value = request[field]
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push({
        field,
        code: 'REQUIRED_FIELD_MISSING',
        message: `${getFieldDisplayName(field)}은(는) 필수 입력 항목입니다.`,
        value
      })
    }
  })
}

function validateConcept(concept: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!concept) return

  const trimmed = concept.trim()

  // 길이 검증
  if (trimmed.length < VALIDATION_RULES.CONCEPT.MIN_LENGTH) {
    errors.push({
      field: 'concept',
      code: 'CONCEPT_TOO_SHORT',
      message: `영상 컨셉은 최소 ${VALIDATION_RULES.CONCEPT.MIN_LENGTH}자 이상 입력해야 합니다.`,
      value: trimmed.length
    })
  }

  if (trimmed.length > VALIDATION_RULES.CONCEPT.MAX_LENGTH) {
    errors.push({
      field: 'concept',
      code: 'CONCEPT_TOO_LONG',
      message: `영상 컨셉은 최대 ${VALIDATION_RULES.CONCEPT.MAX_LENGTH}자까지 입력 가능합니다.`,
      value: trimmed.length
    })
  }

  // 키워드 검증
  const hasRequiredKeyword = VALIDATION_RULES.CONCEPT.REQUIRED_KEYWORDS.some(keyword =>
    trimmed.toLowerCase().includes(keyword)
  )

  if (!hasRequiredKeyword) {
    warnings.push({
      field: 'concept',
      code: 'CONCEPT_MISSING_KEYWORDS',
      message: '영상 컨셉에 구체적인 내용(영상, 콘텐츠, 브랜드, 제품, 서비스 등)을 포함하는 것이 좋습니다.',
      suggestion: '예: "브랜드 홍보를 위한 제품 소개 영상"'
    })
  }

  // 구체성 검증
  if (trimmed.split(' ').length < 5) {
    warnings.push({
      field: 'concept',
      code: 'CONCEPT_LACKS_DETAIL',
      message: '영상 컨셉을 더 구체적으로 설명하면 더 정확한 기획서를 생성할 수 있습니다.',
      suggestion: '목적, 스타일, 분위기 등을 포함해 주세요.'
    })
  }
}

function validatePurpose(purpose: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!purpose) return

  const trimmed = purpose.trim()

  if (trimmed.length < VALIDATION_RULES.PURPOSE.MIN_LENGTH) {
    errors.push({
      field: 'purpose',
      code: 'PURPOSE_TOO_SHORT',
      message: `제작 목적은 최소 ${VALIDATION_RULES.PURPOSE.MIN_LENGTH}자 이상 입력해야 합니다.`,
      value: trimmed.length
    })
  }

  if (trimmed.length > VALIDATION_RULES.PURPOSE.MAX_LENGTH) {
    errors.push({
      field: 'purpose',
      code: 'PURPOSE_TOO_LONG',
      message: `제작 목적은 최대 ${VALIDATION_RULES.PURPOSE.MAX_LENGTH}자까지 입력 가능합니다.`,
      value: trimmed.length
    })
  }

  // 목적의 명확성 검증
  const hasCommonPurpose = VALIDATION_RULES.PURPOSE.COMMON_PURPOSES.some(commonPurpose =>
    trimmed.includes(commonPurpose)
  )

  if (!hasCommonPurpose) {
    warnings.push({
      field: 'purpose',
      code: 'PURPOSE_UNCLEAR',
      message: '제작 목적을 더 명확하게 표현해 주세요.',
      suggestion: '예: "신제품 출시를 위한 브랜드 인지도 향상"'
    })
  }
}

function validateTarget(target: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!target) return

  const trimmed = target.trim()

  if (trimmed.length < VALIDATION_RULES.TARGET.MIN_LENGTH) {
    errors.push({
      field: 'target',
      code: 'TARGET_TOO_SHORT',
      message: `타겟 오디언스는 최소 ${VALIDATION_RULES.TARGET.MIN_LENGTH}자 이상 입력해야 합니다.`,
      value: trimmed.length
    })
  }

  if (trimmed.length > VALIDATION_RULES.TARGET.MAX_LENGTH) {
    errors.push({
      field: 'target',
      code: 'TARGET_TOO_LONG',
      message: `타겟 오디언스는 최대 ${VALIDATION_RULES.TARGET.MAX_LENGTH}자까지 입력 가능합니다.`,
      value: trimmed.length
    })
  }

  // 타겟 구체성 검증
  const agePattern = /\d{1,2}대|\d{1,2}세|\d{1,2}-\d{1,2}세/
  const hasAgeInfo = agePattern.test(trimmed)

  if (!hasAgeInfo) {
    warnings.push({
      field: 'target',
      code: 'TARGET_MISSING_AGE',
      message: '타겟 오디언스에 연령대 정보를 포함하면 더 정확한 기획이 가능합니다.',
      suggestion: '예: "20-30대 직장인"'
    })
  }
}

function validateDuration(duration: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!duration) return

  const trimmed = duration.trim()

  // 일반적인 시간 형식 검증
  const durationPattern = /(\d+)\s*(초|분|시간)/
  const match = trimmed.match(durationPattern)

  if (!match) {
    errors.push({
      field: 'duration',
      code: 'DURATION_INVALID_FORMAT',
      message: '영상 길이는 "60초" 또는 "2분"과 같은 형식으로 입력해 주세요.',
      value: trimmed
    })
    return
  }

  const [, numberStr, unit] = match
  const number = parseInt(numberStr)

  let durationInSeconds: number
  switch (unit) {
    case '초':
      durationInSeconds = number
      break
    case '분':
      durationInSeconds = number * 60
      break
    case '시간':
      durationInSeconds = number * 3600
      break
    default:
      durationInSeconds = number // 기본값은 초
  }

  if (durationInSeconds < VALIDATION_RULES.DURATION.MIN_SECONDS) {
    errors.push({
      field: 'duration',
      code: 'DURATION_TOO_SHORT',
      message: `영상 길이는 최소 ${VALIDATION_RULES.DURATION.MIN_SECONDS}초 이상이어야 합니다.`,
      value: durationInSeconds
    })
  }

  if (durationInSeconds > VALIDATION_RULES.DURATION.MAX_SECONDS) {
    errors.push({
      field: 'duration',
      code: 'DURATION_TOO_LONG',
      message: `영상 길이는 최대 ${VALIDATION_RULES.DURATION.MAX_SECONDS}초(${VALIDATION_RULES.DURATION.MAX_SECONDS / 60}분)까지 권장됩니다.`,
      value: durationInSeconds
    })
  }

  // 최적 길이 제안
  const isCommonDuration = VALIDATION_RULES.DURATION.COMMON_DURATIONS.includes(trimmed)
  if (!isCommonDuration && durationInSeconds > 180) {
    warnings.push({
      field: 'duration',
      code: 'DURATION_UNCOMMON',
      message: '긴 영상은 시청자의 주의 집중이 어려울 수 있습니다.',
      suggestion: '60초-180초 길이를 권장합니다.'
    })
  }
}

function validateStyle(styles: string[], errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!Array.isArray(styles)) {
    errors.push({
      field: 'style',
      code: 'STYLE_INVALID_TYPE',
      message: '영상 스타일은 배열 형태로 입력해 주세요.',
      value: typeof styles
    })
    return
  }

  if (styles.length < VALIDATION_RULES.STYLE.MIN_COUNT) {
    errors.push({
      field: 'style',
      code: 'STYLE_TOO_FEW',
      message: `영상 스타일은 최소 ${VALIDATION_RULES.STYLE.MIN_COUNT}개 이상 선택해 주세요.`,
      value: styles.length
    })
  }

  if (styles.length > VALIDATION_RULES.STYLE.MAX_COUNT) {
    errors.push({
      field: 'style',
      code: 'STYLE_TOO_MANY',
      message: `영상 스타일은 최대 ${VALIDATION_RULES.STYLE.MAX_COUNT}개까지 선택 가능합니다.`,
      value: styles.length
    })
  }

  // 개별 스타일 검증
  styles.forEach((style, index) => {
    if (!style || typeof style !== 'string' || style.trim().length === 0) {
      errors.push({
        field: `style[${index}]`,
        code: 'STYLE_EMPTY',
        message: `${index + 1}번째 스타일이 비어있습니다.`,
        value: style
      })
      return
    }

    const trimmedStyle = style.trim()
    if (!VALIDATION_RULES.STYLE.VALID_STYLES.includes(trimmedStyle)) {
      warnings.push({
        field: `style[${index}]`,
        code: 'STYLE_UNCOMMON',
        message: `"${trimmedStyle}"는 일반적이지 않은 스타일입니다.`,
        suggestion: `추천 스타일: ${VALIDATION_RULES.STYLE.VALID_STYLES.slice(0, 5).join(', ')} 등`
      })
    }
  })

  // 스타일 조합 검증
  validateStyleCombination(styles, warnings)
}

function validateTone(tones: string[], errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!Array.isArray(tones)) {
    errors.push({
      field: 'tone',
      code: 'TONE_INVALID_TYPE',
      message: '톤앤매너는 배열 형태로 입력해 주세요.',
      value: typeof tones
    })
    return
  }

  if (tones.length < VALIDATION_RULES.TONE.MIN_COUNT) {
    errors.push({
      field: 'tone',
      code: 'TONE_TOO_FEW',
      message: `톤앤매너는 최소 ${VALIDATION_RULES.TONE.MIN_COUNT}개 이상 선택해 주세요.`,
      value: tones.length
    })
  }

  if (tones.length > VALIDATION_RULES.TONE.MAX_COUNT) {
    errors.push({
      field: 'tone',
      code: 'TONE_TOO_MANY',
      message: `톤앤매너는 최대 ${VALIDATION_RULES.TONE.MAX_COUNT}개까지 선택 가능합니다.`,
      value: tones.length
    })
  }

  // 개별 톤 검증
  tones.forEach((tone, index) => {
    if (!tone || typeof tone !== 'string' || tone.trim().length === 0) {
      errors.push({
        field: `tone[${index}]`,
        code: 'TONE_EMPTY',
        message: `${index + 1}번째 톤앤매너가 비어있습니다.`,
        value: tone
      })
      return
    }

    const trimmedTone = tone.trim()
    if (!VALIDATION_RULES.TONE.VALID_TONES.includes(trimmedTone)) {
      warnings.push({
        field: `tone[${index}]`,
        code: 'TONE_UNCOMMON',
        message: `"${trimmedTone}"는 일반적이지 않은 톤입니다.`,
        suggestion: `추천 톤: ${VALIDATION_RULES.TONE.VALID_TONES.slice(0, 5).join(', ')} 등`
      })
    }
  })

  // 톤 조합 검증
  validateToneCombination(tones, warnings)
}

function validateKeyMessages(keyMessages: string[], errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (!Array.isArray(keyMessages)) {
    errors.push({
      field: 'keyMessages',
      code: 'KEY_MESSAGES_INVALID_TYPE',
      message: '핵심 메시지는 배열 형태로 입력해 주세요.',
      value: typeof keyMessages
    })
    return
  }

  if (keyMessages.length < VALIDATION_RULES.KEY_MESSAGES.MIN_COUNT) {
    errors.push({
      field: 'keyMessages',
      code: 'KEY_MESSAGES_TOO_FEW',
      message: `핵심 메시지는 최소 ${VALIDATION_RULES.KEY_MESSAGES.MIN_COUNT}개 이상 입력해 주세요.`,
      value: keyMessages.length
    })
  }

  if (keyMessages.length > VALIDATION_RULES.KEY_MESSAGES.MAX_COUNT) {
    errors.push({
      field: 'keyMessages',
      code: 'KEY_MESSAGES_TOO_MANY',
      message: `핵심 메시지는 최대 ${VALIDATION_RULES.KEY_MESSAGES.MAX_COUNT}개까지 입력 가능합니다.`,
      value: keyMessages.length
    })
  }

  // 개별 메시지 검증
  keyMessages.forEach((message, index) => {
    if (!message || typeof message !== 'string') {
      errors.push({
        field: `keyMessages[${index}]`,
        code: 'KEY_MESSAGE_EMPTY',
        message: `${index + 1}번째 핵심 메시지가 비어있습니다.`,
        value: message
      })
      return
    }

    const trimmed = message.trim()
    
    if (trimmed.length < VALIDATION_RULES.KEY_MESSAGES.MIN_LENGTH_EACH) {
      errors.push({
        field: `keyMessages[${index}]`,
        code: 'KEY_MESSAGE_TOO_SHORT',
        message: `${index + 1}번째 핵심 메시지는 최소 ${VALIDATION_RULES.KEY_MESSAGES.MIN_LENGTH_EACH}자 이상이어야 합니다.`,
        value: trimmed.length
      })
    }

    if (trimmed.length > VALIDATION_RULES.KEY_MESSAGES.MAX_LENGTH_EACH) {
      errors.push({
        field: `keyMessages[${index}]`,
        code: 'KEY_MESSAGE_TOO_LONG',
        message: `${index + 1}번째 핵심 메시지는 최대 ${VALIDATION_RULES.KEY_MESSAGES.MAX_LENGTH_EACH}자까지 입력 가능합니다.`,
        value: trimmed.length
      })
    }
  })

  // 중복 메시지 검증
  const uniqueMessages = new Set(keyMessages.map(msg => msg.trim().toLowerCase()))
  if (uniqueMessages.size !== keyMessages.length) {
    warnings.push({
      field: 'keyMessages',
      code: 'KEY_MESSAGES_DUPLICATE',
      message: '중복된 핵심 메시지가 있습니다. 다양한 메시지로 구성해 주세요.',
      suggestion: '각기 다른 관점의 메시지를 입력해 주세요.'
    })
  }
}

function validateRequirements(requirements: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (requirements.length > 1000) {
    errors.push({
      field: 'requirements',
      code: 'REQUIREMENTS_TOO_LONG',
      message: '특별 요구사항은 최대 1000자까지 입력 가능합니다.',
      value: requirements.length
    })
  }

  if (requirements.trim().length < 10) {
    warnings.push({
      field: 'requirements',
      code: 'REQUIREMENTS_TOO_BRIEF',
      message: '특별 요구사항을 더 구체적으로 작성하면 더 정확한 기획서를 생성할 수 있습니다.',
      suggestion: '구체적인 요구사항, 제약사항, 선호하는 방향 등을 포함해 주세요.'
    })
  }
}

function validatePreferences(preferences: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (preferences.length > 500) {
    errors.push({
      field: 'preferences',
      code: 'PREFERENCES_TOO_LONG',
      message: '선호 사항은 최대 500자까지 입력 가능합니다.',
      value: preferences.length
    })
  }
}

function validateBudget(budget: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  const trimmed = budget.trim()
  
  // 예산 형식 검증 (숫자 + 단위)
  const budgetPattern = /^(\d{1,3}(?:,\d{3})*|\d+)\s*(원|만원|억원|달러|\$|USD)?$/
  
  if (!budgetPattern.test(trimmed)) {
    errors.push({
      field: 'budget',
      code: 'BUDGET_INVALID_FORMAT',
      message: '예산은 "3000만원" 또는 "50,000달러"와 같은 형식으로 입력해 주세요.',
      value: trimmed
    })
    return
  }

  // 예산 범위 타당성 검증
  const numberMatch = trimmed.match(/(\d{1,3}(?:,\d{3})*|\d+)/)
  if (numberMatch) {
    const amount = parseInt(numberMatch[1].replace(/,/g, ''))
    const unit = trimmed.replace(numberMatch[0], '').trim()
    
    let amountInKRW: number
    switch (unit) {
      case '원':
        amountInKRW = amount
        break
      case '만원':
        amountInKRW = amount * 10000
        break
      case '억원':
        amountInKRW = amount * 100000000
        break
      case '달러':
      case '$':
      case 'USD':
        amountInKRW = amount * 1300 // 대략적인 환율
        break
      default:
        amountInKRW = amount // 단위가 없으면 원으로 간주
    }

    if (amountInKRW < 1000000) { // 100만원 미만
      warnings.push({
        field: 'budget',
        code: 'BUDGET_TOO_LOW',
        message: '입력하신 예산이 일반적인 영상 제작비보다 낮을 수 있습니다.',
        suggestion: '영상 품질과 제작 범위를 고려하여 예산을 재검토해 보세요.'
      })
    }

    if (amountInKRW > 1000000000) { // 10억원 초과
      warnings.push({
        field: 'budget',
        code: 'BUDGET_VERY_HIGH',
        message: '입력하신 예산이 매우 높습니다. 제작 범위를 확인해 주세요.',
        suggestion: '대규모 프로덕션이 아닌 경우 예산을 재검토해 보세요.'
      })
    }
  }
}

// ============================
// 조합 검증 함수들
// ============================

function validateFieldCombinations(
  request: AIGenerationPlanRequest, 
  errors: ValidationError[], 
  warnings: ValidationWarning[]
): void {
  // 스타일과 톤의 조합 검증
  validateStyleToneCombination(request.style, request.tone, warnings)
  
  // 목적과 타겟의 일치성 검증
  validatePurposeTargetAlignment(request.purpose, request.target, warnings)
  
  // 예산과 요구사항의 현실성 검증
  if (request.budget && request.requirements) {
    validateBudgetRequirementsAlignment(request.budget, request.requirements, warnings)
  }
}

function validateStyleCombination(styles: string[], warnings: ValidationWarning[]): void {
  // 상충하는 스타일 조합 검증
  const conflictingPairs = [
    ['모던', '클래식'],
    ['미니멀', '컬러풀'],
    ['럭셔리', '캐주얼'],
    ['밝은', '어두운'],
    ['차분한', '역동적']
  ]

  conflictingPairs.forEach(([style1, style2]) => {
    if (styles.includes(style1) && styles.includes(style2)) {
      warnings.push({
        field: 'style',
        code: 'STYLE_CONFLICTING',
        message: `"${style1}"과(와) "${style2}" 스타일은 서로 상충될 수 있습니다.`,
        suggestion: '하나의 일관된 방향으로 스타일을 선택해 주세요.'
      })
    }
  })
}

function validateToneCombination(tones: string[], warnings: ValidationWarning[]): void {
  // 상충하는 톤 조합 검증
  const conflictingTones = [
    ['전문적', '유머러스'],
    ['진지한', '유머러스'],
    ['고급스러운', '접근하기 쉬운'],
    ['쿨한', '따뜻한']
  ]

  conflictingTones.forEach(([tone1, tone2]) => {
    if (tones.includes(tone1) && tones.includes(tone2)) {
      warnings.push({
        field: 'tone',
        code: 'TONE_CONFLICTING',
        message: `"${tone1}"과(와) "${tone2}" 톤은 서로 상충될 수 있습니다.`,
        suggestion: '일관된 톤앤매너로 조정해 주세요.'
      })
    }
  })
}

function validateStyleToneCombination(
  styles: string[], 
  tones: string[], 
  warnings: ValidationWarning[]
): void {
  // 스타일과 톤의 부조화 검증
  const recommendedCombinations = {
    '럭셔리': ['고급스러운', '전문적', '세련된'],
    '미니멀': ['차분한', '이성적', '모던'],
    '친근한': ['따뜻한', '접근하기 쉬운', '유머러스'],
    '전문적': ['신뢰감', '안정적', '이성적']
  }

  Object.entries(recommendedCombinations).forEach(([style, recommendedTones]) => {
    if (styles.includes(style)) {
      const hasRecommendedTone = recommendedTones.some(tone => tones.includes(tone))
      if (!hasRecommendedTone) {
        warnings.push({
          field: 'style,tone',
          code: 'STYLE_TONE_MISMATCH',
          message: `"${style}" 스타일에는 다음 톤이 잘 어울립니다.`,
          suggestion: `추천 톤: ${recommendedTones.join(', ')}`
        })
      }
    }
  })
}

function validatePurposeTargetAlignment(
  purpose: string, 
  target: string, 
  warnings: ValidationWarning[]
): void {
  const purposeLower = purpose.toLowerCase()
  const targetLower = target.toLowerCase()

  // B2B vs B2C 일치성 검증
  const isB2BPurpose = purposeLower.includes('기업') || purposeLower.includes('비즈니스') || purposeLower.includes('b2b')
  const isB2CTarget = targetLower.includes('소비자') || targetLower.includes('고객') || /\d{1,2}대/.test(targetLower)

  if (isB2BPurpose && isB2CTarget) {
    warnings.push({
      field: 'purpose,target',
      code: 'PURPOSE_TARGET_MISMATCH',
      message: '기업 대상 목적과 소비자 타겟이 맞지 않을 수 있습니다.',
      suggestion: '목적과 타겟 오디언스의 일치성을 확인해 주세요.'
    })
  }
}

function validateBudgetRequirementsAlignment(
  budget: string, 
  requirements: string, 
  warnings: ValidationWarning[]
): void {
  const requirementsLower = requirements.toLowerCase()
  const budgetLower = budget.toLowerCase()

  // 고품질 요구사항 vs 저예산 검증
  const highQualityKeywords = ['4k', '8k', 'vr', 'ar', '드론', '스테디캠', '전문 배우', 'cg', '특수효과']
  const hasHighQualityRequirement = highQualityKeywords.some(keyword => 
    requirementsLower.includes(keyword)
  )

  const budgetNumber = parseInt(budget.match(/\d+/)?.[0] || '0')
  const isLowBudget = budgetLower.includes('만원') && budgetNumber < 1000

  if (hasHighQualityRequirement && isLowBudget) {
    warnings.push({
      field: 'budget,requirements',
      code: 'BUDGET_REQUIREMENTS_MISMATCH',
      message: '고품질 요구사항에 비해 예산이 부족할 수 있습니다.',
      suggestion: '요구사항을 조정하거나 예산을 늘려주세요.'
    })
  }
}

// ============================
// 기획서 관리 검증
// ============================

export function validateVideoPlanning(planning: Partial<VideoPlanning>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 제목 검증
  if (planning.title) {
    validatePlanTitle(planning.title, errors, warnings)
  }

  // 태그 검증
  if (planning.tags) {
    validatePlanTags(planning.tags, errors, warnings)
  }

  // 상태 전환 검증
  if (planning.status) {
    validateStatusTransition(planning.status, errors)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

function validatePlanTitle(title: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  const trimmed = title.trim()

  if (trimmed.length < VALIDATION_RULES.PLAN_TITLE.MIN_LENGTH) {
    errors.push({
      field: 'title',
      code: 'TITLE_TOO_SHORT',
      message: '기획서 제목을 입력해 주세요.',
      value: trimmed.length
    })
  }

  if (trimmed.length > VALIDATION_RULES.PLAN_TITLE.MAX_LENGTH) {
    errors.push({
      field: 'title',
      code: 'TITLE_TOO_LONG',
      message: `기획서 제목은 최대 ${VALIDATION_RULES.PLAN_TITLE.MAX_LENGTH}자까지 입력 가능합니다.`,
      value: trimmed.length
    })
  }

  if (!VALIDATION_RULES.PLAN_TITLE.PATTERN.test(trimmed)) {
    errors.push({
      field: 'title',
      code: 'TITLE_INVALID_CHARACTERS',
      message: '기획서 제목에 허용되지 않는 특수문자가 포함되어 있습니다.',
      value: trimmed
    })
  }
}

function validatePlanTags(tags: string[], errors: ValidationError[], warnings: ValidationWarning[]): void {
  if (tags.length > VALIDATION_RULES.TAGS.MAX_COUNT) {
    errors.push({
      field: 'tags',
      code: 'TAGS_TOO_MANY',
      message: `태그는 최대 ${VALIDATION_RULES.TAGS.MAX_COUNT}개까지 추가 가능합니다.`,
      value: tags.length
    })
  }

  tags.forEach((tag, index) => {
    const trimmed = tag.trim()
    
    if (trimmed.length < VALIDATION_RULES.TAGS.MIN_LENGTH_EACH) {
      errors.push({
        field: `tags[${index}]`,
        code: 'TAG_TOO_SHORT',
        message: `${index + 1}번째 태그는 최소 ${VALIDATION_RULES.TAGS.MIN_LENGTH_EACH}자 이상이어야 합니다.`,
        value: trimmed.length
      })
    }

    if (trimmed.length > VALIDATION_RULES.TAGS.MAX_LENGTH_EACH) {
      errors.push({
        field: `tags[${index}]`,
        code: 'TAG_TOO_LONG',
        message: `${index + 1}번째 태그는 최대 ${VALIDATION_RULES.TAGS.MAX_LENGTH_EACH}자까지 입력 가능합니다.`,
        value: trimmed.length
      })
    }

    if (!VALIDATION_RULES.TAGS.PATTERN.test(trimmed)) {
      errors.push({
        field: `tags[${index}]`,
        code: 'TAG_INVALID_CHARACTERS',
        message: `${index + 1}번째 태그에 허용되지 않는 문자가 포함되어 있습니다.`,
        value: trimmed
      })
    }
  })

  // 중복 태그 검증
  const uniqueTags = new Set(tags.map(tag => tag.trim().toLowerCase()))
  if (uniqueTags.size !== tags.length) {
    warnings.push({
      field: 'tags',
      code: 'TAGS_DUPLICATE',
      message: '중복된 태그가 있습니다.',
      suggestion: '각기 다른 태그를 사용해 주세요.'
    })
  }
}

function validateStatusTransition(status: string, errors: ValidationError[]): void {
  const validStatuses = ['draft', 'in-review', 'approved', 'published', 'archived']
  
  if (!validStatuses.includes(status)) {
    errors.push({
      field: 'status',
      code: 'INVALID_STATUS',
      message: '유효하지 않은 상태값입니다.',
      value: status
    })
  }
}

// ============================
// 유틸리티 함수들
// ============================

function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    concept: '영상 컨셉',
    purpose: '제작 목적',
    target: '타겟 오디언스',
    duration: '영상 길이',
    budget: '예산',
    style: '영상 스타일',
    tone: '톤앤매너',
    keyMessages: '핵심 메시지',
    requirements: '특별 요구사항',
    preferences: '선호 사항',
    title: '기획서 제목',
    tags: '태그'
  }
  
  return displayNames[field] || field
}

// ============================
// 내보내기 함수들
// ============================

export {
  validateAIGenerationRequest,
  validateVideoPlanning,
  VALIDATION_RULES
}

// 개별 검증 함수들도 내보내기 (필요 시)
export {
  validateConcept,
  validatePurpose,
  validateTarget,
  validateDuration,
  validateStyle,
  validateTone,
  validateKeyMessages
}