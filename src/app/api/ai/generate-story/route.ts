/**
 * 4단계 스토리 생성 API 엔드포인트
 * LLM을 활용한 기승전결 스토리 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  LLMGenerationRequest,
  LLMGenerationResponse,
  StorySection,
  APIResponse
} from '@/entities/storyboard'

// ============================
// 1. 타입 정의
// ============================

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    total_tokens: number
  }
}

// ============================
// 2. 프롬프트 생성 함수
// ============================

function generateStoryPrompt(request: LLMGenerationRequest): string {
  const {
    title,
    storyline,
    tones,
    genres,
    target,
    duration,
    format,
    tempo,
    narrativeStyle,
    developmentIntensity
  } = request

  const toneDescription = tones.join(', ')
  const genreDescription = genres.join(', ')
  
  let intensityInstruction = ''
  switch (developmentIntensity) {
    case 'minimal':
      intensityInstruction = '간결하고 직접적으로 표현하세요. 수식어는 최소화하고 핵심 내용만 포함하세요.'
      break
    case 'moderate':
      intensityInstruction = '균형 잡힌 묘사로 적당한 디테일을 포함하세요.'
      break
    case 'rich':
      intensityInstruction = '감정과 환경을 상세히 묘사하되, 비유는 1회 이내로 제한하세요.'
      break
  }

  let structureInstruction = ''
  switch (narrativeStyle) {
    case 'hook-immersion-twist-cliffhanger':
      structureInstruction = '훅으로 시작하여 몰입을 유도하고, 반전과 떡밥으로 전개하세요.'
      break
    case 'classic-four-act':
      structureInstruction = '전통적인 기승전결 구조를 따르세요.'
      break
    case 'inductive':
      structureInstruction = '구체적인 사례들을 제시하고 일반화된 결론으로 이끄세요.'
      break
    case 'deductive':
      structureInstruction = '일반적인 원리를 제시하고 구체적인 결론을 도출하세요.'
      break
    case 'documentary-interview':
      structureInstruction = '증언과 사실 중심으로 객관적으로 전개하세요.'
      break
    case 'pixar-storytelling':
      structureInstruction = '감정적 몰입과 캐릭터의 성장 여정을 중심으로 전개하세요.'
      break
  }

  return `
당신은 전문 영상 기획자입니다. 다음 정보를 바탕으로 4단계(기-승-전-결) 스토리를 생성해주세요.

### 기본 정보
- 제목: ${title}
- 한 줄 스토리: ${storyline}
- 타겟: ${target}
- 분량: ${duration}초
- 포맷: ${format}
- 템포: ${tempo}

### 스타일 가이드
- 톤앤매너: ${toneDescription}
- 장르: ${genreDescription}
- 전개 방식: ${narrativeStyle}
- 전개 강도: ${intensityInstruction}

### 구조 지침
${structureInstruction}

각 단계별로 총 ${duration}초를 고려하여 적절한 길이로 배분하고, ${tempo} 템포에 맞게 조정하세요.

### 출력 형식
다음 JSON 형식으로 응답해주세요:

{
  "sections": [
    {
      "stage": "opening",
      "title": "[기] 제목",
      "summary": "한 줄 요약",
      "content": "상세 내용",
      "objective": "이 단계의 목표",
      "lengthHint": "예상 길이 (예: 20-25초)",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    },
    {
      "stage": "development", 
      "title": "[승] 제목",
      "summary": "한 줄 요약",
      "content": "상세 내용", 
      "objective": "이 단계의 목표",
      "lengthHint": "예상 길이",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    },
    {
      "stage": "climax",
      "title": "[전] 제목", 
      "summary": "한 줄 요약",
      "content": "상세 내용",
      "objective": "이 단계의 목표", 
      "lengthHint": "예상 길이",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    },
    {
      "stage": "resolution",
      "title": "[결] 제목",
      "summary": "한 줄 요약", 
      "content": "상세 내용",
      "objective": "이 단계의 목표",
      "lengthHint": "예상 길이", 
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    }
  ]
}

반드시 유효한 JSON 형식으로만 응답하고, 추가 설명은 하지 마세요.
`.trim()
}

// ============================
// 3. OpenAI API 호출 함수
// ============================

async function callOpenAI(prompt: string): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 전문 영상 기획자입니다. 사용자의 요구사항에 따라 창의적이고 구체적인 4단계 스토리를 생성해주세요.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

// ============================
// 4. 응답 파싱 및 검증 함수
// ============================

function parseAndValidateResponse(content: string, requestId: string): StorySection[] {
  try {
    const parsed = JSON.parse(content)
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response format: missing sections array')
    }

    if (parsed.sections.length !== 4) {
      throw new Error(`Invalid response format: expected 4 sections, got ${parsed.sections.length}`)
    }

    const requiredStages = ['opening', 'development', 'climax', 'resolution']
    const storySections: StorySection[] = parsed.sections.map((section: any, index: number) => {
      const expectedStage = requiredStages[index]
      
      // 필수 필드 검증
      const requiredFields = ['title', 'summary', 'content', 'objective', 'lengthHint', 'keyPoints']
      for (const field of requiredFields) {
        if (!section[field]) {
          throw new Error(`Missing required field: ${field} in section ${index + 1}`)
        }
      }

      return {
        id: `${requestId}_${expectedStage}`,
        stage: expectedStage as any,
        title: section.title,
        summary: section.summary,
        content: section.content,
        objective: section.objective,
        lengthHint: section.lengthHint,
        keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
        isEdited: false,
        editedAt: undefined
      }
    })

    return storySections
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error)
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`)
  }
}

// ============================
// 5. 캐시 관련 함수들
// ============================

function generateCacheKey(request: LLMGenerationRequest): string {
  const cacheData = {
    storyline: request.storyline,
    tones: request.tones.sort(),
    genres: request.genres.sort(), 
    target: request.target,
    duration: request.duration,
    format: request.format,
    tempo: request.tempo,
    narrativeStyle: request.narrativeStyle,
    developmentIntensity: request.developmentIntensity
  }
  
  const hashInput = JSON.stringify(cacheData)
  
  // 간단한 해시 생성 (실제 환경에서는 crypto 모듈 사용 권장)
  let hash = 0
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit integer로 변환
  }
  
  return `story_${Math.abs(hash)}`
}

// 메모리 캐시 (실제 환경에서는 Redis 등 외부 캐시 사용 권장)
const cache = new Map<string, { data: StorySection[], timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1시간

function getCachedResult(key: string): StorySection[] | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  if (cached) {
    cache.delete(key) // 만료된 캐시 삭제
  }
  
  return null
}

function setCachedResult(key: string, data: StorySection[]): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// ============================
// 6. 메인 API 핸들러
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // 요청 본문 파싱
    const body: LLMGenerationRequest = await request.json()
    
    // 필수 필드 검증
    const requiredFields: (keyof LLMGenerationRequest)[] = [
      'title', 'storyline', 'tones', 'genres', 'target', 
      'duration', 'format', 'tempo', 'narrativeStyle', 'developmentIntensity'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        } as APIResponse<never>, { status: 400 })
      }
    }

    // 타입 검증
    if (body.type !== '4-stage') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request type. Expected "4-stage"'
      } as APIResponse<never>, { status: 400 })
    }

    // 캐시 확인
    const cacheKey = generateCacheKey(body)
    const cachedResult = getCachedResult(cacheKey)
    
    if (cachedResult) {
      console.log(`Cache hit for key: ${cacheKey}`)
      
      const response: LLMGenerationResponse = {
        generatedContent: cachedResult,
        prompt: generateStoryPrompt(body),
        tokensUsed: 0, // 캐시된 결과이므로 토큰 사용 없음
        generationTime: Date.now() - startTime
      }

      return NextResponse.json({
        success: true,
        data: response
      } as APIResponse<LLMGenerationResponse>)
    }

    // LLM 프롬프트 생성
    const prompt = generateStoryPrompt(body)
    console.log('Generated prompt length:', prompt.length)

    // OpenAI API 호출
    const openaiResponse = await callOpenAI(prompt)
    const generatedContent = openaiResponse.choices[0]?.message?.content

    if (!generatedContent) {
      throw new Error('Empty response from OpenAI')
    }

    // 응답 파싱 및 검증
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storySections = parseAndValidateResponse(generatedContent, requestId)

    // 캐시에 저장
    setCachedResult(cacheKey, storySections)

    const response: LLMGenerationResponse = {
      generatedContent: storySections,
      prompt,
      tokensUsed: openaiResponse.usage?.total_tokens || 0,
      generationTime: Date.now() - startTime
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: `Successfully generated 4-stage story in ${response.generationTime}ms`
    } as APIResponse<LLMGenerationResponse>)

  } catch (error) {
    console.error('Story generation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('API key') ? 500 : 
                      errorMessage.includes('Invalid') ? 400 : 500

    return NextResponse.json({
      success: false,
      error: errorMessage
    } as APIResponse<never>, { status: statusCode })
  }
}

// ============================
// 7. GET 메서드 (상태 확인용)
// ============================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'Story generation API is operational',
    data: {
      endpoint: '/api/ai/generate-story',
      method: 'POST',
      cacheSize: cache.size,
      supportedTypes: ['4-stage']
    }
  })
}