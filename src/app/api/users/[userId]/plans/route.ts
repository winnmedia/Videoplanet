/**
 * 사용자별 기획서 관리 API 엔드포인트
 * 특정 사용자의 기획서 목록, 통계, 협업 관리
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  VideoPlanning,
  APIResponse,
  PaginatedResponse,
  PlanCollaborator,
  PlanComment
} from '@/entities/video-planning'

// ============================
// 응답 타입 정의
// ============================

interface UserPlanStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  recentActivity: {
    created: number
    updated: number
    commented: number
  }
  collaboration: {
    owned: number
    participating: number
    invited: number
  }
}

interface UserPlanSummary {
  plans: VideoPlanning[]
  stats: UserPlanStats
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CollaborationRequest {
  planId: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  message?: string
}

// ============================
// 메모리 저장소 확장
// ============================

const planStorage = new Map<string, VideoPlanning>()
const userInvitations = new Map<string, Array<{
  id: string
  planId: string
  email: string
  role: string
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'accepted' | 'declined'
  message?: string
}>>()

// 샘플 데이터 추가
const samplePlans: VideoPlanning[] = [
  {
    id: 'plan_user_001',
    userId: 'user_001',
    title: '브랜드 홍보 영상 기획서',
    description: 'AI로 생성된 브랜드 홍보 영상 기획서',
    planType: 'ai-generated',
    status: 'draft',
    editHistory: [],
    collaborators: [],
    comments: [],
    version: 1,
    tags: ['브랜드', '홍보'],
    isPublic: false,
    createdAt: '2025-08-20T10:00:00.000Z',
    updatedAt: '2025-08-23T15:30:00.000Z',
    lastEditedAt: '2025-08-23T15:30:00.000Z',
    exports: []
  },
  {
    id: 'plan_user_002',
    userId: 'user_001',
    title: '제품 소개 영상',
    description: '수동으로 작성한 제품 소개 영상 기획서',
    planType: 'manual',
    status: 'in-review',
    editHistory: [],
    collaborators: [{
      userId: 'user_002',
      userName: 'Editor User',
      email: 'editor@example.com',
      role: 'editor',
      invitedBy: 'user_001',
      invitedAt: '2025-08-22T09:00:00.000Z',
      lastActiveAt: '2025-08-23T14:00:00.000Z',
      permissions: ['edit', 'comment']
    }],
    comments: [{
      id: 'comment_001',
      userId: 'user_002',
      userName: 'Editor User',
      content: '전체적인 구성이 좋습니다. 타겟 메시지를 조금 더 구체화하면 어떨까요?',
      section: 'concept',
      isResolved: false,
      createdAt: '2025-08-23T14:15:00.000Z'
    }],
    version: 3,
    tags: ['제품', '소개'],
    isPublic: true,
    createdAt: '2025-08-21T14:00:00.000Z',
    updatedAt: '2025-08-23T14:15:00.000Z',
    lastEditedAt: '2025-08-23T14:00:00.000Z',
    exports: []
  },
  {
    id: 'plan_user_003',
    userId: 'user_002',
    title: '교육 콘텐츠 기획서',
    description: 'AI와 수동 편집이 결합된 교육 콘텐츠',
    planType: 'hybrid',
    status: 'approved',
    editHistory: [],
    collaborators: [{
      userId: 'user_001',
      userName: 'Plan Owner',
      email: 'owner@example.com',
      role: 'viewer',
      invitedBy: 'user_002',
      invitedAt: '2025-08-22T16:00:00.000Z',
      permissions: ['view', 'comment']
    }],
    comments: [],
    version: 2,
    tags: ['교육', '온라인'],
    isPublic: false,
    createdAt: '2025-08-19T11:00:00.000Z',
    updatedAt: '2025-08-22T16:00:00.000Z',
    lastEditedAt: '2025-08-22T10:00:00.000Z',
    exports: []
  }
]

// 샘플 데이터를 저장소에 추가
samplePlans.forEach(plan => planStorage.set(plan.id, plan))

// ============================
// 유틸리티 함수들
// ============================

function calculateUserStats(userId: string, allPlans: VideoPlanning[]): UserPlanStats {
  // 사용자가 소유한 기획서
  const ownedPlans = allPlans.filter(plan => plan.userId === userId)
  
  // 사용자가 협업 중인 기획서
  const collaboratingPlans = allPlans.filter(plan => 
    plan.collaborators.some(c => c.userId === userId)
  )

  // 상태별 통계
  const byStatus = ownedPlans.reduce((acc, plan) => {
    acc[plan.status] = (acc[plan.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 타입별 통계
  const byType = ownedPlans.reduce((acc, plan) => {
    acc[plan.planType] = (acc[plan.planType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 최근 활동 (최근 7일)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const recentCreated = ownedPlans.filter(plan => 
    new Date(plan.createdAt) > sevenDaysAgo
  ).length

  const recentUpdated = ownedPlans.filter(plan => 
    new Date(plan.updatedAt) > sevenDaysAgo
  ).length

  const recentCommented = allPlans.filter(plan =>
    plan.comments.some(comment => 
      comment.userId === userId && new Date(comment.createdAt) > sevenDaysAgo
    )
  ).length

  return {
    total: ownedPlans.length,
    byStatus,
    byType,
    recentActivity: {
      created: recentCreated,
      updated: recentUpdated,
      commented: recentCommented
    },
    collaboration: {
      owned: ownedPlans.length,
      participating: collaboratingPlans.length,
      invited: userInvitations.get(userId)?.filter(inv => inv.status === 'pending').length || 0
    }
  }
}

function getUserPlans(userId: string, includeCollaborations: boolean = false): VideoPlanning[] {
  const allPlans = Array.from(planStorage.values())
  
  let userPlans = allPlans.filter(plan => plan.userId === userId)
  
  if (includeCollaborations) {
    const collaboratingPlans = allPlans.filter(plan =>
      plan.collaborators.some(c => c.userId === userId)
    )
    userPlans = [...userPlans, ...collaboratingPlans]
  }
  
  return userPlans
}

function applyUserPlanFilters(
  plans: VideoPlanning[],
  filters: {
    status?: string
    planType?: string
    tags?: string
    search?: string
    period?: string
  }
): VideoPlanning[] {
  let filtered = plans

  if (filters.status) {
    const statuses = filters.status.split(',')
    filtered = filtered.filter(plan => statuses.includes(plan.status))
  }

  if (filters.planType) {
    const types = filters.planType.split(',')
    filtered = filtered.filter(plan => types.includes(plan.planType))
  }

  if (filters.tags) {
    const tags = filters.tags.split(',')
    filtered = filtered.filter(plan =>
      tags.some(tag => plan.tags.includes(tag))
    )
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filtered = filtered.filter(plan =>
      plan.title.toLowerCase().includes(searchTerm) ||
      plan.description?.toLowerCase().includes(searchTerm)
    )
  }

  if (filters.period) {
    const now = new Date()
    let periodStart: Date

    switch (filters.period) {
      case '1d':
        periodStart = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        break
      case '7d':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return filtered
    }

    filtered = filtered.filter(plan => new Date(plan.updatedAt) >= periodStart)
  }

  return filtered
}

// ============================
// GET: 사용자별 기획서 목록 및 통계
// ============================

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const userId = params.userId
    const { searchParams } = new URL(request.url)

    // 현재 사용자 권한 확인
    const currentUserId = 'user_001' // JWT에서 추출해야 함
    if (userId !== currentUserId) {
      // 다른 사용자의 기획서 조회 시 공개 기획서만 조회
      const isPublicOnly = searchParams.get('public') === 'true'
      if (!isPublicOnly) {
        return NextResponse.json({
          success: false,
          error: '다른 사용자의 비공개 기획서에 접근할 권한이 없습니다',
          code: 'ACCESS_DENIED'
        } as APIResponse<never>, { status: 403 })
      }
    }

    // 필터링 파라미터
    const filters = {
      status: searchParams.get('status') || undefined,
      planType: searchParams.get('planType') || undefined,
      tags: searchParams.get('tags') || undefined,
      search: searchParams.get('search') || undefined,
      period: searchParams.get('period') || undefined
    }

    // 페이지네이션 파라미터
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10')), 50)
    
    // 협업 기획서 포함 여부
    const includeCollabs = searchParams.get('includeCollaborations') === 'true'
    
    // 통계만 요청하는 경우
    const statsOnly = searchParams.get('statsOnly') === 'true'

    // 사용자 기획서 가져오기
    let userPlans = getUserPlans(userId, includeCollabs)

    // 다른 사용자 조회 시 공개 기획서만 필터링
    if (userId !== currentUserId) {
      userPlans = userPlans.filter(plan => plan.isPublic)
    }

    // 필터 적용
    const filteredPlans = applyUserPlanFilters(userPlans, filters)

    // 정렬 (최근 업데이트 순)
    const sortedPlans = filteredPlans.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    // 통계 계산
    const allUserPlans = Array.from(planStorage.values())
    const stats = calculateUserStats(userId, allUserPlans)

    if (statsOnly) {
      return NextResponse.json({
        success: true,
        data: { stats },
        message: '사용자 통계를 조회했습니다'
      } as APIResponse<{ stats: UserPlanStats }>)
    }

    // 페이지네이션 적용
    const offset = (page - 1) * limit
    const paginatedPlans = sortedPlans.slice(offset, offset + limit)

    const result: UserPlanSummary = {
      plans: paginatedPlans,
      stats,
      pagination: {
        page,
        limit,
        total: sortedPlans.length,
        totalPages: Math.ceil(sortedPlans.length / limit)
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${paginatedPlans.length}개의 기획서를 조회했습니다`
    } as APIResponse<UserPlanSummary>)

  } catch (error) {
    console.error('User plans retrieval error:', error)

    return NextResponse.json({
      success: false,
      error: '사용자 기획서 조회 중 오류가 발생했습니다',
      code: 'USER_PLANS_RETRIEVAL_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

// ============================
// POST: 협업자 초대
// ============================

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const userId = params.userId
    const currentUserId = 'user_001' // JWT에서 추출해야 함

    if (userId !== currentUserId) {
      return NextResponse.json({
        success: false,
        error: '다른 사용자 계정에 협업자를 초대할 권한이 없습니다',
        code: 'ACCESS_DENIED'
      } as APIResponse<never>, { status: 403 })
    }

    const body: CollaborationRequest = await request.json()

    // 기획서 존재 확인
    const plan = planStorage.get(body.planId)
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 기획서 소유권 확인
    if (plan.userId !== currentUserId) {
      return NextResponse.json({
        success: false,
        error: '기획서 소유자만 협업자를 초대할 수 있습니다',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as APIResponse<never>, { status: 403 })
    }

    // 이미 협업자인지 확인
    const existingCollaborator = plan.collaborators.find(c => c.email === body.email)
    if (existingCollaborator) {
      return NextResponse.json({
        success: false,
        error: '이미 협업 중인 사용자입니다',
        code: 'ALREADY_COLLABORATOR'
      } as APIResponse<never>, { status: 400 })
    }

    // 초대 생성
    const invitationId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const invitation = {
      id: invitationId,
      planId: body.planId,
      email: body.email,
      role: body.role,
      invitedBy: currentUserId,
      invitedAt: new Date().toISOString(),
      status: 'pending' as const,
      message: body.message
    }

    // 사용자별 초대 목록에 추가
    const inviteTargetUserId = 'user_002' // 실제로는 이메일을 통해 사용자 ID 조회해야 함
    const userInvites = userInvitations.get(inviteTargetUserId) || []
    userInvites.push(invitation)
    userInvitations.set(inviteTargetUserId, userInvites)

    console.log(`Collaboration invitation sent: ${body.email} to plan ${body.planId}`)

    return NextResponse.json({
      success: true,
      data: { invitationId, invitation },
      message: `${body.email}에게 협업 초대를 발송했습니다`
    } as APIResponse<{ invitationId: string, invitation: any }>)

  } catch (error) {
    console.error('Collaboration invitation error:', error)

    return NextResponse.json({
      success: false,
      error: '협업자 초대 중 오류가 발생했습니다',
      code: 'COLLABORATION_INVITATION_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}