'use client';
import { useEffect, useState } from 'react';
import { api, Consulta, Paciente, Ficha } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDia(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

const STATUS_CLS: Record<string, string> = {
  agendada:  'bg-blue-100 text-blue-700',
  confirmada:'bg-teal-100 text-teal-700',
  cancelada: 'bg-red-100 text-red-500',
  realizada: 'bg-stone-100 text-stone-500',
  faltou:    'bg-orange-100 text-orange-600',
};

export default function DashboardPage() {
  const usuario = obterUsuario();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [fichas,    setFichas]    = useState<Ficha[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);

  useEffect(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const fim  = new Date(hoje); fim.setDate(hoje.getDate() + 7); fim.setHours(23, 59, 59, 999);

    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(() => null);
    api.get<Ficha[]>('/fichas').then(setFichas).catch(() => null);
    api.get<Consulta[]>(`/consultas?inicio=${hoje.toISOString()}&fim=${fim.toISOString()}`)
      .then(setConsultas).catch(() => null);
  }, []);

  const inicioMes   = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const hojeInicio  = new Date(); hojeInicio.setHours(0, 0, 0, 0);
  const hojeStr     = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const consultasHoje   = consultas.filter(c => new Date(c.data_hora) >= hojeInicio && new Date(c.data_hora) < new Date(hojeInicio.getTime() + 86400000));
  const proximasSemana  = consultas.filter(c => new Date(c.data_hora) >= new Date(hojeInicio.getTime() + 86400000));

  const cards = [
    { label: 'Pacientes',        valor: pacientes.length,                                              cor: 'bg-teal-50 border-teal-200'   },
    { label: 'Consultas hoje',   valor: consultasHoje.length,                                          cor: 'bg-sky-50 border-sky-200'     },
    { label: 'Fichas este mês',  valor: fichas.filter(f => new Date(f.criado_em) >= inicioMes).length, cor: 'bg-stone-50 border-stone-200' },
    { label: 'LGPD pendente',    valor: pacientes.filter(p => !p.consentimento_lgpd).length,           cor: 'bg-amber-50 border-amber-200' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">
        Olá{usuario?.nome ? `, ${usuario.nome.split(' ')[0]}` : ''}
      </h1>
      <p className="text-stone-400 text-sm mb-8 capitalize">{hojeStr}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`rounded-2xl border p-5 ${c.cor}`}>
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">{c.label}</p>
            <p className="text-4xl font-light text-stone-800">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoje */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Hoje</h2>
            <a href="/agenda" className="text-xs text-stone-400 hover:text-stone-600">Ver agenda →</a>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {consultasHoje.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-8">Nenhuma consulta hoje.</p>
            ) : consultasHoje.map((c, i) => (
              <a key={c.id} href={`/agenda/${c.id}`}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                <div className="w-10 text-center flex-shrink-0">
                  <p className="text-sm font-semibold text-stone-800">{fmtHora(c.data_hora)}</p>
                  <p className="text-xs text-stone-400">{c.duracao_minutos}min</p>
                </div>
                {c.especialidade_cor && (
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: c.especialidade_cor }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{c.paciente_nome}</p>
                  <p className="text-xs text-stone-400 truncate">{c.profissional_nome}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_CLS[c.status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {c.status}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Próximos 7 dias */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Próximos 7 dias</h2>
            <a href="/agenda/nova" className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-full transition">+ Nova consulta</a>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {proximasSemana.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-8">Sem consultas agendadas.</p>
            ) : proximasSemana.slice(0, 6).map((c, i) => (
              <a key={c.id} href={`/agenda/${c.id}`}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-xs font-semibold text-stone-600 capitalize">{fmtDia(c.data_hora)}</p>
                  <p className="text-xs text-stone-400">{fmtHora(c.data_hora)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{c.paciente_nome}</p>
                  <p className="text-xs text-stone-400 truncate">{c.especialidade_nome ?? c.profissional_nome}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_CLS[c.status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {c.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
