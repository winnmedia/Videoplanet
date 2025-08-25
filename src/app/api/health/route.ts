import { NextResponse } from 'next/server';

/**
 * Health Check API
 * 서버 상태를 확인하는 엔드포인트
 */
export async function GET() {
  try {
    // 시스템 상태 체크
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'VideoplanetFrontend',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        unit: 'MB'
      },
      checks: {
        api: true,
        database: 'mock', // 실제 DB 연결 시 체크
        cache: 'mock',     // Redis 연결 시 체크
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}