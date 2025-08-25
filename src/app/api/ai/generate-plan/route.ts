import { NextRequest, NextResponse } from 'next/server'

// AI 기획서 생성 요청 타입
interface AIGeneratePlanRequest {
  title: string
  genre: string
  duration: number
  budget: string
  targetAudience: string
  concept: string
  purpose: string
  tone: string
}

// AI 기획서 응답 타입
interface AIGeneratePlanResponse {
  id: string
  title: string
  genre: string
  duration: number
  budget: string
  targetAudience: string
  concept: string
  purpose: string
  tone: string
  
  // AI 생성된 4단계 스토리
  storyStages: {
    introduction: {
      title: string
      description: string
      duration: number
      keyPoints: string[]
    }
    rising: {
      title: string
      description: string
      duration: number
      keyPoints: string[]
    }
    climax: {
      title: string
      description: string
      duration: number
      keyPoints: string[]
    }
    conclusion: {
      title: string
      description: string
      duration: number
      keyPoints: string[]
    }
  }
  
  // AI 생성된 12개 숏트 분해
  shotBreakdown: Array<{
    shotNumber: number
    storyStage: 'introduction' | 'rising' | 'climax' | 'conclusion'
    shotType: string
    cameraMovement: string
    composition: string
    duration: number
    description: string
    dialogue: string
    storyboardImage?: string
  }>
  
  generatedAt: string
  status: 'generating' | 'completed' | 'error'
}

// AI 기획서 생성 함수
async function generateAIPlan(request: AIGeneratePlanRequest): Promise<AIGeneratePlanResponse> {
  // 1. 환경변수 체크
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (openaiApiKey && openaiApiKey !== 'sk-test-dummy-key-for-development') {
    // TODO(human): 실제 OpenAI API 연동 코드 구현
    // 실제 API 키가 있을 때 LLM API 호출
    console.log('🤖 실제 OpenAI API 호출 준비 중...')
    
    try {
      // 프롬프트 생성
      const prompt = `
영상 기획서를 JSON 형태로 생성해주세요.

입력 정보:
- 제목: ${request.title}
- 장르: ${request.genre}  
- 길이: ${request.duration}초
- 예산: ${request.budget}
- 타겟: ${request.targetAudience}
- 컨셉: ${request.concept}
- 목적: ${request.purpose}
- 톤앤매너: ${request.tone}

4단계 스토리(도입부 20%, 전개부 40%, 절정부 30%, 마무리부 10%)와 12개 숏트로 분해하여 JSON으로 응답해주세요.
`

      // OpenAI API 호출 (실제로는 여기서 fetch 호출)
      // const response = await fetch('https://api.openai.com/v1/chat/completions', {...})
      
      console.log('🎯 실제 LLM API 호출이 필요합니다. 현재는 고급 시뮬레이션으로 대체합니다.')
      
      // 고급 시뮬레이션으로 fallback
      return generateAdvancedSimulation(request)
      
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error)
      // 에러 시 시뮬레이션으로 fallback
      return generateAdvancedSimulation(request)
    }
  }
  
  // API 키가 없거나 더미 키일 때 시뮬레이션 사용
  console.log('💡 시뮬레이션 모드로 AI 기획서 생성 중...')
  return generateAdvancedSimulation(request)
}

// 고급 시뮬레이션 함수
function generateAdvancedSimulation(request: AIGeneratePlanRequest): AIGeneratePlanResponse {
  
  const storyStages = {
    introduction: {
      title: "도입부",
      description: `${request.concept}을 바탕으로 ${request.targetAudience}의 관심을 끌어내는 오프닝 시퀀스. ${request.tone} 톤으로 주제를 자연스럽게 소개합니다.`,
      duration: Math.ceil(request.duration * 0.2),
      keyPoints: [
        `${request.targetAudience}에게 어필하는 강력한 첫인상`,
        `${request.concept}의 핵심 메시지 암시`,
        `${request.tone} 톤앤매너 설정`
      ]
    },
    rising: {
      title: "전개부", 
      description: `${request.purpose}를 달성하기 위한 핵심 내용 전개. 단계적으로 정보를 제공하며 시청자의 몰입도를 높입니다.`,
      duration: Math.ceil(request.duration * 0.4),
      keyPoints: [
        "핵심 정보의 체계적 전달",
        "시청자 참여 유도 요소",
        "감정적 연결고리 구축"
      ]
    },
    climax: {
      title: "절정부",
      description: `영상의 핵심 메시지가 가장 강력하게 드러나는 구간. ${request.concept}의 결정적 순간을 시각적으로 임팩트 있게 표현합니다.`,
      duration: Math.ceil(request.duration * 0.3),
      keyPoints: [
        "최고 임팩트 모멘트",
        "핵심 메시지의 명확한 전달",
        "시각적/청각적 클라이맥스"
      ]
    },
    conclusion: {
      title: "마무리부",
      description: `${request.purpose}에 맞는 강력한 마무리와 Call-to-Action. 시청자에게 명확한 행동 지침을 제시합니다.`,
      duration: Math.ceil(request.duration * 0.1),
      keyPoints: [
        "핵심 메시지 요약",
        "구체적 행동 유도",
        "브랜드 임프레션 강화"
      ]
    }
  }

  // 12개 숏트 자동 생성
  const shotBreakdown = generateShotBreakdown(request, storyStages)

  return {
    id: `ai_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: request.title,
    genre: request.genre,
    duration: request.duration,
    budget: request.budget,
    targetAudience: request.targetAudience,
    concept: request.concept,
    purpose: request.purpose,
    tone: request.tone,
    storyStages,
    shotBreakdown,
    generatedAt: new Date().toISOString(),
    status: 'completed'
  }
}

// 숏트 분해 자동 생성 함수
function generateShotBreakdown(request: AIGeneratePlanRequest, storyStages: any) {
  const shotTypes = ['클로즈업', '미디엄샷', '와이드샷', '오버더숄더', '버드뷰', '로우앵글']
  const cameraMovements = ['고정', '팬', '틸트', '줌인', '줌아웃', '트래킹', '스테디캠']
  const compositions = ['중앙구도', '삼등분구도', '대각선구도', '대칭구도', '프레임인프레임']
  
  const stages = ['introduction', 'rising', 'climax', 'conclusion'] as const
  const stageShotCounts = [2, 5, 3, 2] // 각 단계별 샷 개수

  const shots = []
  let shotNumber = 1

  stages.forEach((stage, stageIndex) => {
    const shotCount = stageShotCounts[stageIndex]
    const stageDuration = storyStages[stage].duration
    const avgShotDuration = Math.ceil(stageDuration / shotCount)
    
    for (let i = 0; i < shotCount; i++) {
      shots.push({
        shotNumber: shotNumber++,
        storyStage: stage,
        shotType: shotTypes[Math.floor(Math.random() * shotTypes.length)],
        cameraMovement: cameraMovements[Math.floor(Math.random() * cameraMovements.length)],
        composition: compositions[Math.floor(Math.random() * compositions.length)],
        duration: avgShotDuration + Math.floor(Math.random() * 5) - 2, // ±2초 변동
        description: generateShotDescription(request, stage, i + 1),
        dialogue: generateDialogue(request, stage, i + 1),
        storyboardImage: null // 실제로는 AI 이미지 생성 API 연동
      })
    }
  })

  return shots
}

// 숏트 설명 자동 생성
function generateShotDescription(request: AIGeneratePlanRequest, stage: string, shotIndex: number): string {
  const descriptions = {
    introduction: [
      `${request.concept}를 상징하는 강력한 오프닝 이미지`,
      `${request.targetAudience}의 관심을 끄는 도입 장면`
    ],
    rising: [
      `핵심 메시지를 전달하는 설명 장면`,
      `시청자 몰입도를 높이는 전개 장면`,
      `정보 제공과 감정 유발을 동시에 하는 장면`,
      `${request.tone} 톤을 강화하는 분위기 장면`,
      `${request.purpose} 달성을 위한 핵심 장면`
    ],
    climax: [
      `영상의 하이라이트가 되는 결정적 장면`,
      `최대 임팩트를 주는 클라이맥스 장면`,
      `핵심 메시지가 폭발하는 순간`
    ],
    conclusion: [
      `강력한 마무리 메시지 전달 장면`,
      `Call-to-Action을 유도하는 마무리 장면`
    ]
  }

  const stageDescriptions = descriptions[stage as keyof typeof descriptions]
  return stageDescriptions[shotIndex - 1] || stageDescriptions[0]
}

// 대사/자막 자동 생성
function generateDialogue(request: AIGeneratePlanRequest, stage: string, shotIndex: number): string {
  const dialogues = {
    introduction: [
      `"${request.concept}, 지금 시작합니다."`,
      `"${request.targetAudience}를 위한 특별한 이야기"`
    ],
    rising: [
      `"${request.purpose}를 위한 핵심 포인트"`,
      `"더 깊이 알아보겠습니다"`,
      `"이것이 바로 ${request.concept}의 핵심입니다"`,
      `"${request.tone} 분위기로 전해드리는"`,
      `"놓치면 안 되는 중요한 부분"`
    ],
    climax: [
      `"가장 중요한 순간입니다"`,
      `"바로 이것이 ${request.concept}의 진짜 모습"`,
      `"결정적인 순간을 놓치지 마세요"`
    ],
    conclusion: [
      `"${request.purpose}, 지금 바로 시작하세요"`,
      `"함께 만들어가는 ${request.concept}"`
    ]
  }

  const stageDialogues = dialogues[stage as keyof typeof dialogues]
  return stageDialogues[shotIndex - 1] || stageDialogues[0]
}

export async function POST(request: NextRequest) {
  try {
    const body: AIGeneratePlanRequest = await request.json()
    
    // 입력 유효성 검사
    if (!body.title || !body.concept || !body.purpose) {
      return NextResponse.json(
        { error: '제목, 컨셉, 목적은 필수 입력 항목입니다.' },
        { status: 400 }
      )
    }

    if (body.duration < 10 || body.duration > 600) {
      return NextResponse.json(
        { error: '영상 길이는 10초에서 10분 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // AI 기획서 생성 (시뮬레이션)
    const generatedPlan = await generateAIPlan(body)

    return NextResponse.json({
      success: true,
      data: generatedPlan,
      message: 'AI 영상 기획서가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('AI 기획서 생성 오류:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'AI 기획서 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // AI 기획서 생성 상태 확인 (WebSocket 대안)
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('planId')
  
  if (!planId) {
    return NextResponse.json(
      { error: 'planId가 필요합니다.' },
      { status: 400 }
    )
  }

  // 실제로는 데이터베이스에서 진행 상태 조회
  return NextResponse.json({
    success: true,
    data: {
      planId,
      status: 'completed',
      progress: 100,
      message: 'AI 기획서 생성이 완료되었습니다.'
    }
  })
}