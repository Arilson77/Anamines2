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
  realizada: 'bg-gray-100 text-gray-500',
  faltou:    'bg-orange-100 text-orange-600',
};

const CARDS = [
  { label: 'Pacientes',       cor: 'text-teal-600',   bg: 'bg-white', icone: '👥' },
  { label: 'Consultas hoje',  cor: 'text-blue-500',   bg: 'bg-white', icone: '📅' },
  { label: 'Fichas este mês', cor: 'text-purple-500', bg: 'bg-white', icone: '📋' },
  { label: 'LGPD pendente',   cor: 'text-orange-500', bg: 'bg-white', icone: '⚠️' },
];

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

  const inicioMes  = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0);

  const consultasHoje  = consultas.filter(c => new Date(c.data_hora) >= hojeInicio && new Date(c.data_hora) < new Date(hojeInicio.getTime() + 86400000));
  const proximasSemana = consultas.filter(c => new Date(c.data_hora) >= new Date(hojeInicio.getTime() + 86400000));

  const valores = [
    pacientes.length,
    consultasHoje.length,
    fichas.filter(f => new Date(f.criado_em) >= inicioMes).length,
    pacientes.filter(p => !p.consentimento_lgpd).length,
  ];

  return (
    <div>
      <p className="text-gray-500 text-sm mb-6">
        Bem-vindo{usuario?.nome ? `, ${usuario.nome.split(' ')[0]}` : ''}! Aqui está o resumo do dia.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map((c, i) => (
          <div key={c.label} className={`${c.bg} rounded-lg border border-gray-200 p-5 relative overflow-hidden shadow-sm`}>
            <div className="absolute right-3 top-3 text-4xl opacity-10 select-none">{c.icone}</div>
            <p className={`text-4xl font-bold ${c.cor}`}>{valores[i]}</p>
            <p className={`text-sm font-medium mt-1 ${c.cor}`}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoje */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Consultas de Hoje</h2>
            <a href="/agenda" className="text-xs text-teal-600 hover:underline">Ver agenda →</a>
          </div>
          {consultasHoje.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Nenhuma consulta hoje.</p>
          ) : consultasHoje.map((c, i) => (
            <a key={c.id} href={`/agenda/${c.id}`}
              className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="w-10 text-center flex-shrink-0">
                <p className="text-sm font-semibold text-gray-700">{fmtHora(c.data_hora)}</p>
                <p className="text-xs text-gray-400">{c.duracao_minutos}min</p>
              </div>
              {c.especialidade_cor && (
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: c.especialidade_cor }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.paciente_nome}</p>
                <p className="text-xs text-gray-400 truncate">{c.profissional_nome}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_CLS[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {c.status}
              </span>
            </a>
          ))}
        </div>

        {/* Próximos 7 dias */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Próximos 7 dias</h2>
            <a href="/agenda/nova" className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded transition">+ Nova consulta</a>
          </div>
          {proximasSemana.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sem consultas agendadas.</p>
          ) : proximasSemana.slice(0, 6).map((c, i) => (
            <a key={c.id} href={`/agenda/${c.id}`}
              className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="w-14 text-center flex-shrink-0">
                <p className="text-xs font-semibold text-gray-600 capitalize">{fmtDia(c.data_hora)}</p>
                <p className="text-xs text-gray-400">{fmtHora(c.data_hora)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.paciente_nome}</p>
                <p className="text-xs text-gray-400 truncate">{c.especialidade_nome ?? c.profissional_nome}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_CLS[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {c.status}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
