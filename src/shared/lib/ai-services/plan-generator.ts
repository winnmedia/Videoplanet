/**
 * AI 영상 기획서 생성 서비스
 * OpenAI GPT-4 기반 영상 기획서 자동 생성
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import type {
  AIGenerationPlanRequest,
  AIGenerationPlanResponse,
  VideoPlanContent,
  APIResponse
} from '@/entities/video-planning'

// ============================
// 서비스 인터페이스 정의
// ============================

export interface AIServiceConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
  retryAttempts: number
}

export interface GenerationProgress {
  step: string
  progress: number
  message: string
}

export interface AIServiceError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface AIServiceMetrics {
  requestId: string
  tokensUsed: number
  responseTime: number
  cacheHit: boolean
  model: string
}

// ============================
// AI 기획서 생성 서비스 클래스
// ============================

export class VideoPlanGeneratorService {
  private config: AIServiceConfig
  private progressCallback?: (progress: GenerationProgress) => void
  private abortController?: AbortController

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      ...config
    }

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  /**
   * 진행 상황 콜백 설정
   */
  setProgressCallback(callback: (progress: GenerationProgress) => void): void {
    this.progressCallback = callback
  }

  /**
   * 생성 작업 취소
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  /**
   * AI 기획서 생성
   */
  async generatePlan(request: AIGenerationPlanRequest): Promise<AIGenerationPlanResponse> {
    this.abortController = new AbortController()
    const startTime = Date.now()

    try {
      // 1단계: 입력 검증
      this.emitProgress('validation', 10, '입력 데이터 검증 중...')
      this.validateRequest(request)

      // 2단계: 캐시 확인
      this.emitProgress('cache-check', 20, '캐시 확인 중...')
      const cacheResult = await this.checkCache(request)
      if (cacheResult) {
        this.emitProgress('completed', 100, '캐시된 기획서 반환 완료')
        return {
          planContent: cacheResult,
          generationTime: Date.now() - startTime,
          tokensUsed: 0,
          cached: true
        }
      }

      // 3단계: 프롬프트 생성
      this.emitProgress('prompt-generation', 30, '프롬프트 생성 중...')
      const prompt = this.generatePrompt(request)

      // 4단계: AI API 호출
      this.emitProgress('ai-generation', 50, 'AI 기획서 생성 중...')
      const aiResponse = await this.callOpenAI(prompt)

      // 5단계: 응답 파싱
      this.emitProgress('parsing', 80, '응답 데이터 파싱 중...')
      const planContent = await this.parseAndValidateResponse(aiResponse, request)

      // 6단계: 캐시 저장
      this.emitProgress('caching', 90, '결과 캐싱 중...')
      await this.saveToCache(request, planContent)

      // 완료
      this.emitProgress('completed', 100, 'AI 기획서 생성 완료')

      return {
        planContent,
        generationTime: Date.now() - startTime,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        cached: false
      }

    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 배치 기획서 생성 (여러 개 동시 생성)
   */
  async generateMultiplePlans(
    requests: AIGenerationPlanRequest[]
  ): Promise<AIGenerationPlanResponse[]> {
    const results: AIGenerationPlanResponse[] = []
    
    for (let i = 0; i < requests.length; i++) {
      try {
        this.emitProgress('batch-processing', (i / requests.length) * 100, 
          `${i + 1}/${requests.length} 기획서 생성 중...`)
        
        const result = await this.generatePlan(requests[i])
        results.push(result)
        
        // API 호출 제한을 위한 지연
        if (i < requests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Failed to generate plan ${i + 1}:`, error)
        // 에러 발생 시에도 계속 진행
      }
    }

    return results
  }

  /**
   * 기획서 개선 (기존 기획서를 기반으로 업데이트)
   */
  async improvePlan(
    existingPlan: VideoPlanContent,
    improvements: string[]
  ): Promise<AIGenerationPlanResponse> {
    const improveRequest: AIGenerationPlanRequest = {
      concept: existingPlan.executiveSummary.title,
      purpose: existingPlan.executiveSummary.objective,
      target: existingPlan.executiveSummary.targetAudience,
      duration: existingPlan.contentStructure.duration,
      style: [existingPlan.conceptDevelopment.visualStyle],
      tone: [existingPlan.conceptDevelopment.emotionalTone],
      keyMessages: [existingPlan.conceptDevelopment.coreMessage],
      requirements: `기존 기획서를 개선해주세요. 개선 요청사항: ${improvements.join(', ')}`
    }

    return this.generatePlan(improveRequest)
  }

  // ============================
  // Private 메서드들
  // ============================

  private emitProgress(step: string, progress: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({ step, progress, message })
    }
  }

  private validateRequest(request: AIGenerationPlanRequest): void {
    const requiredFields = ['concept', 'purpose', 'target', 'duration', 'style', 'tone', 'keyMessages']
    
    for (const field of requiredFields) {
      if (!request[field as keyof AIGenerationPlanRequest]) {
        throw new AIServiceError({
          code: 'INVALID_REQUEST',
          message: `필수 필드가 누락되었습니다: ${field}`,
          retryable: false
        })
      }
    }

    // 길이 제한 검증
    if (request.concept.length > 500) {
      throw new AIServiceError({
        code: 'INPUT_TOO_LONG',
        message: '컨셉 설명이 너무 깁니다 (최대 500자)',
        retryable: false
      })
    }

    // 배열 필드 검증
    if (!Array.isArray(request.style) || request.style.length === 0) {
      throw new AIServiceError({
        code: 'INVALID_STYLE_ARRAY',
        message: '스타일 정보는 최소 1개 이상 선택해야 합니다',
        retryable: false
      })
    }
  }

  private async checkCache(request: AIGenerationPlanRequest): Promise<VideoPlanContent | null> {
    try {
      const response = await fetch('/api/ai/cache/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request })
      })

      if (response.ok) {
        const result = await response.json()
        return result.data?.planContent || null
      }
    } catch (error) {
      console.warn('Cache check failed:', error)
    }

    return null
  }

  private generatePrompt(request: AIGenerationPlanRequest): string {
    // 기존 generatePlanPrompt 로직 재사용
    return `
당신은 전문 영상 기획 전문가입니다. 아래 요구사항을 바탕으로 체계적이고 실행 가능한 영상 기획서를 생성해주세요.

### 기본 정보
- **영상 컨셉**: ${request.concept}
- **제작 목적**: ${request.purpose}
- **타겟 오디언스**: ${request.target}
- **예상 길이**: ${request.duration}
- **예산 범위**: ${request.budget || '미정'}

### 스타일 가이드
- **영상 스타일**: ${request.style.join(', ')}
- **톤앤매너**: ${request.tone.join(', ')}
- **핵심 메시지**: ${request.keyMessages.join(', ')}

${request.requirements ? `### 특별 요구사항\n${request.requirements}\n` : ''}
${request.preferences ? `### 선호 사항\n${request.preferences}\n` : ''}

다음 JSON 구조로 완전한 영상 기획서를 작성해주세요:
[구조화된 JSON 스키마...]

반드시 유효한 JSON 형식으로만 응답하고, 추가 설명은 하지 마세요.
`.trim()
  }

  private async callOpenAI(prompt: string): Promise<any> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const timeoutId = setTimeout(() => {
          if (this.abortController) {
            this.abortController.abort()
          }
        }, this.config.timeout)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: '당신은 10년 이상의 경험을 가진 영상 기획 전문가입니다.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            response_format: { type: 'json_object' }
          }),
          signal: this.abortController?.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message}`)
        }

        return await response.json()

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.config.retryAttempts) {
          console.warn(`OpenAI API attempt ${attempt} failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError!
  }

  private async parseAndValidateResponse(
    aiResponse: any, 
    request: AIGenerationPlanRequest
  ): Promise<VideoPlanContent> {
    try {
      const content = aiResponse.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from AI service')
      }

      const parsed = JSON.parse(content)
      
      // 필수 섹션 검증
      const requiredSections = [
        'executiveSummary', 'conceptDevelopment', 'contentStructure',
        'productionPlan', 'budgetEstimate', 'deliverables',
        'successMetrics', 'riskAssessment'
      ]

      for (const section of requiredSections) {
        if (!parsed[section]) {
          throw new Error(`Missing required section: ${section}`)
        }
      }

      return {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...parsed,
        createdAt: new Date().toISOString(),
        version: 1
      }

    } catch (error) {
      throw new AIServiceError({
        code: 'PARSING_ERROR',
        message: `AI 응답 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { aiResponse },
        retryable: true
      })
    }
  }

  private async saveToCache(
    request: AIGenerationPlanRequest,
    planContent: VideoPlanContent
  ): Promise<void> {
    try {
      await fetch('/api/ai/cache/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, planContent })
      })
    } catch (error) {
      console.warn('Cache save failed:', error)
      // 캐시 저장 실패는 전체 프로세스를 중단하지 않음
    }
  }

  private handleError(error: any): AIServiceError {
    if (error instanceof AIServiceError) {
      return error
    }

    if (error.name === 'AbortError') {
      return new AIServiceError({
        code: 'GENERATION_CANCELLED',
        message: '기획서 생성이 취소되었습니다',
        retryable: false
      })
    }

    if (error.message?.includes('timeout')) {
      return new AIServiceError({
        code: 'TIMEOUT',
        message: 'AI 서비스 응답 시간이 초과되었습니다',
        retryable: true
      })
    }

    if (error.message?.includes('rate limit')) {
      return new AIServiceError({
        code: 'RATE_LIMIT',
        message: 'API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요',
        retryable: true
      })
    }

    return new AIServiceError({
      code: 'UNKNOWN_ERROR',
      message: error.message || '알 수 없는 오류가 발생했습니다',
      details: error,
      retryable: false
    })
  }
}

// ============================
// 싱글톤 인스턴스 및 팩토리
// ============================

let globalPlanGenerator: VideoPlanGeneratorService | null = null

export function createPlanGenerator(config?: Partial<AIServiceConfig>): VideoPlanGeneratorService {
  return new VideoPlanGeneratorService(config)
}

export function getPlanGenerator(config?: Partial<AIServiceConfig>): VideoPlanGeneratorService {
  if (!globalPlanGenerator) {
    globalPlanGenerator = new VideoPlanGeneratorService(config)
  }
  return globalPlanGenerator
}

// ============================
// 유틸리티 함수들
// ============================

export async function generatePlanFromAPI(
  request: AIGenerationPlanRequest,
  onProgress?: (progress: GenerationProgress) => void
): Promise<AIGenerationPlanResponse> {
  const generator = createPlanGenerator()
  
  if (onProgress) {
    generator.setProgressCallback(onProgress)
  }

  return await generator.generatePlan(request)
}

export function validatePlanRequest(request: AIGenerationPlanRequest): string[] {
  const errors: string[] = []
  
  if (!request.concept || request.concept.trim().length === 0) {
    errors.push('영상 컨셉은 필수입니다')
  }
  
  if (!request.purpose || request.purpose.trim().length === 0) {
    errors.push('제작 목적은 필수입니다')
  }

  if (!request.target || request.target.trim().length === 0) {
    errors.push('타겟 오디언스는 필수입니다')
  }

  if (!request.duration || request.duration.trim().length === 0) {
    errors.push('영상 길이는 필수입니다')
  }

  if (!Array.isArray(request.style) || request.style.length === 0) {
    errors.push('영상 스타일은 최소 1개 이상 선택해야 합니다')
  }

  if (!Array.isArray(request.tone) || request.tone.length === 0) {
    errors.push('톤앤매너는 최소 1개 이상 선택해야 합니다')
  }

  if (!Array.isArray(request.keyMessages) || request.keyMessages.length === 0) {
    errors.push('핵심 메시지는 최소 1개 이상 입력해야 합니다')
  }

  if (request.concept && request.concept.length > 500) {
    errors.push('컨셉 설명은 500자를 초과할 수 없습니다')
  }

  return errors
}

// ============================
// 에러 클래스 정의
// ============================

class AIServiceError extends Error {
  public readonly code: string
  public readonly retryable: boolean
  public readonly details?: any

  constructor({ code, message, details, retryable }: {
    code: string
    message: string
    details?: any
    retryable: boolean
  }) {
    super(message)
    this.name = 'AIServiceError'
    this.code = code
    this.retryable = retryable
    this.details = details
  }
}