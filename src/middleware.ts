import { NextResponse, type NextRequest } from 'next/server';

// ----------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/ACCopen' || pathname === '/ACCopen/') {
    const url = request.nextUrl.clone();
    url.pathname = '/accopen/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
