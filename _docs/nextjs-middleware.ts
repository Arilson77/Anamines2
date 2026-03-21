// middleware.ts — fica na raiz do projeto (fora de src/)
// Roda no Edge antes de qualquer página carregar

import { NextRequest, NextResponse } from 'next/server';

// Rotas que NÃO precisam de login
const ROTAS_PUBLICAS = ['/login', '/cadastro'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deixa passar rotas públicas e assets
  if (
    ROTAS_PUBLICAS.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Verifica o token salvo no cookie
  // (no login salvamos o token tanto no localStorage quanto num cookie httpOnly)
  const token = req.cookies.get('anamnese_token')?.value;

  if (!token) {
    // Redireciona para login guardando a rota de destino
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware apenas nas rotas do dashboard
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
