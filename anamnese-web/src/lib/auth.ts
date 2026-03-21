const TOKEN_KEY = 'anamnese_token';

export function salvarToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obterToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaAutenticado(): boolean {
  const token = obterToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function obterUsuario(): { usuario_id: string; tenant_id: string; papel: string } | null {
  const token = obterToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}
