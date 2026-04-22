'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Consulta } from '@/lib/api';

const STATUS_OPTS = [
  { value: 'agendada',   label: 'Agendada'   },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'realizada',  label: 'Realizada'  },
  { value: 'faltou',     label: 'Faltou'     },
  { value: 'cancelada',  label: 'Cancelada'  },
];

function fmt(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function ConsultaPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [status,   setStatus]   = useState('');
  const [obs,      setObs]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');
  const [sucesso,  setSucesso]  = useState('');

  useEffect(() => {
    api.get<Consulta>(`/consultas/${id}`).then(c => {
      setConsulta(c);
      setStatus(c.status);
      setObs(c.observacoes || '');
    }).catch(() => router.push('/agenda'));
  }, [id, router]);

  async function salvar() {
    setErro(''); setSucesso(''); setLoading(true);
    try {
      const c = await api.put<Consulta>(`/consultas/${id}`, { status, observacoes: obs });
      setConsulta(c);
      setSucesso('Salvo com sucesso');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function excluir() {
    if (!confirm('Excluir esta consulta? Esta ação não pode ser desfeita.')) return;
    await api.delete(`/consultas/${id}`);
    router.push('/agenda');
  }

  if (!consulta) return <p className="text-stone-400 text-sm">Carregando…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light italic text-stone-800">{consulta.paciente_nome}</h1>
          <p className="text-stone-400 text-sm">{fmt(consulta.data_hora)} · {consulta.duracao_minutos}min</p>
        </div>
        <a href="/agenda" className="text-sm text-stone-400 hover:text-stone-600">← Voltar</a>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Profissional</p>
            <p className="text-stone-700">{consulta.profissional_nome}</p>
          </div>
          {consulta.especialidade_nome && (
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Especialidade</p>
              <p className="text-stone-700">{consulta.especialidade_nome}</p>
            </div>
          )}
          {consulta.procedimento_nome && (
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Procedimento</p>
              <p className="text-stone-700">{consulta.procedimento_nome}</p>
            </div>
          )}
          {consulta.paciente_telefone && (
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Telefone</p>
              <p className="text-stone-700">{consulta.paciente_telefone}</p>
            </div>
          )}
        </div>

        {consulta.requer_preparacao && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            ⚠️ Requer preparação {consulta.data_hora_preparacao ? `— ${fmt(consulta.data_hora_preparacao)}` : ''}
          </div>
        )}

        {consulta.confirmado_em && (
          <p className="text-xs text-teal-600">✓ Confirmado em {fmt(consulta.confirmado_em)}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Observações / Evolução</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={4}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
        </div>

        {erro    && <p className="text-red-500 text-sm">{erro}</p>}
        {sucesso && <p className="text-teal-600 text-sm">{sucesso}</p>}

        <div className="flex items-center justify-between pt-2">
          <button onClick={salvar} disabled={loading}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
          <button onClick={excluir}
            className="text-sm text-red-400 hover:text-red-600 transition">
            Excluir consulta
          </button>
        </div>
      </div>
    </div>
  );
}
