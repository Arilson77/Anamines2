'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api, Especialidade } from '@/lib/api';

const CORES = ['#6b7280','#0d9488','#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04'];

export default function EspecialidadesPage() {
  const [lista,   setLista]   = useState<Especialidade[]>([]);
  const [nome,    setNome]    = useState('');
  const [cor,     setCor]     = useState('#6b7280');
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  useEffect(() => {
    api.get<Especialidade[]>('/especialidades').then(setLista).catch(() => null);
  }, []);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const esp = await api.post<Especialidade>('/especialidades', { nome, cor });
      setLista(l => [...l, esp]);
      setNome('');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro');
    } finally { setLoading(false); }
  }

  async function remover(id: string) {
    if (!confirm('Remover especialidade?')) return;
    await api.delete(`/especialidades/${id}`);
    setLista(l => l.filter(e => e.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">Especialidades</h1>
      <p className="text-stone-400 text-sm mb-8">Defina as especialidades atendidas pela clínica.</p>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
        {lista.map((e, i) => (
          <div key={e.id} className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: e.cor }} />
            <p className="flex-1 text-sm font-medium text-stone-700">{e.nome}</p>
            <button onClick={() => remover(e.id)} className="text-xs text-red-400 hover:text-red-600 transition">Remover</button>
          </div>
        ))}
        {lista.length === 0 && <p className="text-center text-stone-400 text-sm py-10">Nenhuma especialidade cadastrada.</p>}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Nova especialidade</h2>
        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleCriar} className="space-y-4">
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Psicologia, Nutrição, Ortopedia…" required
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          <div>
            <p className="text-xs text-stone-400 mb-2">Cor na agenda:</p>
            <div className="flex gap-2 flex-wrap">
              {CORES.map(c => (
                <button key={c} type="button" onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition ${cor === c ? 'ring-2 ring-offset-2 ring-stone-400' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Salvando…' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
