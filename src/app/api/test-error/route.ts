import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const errorType = searchParams.get('type')

  switch (errorType) {
    case '400':
      return NextResponse.json(
        { error: 'Bad Request', message: '잘못된 요청입니다.' },
        { status: 400 }
      )
    
    case '401':
      return NextResponse.json(
        { error: 'Unauthorized', message: '인증이 필요합니다.' },
        { status: 401 }
      )
    
    case '403':
      return NextResponse.json(
        { error: 'Forbidden', message: '접근이 거부되었습니다.' },
        { status: 403 }
      )
    
    case '500':
      // Simulate a server error
      throw new Error('Internal Server Error - 서버 내부 오류')
    
    default:
      return NextResponse.json(
        { message: 'Test endpoint working', timestamp: new Date().toISOString() },
        { status: 200 }
      )
  }
}