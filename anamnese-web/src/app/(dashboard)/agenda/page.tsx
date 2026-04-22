'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Consulta } from '@/lib/api';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  agendada:  { label: 'Agendada',  cls: 'bg-blue-100 text-blue-700' },
  confirmada:{ label: 'Confirmada',cls: 'bg-teal-100 text-teal-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-600'   },
  realizada: { label: 'Realizada', cls: 'bg-stone-100 text-stone-500'},
  faltou:    { label: 'Faltou',    cls: 'bg-orange-100 text-orange-600'},
};

function fmtDia(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function AgendaPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading]     = useState(true);

  const hoje    = new Date();
  const inicio  = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);
  const fim     = new Date(hoje);
  fim.setDate(hoje.getDate() + 30);
  fim.setHours(23, 59, 59, 999);

  useEffect(() => {
    api.get<Consulta[]>(`/consultas?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
      .then(setConsultas)
      .catch(() => null)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agrupadas = consultas.reduce<Record<string, Consulta[]>>((acc, c) => {
    const dia = fmtDia(c.data_hora);
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(c);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light italic text-stone-800">Agenda</h1>
          <p className="text-stone-400 text-sm">Próximos 30 dias</p>
        </div>
        <Link href="/agenda/nova"
          className="bg-stone-800 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-stone-700 transition">
          + Nova consulta
        </Link>
      </div>

      {loading && <p className="text-stone-400 text-sm text-center py-12">Carregando…</p>}

      {!loading && consultas.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">Nenhuma consulta nos próximos 30 dias.</p>
          <Link href="/agenda/nova" className="text-stone-600 underline text-sm mt-2 inline-block">Agendar agora</Link>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(agrupadas).map(([dia, lista]) => (
          <div key={dia}>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">{dia}</p>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {lista.map((c, idx) => {
                const st = STATUS_LABEL[c.status] ?? { label: c.status, cls: 'bg-stone-100 text-stone-500' };
                return (
                  <Link key={c.id} href={`/agenda/${c.id}`}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition ${idx > 0 ? 'border-t border-stone-100' : ''}`}>
                    <div className="w-12 text-center">
                      <p className="text-lg font-medium text-stone-800">{fmtHora(c.data_hora)}</p>
                      <p className="text-xs text-stone-400">{c.duracao_minutos}min</p>
                    </div>
                    {c.especialidade_cor && (
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.especialidade_cor }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{c.paciente_nome}</p>
                      <p className="text-xs text-stone-400 truncate">
                        {c.profissional_nome} {c.especialidade_nome ? `· ${c.especialidade_nome}` : ''}
                        {c.procedimento_nome  ? ` · ${c.procedimento_nome}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
                    {c.requer_preparacao && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Prep.</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
