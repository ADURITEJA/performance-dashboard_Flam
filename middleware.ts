import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add security headers
  requestHeaders.set('X-Content-Type-Options', 'nosniff');
  requestHeaders.set('X-Frame-Options', 'DENY');
  requestHeaders.set('X-XSS-Protection', '1; mode=block');
  requestHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add performance headers for static assets
  if (request.nextUrl.pathname.match(/\.(js|css|woff|woff2|eot|ttf|otf)$/)) {
    requestHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add CSP header in production
  if (process.env.NODE_ENV === 'production') {
    requestHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.google-analytics.com;"
    );
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
