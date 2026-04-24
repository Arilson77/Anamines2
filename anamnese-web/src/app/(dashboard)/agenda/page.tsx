'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api, Consulta } from '@/lib/api';

type Modo = 'semana' | 'dia' | 'lista';

const HORA_INICIO = 7;   // 07:00
const HORA_FIM    = 20;  // 20:00
const PX_HORA     = 64;  // pixels por hora

const STATUS_COR: Record<string, string> = {
  agendada:  'bg-blue-100  border-blue-400  text-blue-800',
  confirmada:'bg-teal-100  border-teal-400  text-teal-800',
  cancelada: 'bg-red-100   border-red-400   text-red-700',
  realizada: 'bg-gray-100  border-gray-400  text-gray-600',
  faltou:    'bg-orange-100 border-orange-400 text-orange-700',
};

const DIAS_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES_PT   = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function inicioSemana(d: Date) {
  const r = new Date(d);
  const dia = r.getDay();
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1)); // Segunda
  r.setHours(0,0,0,0);
  return r;
}

function addDias(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function minutosDesde7h(d: Date) {
  return (d.getHours() - HORA_INICIO) * 60 + d.getMinutes();
}

export default function AgendaPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modo,      setModo]      = useState<Modo>('semana');
  const [semanaRef, setSemanaRef] = useState(() => inicioSemana(new Date()));
  const [diaRef,    setDiaRef]    = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });

  // Busca consultas da janela visível
  useEffect(() => {
    let inicio: Date, fim: Date;
    if (modo === 'semana') {
      inicio = new Date(semanaRef);
      fim    = addDias(semanaRef, 6); fim.setHours(23,59,59,999);
    } else if (modo === 'dia') {
      inicio = new Date(diaRef);
      fim    = new Date(diaRef); fim.setHours(23,59,59,999);
    } else {
      inicio = new Date(); inicio.setHours(0,0,0,0);
      fim    = addDias(inicio, 30); fim.setHours(23,59,59,999);
    }
    setLoading(true);
    api.get<Consulta[]>(`/consultas?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
      .then(setConsultas).catch(() => null).finally(() => setLoading(false));
  }, [modo, semanaRef, diaRef]);

  const hoje = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // ── VISTA SEMANA ──────────────────────────────────────────────
  function ViewSemana() {
    const dias = Array.from({ length: 6 }, (_, i) => addDias(semanaRef, i)); // Seg–Sáb
    const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);
    const totalPx = (HORA_FIM - HORA_INICIO) * PX_HORA;

    function consultasDoDia(d: Date) {
      return consultas.filter(c => {
        const cd = new Date(c.data_hora); cd.setHours(0,0,0,0);
        return cd.getTime() === d.getTime();
      });
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Cabeçalho dos dias */}
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}>
          <div className="border-r border-gray-100" />
          {dias.map(d => {
            const ehHoje = d.getTime() === hoje.getTime();
            return (
              <div key={d.toISOString()} className={`text-center py-2 border-r border-gray-100 last:border-r-0 ${ehHoje ? 'bg-teal-50' : ''}`}>
                <p className={`text-xs font-semibold ${ehHoje ? 'text-teal-600' : 'text-gray-500'}`}>
                  {DIAS_ABREV[d.getDay()]}
                </p>
                <p className={`text-lg font-bold ${ehHoje ? 'text-teal-600' : 'text-gray-700'}`}>{d.getDate()}</p>
                <p className="text-xs text-gray-400">{MESES_PT[d.getMonth()]}</p>
              </div>
            );
          })}
        </div>

        {/* Grade de horas */}
        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
          <div className="relative grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)', height: `${totalPx}px` }}>
            {/* Linhas de hora */}
            {horas.map(h => (
              <div key={h} className="absolute w-full border-t border-gray-100"
                style={{ top: `${(h - HORA_INICIO) * PX_HORA}px` }}>
                <span className="absolute left-1 top-1 text-xs text-gray-400 w-12 text-right pr-2">
                  {String(h).padStart(2,'0')}:00
                </span>
              </div>
            ))}

            {/* Colunas dos dias */}
            {dias.map((d, ci) => {
              const lista = consultasDoDia(d);
              return (
                <div key={d.toISOString()}
                  className="relative border-r border-gray-100 last:border-r-0"
                  style={{ gridColumn: ci + 2, gridRow: 1 }}>
                  {lista.map(c => {
                    const start   = new Date(c.data_hora);
                    const minutos = minutosDesde7h(start);
                    if (minutos < 0 || minutos > (HORA_FIM - HORA_INICIO) * 60) return null;
                    const top    = (minutos / 60) * PX_HORA;
                    const height = Math.max((c.duracao_minutos / 60) * PX_HORA, 24);
                    const cls    = STATUS_COR[c.status] ?? 'bg-gray-100 border-gray-400 text-gray-600';
                    return (
                      <Link key={c.id} href={`/agenda/${c.id}`}
                        className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1.5 py-0.5 overflow-hidden cursor-pointer hover:brightness-95 transition ${cls}`}
                        style={{ top: `${top}px`, height: `${height}px` }}>
                        <p className="text-xs font-semibold leading-tight truncate">{fmtHora(c.data_hora)}</p>
                        <p className="text-xs leading-tight truncate">{c.paciente_nome}</p>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA DIA ─────────────────────────────────────────────────
  function ViewDia() {
    const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);
    const totalPx = (HORA_FIM - HORA_INICIO) * PX_HORA;
    const listaDia = consultas.filter(c => {
      const cd = new Date(c.data_hora); cd.setHours(0,0,0,0);
      return cd.getTime() === diaRef.getTime();
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: '640px' }}>
          <div className="relative flex" style={{ height: `${totalPx}px` }}>
            {/* Horas */}
            <div className="w-14 flex-shrink-0 border-r border-gray-100 relative">
              {horas.map(h => (
                <div key={h} className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(h - HORA_INICIO) * PX_HORA}px` }}>
                  <span className="text-xs text-gray-400 absolute right-2 top-1">
                    {String(h).padStart(2,'0')}:00
                  </span>
                </div>
              ))}
            </div>
            {/* Eventos */}
            <div className="relative flex-1">
              {horas.map(h => (
                <div key={h} className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(h - HORA_INICIO) * PX_HORA}px` }} />
              ))}
              {listaDia.map(c => {
                const start   = new Date(c.data_hora);
                const minutos = minutosDesde7h(start);
                if (minutos < 0) return null;
                const top    = (minutos / 60) * PX_HORA;
                const height = Math.max((c.duracao_minutos / 60) * PX_HORA, 28);
                const cls    = STATUS_COR[c.status] ?? 'bg-gray-100 border-gray-400 text-gray-600';
                return (
                  <Link key={c.id} href={`/agenda/${c.id}`}
                    className={`absolute left-2 right-2 rounded border-l-4 px-3 py-1 overflow-hidden hover:brightness-95 transition ${cls}`}
                    style={{ top: `${top}px`, height: `${height}px` }}>
                    <p className="text-xs font-bold">{fmtHora(c.data_hora)} · {c.duracao_minutos}min</p>
                    <p className="text-sm font-medium truncate">{c.paciente_nome}</p>
                    <p className="text-xs truncate opacity-70">{c.profissional_nome}</p>
                  </Link>
                );
              })}
              {listaDia.length === 0 && (
                <p className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Nenhuma consulta neste dia
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA LISTA ───────────────────────────────────────────────
  function ViewLista() {
    const agrupadas = consultas.reduce<Record<string, Consulta[]>>((acc, c) => {
      const d  = new Date(c.data_hora);
      const key = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    if (consultas.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Nenhuma consulta nos próximos 30 dias.</p>
          <Link href="/agenda/nova" className="text-teal-600 underline text-sm mt-2 inline-block">Agendar agora</Link>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {Object.entries(agrupadas).map(([dia, lista]) => (
          <div key={dia}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 capitalize">{dia}</p>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {lista.map((c, idx) => {
                const cls = STATUS_COR[c.status] ?? 'bg-gray-100 border-gray-400 text-gray-600';
                return (
                  <Link key={c.id} href={`/agenda/${c.id}`}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-sm font-bold text-gray-700">{fmtHora(c.data_hora)}</p>
                      <p className="text-xs text-gray-400">{c.duracao_minutos}min</p>
                    </div>
                    {c.especialidade_cor && (
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.especialidade_cor }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.paciente_nome}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {c.profissional_nome}{c.especialidade_nome ? ` · ${c.especialidade_nome}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${cls}`}>
                      {c.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Navegação semana/dia
  function navSemana(n: number) { setSemanaRef(d => addDias(d, n * 7)); }
  function navDia(n: number)    { setDiaRef(d => addDias(d, n)); }

  const labelSemana = `${semanaRef.getDate()} ${MESES_PT[semanaRef.getMonth()]} – ${addDias(semanaRef,5).getDate()} ${MESES_PT[addDias(semanaRef,5).getMonth()]}`;
  const labelDia    = diaRef.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        {/* Seletor de modo */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          {(['semana','dia','lista'] as Modo[]).map(m => (
            <button key={m} onClick={() => setModo(m)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                modo === m ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {m === 'semana' ? 'Semana' : m === 'dia' ? 'Dia' : 'Lista'}
            </button>
          ))}
        </div>

        {/* Navegação */}
        {modo !== 'lista' && (
          <div className="flex items-center gap-2">
            <button onClick={() => modo === 'semana' ? navSemana(-1) : navDia(-1)}
              className="w-8 h-8 rounded border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600">‹</button>
            <button onClick={() => { modo === 'semana' ? setSemanaRef(inicioSemana(new Date())) : setDiaRef(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }); }}
              className="px-3 h-8 rounded border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-600 font-medium">Hoje</button>
            <button onClick={() => modo === 'semana' ? navSemana(1) : navDia(1)}
              className="w-8 h-8 rounded border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600">›</button>
            <span className="text-sm text-gray-600 font-medium capitalize ml-1">
              {modo === 'semana' ? labelSemana : labelDia}
            </span>
          </div>
        )}

        <Link href="/agenda/nova"
          className="ml-auto bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-1">
          + Nova consulta
        </Link>
      </div>

      {loading && <p className="text-gray-400 text-sm text-center py-12">Carregando…</p>}

      {!loading && (
        modo === 'semana' ? <ViewSemana /> :
        modo === 'dia'    ? <ViewDia />    :
                            <ViewLista />
      )}
    </div>
  );
}
