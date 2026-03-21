'use client';
import { useEffect, useState } from 'react';
import { api, Paciente, Ficha } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

export default function DashboardPage() {
  const usuario = obterUsuario();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [fichas,    setFichas]    = useState<Ficha[]>([]);

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(console.error);
    api.get<Ficha[]>('/fichas').then(setFichas).catch(console.error);
  }, []);

  const cards = [
    { label: 'Pacientes',       valor: pacientes.length,                                    cor: 'bg-teal-50  border-teal-200'   },
    { label: 'Fichas enviadas', valor: fichas.filter(f => f.status === 'enviada').length,   cor: 'bg-stone-50 border-stone-200' },
    { label: 'Rascunhos',       valor: fichas.filter(f => f.status === 'rascunho').length,  cor: 'bg-amber-50 border-amber-200' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">
        Olá{usuario?.papel === 'admin' ? ', Dr(a).' : ''}
      </h1>
      <p className="text-stone-400 text-sm mb-8">Aqui está um resumo do seu consultório.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map(c => (
          <div key={c.label} className={`rounded-2xl border p-6 ${c.cor}`}>
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">{c.label}</p>
            <p className="text-4xl font-light text-stone-800">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-light text-stone-700">Fichas recentes</h2>
        <a href="/fichas/nova"
          className="bg-stone-800 text-white text-xs rounded-full px-5 py-2 hover:bg-stone-700 transition">
          + Nova ficha
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {fichas.slice(0, 5).map(f => (
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
        {fichas.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-10">Nenhuma ficha ainda.</p>
        )}
      </div>
    </div>
  );
}
