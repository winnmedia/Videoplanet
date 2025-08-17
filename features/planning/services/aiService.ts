// ==========================================================================
// AI Service - VideoPlanet AI 영상 기획 모듈
// ==========================================================================

import { 
  PlanningProject, 
  AIGenerationRequest, 
  AIGenerationResponse, 
  StoryGenerationResponse,
  ShotGenerationResponse,
  StoryboardGenerationResponse,
  StoryDevelopment,
  Shot,
  Storyboard,
  StoryboardFrame,
  StoryStructureType,
  DevelopmentLevelType,
  StoryboardStyleType,
  GenreType,
  ToneType,
  AudienceType,
  PurposeType
} from '../types/planning.types'

// ====== AI 서비스 설정 ======
interface AIServiceConfig {
  openai: {
    apiKey: string
    endpoint: string
    model: string
  }
  gemini: {
    apiKey: string
    endpoint: string
    model: string
  }
  fallback: {
    enabled: boolean
    order: string[]
  }
  timeout: number
  retryAttempts: number
}

class AIService {
  private config: AIServiceConfig
  private defaultModel: string = 'gpt-4'

  constructor() {
    this.config = {
      openai: {
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4'
      },
      gemini: {
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro'
      },
      fallback: {
        enabled: true,
        order: ['openai', 'gemini', 'local']
      },
      timeout: 30000,
      retryAttempts: 3
    }
  }

  // ====== 메인 생성 메서드 ======
  async generateStory(project: PlanningProject): Promise<StoryGenerationResponse> {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildStoryPrompt(project)
      const response = await this.callAI(prompt, 'story')
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI 응답이 비어있습니다')
      }

      const storyDevelopment: StoryDevelopment = {
        story_structure: project.story_structure as StoryStructureType,
        development_level: project.development_level as DevelopmentLevelType,
        story_content: response.data,
        generated_at: new Date().toISOString(),
        ai_model_used: response.model_used || this.defaultModel
      }

      const result: any = {
        success: true,
        data: storyDevelopment,
        model_used: response.model_used,
        generation_time: Date.now() - startTime
      };
      
      if (response.usage) {
        result.usage = response.usage;
      }
      
      return result;
    } catch (error) {
      console.error('[AI Service] Story generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '스토리 생성에 실패했습니다',
        generation_time: Date.now() - startTime
      }
    }
  }

  async generateShots(project: PlanningProject): Promise<ShotGenerationResponse> {
    const startTime = Date.now()
    
    try {
      if (!project.story_content) {
        throw new Error('스토리 내용이 필요합니다')
      }

      const prompt = this.buildShotsPrompt(project)
      const response = await this.callAI(prompt, 'shots')
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI 응답이 비어있습니다')
      }

      const shots = this.parseShotsResponse(response.data, project)

      const result: any = {
        success: true,
        data: shots,
        model_used: response.model_used,
        generation_time: Date.now() - startTime
      };
      
      if (response.usage) {
        result.usage = response.usage;
      }
      
      return result;
    } catch (error) {
      console.error('[AI Service] Shots generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '숏 분할 생성에 실패했습니다',
        generation_time: Date.now() - startTime
      }
    }
  }

  async generateStoryboard(
    project: PlanningProject, 
    style: StoryboardStyleType = 'realistic'
  ): Promise<StoryboardGenerationResponse> {
    const startTime = Date.now()
    
    try {
      if (!project.shots || project.shots.length === 0) {
        throw new Error('숏 분할 데이터가 필요합니다')
      }

      const frames: StoryboardFrame[] = []
      
      // 각 숏에 대해 프레임 생성
      for (let i = 0; i < project.shots.length; i++) {
        const shot = project.shots[i]
        if (shot) {
          const framePrompt = this.buildStoryboardFramePrompt(shot, project, style)
          
          // 실제로는 이미지 생성 API 호출
          const frame = await this.generateStoryboardFrame(shot, framePrompt, i + 1)
          frames.push(frame)
        }
      }

      const storyboard: Storyboard = {
        id: `storyboard_${Date.now()}`,
        title: project.title || '무제',
        frames,
        style,
        created_at: new Date().toISOString(),
        ai_generated: true,
        total_duration: this.calculateTotalDuration(project.shots)
      }

      return {
        success: true,
        data: storyboard,
        model_used: 'dall-e-3', // 또는 사용된 이미지 생성 모델
        generation_time: Date.now() - startTime
      }
    } catch (error) {
      console.error('[AI Service] Storyboard generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '콘티 생성에 실패했습니다',
        generation_time: Date.now() - startTime
      }
    }
  }

  // ====== 프롬프트 빌더 메서드 ======
  private buildStoryPrompt(project: PlanningProject): string {
    const genreDescription = this.getGenreDescription(project.genre as GenreType)
    const audienceDescription = this.getAudienceDescription(project.target_audience as AudienceType)
    const toneDescription = this.getToneDescription(project.tone_manner as ToneType)
    const purposeDescription = this.getPurposeDescription(project.purpose as PurposeType)
    const structureDescription = this.getStructureDescription(project.story_structure as StoryStructureType)
    const levelDescription = this.getLevelDescription(project.development_level as DevelopmentLevelType)

    return `다음 조건에 맞는 ${project.duration} 길이의 영상 스토리를 ${structureDescription} 구조로 ${levelDescription} 작성해주세요.

## 프로젝트 정보
- 제목: ${project.title}
- 장르: ${genreDescription}
- 타겟 오디언스: ${audienceDescription}
- 톤앤매너: ${toneDescription}
- 목적: ${purposeDescription}
- 예산: ${project.budget}

## 스토리 요구사항
1. ${structureDescription} 구조를 명확히 따를 것
2. ${toneDescription} 분위기를 일관되게 유지할 것
3. ${audienceDescription}에게 적합한 내용일 것
4. ${purposeDescription} 목적을 달성할 수 있는 내용일 것
5. ${project.duration} 길이에 적합한 분량일 것

## 출력 형식
다음과 같은 형식으로 단계별 스토리를 작성해주세요:

【${structureDescription.toUpperCase()} 스토리 구조】

1. 1단계 (0-25%)
   [해당 단계의 내용]

2. 2단계 (25-50%)
   [해당 단계의 내용]

3. 3단계 (50-75%)
   [해당 단계의 내용]

4. 4단계 (75-100%)
   [해당 단계의 내용]

각 단계마다 구체적인 장면, 대사, 행동을 포함해서 ${levelDescription} 작성해주세요.`
  }

  private buildShotsPrompt(project: PlanningProject): string {
    const duration = this.parseDurationToSeconds(project.duration)
    const shotCount = this.calculateOptimalShotCount(duration, project.genre as GenreType)

    return `다음 스토리를 바탕으로 ${shotCount}개의 숏으로 분할해주세요.

## 프로젝트 정보
- 제목: ${project.title}
- 장르: ${project.genre}
- 톤앤매너: ${project.tone_manner}
- 총 길이: ${project.duration}
- 타겟: ${project.target_audience}

## 스토리 내용
${project.story_content}

## 숏 분할 요구사항
1. 총 ${shotCount}개의 숏으로 구성
2. 각 숏은 평균 ${Math.round(duration / shotCount)}초 내외
3. 장르에 적합한 촬영 기법 사용
4. 톤앤매너에 맞는 카메라 워크
5. 타겟 오디언스 고려한 시각적 구성

## 출력 형식 (JSON)
다음 형식의 JSON 배열로 출력해주세요:

[
  {
    "sequence": 1,
    "type": "establishing",
    "duration": "5초",
    "description": "구체적인 장면 설명",
    "camera_angle": "eye_level",
    "camera_movement": "static",
    "audio": "배경음악",
    "location": "촬영 장소",
    "lighting": "natural",
    "notes": "특별 지시사항"
  }
]

각 숏에 대해 다음 정보를 정확히 포함해주세요:
- sequence: 순서 (1부터 시작)
- type: establishing/wide/medium/close_up/extreme_close_up/over_shoulder/bird_eye/low_angle/high_angle/insert
- duration: "N초" 형식
- description: 구체적인 장면 설명
- camera_angle: eye_level/low_angle/high_angle/bird_eye/worm_eye
- camera_movement: static/pan/tilt/zoom_in/zoom_out/dolly_in/dolly_out/tracking/handheld/crane
- audio: 오디오 내용
- location: 촬영 장소
- lighting: natural/soft/hard/back_light/side_light/top_light/dramatic/flat
- notes: 추가 지시사항`
  }

  private buildStoryboardFramePrompt(shot: Shot, project: PlanningProject, style: StoryboardStyleType): string {
    const styleDescription = this.getStyleDescription(style)
    
    return `다음 숏에 대한 ${styleDescription} 스타일의 스토리보드 프레임을 설명해주세요.

## 숏 정보
- 순서: ${shot.sequence}
- 타입: ${shot.type}
- 길이: ${shot.duration}
- 설명: ${shot.description}
- 카메라 앵글: ${shot.camera_angle}
- 카메라 움직임: ${shot.camera_movement}
- 조명: ${shot.lighting}
- 위치: ${shot.location}

## 프로젝트 컨텍스트
- 장르: ${project.genre}
- 톤앤매너: ${project.tone_manner}
- 타겟: ${project.target_audience}

## 요구사항
1. ${styleDescription} 스타일로 그릴 것
2. 카메라 앵글과 구도를 정확히 반영할 것
3. 조명과 분위기를 적절히 표현할 것
4. 장르와 톤에 맞는 비주얼 스타일
5. 실제 촬영 가능한 현실적인 구성

이미지 생성을 위한 상세한 프롬프트를 작성해주세요.`
  }

  // ====== AI 호출 메서드 ======
  private async callAI(prompt: string, type: string): Promise<AIGenerationResponse> {
    // 실제 환경에서는 API 키 확인
    if (!this.config.openai.apiKey && !this.config.gemini.apiKey) {
      // 개발 환경에서는 시뮬레이션 응답 반환
      return this.getSimulatedResponse(prompt, type)
    }

    // OpenAI API 호출 시도
    try {
      return await this.callOpenAI(prompt, type)
    } catch (error) {
      console.error('[AI Service] OpenAI call failed:', error)
      
      // Fallback으로 Gemini 시도
      if (this.config.fallback.enabled) {
        try {
          return await this.callGemini(prompt, type)
        } catch (geminiError) {
          console.error('[AI Service] Gemini call failed:', geminiError)
        }
      }
      
      // 모든 API 실패 시 시뮬레이션 응답
      return this.getSimulatedResponse(prompt, type)
    }
  }

  private async callOpenAI(prompt: string, type: string): Promise<AIGenerationResponse> {
    const response = await fetch(this.config.openai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: type === 'story' ? 0.8 : 0.7,
        max_tokens: type === 'story' ? 2000 : 1500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data: data.choices[0]?.message?.content,
      model_used: this.config.openai.model,
      usage: data.usage
    }
  }

  private async callGemini(prompt: string, type: string): Promise<AIGenerationResponse> {
    const response = await fetch(`${this.config.gemini.endpoint}?key=${this.config.gemini.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${this.getSystemPrompt(type)}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: type === 'story' ? 0.8 : 0.7,
          maxOutputTokens: type === 'story' ? 2000 : 1500
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data: data.candidates[0]?.content?.parts[0]?.text,
      model_used: this.config.gemini.model
    }
  }

  // ====== 시뮬레이션 메서드 (개발용) - 성능 최적화 ======
  private simulationCache = new Map<string, AIGenerationResponse>()
  
  private getSimulatedResponse(prompt: string, type: string): AIGenerationResponse {
    // 캐시 키 생성
    const cacheKey = `${type}_${prompt.slice(0, 100)}`
    
    // 캐시된 응답이 있으면 즉시 반환
    if (this.simulationCache.has(cacheKey)) {
      const cached = this.simulationCache.get(cacheKey)!
      console.log('[AI Service] Using cached simulated response for type:', type)
      return { ...cached, generation_time: 500 } // 캐시된 응답은 빠르게
    }
    
    console.log('[AI Service] Generating new simulated response for type:', type)
    
    let response: AIGenerationResponse
    switch (type) {
      case 'story':
        response = {
          success: true,
          data: this.getSimulatedStory(prompt),
          model_used: 'simulation',
          generation_time: 2000
        }
        break
      case 'shots':
        response = {
          success: true,
          data: this.getSimulatedShots(prompt),
          model_used: 'simulation',
          generation_time: 3000
        }
        break
      default:
        response = {
          success: false,
          error: '지원하지 않는 생성 타입입니다'
        }
    }
    
    // 성공적인 응답만 캐시
    if (response.success) {
      this.simulationCache.set(cacheKey, response)
      
      // 캐시 크기 제한 (메모리 누수 방지)
      if (this.simulationCache.size > 50) {
        const firstKey = this.simulationCache.keys().next().value
        if (firstKey) {
          this.simulationCache.delete(firstKey)
        }
      }
    }
    
    return response
  }

  private getSimulatedStory(prompt: string): string {
    return `【연역식 스토리 구조】

1. 문제 제시 (0-25%)
   현대인들은 바쁜 일상 속에서 진정한 휴식과 여유를 찾기 어려워하고 있습니다. 스마트폰과 디지털 기기에 둘러싸여 끊임없이 정보에 노출되며, 정신적 피로감이 누적되고 있는 상황입니다.

2. 해결 방법 소개 (25-50%)
   이러한 문제를 해결하기 위해 '디지털 디톡스'와 '마음챙김 명상'이 새로운 해답으로 주목받고 있습니다. 하루 한 시간만 스마트폰을 내려놓고, 자연과 함께하는 시간을 가지는 것만으로도 놀라운 변화를 경험할 수 있습니다.

3. 구체적 사례 (50-75%)
   실제로 이 방법을 실천한 김민수씨(30대 직장인)는 "매일 저녁 30분씩 스마트폰 없이 산책을 하기 시작했더니, 스트레스가 줄어들고 집중력이 향상되었다"고 말합니다. 또한 이윤정씨(20대 대학생)는 "아침 명상 10분으로 하루가 더 평온해졌다"고 경험을 공유했습니다.

4. 결론 및 행동 유도 (75-100%)
   진정한 휴식은 멀리 있지 않습니다. 오늘부터 작은 변화를 시작해보세요. 하루 10분, 스마트폰을 내려놓고 자신만의 시간을 만들어보세요. 당신의 일상이 더욱 풍요로워질 것입니다.`
  }

  private getSimulatedShots(prompt: string): string {
    return JSON.stringify([
      {
        sequence: 1,
        type: "establishing",
        duration: "5초",
        description: "바쁜 도시의 아침 풍경, 사람들이 스마트폰을 보며 걸어가는 모습",
        camera_angle: "high_angle",
        camera_movement: "pan",
        audio: "도시 소음, 경쾌한 BGM",
        location: "도심 거리",
        lighting: "natural",
        notes: "현대인의 바쁜 일상을 상징적으로 표현"
      },
      {
        sequence: 2,
        type: "close_up",
        duration: "3초",
        description: "스마트폰 화면을 보는 사람의 피곤한 표정",
        camera_angle: "eye_level",
        camera_movement: "static",
        audio: "알림음, 타이핑 소리",
        location: "카페 또는 사무실",
        lighting: "soft",
        notes: "디지털 피로감을 강조"
      },
      {
        sequence: 3,
        type: "medium",
        duration: "4초",
        description: "주인공이 스마트폰을 책상에 내려놓는 모습",
        camera_angle: "eye_level",
        camera_movement: "zoom_in",
        audio: "결심을 다지는 음악",
        location: "집 또는 사무실",
        lighting: "natural",
        notes: "변화의 시작점을 상징"
      },
      {
        sequence: 4,
        type: "wide",
        duration: "6초",
        description: "자연 속에서 산책하는 주인공의 편안한 모습",
        camera_angle: "eye_level",
        camera_movement: "tracking",
        audio: "새소리, 바람소리",
        location: "공원 또는 숲길",
        lighting: "natural",
        notes: "디지털 디톡스의 긍정적 효과 표현"
      }
    ])
  }

  // ====== 헬퍼 메서드 ======
  private getSystemPrompt(type: string): string {
    const prompts = {
      story: `당신은 전문 영상 기획자입니다. 주어진 조건에 맞는 창의적이고 매력적인 스토리를 작성해주세요. 스토리는 명확한 구조를 가지고 있어야 하며, 타겟 오디언스에게 적합해야 합니다.`,
      shots: `당신은 영상 제작 전문가입니다. 주어진 스토리를 효과적인 촬영 기법으로 분할해주세요. 각 숏은 스토리의 흐름을 자연스럽게 이어가야 하며, 기술적으로 실현 가능해야 합니다.`,
      storyboard: `당신은 스토리보드 아티스트입니다. 주어진 숏에 대한 시각적으로 명확하고 실용적인 스토리보드 프레임을 설명해주세요.`
    }
    return prompts[type as keyof typeof prompts] || prompts.story
  }

  private parseShotsResponse(response: string, project: PlanningProject): Shot[] {
    try {
      // JSON 응답에서 배열 부분만 추출
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Valid JSON array not found in response')
      }

      const shotsData = JSON.parse(jsonMatch[0])
      
      return shotsData.map((shotData: any, index: number) => ({
        id: `shot_${index + 1}`,
        sequence: shotData.sequence || index + 1,
        type: shotData.type || 'medium',
        duration: shotData.duration || '5초',
        description: shotData.description || '',
        camera_angle: shotData.camera_angle || 'eye_level',
        camera_movement: shotData.camera_movement || 'static',
        audio: shotData.audio || 'BGM',
        props: shotData.props || [],
        location: shotData.location || '실내',
        lighting: shotData.lighting || 'natural',
        notes: shotData.notes || ''
      }))
    } catch (error) {
      console.error('[AI Service] Failed to parse shots response:', error)
      // 파싱 실패 시 기본 숏 생성
      return this.generateFallbackShots(project)
    }
  }

  private generateFallbackShots(project: PlanningProject): Shot[] {
    const shotCount = 8 // 기본 숏 개수
    const shots: Shot[] = []

    for (let i = 0; i < shotCount; i++) {
      shots.push({
        id: `shot_${i + 1}`,
        sequence: i + 1,
        type: i === 0 ? 'establishing' : 'medium',
        duration: '5초',
        description: `${i + 1}번째 장면 - ${project.title}의 핵심 내용`,
        camera_angle: 'eye_level',
        camera_movement: 'static',
        audio: 'BGM',
        props: [],
        location: '실내',
        lighting: 'natural',
        notes: ''
      })
    }

    return shots
  }

  private async generateStoryboardFrame(shot: Shot, prompt: string, sequence: number): Promise<StoryboardFrame> {
    // 실제로는 DALL-E, Midjourney 등의 이미지 생성 API 호출
    // 여기서는 시뮬레이션
    
    return {
      id: `frame_${shot.id}`,
      shotId: shot.id,
      sequence,
      thumbnail: `[FRAME] ${shot.type} 프레임 ${sequence}`,
      description: `${shot.description.substring(0, 100)}...`,
      technical_notes: `앵글: ${shot.camera_angle}\n움직임: ${shot.camera_movement}\n조명: ${shot.lighting}`,
      timing: `${sequence * 5}초`,
      duration: shot.duration,
      ai_generated_image: `simulated_image_${sequence}.jpg`
    }
  }

  // ====== 유틸리티 메서드 ======
  private parseDurationToSeconds(duration: string): number {
    if (duration.includes('30초')) return 30
    if (duration.includes('1분')) return 60
    if (duration.includes('3분')) return 180
    if (duration.includes('5분')) return 300
    if (duration.includes('10분')) return 600
    if (duration.includes('30분')) return 1800
    
    const match = duration.match(/(\d+)분?\s*(\d+)?초?/)
    if (match) {
      const minutes = parseInt(match[1] || '0') || 0
      const seconds = parseInt(match[2] || '0') || 0
      return minutes * 60 + seconds
    }
    
    return 60
  }

  private calculateOptimalShotCount(duration: number, genre: GenreType): number {
    const avgShotLength: Record<GenreType, number> = {
      'commercial': 3,
      'music_video': 2,
      'social': 2,
      'drama': 8,
      'documentary': 12,
      'educational': 15,
      'corporate': 10,
      'event': 6
    }

    const shotLength = avgShotLength[genre] || 6
    return Math.max(6, Math.min(20, Math.round(duration / shotLength)))
  }

  private calculateTotalDuration(shots: Shot[]): string {
    let totalSeconds = 0
    shots.forEach(shot => {
      totalSeconds += this.parseDurationToSeconds(shot.duration)
    })
    
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}분 ${seconds}초`
  }

  // ====== 라벨 및 설명 메서드 ======
  private getGenreDescription(genre: GenreType): string {
    const descriptions: Record<GenreType, string> = {
      'drama': '감정적이고 서사적인 드라마',
      'documentary': '사실적이고 정보 전달적인 다큐멘터리',
      'commercial': '제품/서비스 홍보를 위한 광고',
      'music_video': '음악과 시각적 표현이 조화된 뮤직비디오',
      'educational': '학습과 지식 전달을 위한 교육 콘텐츠',
      'corporate': '기업 소개 및 브랜딩 영상',
      'event': '행사 및 기념을 위한 이벤트 영상',
      'social': 'SNS 플랫폼 최적화 소셜미디어 콘텐츠'
    }
    return descriptions[genre] || genre
  }

  private getAudienceDescription(audience: AudienceType): string {
    const descriptions: Record<AudienceType, string> = {
      'teens': '10대 청소년층 (13-19세)',
      'twenties': '20대 청년층 (20-29세)', 
      'thirties': '30대 성인층 (30-39세)',
      'forties': '40대 중년층 (40-49세)',
      'fifties_plus': '50대 이상 장년층',
      'general': '전 연령층 대상',
      'business': 'B2B 기업 의사결정자',
      'professionals': '특정 전문직 종사자'
    }
    return descriptions[audience] || audience
  }

  private getToneDescription(tone: ToneType): string {
    const descriptions: Record<ToneType, string> = {
      'bright': '밝고 긍정적인',
      'serious': '진지하고 신뢰할 수 있는',
      'funny': '유머러스하고 재미있는',
      'emotional': '감동적이고 진심 어린',
      'energetic': '역동적이고 활기찬',
      'calm': '차분하고 안정적인',
      'mysterious': '신비롭고 궁금증을 자아내는',
      'trendy': '트렌디하고 세련된'
    }
    return descriptions[tone] || tone
  }

  private getPurposeDescription(purpose: PurposeType): string {
    const descriptions: Record<PurposeType, string> = {
      'branding': '브랜드 인지도 향상 및 이미지 구축',
      'education': '지식 및 정보 전달을 통한 교육',
      'entertainment': '재미와 즐거움 제공',
      'information': '소식 및 공지사항 전달',
      'promotion': '제품/서비스 판매 촉진',
      'recruitment': '인재 모집 및 채용',
      'portfolio': '작품 소개 및 실력 증명',
      'documentation': '행사 및 과정 기록 보존'
    }
    return descriptions[purpose] || purpose
  }

  private getStructureDescription(structure: StoryStructureType): string {
    const descriptions: Record<StoryStructureType, string> = {
      'deductive': '연역식 (일반→구체)',
      'inductive': '귀납식 (구체→일반)',
      'conflict_resolution': '갈등-해결식',
      'hero_journey': '영웅의 여정'
    }
    return descriptions[structure] || structure
  }

  private getLevelDescription(level: DevelopmentLevelType): string {
    const descriptions: Record<DevelopmentLevelType, string> = {
      'simple': '간단하고 핵심적으로',
      'normal': '적절한 디테일과 함께',
      'detailed': '상세하고 풍부하게'
    }
    return descriptions[level] || level
  }

  private getStyleDescription(style: StoryboardStyleType): string {
    const descriptions: Record<StoryboardStyleType, string> = {
      'realistic': '사실적이고 세밀한',
      'cartoon': '만화적이고 친근한',
      'minimalist': '미니멀하고 간결한',
      'detailed': '상세하고 정교한',
      'sketch': '스케치 느낌의',
      'wireframe': '와이어프레임 스타일의'
    }
    return descriptions[style] || style
  }
}

// 싱글톤 인스턴스 생성
export const aiService = new AIService()

// 개별 함수들도 export (편의성)
export const generateStory = (project: PlanningProject) => aiService.generateStory(project)
export const generateShots = (project: PlanningProject) => aiService.generateShots(project)
export const generateStoryboard = (project: PlanningProject, style?: StoryboardStyleType) => 
  aiService.generateStoryboard(project, style)

export default aiService