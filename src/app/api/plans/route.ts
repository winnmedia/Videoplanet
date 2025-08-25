/**
 * 영상 기획서 CRUD API 엔드포인트
 * 기획서 생성, 조회, 수정, 삭제 및 목록 관리
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  VideoPlanning,
  APIResponse,
  PaginatedResponse,
  PlanStatus,
  PlanType
} from '@/entities/video-planning'

// ============================
// 요청/응답 타입 정의
// ============================

interface CreatePlanRequest {
  title: string
  description?: string
  planType: PlanType
  originalRequest?: any
  generatedContent?: any
  projectId?: string
  tags?: string[]
}

interface UpdatePlanRequest {
  title?: string
  description?: string
  status?: PlanStatus
  editedContent?: any
  tags?: string[]
  changeReason?: string
}

interface PlanListQuery {
  page?: string
  limit?: string
  status?: string
  planType?: string
  tags?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  userId?: string
}

// ============================
// 메모리 저장소 (실제 환경에서는 데이터베이스 사용)
// ============================

const planStorage = new Map<string, VideoPlanning>()

// 테스트용 더미 데이터
const samplePlan: VideoPlanning = {
  id: 'plan_sample_001',
  userId: 'user_001',
  projectId: undefined,
  title: 'AI 생성 샘플 기획서',
  description: 'AI로 자동 생성된 영상 기획서 샘플입니다',
  planType: 'ai-generated',
  status: 'draft',
  originalRequest: {
    concept: '브랜드 홍보 영상',
    purpose: '신제품 런칭',
    target: '20-30대 직장인',
    duration: '60초',
    style: ['모던', '깔끔'],
    tone: ['전문적', '신뢰감'],
    keyMessages: ['혁신적 기술', '사용자 중심']
  },
  editHistory: [],
  collaborators: [],
  comments: [],
  version: 1,
  tags: ['브랜드', '홍보', 'B2C'],
  isPublic: false,
  createdAt: '2025-08-23T10:00:00.000Z',
  updatedAt: '2025-08-23T10:00:00.000Z',
  lastEditedAt: '2025-08-23T10:00:00.000Z',
  exports: []
}

planStorage.set(samplePlan.id, samplePlan)

// ============================
// 유틸리티 함수들
// ============================

function generateId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validateCreateRequest(request: CreatePlanRequest): string[] {
  const errors: string[] = []

  if (!request.title || request.title.trim().length === 0) {
    errors.push('기획서 제목은 필수입니다')
  }

  if (request.title && request.title.length > 200) {
    errors.push('제목은 200자를 초과할 수 없습니다')
  }

  if (!request.planType) {
    errors.push('기획서 유형은 필수입니다')
  }

  if (request.planType && !['ai-generated', 'manual', 'hybrid'].includes(request.planType)) {
    errors.push('유효하지 않은 기획서 유형입니다')
  }

  return errors
}

function validateUpdateRequest(request: UpdatePlanRequest): string[] {
  const errors: string[] = []

  if (request.title && request.title.length > 200) {
    errors.push('제목은 200자를 초과할 수 없습니다')
  }

  if (request.status && !['draft', 'in-review', 'approved', 'published', 'archived'].includes(request.status)) {
    errors.push('유효하지 않은 상태값입니다')
  }

  return errors
}

function applyFilters(plans: VideoPlanning[], query: PlanListQuery): VideoPlanning[] {
  let filtered = Array.from(plans)

  // 상태 필터
  if (query.status) {
    const statuses = query.status.split(',')
    filtered = filtered.filter(plan => statuses.includes(plan.status))
  }

  // 타입 필터
  if (query.planType) {
    const types = query.planType.split(',')
    filtered = filtered.filter(plan => types.includes(plan.planType))
  }

  // 태그 필터
  if (query.tags) {
    const tags = query.tags.split(',')
    filtered = filtered.filter(plan => 
      tags.some(tag => plan.tags.includes(tag))
    )
  }

  // 검색 필터
  if (query.search) {
    const searchTerm = query.search.toLowerCase()
    filtered = filtered.filter(plan =>
      plan.title.toLowerCase().includes(searchTerm) ||
      plan.description?.toLowerCase().includes(searchTerm) ||
      plan.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // 사용자 필터
  if (query.userId) {
    filtered = filtered.filter(plan => plan.userId === query.userId)
  }

  return filtered
}

function applySorting(plans: VideoPlanning[], query: PlanListQuery): VideoPlanning[] {
  const sortBy = query.sortBy || 'updatedAt'
  const sortOrder = query.sortOrder || 'desc'

  return plans.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })
}

function paginateResults<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[], pagination: any } {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit)
    }
  }
}

// ============================
// API 핸들러들
// ============================

/**
 * GET: 기획서 목록 조회 (필터링, 검색, 정렬, 페이지네이션 지원)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query: PlanListQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      planType: searchParams.get('planType') || undefined,
      tags: searchParams.get('tags') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      userId: searchParams.get('userId') || undefined
    }

    // 페이지네이션 파라미터 검증
    const page = Math.max(1, parseInt(query.page!))
    const limit = Math.min(Math.max(1, parseInt(query.limit!)), 50) // 최대 50개까지

    // 모든 기획서 가져오기
    const allPlans = Array.from(planStorage.values())

    // 필터링 적용
    const filteredPlans = applyFilters(allPlans, query)

    // 정렬 적용
    const sortedPlans = applySorting(filteredPlans, query)

    // 페이지네이션 적용
    const result = paginateResults(sortedPlans, page, limit)

    const response: PaginatedResponse<VideoPlanning> = result

    return NextResponse.json({
      success: true,
      data: response,
      message: `${result.items.length}개의 기획서를 조회했습니다`
    } as APIResponse<PaginatedResponse<VideoPlanning>>)

  } catch (error) {
    console.error('Plan list retrieval error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 목록 조회 중 오류가 발생했습니다',
      code: 'LIST_RETRIEVAL_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

/**
 * POST: 새 기획서 생성
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreatePlanRequest = await request.json()

    // 요청 검증
    const validationErrors = validateCreateRequest(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: validationErrors.join(', '),
        code: 'VALIDATION_ERROR'
      } as APIResponse<never>, { status: 400 })
    }

    // 새 기획서 생성
    const now = new Date().toISOString()
    const newPlan: VideoPlanning = {
      id: generateId(),
      userId: body.projectId || 'default_user', // 실제로는 JWT에서 추출
      projectId: body.projectId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      planType: body.planType,
      status: 'draft',
      originalRequest: body.originalRequest,
      generatedContent: body.generatedContent,
      editHistory: [{
        id: `edit_${Date.now()}`,
        userId: 'current_user',
        editType: 'content',
        section: 'creation',
        previousValue: null,
        newValue: { title: body.title, planType: body.planType },
        timestamp: now
      }],
      collaborators: [],
      comments: [],
      version: 1,
      tags: body.tags || [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      lastEditedAt: now,
      exports: []
    }

    // 저장
    planStorage.set(newPlan.id, newPlan)

    console.log(`Created new plan: ${newPlan.id} - "${newPlan.title}"`)

    return NextResponse.json({
      success: true,
      data: newPlan,
      message: '새 기획서가 성공적으로 생성되었습니다'
    } as APIResponse<VideoPlanning>, { status: 201 })

  } catch (error) {
    console.error('Plan creation error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 생성 중 오류가 발생했습니다',
      code: 'CREATION_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

/**
 * PUT: 기획서 정보 업데이트 (제목, 설명, 상태 등 메타데이터)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')

    if (!planId) {
      return NextResponse.json({
        success: false,
        error: '기획서 ID가 필요합니다',
        code: 'MISSING_PLAN_ID'
      } as APIResponse<never>, { status: 400 })
    }

    const existingPlan = planStorage.get(planId)
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    const body: UpdatePlanRequest = await request.json()

    // 요청 검증
    const validationErrors = validateUpdateRequest(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: validationErrors.join(', '),
        code: 'VALIDATION_ERROR'
      } as APIResponse<never>, { status: 400 })
    }

    // 편집 이력 추가
    const editEntry = {
      id: `edit_${Date.now()}`,
      userId: 'current_user', // 실제로는 JWT에서 추출
      editType: 'metadata' as const,
      section: 'plan_info',
      previousValue: {
        title: existingPlan.title,
        status: existingPlan.status,
        description: existingPlan.description
      },
      newValue: body,
      changeReason: body.changeReason,
      timestamp: new Date().toISOString()
    }

    // 기획서 업데이트
    const updatedPlan: VideoPlanning = {
      ...existingPlan,
      title: body.title?.trim() || existingPlan.title,
      description: body.description?.trim() ?? existingPlan.description,
      status: body.status || existingPlan.status,
      editedContent: body.editedContent ? { ...existingPlan.editedContent, ...body.editedContent } : existingPlan.editedContent,
      tags: body.tags ?? existingPlan.tags,
      editHistory: [...existingPlan.editHistory, editEntry],
      version: existingPlan.version + 1,
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString()
    }

    // 저장
    planStorage.set(planId, updatedPlan)

    console.log(`Updated plan: ${planId} - version ${updatedPlan.version}`)

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: '기획서가 성공적으로 업데이트되었습니다'
    } as APIResponse<VideoPlanning>)

  } catch (error) {
    console.error('Plan update error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 업데이트 중 오류가 발생했습니다',
      code: 'UPDATE_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

/**
 * DELETE: 기획서 삭제
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')

    if (!planId) {
      return NextResponse.json({
        success: false,
        error: '기획서 ID가 필요합니다',
        code: 'MISSING_PLAN_ID'
      } as APIResponse<never>, { status: 400 })
    }

    const existingPlan = planStorage.get(planId)
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 권한 확인 (실제로는 JWT에서 사용자 ID 추출하여 확인)
    // if (existingPlan.userId !== currentUserId) {
    //   return NextResponse.json({
    //     success: false,
    //     error: '기획서 삭제 권한이 없습니다',
    //     code: 'INSUFFICIENT_PERMISSIONS'
    //   } as APIResponse<never>, { status: 403 })
    // }

    // 삭제
    planStorage.delete(planId)

    console.log(`Deleted plan: ${planId} - "${existingPlan.title}"`)

    return NextResponse.json({
      success: true,
      message: '기획서가 성공적으로 삭제되었습니다'
    } as APIResponse<never>)

  } catch (error) {
    console.error('Plan deletion error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 삭제 중 오류가 발생했습니다',
      code: 'DELETION_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}