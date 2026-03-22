'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type Status = {
  plano: string;
  status: string;
  trial_termina_em: string;
  assinatura_termina_em: string | null;
  dias_restantes: number | null;
};

const LABELS: Record<string, string> = {
  trial:    'Trial gratuito',
  ativa:    'Ativa',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
};

const CORES: Record<string, string> = {
  trial:    'bg-amber-50 text-amber-700 border-amber-200',
  ativa:    'bg-teal-50 text-teal-700 border-teal-200',
  expirada: 'bg-red-50 text-red-700 border-red-200',
  cancelada:'bg-stone-100 text-stone-500 border-stone-200',
};

export default function AssinaturaPage() {
  const [status, setStatus]   = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const sucesso = params.get('sucesso');

  useEffect(() => {
    api.get<Status>('/cobranca/status').then(setStatus).catch(console.error);
  }, []);

  async function abrirPortal() {
    setLoading(true);
    try {
      const { url } = await api.post<{ url: string }>('/cobranca/portal', {});
      window.location.href = url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao abrir portal');
    } finally {
      setLoading(false);
    }
  }

  if (!status) return <p className="text-stone-400 text-sm">Carregando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-light italic text-stone-800 mb-8">Assinatura</h1>

      {sucesso && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-3 mb-6 text-sm">
          Assinatura ativada com sucesso! Bem-vindo ao plano {status.plano}.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Plano atual</span>
          <span className="text-sm font-semibold capitalize text-stone-800">{status.plano}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Status</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CORES[status.status] ?? CORES.cancelada}`}>
            {LABELS[status.status] ?? status.status}
          </span>
        </div>

        {status.status === 'trial' && status.dias_restantes !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Trial encerra em</span>
            <span className="text-sm text-amber-600 font-semibold">
              {status.dias_restantes} {status.dias_restantes === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        )}

        {status.assinatura_termina_em && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Próxima cobrança</span>
            <span className="text-sm text-stone-600">
              {new Date(status.assinatura_termina_em).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {(status.status === 'expirada' || status.status === 'trial') && (
          <a href="/planos"
            className="block text-center w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium hover:bg-stone-700 transition">
            {status.status === 'expirada' ? 'Renovar assinatura' : 'Ver planos e assinar'}
          </a>
        )}

        {status.status === 'ativa' && (
          <button onClick={abrirPortal} disabled={loading}
            className="w-full border border-stone-300 text-stone-700 rounded-full py-3 text-sm font-medium hover:bg-stone-100 transition disabled:opacity-50">
            {loading ? 'Abrindo portal…' : 'Gerenciar assinatura'}
          </button>
        )}
      </div>
    </div>
  );
}
