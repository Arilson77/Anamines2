'use client';
import { useEffect, useState } from 'react';
import { api, Ficha } from '@/lib/api';

type Filtro = 'todas' | 'rascunho' | 'enviada' | 'arquivada';

export default function FichasPage() {
  const [fichas,  setFichas]  = useState<Ficha[]>([]);
  const [filtro,  setFiltro]  = useState<Filtro>('todas');
  const [busca,   setBusca]   = useState('');

  useEffect(() => {
    api.get<Ficha[]>('/fichas').then(setFichas).catch(console.error);
  }, []);

  const filtradas = fichas.filter(f => {
    const matchFiltro = filtro === 'todas' || f.status === filtro;
    const matchBusca  = f.paciente.toLowerCase().includes(busca.toLowerCase());
    return matchFiltro && matchBusca;
  });

  const FILTROS: { val: Filtro; label: string }[] = [
    { val: 'todas',     label: 'Todas' },
    { val: 'rascunho',  label: 'Rascunhos' },
    { val: 'enviada',   label: 'Enviadas' },
    { val: 'arquivada', label: 'Arquivadas' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light italic text-stone-800">Fichas</h1>
        <a href="/fichas/nova"
          className="bg-stone-800 text-white text-sm rounded-full px-6 py-2 hover:bg-stone-700 transition">
          + Nova ficha
        </a>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-4">
        {FILTROS.map(({ val, label }) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`text-xs px-4 py-1.5 rounded-full border transition ${
              filtro === val
                ? 'bg-stone-800 text-white border-stone-800'
                : 'text-stone-500 border-stone-200 hover:bg-stone-100'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Buscar por paciente…" value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
      />

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtradas.map(f => (
          <a key={f.id} href={`/fichas/${f.id}`}
            className="flex items-center justify-between px-6 py-4 border-b border-stone-100 hover:bg-stone-50 transition last:border-0">
            <div>
              <p className="text-sm font-medium text-stone-700">{f.paciente}</p>
              <p className="text-xs text-stone-400">{new Date(f.criado_em).toLocaleDateString('pt-BR')}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              f.status === 'enviada'  ? 'bg-teal-100 text-teal-700' :
              f.status === 'rascunho' ? 'bg-amber-100 text-amber-700' :
              'bg-stone-100 text-stone-500'
            }`}>{f.status}</span>
          </a>
        ))}
        {filtradas.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-10">Nenhuma ficha encontrada.</p>
        )}
      </div>
    </div>
  );
}
