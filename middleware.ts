import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next()

  // Default Security Headers
  const isPublicFeedback = request.nextUrl.pathname.startsWith('/feedback/public/')
  
  const securityHeaders = {
    // Content Security Policy - 보안 강화 (public feedback은 다르게 설정)
    'Content-Security-Policy': isPublicFeedback ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: data:",
      "connect-src 'self'",
      "frame-ancestors 'self' https:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ') : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: data:",
      "connect-src 'self' https://vercel.live wss://vercel.live",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests"
    ].join('; '),

    // X-Frame-Options - 클릭재킹 방지 (public feedback은 더 관대)
    'X-Frame-Options': isPublicFeedback ? 'SAMEORIGIN' : 'DENY',

    // X-Content-Type-Options - MIME 타입 스니핑 방지
    'X-Content-Type-Options': 'nosniff',

    // Referrer Policy - 리퍼러 정보 제한
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // X-XSS-Protection - XSS 공격 방지 (레거시 브라우저 지원)
    'X-XSS-Protection': '1; mode=block',

    // Strict Transport Security - HTTPS 강제
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Permissions Policy - 브라우저 기능 제한
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),

    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'cross-origin',

    // Remove potentially revealing headers
    'X-Powered-By': '',
    'Server': 'VideoPlanet'
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (key === 'X-Powered-By') {
      // Remove X-Powered-By header
      response.headers.delete(key)
    } else {
      response.headers.set(key, value)
    }
  })

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      const corsResponse = new Response(null, { status: 200 })
      corsResponse.headers.set('Access-Control-Allow-Origin', '*')
      corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      corsResponse.headers.set('Access-Control-Max-Age', '86400')
      return corsResponse
    }

    // Set CORS headers for actual requests
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Public feedback routes already handled above with conditional logic

  // Rate limiting headers (informational)
  response.headers.set('X-RateLimit-Limit', '1000')
  response.headers.set('X-RateLimit-Remaining', '999')
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}