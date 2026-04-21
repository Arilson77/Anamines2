import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ROTAS_PUBLICAS = ['/login', '/cadastro', '/consentimento', '/planos', '/esqueci-senha', '/redefinir-senha', '/aceitar-convite'];

function redirecionarLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
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
    return redirecionarLogin(req);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token inválido, adulterado ou expirado — redireciona para login
    return redirecionarLogin(req);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
