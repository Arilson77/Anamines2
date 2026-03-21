// ============================================================
// lib/auth.ts — gerencia o token JWT no cliente
// ============================================================

const TOKEN_KEY = 'anamnese_token';

export function salvarToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaAutenticado(): boolean {
  const token = obterToken();
  if (!token) return false;

  try {
    // Decodifica o payload do JWT (sem verificar assinatura — só para checar expiração)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function obterUsuario() {
  const token = obterToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}


// ============================================================
// lib/api.ts — cliente HTTP que envia o token automaticamente
// ============================================================
import { obterToken, removerToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = obterToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Token expirado — desloga
  if (res.status === 401) {
    removerToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.erro || 'Erro na requisição');
  }

  return res.json();
}

// Helpers para cada verbo HTTP
export const api = {
  get:    <T>(path: string) =>
    request<T>(path),

  post:   <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put:    <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

// Tipagens básicas
export type Paciente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criado_em: string;
};

export type Ficha = {
  id: string;
  paciente: string;
  status: 'rascunho' | 'enviada' | 'arquivada';
  dados: Record<string, unknown>;
  criado_em: string;
};
