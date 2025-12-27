import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminEnabled } from './lib/admin-access';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminBlocked = !isAdminEnabled();

  if (adminBlocked && (pathname.startsWith('/admin') || pathname.startsWith('/api/v1/admin'))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/admin/:path*'],
};
