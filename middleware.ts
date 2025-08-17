import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 * AppRoute.js를 대체하여 라우트 보호 기능을 제공합니다.
 */

// 보호된 라우트 목록 (인증이 필요한 페이지)
const protectedRoutes = [
  '/calendar',
  '/projects',
  '/feedback',
  '/planning',
  '/elearning',
  '/cms',
  '/dashboard',
  '/settings',
];

// 인증 라우트 목록 (로그인한 사용자가 접근하면 안 되는 페이지)
const authRoutes = [
  '/login',
  '/signup',
  '/reset-password',
];

// 공개 라우트 목록 (인증 없이 접근 가능)
const publicRoutes = [
  '/',
  '/privacy',
  '/terms',
  '/about',
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // 데모 모드 확인
  const isDemoMode = searchParams.get('demo') === 'true';
  
  // 인증 쿠키 확인 (우선순위: vridge_session > VGID > token > Authorization header)
  const vridgeSessionCookie = request.cookies.get('vridge_session')?.value;
  const vgidCookie = request.cookies.get('VGID')?.value;
  const demoSessionCookie = request.cookies.get('demo_session')?.value;
  const token = vridgeSessionCookie ||
                vgidCookie || 
                request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // 토큰 검증 (데모 모드이거나 정상 인증이 있는 경우)
  const isAuthenticated = Boolean(token) || (isDemoMode || Boolean(demoSessionCookie));

  // 보호된 라우트 체크
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 인증 라우트 체크
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 공개 라우트 체크
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // 1. 보호된 라우트에 인증 없이 접근하는 경우
  if (isProtectedRoute && !isAuthenticated) {
    // 데모 모드인 경우 데모 세션 쿠키 설정하고 계속 진행
    if (isDemoMode) {
      const response = NextResponse.next();
      response.cookies.set('demo_session', 'true', {
        maxAge: 60 * 60 * 2, // 2시간
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return response;
    }
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. 인증된 사용자가 로그인/회원가입 페이지에 접근하는 경우
  // VGID 쿠키가 있으면 이미 로그인한 상태로 간주
  if (isAuthRoute && isAuthenticated) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const redirectUrl = returnUrl || '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 3. API 라우트 보호 (선택사항)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // 4. 정적 파일 및 Next.js 내부 파일 처리
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 5. 라우트 재작성 규칙 (AppRoute.js의 라우팅 규칙을 middleware로 이전)
  const routeRewriteMap: Record<string, string> = {
    '/CmsHome': '/dashboard',
    '/Calendar': '/calendar',
    '/ProjectCreate': '/projects/create',
    '/ProjectView': '/projects',
    '/Feedback': '/feedback',
    '/Elearning': '/elearning',
    '/Login': '/login',
    '/Signup': '/signup',
    '/ResetPw': '/reset-password',
    '/Privacy': '/privacy',
    '/Terms': '/terms',
    '/EmailCheck': '/email-check',
    '/FeedbackAll': '/feedback',
  };

  // 기존 라우트 패턴을 새로운 Next.js App Router 패턴으로 재작성
  for (const [oldRoute, newRoute] of Object.entries(routeRewriteMap)) {
    if (pathname.startsWith(oldRoute)) {
      const dynamicPart = pathname.slice(oldRoute.length);
      return NextResponse.redirect(new URL(newRoute + dynamicPart, request.url));
    }
  }

  // 동적 라우트 재작성
  // /ProjectEdit/:project_id -> /projects/:project_id/edit
  const projectEditMatch = pathname.match(/^\/ProjectEdit\/(.+)$/);
  if (projectEditMatch) {
    const projectId = projectEditMatch[1];
    return NextResponse.redirect(new URL(`/projects/${projectId}/edit`, request.url));
  }

  // /ProjectView/:project_id -> /projects/:project_id/view
  const projectViewMatch = pathname.match(/^\/ProjectView\/(.+)$/);
  if (projectViewMatch) {
    const projectId = projectViewMatch[1];
    return NextResponse.redirect(new URL(`/projects/${projectId}/view`, request.url));
  }

  // /Feedback/:project_id -> /feedback/:project_id
  const feedbackMatch = pathname.match(/^\/Feedback\/(.+)$/);
  if (feedbackMatch) {
    const projectId = feedbackMatch[1];
    return NextResponse.redirect(new URL(`/feedback/${projectId}`, request.url));
  }

  return NextResponse.next();
}

// Middleware가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청 경로에서 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 확장자가 있는 파일들 (이미지, 폰트 등)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};