'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NovoPacientePage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', data_nascimento: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const paciente = await api.post<{ id: string }>('/pacientes', form);
      router.push(`/pacientes/${paciente.id}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar paciente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <a href="/pacientes" className="text-stone-400 hover:text-stone-600 text-sm">← Pacientes</a>
        <h1 className="text-2xl font-light italic text-stone-800">Novo paciente</h1>
      </div>

      <div className="max-w-lg bg-white rounded-2xl border border-stone-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nome" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Nome completo *</label>
            <input id="nome" type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="Nome do paciente" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">E-mail</label>
            <input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="paciente@email.com" />
          </div>
          <div>
            <label htmlFor="telefone" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Telefone</label>
            <input id="telefone" type="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label htmlFor="data_nascimento" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Data de nascimento</label>
            <input id="data_nascimento" type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              title="Data de nascimento" />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50">
              {loading ? 'Salvando…' : 'Criar paciente'}
            </button>
            <a href="/pacientes"
              className="px-6 py-3 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition">
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
