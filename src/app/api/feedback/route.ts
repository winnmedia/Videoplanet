import { NextRequest, NextResponse } from 'next/server';

// Mock 피드백 데이터
const mockFeedbacks = [
  {
    id: '1',
    projectId: '1',
    projectName: '브랜드 홍보 영상',
    videoUrl: '/videos/sample1.mp4',
    timestamp: '00:01:23',
    comment: '이 부분의 트랜지션이 너무 빠른 것 같습니다. 조금 더 부드럽게 처리해주세요.',
    author: '김디자이너',
    status: 'pending',
    priority: 'high',
    screenshot: null,
    createdAt: '2025-08-24T09:30:00Z',
    updatedAt: '2025-08-24T09:30:00Z',
    replies: [
      {
        id: 'r1',
        author: '이기획자',
        comment: '동의합니다. 0.5초 정도 더 길게 가져가면 좋을 것 같아요.',
        createdAt: '2025-08-24T10:00:00Z',
      }
    ],
    reactions: {
      like: 3,
      dislike: 0,
      question: 1,
    }
  },
  {
    id: '2',
    projectId: '1',
    projectName: '브랜드 홍보 영상',
    videoUrl: '/videos/sample1.mp4',
    timestamp: '00:02:45',
    comment: '배경 음악이 너무 큰 것 같아요. 나레이션이 잘 안 들립니다.',
    author: '박PD',
    status: 'resolved',
    priority: 'medium',
    screenshot: '/screenshots/feedback2.png',
    createdAt: '2025-08-23T14:20:00Z',
    updatedAt: '2025-08-24T08:00:00Z',
    replies: [],
    reactions: {
      like: 5,
      dislike: 0,
      question: 0,
    }
  },
  {
    id: '3',
    projectId: '2',
    projectName: '제품 튜토리얼 영상',
    videoUrl: '/videos/sample2.mp4',
    timestamp: '00:00:30',
    comment: '제품 클로즈업 샷이 필요합니다. 디테일이 잘 안 보여요.',
    author: '정기획자',
    status: 'in_progress',
    priority: 'high',
    screenshot: null,
    createdAt: '2025-08-24T11:00:00Z',
    updatedAt: '2025-08-24T11:00:00Z',
    replies: [
      {
        id: 'r2',
        author: '최디자이너',
        comment: '추가 촬영이 필요할 것 같습니다. 일정 조율하겠습니다.',
        createdAt: '2025-08-24T11:30:00Z',
      }
    ],
    reactions: {
      like: 2,
      dislike: 0,
      question: 2,
    }
  },
];

/**
 * GET /api/feedback
 * 피드백 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    let feedbacks = [...mockFeedbacks];
    
    // 프로젝트 필터링
    if (projectId) {
      feedbacks = feedbacks.filter(f => f.projectId === projectId);
    }
    
    // 상태 필터링
    if (status && status !== 'all') {
      feedbacks = feedbacks.filter(f => f.status === status);
    }
    
    // 우선순위 필터링
    if (priority && priority !== 'all') {
      feedbacks = feedbacks.filter(f => f.priority === priority);
    }
    
    // 최신순 정렬
    feedbacks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      data: feedbacks,
      total: feedbacks.length,
      stats: {
        pending: mockFeedbacks.filter(f => f.status === 'pending').length,
        in_progress: mockFeedbacks.filter(f => f.status === 'in_progress').length,
        resolved: mockFeedbacks.filter(f => f.status === 'resolved').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch feedbacks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feedbacks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 * 새 피드백 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 유효성 검사
    if (!body.projectId || !body.comment || !body.timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'ProjectId, comment, and timestamp are required',
        },
        { status: 400 }
      );
    }
    
    const newFeedback = {
      id: String(mockFeedbacks.length + 1),
      projectId: body.projectId,
      projectName: body.projectName || 'Unknown Project',
      videoUrl: body.videoUrl || '/videos/default.mp4',
      timestamp: body.timestamp,
      comment: body.comment,
      author: body.author || 'Anonymous',
      status: 'pending',
      priority: body.priority || 'medium',
      screenshot: body.screenshot || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
      reactions: {
        like: 0,
        dislike: 0,
        question: 0,
      }
    };
    
    mockFeedbacks.push(newFeedback);
    
    return NextResponse.json(
      {
        success: true,
        data: newFeedback,
        message: 'Feedback created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create feedback',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback
 * 피드백 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Feedback ID is required',
        },
        { status: 400 }
      );
    }
    
    const feedbackIndex = mockFeedbacks.findIndex(f => f.id === id);
    
    if (feedbackIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Feedback not found',
        },
        { status: 404 }
      );
    }
    
    mockFeedbacks[feedbackIndex] = {
      ...mockFeedbacks[feedbackIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: mockFeedbacks[feedbackIndex],
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update feedback',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}