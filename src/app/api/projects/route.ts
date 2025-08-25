import { NextRequest, NextResponse } from 'next/server';

// Mock 데이터
const mockProjects = [
  {
    id: '1',
    name: '브랜드 홍보 영상',
    status: 'in_progress',
    progress: 65,
    deadline: '2025-09-15',
    team: ['김디자이너', '이기획자', '박PD'],
    priority: 'high',
    createdAt: '2025-08-01T09:00:00Z',
    updatedAt: '2025-08-24T10:00:00Z',
  },
  {
    id: '2',
    name: '제품 튜토리얼 영상',
    status: 'planning',
    progress: 20,
    deadline: '2025-09-30',
    team: ['최디자이너', '정기획자'],
    priority: 'medium',
    createdAt: '2025-08-10T14:00:00Z',
    updatedAt: '2025-08-23T16:00:00Z',
  },
  {
    id: '3',
    name: '유튜브 콘텐츠 시리즈',
    status: 'completed',
    progress: 100,
    deadline: '2025-08-20',
    team: ['김크리에이터', '이편집자', '박작가'],
    priority: 'low',
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-08-20T18:00:00Z',
  },
];

/**
 * GET /api/projects
 * 프로젝트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 처리
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sort = searchParams.get('sort');
    
    let projects = [...mockProjects];
    
    // 상태 필터링
    if (status && status !== 'all') {
      projects = projects.filter(p => p.status === status);
    }
    
    // 정렬
    if (sort === 'deadline') {
      projects.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (sort === 'progress') {
      projects.sort((a, b) => b.progress - a.progress);
    } else if (sort === 'name') {
      projects.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return NextResponse.json({
      success: true,
      data: projects,
      total: projects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 새 프로젝트 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 유효성 검사
    if (!body.name || !body.deadline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Name and deadline are required',
        },
        { status: 400 }
      );
    }
    
    const newProject = {
      id: String(mockProjects.length + 1),
      name: body.name,
      status: body.status || 'planning',
      progress: 0,
      deadline: body.deadline,
      team: body.team || [],
      priority: body.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockProjects.push(newProject);
    
    return NextResponse.json(
      {
        success: true,
        data: newProject,
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}