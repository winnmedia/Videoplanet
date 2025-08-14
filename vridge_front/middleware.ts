import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 인증이 필요한 경로 정의
  const protectedPaths = [
    '/calendar',
    '/cms-home',
    '/project',
    '/feedback',
    '/elearning',
    '/feedback-all'
  ]
  
  const { pathname } = request.nextUrl
  
  // 보호된 경로 체크
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    // 토큰 체크 (localStorage는 서버에서 접근 불가하므로 쿠키 사용)
    const token = request.cookies.get('access_token')
    
    if (!token) {
      // 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}