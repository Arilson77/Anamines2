import { obterToken, removerToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('API não configurada. Contate o suporte.');
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

  if (res.status === 402) {
    window.location.href = '/planos';
    throw new Error('Assinatura expirada');
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

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: 'admin' | 'colaborador';
  criado_em: string;
};

export type Especialidade = {
  id: string;
  nome: string;
  cor: string;
};

export type Procedimento = {
  id: string;
  nome: string;
  especialidade_id: string | null;
  especialidade_nome: string | null;
  duracao_minutos: number;
  requer_preparacao: boolean;
  instrucoes_preparacao: string | null;
  antecedencia_aviso_horas: number;
};

export type Consulta = {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  paciente_telefone: string;
  profissional_id: string;
  profissional_nome: string;
  especialidade_id: string | null;
  especialidade_nome: string | null;
  especialidade_cor: string | null;
  procedimento_id: string | null;
  procedimento_nome: string | null;
  data_hora: string;
  duracao_minutos: number;
  status: 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'faltou';
  requer_preparacao: boolean;
  data_hora_preparacao: string | null;
  observacoes: string | null;
  confirmado_em: string | null;
  precadastro_feito: boolean;
  criado_em: string;
};

export type Ficha = {
  id: string;
  paciente_id: string;
  paciente: string;
  consentimento_lgpd: boolean;
  status: 'rascunho' | 'enviada' | 'arquivada';
  dados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
};
