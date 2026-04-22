'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, Paciente, Usuario, Especialidade, Procedimento } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

type SlotsResp = { slots: string[]; bloqueado: boolean };

export default function NovaConsultaPage() {
  const router  = useRouter();
  const eu      = obterUsuario();
  const isAdmin = eu?.papel === 'admin';

  const [pacientes,      setPacientes]      = useState<Paciente[]>([]);
  const [profissionais,  setProfissionais]  = useState<Usuario[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [procedimentos,  setProcedimentos]  = useState<Procedimento[]>([]);

  const [pacienteId,      setPacienteId]      = useState('');
  const [profissionalId,  setProfissionalId]  = useState(eu?.usuario_id || '');
  const [especialidadeId, setEspecialidadeId] = useState('');
  const [procedimentoId,  setProcedimentoId]  = useState('');
  const [duracao,         setDuracao]         = useState(50);
  const [requerPrep,      setRequerPrep]      = useState(false);
  const [dataPrep,        setDataPrep]        = useState('');
  const [observacoes,     setObservacoes]     = useState('');

  // seleção de data + slot
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [slots,           setSlots]           = useState<string[]>([]);
  const [bloqueado,       setBloqueado]       = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState('');
  const [buscandoSlots,   setBuscandoSlots]   = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(() => null);
    api.get<Especialidade[]>('/especialidades').then(setEspecialidades).catch(() => null);
    if (isAdmin) {
      api.get<Usuario[]>('/usuarios').then(us => {
        setProfissionais(us);
        if (!profissionalId && us.length) setProfissionalId(us[0].id);
      }).catch(() => null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    const qs = especialidadeId ? `?especialidade_id=${especialidadeId}` : '';
    api.get<Procedimento[]>(`/procedimentos${qs}`).then(setProcedimentos).catch(() => null);
  }, [especialidadeId]);

  // Busca slots disponíveis sempre que muda data, profissional ou duração
  useEffect(() => {
    if (!dataSelecionada || !profissionalId) { setSlots([]); setSlotSelecionado(''); return; }
    setBuscandoSlots(true);
    setSlotSelecionado('');
    api.get<SlotsResp>(
      `/disponibilidade/slots?profissional_id=${profissionalId}&data=${dataSelecionada}&duracao=${duracao}`
    ).then(r => {
      setSlots(r.slots);
      setBloqueado(r.bloqueado);
    }).catch(() => { setSlots([]); setBloqueado(false); })
     .finally(() => setBuscandoSlots(false));
  }, [dataSelecionada, profissionalId, duracao]);

  function onProcedimentoChange(id: string) {
    setProcedimentoId(id);
    const proc = procedimentos.find(p => p.id === id);
    if (proc) {
      setDuracao(proc.duracao_minutos);
      setRequerPrep(proc.requer_preparacao);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (!pacienteId)      return setErro('Selecione um paciente');
    if (!dataSelecionada) return setErro('Selecione uma data');
    if (!slotSelecionado) return setErro('Selecione um horário disponível');
    setLoading(true);
    try {
      const dataHoraISO = new Date(`${dataSelecionada}T${slotSelecionado}:00`).toISOString();
      await api.post('/consultas', {
        paciente_id:          pacienteId,
        profissional_id:      profissionalId || undefined,
        especialidade_id:     especialidadeId || undefined,
        procedimento_id:      procedimentoId  || undefined,
        data_hora:            dataHoraISO,
        duracao_minutos:      duracao,
        requer_preparacao:    requerPrep,
        data_hora_preparacao: requerPrep && dataPrep ? new Date(dataPrep).toISOString() : undefined,
        observacoes:          observacoes || undefined,
      });
      router.push('/agenda');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar consulta');
    } finally {
      setLoading(false);
    }
  }

  // data mínima = hoje
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">Nova consulta</h1>
      <p className="text-stone-400 text-sm mb-8">Agende um atendimento.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">

        {/* Paciente */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Paciente *</label>
          <select value={pacienteId} onChange={e => setPacienteId(e.target.value)} required
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
            <option value="">Selecione…</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        {/* Profissional (só admin) */}
        {isAdmin && profissionais.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Profissional</label>
            <select value={profissionalId} onChange={e => { setProfissionalId(e.target.value); setSlotSelecionado(''); }}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
              <option value="">Selecione…</option>
              {profissionais.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
        )}

        {/* Especialidade + Procedimento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Especialidade</label>
            <select value={especialidadeId} onChange={e => setEspecialidadeId(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
              <option value="">Todas</option>
              {especialidades.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Procedimento</label>
            <select value={procedimentoId} onChange={e => onProcedimentoChange(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
              <option value="">Nenhum</option>
              {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Duração */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Duração (min)</label>
            <input type="number" value={duracao} onChange={e => setDuracao(Number(e.target.value))} min={5} max={480}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
        </div>

        {/* Seleção de data */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Data da consulta *</label>
          <input type="date" value={dataSelecionada} min={hoje}
            onChange={e => { setDataSelecionada(e.target.value); setSlotSelecionado(''); }}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
        </div>

        {/* Slots disponíveis */}
        {dataSelecionada && (
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Horários disponíveis
              {slotSelecionado && <span className="ml-2 text-teal-600 normal-case font-normal">· {slotSelecionado} selecionado</span>}
            </label>

            {buscandoSlots && (
              <p className="text-stone-400 text-sm">Verificando disponibilidade…</p>
            )}

            {!buscandoSlots && bloqueado && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                Este profissional está bloqueado nesta data (férias ou folga).
              </div>
            )}

            {!buscandoSlots && !bloqueado && slots.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                Nenhum horário disponível nesta data. Verifique a grade de disponibilidade ou escolha outra data.
              </div>
            )}

            {!buscandoSlots && slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slots.map(slot => (
                  <button key={slot} type="button" onClick={() => setSlotSelecionado(slot)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      slotSelecionado === slot
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preparação */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={requerPrep} onChange={e => setRequerPrep(e.target.checked)}
              className="rounded border-stone-300" />
            <span className="text-sm text-stone-700">Requer preparação prévia</span>
          </label>
        </div>

        {requerPrep && (
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Data/hora da preparação</label>
            <input type="datetime-local" value={dataPrep} onChange={e => setDataPrep(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            <p className="text-xs text-stone-400 mt-1">O paciente receberá lembrete 24h antes desta data.</p>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !slotSelecionado}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Agendando…' : 'Agendar consulta'}
          </button>
          <a href="/agenda" className="px-6 py-2.5 text-sm text-stone-500 hover:text-stone-700 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
