'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api, Especialidade, Procedimento } from '@/lib/api';

export default function ProcedimentosPage() {
  const [lista,          setLista]          = useState<Procedimento[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [form, setForm] = useState({
    especialidade_id: '', nome: '', duracao_minutos: 50,
    requer_preparacao: false, instrucoes_preparacao: '', antecedencia_aviso_horas: 48,
  });
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  useEffect(() => {
    api.get<Procedimento[]>('/procedimentos').then(setLista).catch(() => null);
    api.get<Especialidade[]>('/especialidades').then(setEspecialidades).catch(() => null);
  }, []);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const proc = await api.post<Procedimento>('/procedimentos', form);
      setLista(l => [...l, proc]);
      setForm({ especialidade_id: '', nome: '', duracao_minutos: 50, requer_preparacao: false, instrucoes_preparacao: '', antecedencia_aviso_horas: 48 });
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro');
    } finally { setLoading(false); }
  }

  async function remover(id: string) {
    if (!confirm('Remover procedimento?')) return;
    await api.delete(`/procedimentos/${id}`);
    setLista(l => l.filter(p => p.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">Procedimentos</h1>
      <p className="text-stone-400 text-sm mb-8">Configure os procedimentos realizados e suas instruções de preparação.</p>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
        {lista.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">{p.nome}</p>
              <p className="text-xs text-stone-400">
                {p.especialidade_nome ?? 'Todas'} · {p.duracao_minutos}min
                {p.requer_preparacao && ` · Requer preparação (aviso ${p.antecedencia_aviso_horas}h antes)`}
              </p>
            </div>
            <button onClick={() => remover(p.id)} className="text-xs text-red-400 hover:text-red-600 transition">Remover</button>
          </div>
        ))}
        {lista.length === 0 && <p className="text-center text-stone-400 text-sm py-10">Nenhum procedimento cadastrado.</p>}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Novo procedimento</h2>
        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleCriar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required
                placeholder="Ex: Endoscopia, Sessão de psicologia…"
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Especialidade</label>
              <select value={form.especialidade_id} onChange={e => setForm(f => ({ ...f, especialidade_id: e.target.value }))}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300">
                <option value="">Todas</option>
                {especialidades.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Duração (min)</label>
              <input type="number" min={5} max={480} value={form.duracao_minutos}
                onChange={e => setForm(f => ({ ...f, duracao_minutos: Number(e.target.value) }))}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="prep" checked={form.requer_preparacao}
                onChange={e => setForm(f => ({ ...f, requer_preparacao: e.target.checked }))} className="rounded" />
              <label htmlFor="prep" className="text-sm text-stone-700">Requer preparação</label>
            </div>
          </div>

          {form.requer_preparacao && (
            <>
              <div>
                <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Aviso com quantas horas de antecedência?</label>
                <input type="number" min={1} value={form.antecedencia_aviso_horas}
                  onChange={e => setForm(f => ({ ...f, antecedencia_aviso_horas: Number(e.target.value) }))}
                  className="w-40 border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
                <span className="text-xs text-stone-400 ml-2">horas antes da preparação</span>
              </div>
              <div>
                <label className="block text-xs text-stone-500 uppercase tracking-wide mb-1">Instruções de preparação</label>
                <textarea value={form.instrucoes_preparacao}
                  onChange={e => setForm(f => ({ ...f, instrucoes_preparacao: e.target.value }))} rows={4}
                  placeholder="Descreva o que o paciente deve fazer antes do procedimento…"
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Salvando…' : 'Adicionar procedimento'}
          </button>
        </form>
      </div>
    </div>
  );
}
