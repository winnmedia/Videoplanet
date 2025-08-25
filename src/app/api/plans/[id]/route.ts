/**
 * 개별 영상 기획서 API 엔드포인트
 * 특정 기획서의 상세 조회, 수정, 삭제 처리
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  VideoPlanning,
  APIResponse,
  PlanEditHistory,
  PlanComment,
  PlanCollaborator
} from '@/entities/video-planning'

// ============================
// 요청 타입 정의
// ============================

interface PlanContentUpdateRequest {
  section: string
  content: any
  changeReason?: string
}

interface AddCommentRequest {
  content: string
  section?: string
  replyToId?: string
}

interface AddCollaboratorRequest {
  email: string
  role: 'viewer' | 'editor' | 'admin'
  permissions?: string[]
}

interface PlanDuplicationRequest {
  title: string
  description?: string
  copyCollaborators?: boolean
}

// ============================
// 메모리 저장소 (동일한 저장소 재사용)
// ============================

// 실제 환경에서는 외부 파일이나 데이터베이스에서 import
const planStorage = new Map<string, VideoPlanning>()

// 샘플 데이터 다시 추가 (모듈 분리 시 제거)
const samplePlan: VideoPlanning = {
  id: 'plan_sample_001',
  userId: 'user_001',
  projectId: undefined,
  title: 'AI 생성 샘플 기획서',
  description: 'AI로 자동 생성된 영상 기획서 샘플입니다',
  planType: 'ai-generated',
  status: 'draft',
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

if (!planStorage.has(samplePlan.id)) {
  planStorage.set(samplePlan.id, samplePlan)
}

// ============================
// 유틸리티 함수들
// ============================

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validatePlanAccess(plan: VideoPlanning, userId: string, requiredRole?: string): boolean {
  // 소유자 확인
  if (plan.userId === userId) {
    return true
  }

  // 협업자 권한 확인
  const collaborator = plan.collaborators.find(c => c.userId === userId)
  if (!collaborator) {
    return false
  }

  // 특정 역할 필요 시 검증
  if (requiredRole) {
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 }
    const userRole = roleHierarchy[collaborator.role as keyof typeof roleHierarchy]
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy]
    
    return userRole >= requiredRoleLevel
  }

  return true
}

// ============================
// GET: 개별 기획서 상세 조회
// ============================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const planId = params.id

    const plan = planStorage.get(planId)
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 권한 확인 (실제로는 JWT에서 사용자 ID 추출)
    const currentUserId = 'user_001' // JWT에서 추출해야 함
    
    if (!validatePlanAccess(plan, currentUserId)) {
      return NextResponse.json({
        success: false,
        error: '기획서 조회 권한이 없습니다',
        code: 'ACCESS_DENIED'
      } as APIResponse<never>, { status: 403 })
    }

    // 조회수 증가나 최근 조회 시간 업데이트 등의 로직 추가 가능
    console.log(`Plan viewed: ${planId} by user ${currentUserId}`)

    return NextResponse.json({
      success: true,
      data: plan,
      message: '기획서를 성공적으로 조회했습니다'
    } as APIResponse<VideoPlanning>)

  } catch (error) {
    console.error('Plan retrieval error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 조회 중 오류가 발생했습니다',
      code: 'RETRIEVAL_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

// ============================
// PATCH: 기획서 콘텐츠 부분 업데이트
// ============================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const planId = params.id
    const body: PlanContentUpdateRequest = await request.json()

    const plan = planStorage.get(planId)
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 편집 권한 확인
    const currentUserId = 'user_001' // JWT에서 추출해야 함
    
    if (!validatePlanAccess(plan, currentUserId, 'editor')) {
      return NextResponse.json({
        success: false,
        error: '기획서 편집 권한이 없습니다',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as APIResponse<never>, { status: 403 })
    }

    // 섹션별 검증
    if (!body.section || !body.content) {
      return NextResponse.json({
        success: false,
        error: '섹션과 콘텐츠 정보가 필요합니다',
        code: 'INVALID_UPDATE_REQUEST'
      } as APIResponse<never>, { status: 400 })
    }

    // 이전 값 저장
    const previousContent = plan.editedContent || plan.generatedContent
    const previousSectionValue = previousContent?.[body.section]

    // 편집 이력 생성
    const editEntry: PlanEditHistory = {
      id: `edit_${generateId()}`,
      userId: currentUserId,
      editType: 'content',
      section: body.section,
      previousValue: previousSectionValue,
      newValue: body.content,
      changeReason: body.changeReason,
      timestamp: new Date().toISOString()
    }

    // 기획서 업데이트
    const updatedPlan: VideoPlanning = {
      ...plan,
      editedContent: {
        ...plan.editedContent,
        [body.section]: body.content
      },
      editHistory: [...plan.editHistory, editEntry],
      version: plan.version + 1,
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString()
    }

    // 저장
    planStorage.set(planId, updatedPlan)

    console.log(`Plan content updated: ${planId} - section: ${body.section}`)

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: `${body.section} 섹션이 성공적으로 업데이트되었습니다`
    } as APIResponse<VideoPlanning>)

  } catch (error) {
    console.error('Plan content update error:', error)

    return NextResponse.json({
      success: false,
      error: '기획서 콘텐츠 업데이트 중 오류가 발생했습니다',
      code: 'CONTENT_UPDATE_ERROR'
    } as APIResponse<never>, { status: 500 })
  }
}

// ============================
// DELETE: 기획서 삭제
// ============================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const planId = params.id

    const plan = planStorage.get(planId)
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: '해당 기획서를 찾을 수 없습니다',
        code: 'PLAN_NOT_FOUND'
      } as APIResponse<never>, { status: 404 })
    }

    // 삭제 권한 확인 (소유자 또는 admin만 가능)
    const currentUserId = 'user_001' // JWT에서 추출해야 함
    
    const isOwner = plan.userId === currentUserId
    const isAdmin = plan.collaborators.some(c => c.userId === currentUserId && c.role === 'admin')

    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: '기획서 삭제 권한이 없습니다',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as APIResponse<never>, { status: 403 })
    }

    // 안전 삭제를 위한 상태 확인
    if (plan.status === 'published') {
      return NextResponse.json({
        success: false,
        error: '게시된 기획서는 삭제할 수 없습니다. 먼저 상태를 변경해주세요',
        code: 'CANNOT_DELETE_PUBLISHED_PLAN'
      } as APIResponse<never>, { status: 400 })
    }

    // 삭제 실행
    planStorage.delete(planId)

    console.log(`Plan deleted: ${planId} by user ${currentUserId}`)

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