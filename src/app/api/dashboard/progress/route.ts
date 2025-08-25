import { NextRequest, NextResponse } from 'next/server';

// Mock project progress data
const mockProgress = [
  {
    id: '1',
    name: '서울 패션위크 2024',
    progress: 75,
    status: 'on_track',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    phase: 'editing',
  },
  {
    id: '2',
    name: '제품 홍보 영상 - 삼성전자',
    progress: 45,
    status: 'delayed',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    phase: 'shooting',
  },
  {
    id: '3',
    name: '다큐멘터리 - 한국의 맛',
    progress: 90,
    status: 'on_track',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    phase: 'review',
  },
  {
    id: '4',
    name: '뮤직비디오 - 아이유',
    progress: 30,
    status: 'on_track',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    phase: 'planning',
  },
  {
    id: '5',
    name: '기업 소개 영상 - LG',
    progress: 100,
    status: 'completed',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    phase: 'review',
  },
];

// ETag 생성 함수
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

export async function GET(request: NextRequest) {
  try {
    // 페이지네이션 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockProgress.slice(startIndex, endIndex);

    const response = {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: mockProgress.length,
        totalPages: Math.ceil(mockProgress.length / limit),
        hasNext: endIndex < mockProgress.length,
        hasPrev: page > 1,
      },
    };

    // ETag 확인
    const etag = generateETag(response);
    const ifNoneMatch = request.headers.get('if-none-match');
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      });
    }
    
    // Simulate optimized network delay
    await new Promise(resolve => setTimeout(resolve, 30));
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'ETag': etag,
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Response-Time': '30ms',
        'X-Total-Count': mockProgress.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project progress' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'Not implemented in mock API' },
    { status: 501 }
  );
}
