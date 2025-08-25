import { NextRequest, NextResponse } from 'next/server';

/**
 * Backend API Proxy
 * /api/v1/* 요청을 백엔드 서버로 프록시
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 모든 HTTP 메서드 처리
async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path?.join('/') || '';
    const url = `${BACKEND_URL}/api/v1/${path}`;
    
    // 쿼리 파라미터 추가
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;
    
    // 헤더 준비
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Host 헤더는 제외
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // 요청 바디 처리
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // 바디가 없는 경우 무시
      }
    }
    
    // 백엔드로 요청 전달
    const response = await fetch(fullUrl, {
      method: request.method,
      headers,
      body,
      // 리디렉션 따라가지 않음
      redirect: 'manual',
    });
    
    // 응답 처리
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // CORS 헤더 추가
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const responseBody = await response.text();
    
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Backend proxy error:', error);
    
    // 백엔드 서버가 다운된 경우 Mock 응답 반환
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backend server is not available',
          message: 'The backend server is currently unavailable. Using mock data.',
          timestamp: new Date().toISOString(),
        },
        { 
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 모든 HTTP 메서드 export
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}