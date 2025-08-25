import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Mock data for development
const mockStats = {
  inProgress: 5,
  completed: 12,
  thisMonth: 3
};

// ETag 생성 함수
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

export async function GET(request: Request) {
  try {
    // ETag 확인
    const etag = generateETag(mockStats);
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
    
    // Simulate optimized network delay (reduced from 200ms)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return NextResponse.json(mockStats, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'ETag': etag,
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600', // 5분 캐시
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Response-Time': '50ms',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
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