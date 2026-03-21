'use client';
import { useEffect, useState } from 'react';
import { api, Paciente } from '@/lib/api';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca,     setBusca]     = useState('');

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(console.error);
  }, []);

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light italic text-stone-800">Pacientes</h1>
        <a href="/pacientes/novo"
          className="bg-stone-800 text-white text-sm rounded-full px-6 py-2 hover:bg-stone-700 transition">
          + Novo paciente
        </a>
      </div>

      <input type="text" placeholder="Buscar por nome…" value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
      />

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtrados.map(p => (
          <a key={p.id} href={`/pacientes/${p.id}`}
            className="flex items-center justify-between px-6 py-4 border-b border-stone-100 hover:bg-stone-50 transition last:border-0">
            <div>
              <p className="text-sm font-medium text-stone-700">{p.nome}</p>
              <p className="text-xs text-stone-400">{p.email}</p>
            </div>
            <span className="text-xs text-stone-400">
              {new Date(p.criado_em).toLocaleDateString('pt-BR')}
            </span>
          </a>
        ))}
        {filtrados.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-10">Nenhum paciente encontrado.</p>
        )}
      </div>
    </div>
  );
}
