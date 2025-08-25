/**
 * 기획서 내보내기 API 엔드포인트
 * PDF, JSON, HTML 등 다양한 형식으로 기획서 내보내기
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  VideoPlanning,
  APIResponse,
  PlanExportHistory,
  VideoPlanContent,
  ExportFormat
} from '@/entities/video-planning'

// ============================
// 요청/응답 타입 정의
// ============================

interface ExportRequest {
  format: ExportFormat
  options?: ExportOptions
  includeComments?: boolean
  includeHistory?: boolean
  sections?: string[]
}

interface ExportOptions {
  template?: 'standard' | 'minimal' | 'detailed'
  branding?: {
    logoUrl?: string
    companyName?: string
    colors?: {
      primary: string
      secondary: string
    }
  }
  language?: 'ko' | 'en'
  pageSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

interface ExportResponse {
  exportId: string
  fileUrl: string
  fileName: string
  fileSize: number
  format: ExportFormat
  status: 'completed'
  createdAt: string
  expiresAt: string
}

interface ExportProgress {
  exportId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  estimatedTime?: number
  error?: string
}

// ============================
// 메모리 저장소
// ============================

const planStorage = new Map<string, VideoPlanning>()
const exportStorage = new Map<string, ExportProgress>()
const exportFiles = new Map<string, {
  content: string | Buffer
  mimeType: string
  fileName: string
  size: number
}>()

// 샘플 기획서 추가
const samplePlan: VideoPlanning = {
  id: 'plan_sample_001',
  userId: 'user_001',
  title: 'AI 생성 샘플 기획서',
  description: 'AI로 자동 생성된 영상 기획서 샘플',
  planType: 'ai-generated',
  status: 'draft',
  generatedContent: {
    id: 'content_001',
    executiveSummary: {
      title: '혁신적인 브랜드 스토리',
      tagline: '새로운 시대를 여는 브랜드 여정',
      objective: '브랜드 인지도 향상 및 고객 참여 증대',
      targetAudience: '20-40대 디지털 네이티브 소비자',
      keyValue: '혁신성, 신뢰성, 접근성'
    },
    conceptDevelopment: {
      coreMessage: '기술과 인간의 조화로운 만남',
      narrativeApproach: '감정적 스토리텔링',
      emotionalTone: '희망적이고 따뜻함',
      visualStyle: '모던하면서도 친근한 스타일',
      brandAlignment: '브랜드 가치와 완벽히 일치'
    },
    contentStructure: {
      duration: '90초',
      format: '16:9 가로형',
      sections: [
        {
          name: '오프닝',
          duration: '15초',
          purpose: '관심 유도',
          keyContent: '브랜드 소개 및 훅',
          visualElements: ['로고 애니메이션', '메인 비주얼']
        },
        {
          name: '문제 제기',
          duration: '25초',
          purpose: '니즈 확인',
          keyContent: '고객 페인 포인트 제시',
          visualElements: ['실제 사용자 모습', '문제 상황']
        }
      ]
    },
    productionPlan: {
      preProduction: {
        timeline: '2주',
        requirements: ['스크립트 완성', '캐스팅', '로케이션 헌팅'],
        stakeholders: ['기획자', '연출가', '클라이언트']
      },
      production: {
        shootingDays: '3일',
        locations: ['스튜디오', '실제 사용 환경'],
        equipment: ['4K 카메라', '조명 장비', '음향 장비'],
        crew: ['감독', '촬영감독', '조명감독', '음향감독']
      },
      postProduction: {
        editingTime: '1주',
        specialEffects: ['텍스트 애니메이션', '트랜지션 효과'],
        musicAndSound: '브랜드에 맞는 오리지널 음악',
        colorGrading: '따뜻하고 생동감 있는 톤'
      }
    },
    budgetEstimate: {
      totalBudget: '5,000만원',
      breakdown: {
        preProduction: '500만원',
        production: '2,500만원',
        postProduction: '1,500만원',
        contingency: '500만원'
      }
    },
    deliverables: {
      primaryVideo: '90초 메인 영상',
      additionalAssets: ['30초 버전', '15초 버전', '스틸컷 10장'],
      formats: ['MP4', 'MOV', 'GIF'],
      timeline: '제작 완료 후 3일 이내'
    },
    successMetrics: {
      quantitative: ['조회수 100만 달성', '참여율 5% 이상'],
      qualitative: ['브랜드 인지도 향상', '긍정적 브랜드 이미지'],
      kpis: ['CPM', '참여율', '브랜드 리콜률']
    },
    riskAssessment: {
      potentialRisks: ['날씨로 인한 촬영 지연', '캐스팅 변경 가능성'],
      mitigationStrategies: ['실내 대안 준비', '백업 캐스트 확보']
    },
    createdAt: '2025-08-23T10:00:00.000Z',
    version: 1
  },
  editHistory: [],
  collaborators: [],
  comments: [],
  version: 1,
  tags: ['브랜드', '홍보'],
  isPublic: false,
  createdAt: '2025-08-23T10:00:00.000Z',
  updatedAt: '2025-08-23T10:00:00.000Z',
  lastEditedAt: '2025-08-23T10:00:00.000Z',
  exports: []
}

planStorage.set(samplePlan.id, samplePlan)

// ============================
// 내보내기 처리 함수들
// ============================

function generateExportId(): string {
  return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function generatePDFContent(
  plan: VideoPlanning, 
  options: ExportOptions = {}
): Promise<{ content: Buffer, fileName: string }> {
  // 실제 환경에서는 PDF 라이브러리(jsPDF, Puppeteer 등) 사용
  const htmlContent = generateHTMLContent(plan, options)
  
  // PDF 생성 시뮬레이션
  const pdfBuffer = Buffer.from(`PDF Content for: ${plan.title}\n\n${htmlContent}`, 'utf-8')
  
  const fileName = `${plan.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${new Date().getTime()}.pdf`
  
  return { content: pdfBuffer, fileName }
}

function generateHTMLContent(
  plan: VideoPlanning, 
  options: ExportOptions = {}
): string {
  const content = plan.editedContent || plan.generatedContent
  
  if (!content) {
    throw new Error('기획서 콘텐츠가 없습니다')
  }

  const template = options.template || 'standard'
  const branding = options.branding || {}
  
  return `
<!DOCTYPE html>
<html lang="${options.language || 'ko'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.executiveSummary.title}</title>
    <style>
        body { 
            font-family: 'Malgun Gothic', Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid ${branding.colors?.primary || '#1631F8'}; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
        }
        .section { 
            margin: 30px 0; 
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .section h2 { 
            color: ${branding.colors?.primary || '#1631F8'};
            border-left: 4px solid ${branding.colors?.primary || '#1631F8'};
            padding-left: 15px;
        }
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        .budget-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .tag {
            display: inline-block;
            background: ${branding.colors?.secondary || '#e3f2fd'};
            color: ${branding.colors?.primary || '#1631F8'};
            padding: 4px 12px;
            margin: 4px;
            border-radius: 16px;
            font-size: 14px;
        }
        @media print {
            body { margin: 0; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 20px;">` : ''}
        <h1>${content.executiveSummary.title}</h1>
        <p style="font-size: 18px; color: #666;">${content.executiveSummary.tagline}</p>
        ${branding.companyName ? `<p><strong>${branding.companyName}</strong></p>` : ''}
        <p>작성일: ${new Date().toLocaleDateString('ko-KR')}</p>
    </div>

    <div class="section">
        <h2>📋 프로젝트 개요</h2>
        <div class="grid">
            <div>
                <h3>제작 목적</h3>
                <p>${content.executiveSummary.objective}</p>
            </div>
            <div>
                <h3>타겟 오디언스</h3>
                <p>${content.executiveSummary.targetAudience}</p>
            </div>
        </div>
        <h3>핵심 가치</h3>
        <p>${content.executiveSummary.keyValue}</p>
    </div>

    <div class="section">
        <h2>💡 컨셉 개발</h2>
        <div class="grid">
            <div>
                <h3>핵심 메시지</h3>
                <p>${content.conceptDevelopment.coreMessage}</p>
                
                <h3>감정적 톤</h3>
                <p>${content.conceptDevelopment.emotionalTone}</p>
            </div>
            <div>
                <h3>서사적 접근법</h3>
                <p>${content.conceptDevelopment.narrativeApproach}</p>
                
                <h3>비주얼 스타일</h3>
                <p>${content.conceptDevelopment.visualStyle}</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🎬 콘텐츠 구성</h2>
        <p><strong>전체 길이:</strong> ${content.contentStructure.duration}</p>
        <p><strong>포맷:</strong> ${content.contentStructure.format}</p>
        
        <h3>섹션별 구성</h3>
        ${content.contentStructure.sections.map((section, index) => `
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h4>${index + 1}. ${section.name}</h4>
                <p><strong>길이:</strong> ${section.duration}</p>
                <p><strong>목적:</strong> ${section.purpose}</p>
                <p><strong>주요 내용:</strong> ${section.keyContent}</p>
                <p><strong>시각적 요소:</strong></p>
                <ul>
                    ${section.visualElements.map(element => `<li>${element}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>🎯 제작 계획</h2>
        <div class="grid">
            <div>
                <h3>사전 제작 (${content.productionPlan.preProduction.timeline})</h3>
                <ul>
                    ${content.productionPlan.preProduction.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h3>촬영 (${content.productionPlan.production.shootingDays})</h3>
                <p><strong>촬영지:</strong> ${content.productionPlan.production.locations.join(', ')}</p>
                <p><strong>장비:</strong> ${content.productionPlan.production.equipment.join(', ')}</p>
            </div>
        </div>
        <div>
            <h3>후반 작업 (${content.productionPlan.postProduction.editingTime})</h3>
            <p><strong>특수효과:</strong> ${content.productionPlan.postProduction.specialEffects.join(', ')}</p>
            <p><strong>음악/사운드:</strong> ${content.productionPlan.postProduction.musicAndSound}</p>
        </div>
    </div>

    <div class="section">
        <h2>💰 예산 계획</h2>
        <div style="background: white; padding: 20px; border-radius: 5px;">
            <h3 style="text-align: center; color: ${branding.colors?.primary || '#1631F8'};">
                총 예산: ${content.budgetEstimate.totalBudget}
            </h3>
            <div class="budget-item">
                <span>사전 제작</span>
                <span>${content.budgetEstimate.breakdown.preProduction}</span>
            </div>
            <div class="budget-item">
                <span>제작비</span>
                <span>${content.budgetEstimate.breakdown.production}</span>
            </div>
            <div class="budget-item">
                <span>후반 작업</span>
                <span>${content.budgetEstimate.breakdown.postProduction}</span>
            </div>
            <div class="budget-item" style="font-weight: bold; border-bottom: 2px solid #333;">
                <span>예비비</span>
                <span>${content.budgetEstimate.breakdown.contingency}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📦 결과물 및 납품</h2>
        <p><strong>메인 영상:</strong> ${content.deliverables.primaryVideo}</p>
        <p><strong>추가 에셋:</strong> ${content.deliverables.additionalAssets.join(', ')}</p>
        <p><strong>제공 포맷:</strong> ${content.deliverables.formats.join(', ')}</p>
        <p><strong>납품 일정:</strong> ${content.deliverables.timeline}</p>
    </div>

    <div class="section">
        <h2>📊 성공 지표</h2>
        <div class="grid">
            <div>
                <h3>정량적 지표</h3>
                <ul>
                    ${content.successMetrics.quantitative.map(metric => `<li>${metric}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h3>정성적 지표</h3>
                <ul>
                    ${content.successMetrics.qualitative.map(metric => `<li>${metric}</li>`).join('')}
                </ul>
            </div>
        </div>
        <h3>핵심 성과 지표 (KPI)</h3>
        <div>
            ${content.successMetrics.kpis.map(kpi => `<span class="tag">${kpi}</span>`).join('')}
        </div>
    </div>

    <div class="section">
        <h2>⚠️ 리스크 관리</h2>
        <div class="grid">
            <div>
                <h3>잠재적 리스크</h3>
                <ul>
                    ${content.riskAssessment.potentialRisks.map(risk => `<li>${risk}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h3>대응 전략</h3>
                <ul>
                    ${content.riskAssessment.mitigationStrategies.map(strategy => `<li>${strategy}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>

    <div class="section" style="text-align: center; background: ${branding.colors?.primary || '#1631F8'}; color: white;">
        <h2 style="color: white;">📧 문의</h2>
        <p>기획서 관련 문의사항이 있으시면 언제든 연락주세요.</p>
        <p>이 기획서는 VideoPlanet AI로 생성되었습니다.</p>
    </div>
</body>
</html>`
}

function generateJSONContent(plan: VideoPlanning): { content: string, fileName: string } {
  const exportData = {
    plan: {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      planType: plan.planType,
      status: plan.status,
      version: plan.version,
      tags: plan.tags,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    },
    content: plan.editedContent || plan.generatedContent,
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'user_001', // 실제로는 JWT에서 추출
      exportVersion: '1.0.0'
    }
  }

  const fileName = `${plan.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${new Date().getTime()}.json`
  
  return {
    content: JSON.stringify(exportData, null, 2),
    fileName
  }
}

async function processExport(
  exportId: string,
  plan: VideoPlanning,
  request: ExportRequest
): Promise<void> {
  try {
    // 진행상황 업데이트
    exportStorage.set(exportId, {
      exportId,
      status: 'processing',
      progress: 10,
      currentStep: '내보내기 준비 중...'
    })

    // 포맷별 처리
    let fileContent: string | Buffer
    let fileName: string
    let mimeType: string

    exportStorage.set(exportId, {
      exportId,
      status: 'processing',
      progress: 30,
      currentStep: `${request.format.toUpperCase()} 파일 생성 중...`
    })

    switch (request.format) {
      case 'pdf':
        const pdfResult = await generatePDFContent(plan, request.options)
        fileContent = pdfResult.content
        fileName = pdfResult.fileName
        mimeType = 'application/pdf'
        break

      case 'html':
        fileContent = generateHTMLContent(plan, request.options)
        fileName = `${plan.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${new Date().getTime()}.html`
        mimeType = 'text/html'
        break

      case 'json':
        const jsonResult = generateJSONContent(plan)
        fileContent = jsonResult.content
        fileName = jsonResult.fileName
        mimeType = 'application/json'
        break

      default:
        throw new Error(`지원하지 않는 내보내기 형식입니다: ${request.format}`)
    }

    exportStorage.set(exportId, {
      exportId,
      status: 'processing',
      progress: 80,
      currentStep: '파일 저장 중...'
    })

    // 파일 저장
    exportFiles.set(exportId, {
      content: fileContent,
      mimeType,
      fileName,
      size: typeof fileContent === 'string' ? fileContent.length : fileContent.length
    })

    // 완료 처리
    exportStorage.set(exportId, {
      exportId,
      status: 'completed',
      progress: 100,
      currentStep: '내보내기 완료'
    })

    console.log(`Export completed: ${exportId} - ${fileName}`)

  } catch (error) {
    console.error(`Export failed: ${exportId}`, error)
    
    exportStorage.set(exportId, {
      exportId,
      status: 'failed',
      progress: 0,
      currentStep: '내보내기 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    })
  }
}

// ============================
// POST: 내보내기 요청
// ============================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const planId = params.id
    const body: ExportRequest = await request.json()

    // 기획서 존재 확인
    const plan = planStorage.get(planId)
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 권한 확인
    const currentUserId = 'user_001' // JWT에서 추출해야 함
    if (plan.userId !== currentUserId && !plan.collaborators.some(c => c.userId === currentUserId)) {
      return NextResponse.json({
        success: false,
        error: '기획서 내보내기 권한이 없습니다',
        code: 'ACCESS_DENIED'
      } as APIResponse<never>, { status: 403 })
    }

    // 포맷 검증
    const supportedFormats: ExportFormat[] = ['pdf', 'json', 'html']
    if (!supportedFormats.includes(body.format)) {
      return NextResponse.json({
        success: false,
        error: `지원하지 않는 형식입니다. 지원 형식: ${supportedFormats.join(', ')}`,
        code: 'UNSUPPORTED_FORMAT'
      } as APIResponse<never>, { status: 400 })
    }

    // 콘텐츠 확인
    if (!plan.generatedContent && !plan.editedContent) {
      return NextResponse.json({
        success: false,
        error: '내보낼 콘텐츠가 없습니다',
        code: 'NO_CONTENT'
      } as APIResponse<never>, { status: 400 })
    }

    // 내보내기 ID 생성
    const exportId = generateExportId()

    // 비동기로 내보내기 처리
    processExport(exportId, plan, body)

    // 즉시 응답 (진행상황은 별도 API로 확인)
    return NextResponse.json({
      success: true,
      data: {
        exportId,
        status: 'pending',
        message: '내보내기 작업이 시작되었습니다'
      },
      message: '내보내기 요청이 접수되었습니다'
    } as APIResponse<{ exportId: string, status: string, message: string }>)

  } catch (error) {
    console.error('Export request error:', error)

    return NextResponse.json({
      success: false,
      error: '내보내기 요청 처리 중 오류가 발생했습니다',
      code: 'EXPORT_REQUEST_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

// ============================
// GET: 내보내기 상태 확인 또는 파일 다운로드
// ============================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const planId = params.id
    const { searchParams } = new URL(request.url)
    const exportId = searchParams.get('exportId')
    const download = searchParams.get('download') === 'true'

    if (!exportId) {
      return NextResponse.json({
        success: false,
        error: 'exportId가 필요합니다',
        code: 'MISSING_EXPORT_ID'
      } as APIResponse<never>, { status: 400 })
    }

    const exportProgress = exportStorage.get(exportId)
    if (!exportProgress) {
      return NextResponse.json({
        success: false,
        error: '해당 내보내기 작업을 찾을 수 없습니다',
        code: 'EXPORT_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 진행상황 조회
    if (!download) {
      return NextResponse.json({
        success: true,
        data: exportProgress,
        message: '내보내기 진행상황을 조회했습니다'
      } as APIResponse<ExportProgress>)
    }

    // 파일 다운로드
    if (exportProgress.status !== 'completed') {
      return NextResponse.json({
        success: false,
        error: '내보내기가 완료되지 않았습니다',
        code: 'EXPORT_NOT_READY'
      } as APIResponse<never>, { status: 400 })
    }

    const fileData = exportFiles.get(exportId)
    if (!fileData) {
      return NextResponse.json({
        success: false,
        error: '내보내기 파일을 찾을 수 없습니다',
        code: 'FILE_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 파일 다운로드 응답
    const headers = new Headers({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileData.fileName)}"`,
      'Content-Length': fileData.size.toString()
    })

    return new NextResponse(fileData.content, { headers })

  } catch (error) {
    console.error('Export retrieval error:', error)

    return NextResponse.json({
      success: false,
      error: '내보내기 상태 조회 중 오류가 발생했습니다',
      code: 'EXPORT_RETRIEVAL_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}