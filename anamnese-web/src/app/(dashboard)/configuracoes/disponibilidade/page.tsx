'use client';
import { useEffect, useState } from 'react';
import { api, Usuario } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type Slot   = { dia_semana: number; hora_inicio: string; hora_fim: string; ativo: boolean };
type Bloqueio = { id: string; data_inicio: string; data_fim: string; motivo: string | null };

const GRADE_VAZIA: Slot[] = DIAS.map((_, i) => ({
  dia_semana: i, hora_inicio: '08:00', hora_fim: '18:00', ativo: i >= 1 && i <= 5,
}));

function fmtData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
}

export default function DisponibilidadePage() {
  const eu      = obterUsuario();
  const isAdmin = eu?.papel === 'admin';

  const [profissionais,  setProfissionais]  = useState<Usuario[]>([]);
  const [profSelecionado, setProfSelecionado] = useState(eu?.usuario_id || '');
  const [grade,          setGrade]          = useState<Slot[]>(GRADE_VAZIA);
  const [bloqueios,      setBloqueios]      = useState<Bloqueio[]>([]);

  const [novoBloqInicio, setNovoBloqInicio] = useState('');
  const [novoBloqFim,    setNovoBloqFim]    = useState('');
  const [novoBloqMotivo, setNovoBloqMotivo] = useState('');

  const [loading,  setLoading]  = useState(false);
  const [sucesso,  setSucesso]  = useState('');
  const [erro,     setErro]     = useState('');

  useEffect(() => {
    if (isAdmin) {
      api.get<Usuario[]>('/usuarios').then(setProfissionais).catch(() => null);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!profSelecionado) return;
    const qs = isAdmin ? `?profissional_id=${profSelecionado}` : '';
    api.get<{ grade: Slot[]; bloqueios: Bloqueio[] }>(`/disponibilidade${qs}`)
      .then(({ grade: g, bloqueios: b }) => {
        const base = GRADE_VAZIA.map(d => {
          const salvo = g.find(s => s.dia_semana === d.dia_semana);
          return salvo ? { ...d, ...salvo, ativo: true } : { ...d, ativo: false };
        });
        setGrade(base);
        setBloqueios(b);
      })
      .catch(() => null);
  }, [profSelecionado, isAdmin]);

  function atualizarSlot(idx: number, campo: keyof Slot, valor: string | boolean) {
    setGrade(g => g.map((s, i) => i === idx ? { ...s, [campo]: valor } : s));
  }

  async function salvarGrade() {
    setSucesso(''); setErro(''); setLoading(true);
    try {
      await api.put('/disponibilidade/grade', {
        profissional_id: profSelecionado,
        slots: grade,
      });
      setSucesso('Grade salva com sucesso!');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function adicionarBloqueio() {
    if (!novoBloqInicio || !novoBloqFim) return setErro('Informe as datas do bloqueio');
    setErro('');
    try {
      const b = await api.post<Bloqueio>('/disponibilidade/bloqueios', {
        profissional_id: profSelecionado,
        data_inicio: novoBloqInicio,
        data_fim:    novoBloqFim,
        motivo:      novoBloqMotivo || undefined,
      });
      setBloqueios(bl => [...bl, b]);
      setNovoBloqInicio(''); setNovoBloqFim(''); setNovoBloqMotivo('');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao bloquear');
    }
  }

  async function removerBloqueio(id: string) {
    await api.delete(`/disponibilidade/bloqueios/${id}`);
    setBloqueios(bl => bl.filter(b => b.id !== id));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">Disponibilidade</h1>
      <p className="text-stone-400 text-sm mb-8">Configure horários disponíveis para agendamento.</p>

      {/* Seletor de profissional (só admin) */}
      {isAdmin && profissionais.length > 0 && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Profissional</label>
          <select value={profSelecionado} onChange={e => setProfSelecionado(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
            <option value="">Selecione…</option>
            {profissionais.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      )}

      {/* Grade semanal */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Grade semanal</h2>

        <div className="space-y-3">
          {grade.map((slot, idx) => (
            <div key={slot.dia_semana} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-14 cursor-pointer">
                <input type="checkbox" checked={slot.ativo}
                  onChange={e => atualizarSlot(idx, 'ativo', e.target.checked)}
                  className="rounded border-stone-300" />
                <span className={`text-sm font-medium ${slot.ativo ? 'text-stone-700' : 'text-stone-400'}`}>
                  {DIAS[slot.dia_semana]}
                </span>
              </label>

              {slot.ativo ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={slot.hora_inicio}
                    onChange={e => atualizarSlot(idx, 'hora_inicio', e.target.value)}
                    className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
                  <span className="text-stone-400 text-sm">até</span>
                  <input type="time" value={slot.hora_fim}
                    onChange={e => atualizarSlot(idx, 'hora_fim', e.target.value)}
                    className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
                </div>
              ) : (
                <p className="text-sm text-stone-300 flex-1">Indisponível</p>
              )}
            </div>
          ))}
        </div>

        {sucesso && <p className="text-teal-600 text-sm mt-4">{sucesso}</p>}
        {erro    && <p className="text-red-500  text-sm mt-4">{erro}</p>}

        <button onClick={salvarGrade} disabled={loading || !profSelecionado}
          className="mt-5 bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
          {loading ? 'Salvando…' : 'Salvar grade'}
        </button>
      </div>

      {/* Bloqueios */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Bloqueios (férias / folgas)</h2>

        {bloqueios.length > 0 && (
          <div className="mb-4 space-y-2">
            {bloqueios.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm text-stone-700">
                    {fmtData(b.data_inicio)} → {fmtData(b.data_fim)}
                  </p>
                  {b.motivo && <p className="text-xs text-stone-400">{b.motivo}</p>}
                </div>
                <button onClick={() => removerBloqueio(b.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition">Remover</button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">De</label>
              <input type="date" value={novoBloqInicio} onChange={e => setNovoBloqInicio(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Até</label>
              <input type="date" value={novoBloqFim} onChange={e => setNovoBloqFim(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            </div>
          </div>
          <input type="text" value={novoBloqMotivo} onChange={e => setNovoBloqMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          <button onClick={adicionarBloqueio} disabled={!profSelecionado}
            className="bg-stone-100 text-stone-700 rounded-full px-5 py-2 text-sm font-medium hover:bg-stone-200 transition disabled:opacity-50">
            + Adicionar bloqueio
          </button>
        </div>
      </div>
    </div>
  );
}
