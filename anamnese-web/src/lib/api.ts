import { obterToken, removerToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = obterToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    removerToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error((erro as { erro?: string }).erro || 'Erro na requisição');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
};

export type Paciente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  consentimento_lgpd: boolean;
  criado_em: string;
};

export type Ficha = {
  id: string;
  paciente_id: string;
  paciente: string;
  status: 'rascunho' | 'enviada' | 'arquivada';
  dados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
};
