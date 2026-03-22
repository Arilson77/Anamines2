import { NextRequest, NextResponse } from 'next/server';

const ROTAS_PUBLICAS = ['/login', '/cadastro', '/consentimento', '/planos'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    ROTAS_PUBLICAS.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('anamnese_token')?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
