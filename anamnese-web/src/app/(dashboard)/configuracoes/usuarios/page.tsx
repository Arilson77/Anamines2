'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api, Usuario } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

export default function UsuariosPage() {
  const eu       = obterUsuario();
  const isAdmin  = eu?.papel === 'admin';

  const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
  const [email,     setEmail]     = useState('');
  const [papel,     setPapel]     = useState<'colaborador' | 'admin'>('colaborador');
  const [loading,   setLoading]   = useState(false);
  const [removendo, setRemovendoId] = useState<string | null>(null);
  const [sucesso,   setSucesso]   = useState('');
  const [erro,      setErro]      = useState('');

  useEffect(() => {
    api.get<Usuario[]>('/usuarios').then(setUsuarios).catch(() => null);
  }, []);

  async function handleConvidar(e: FormEvent) {
    e.preventDefault();
    setSucesso(''); setErro('');
    setLoading(true);
    try {
      await api.post('/usuarios/convidar', { email, papel });
      setSucesso(`Convite enviado para ${email}`);
      setEmail('');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemover(id: string, nome: string) {
    if (!confirm(`Remover ${nome} do consultório? Esta ação não pode ser desfeita.`)) return;
    setRemovendoId(id);
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(us => us.filter(u => u.id !== id));
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover usuário');
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">Equipe</h1>
      <p className="text-stone-400 text-sm mb-8">Gerencie os profissionais do consultório.</p>

      {/* Lista de usuários */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
        {usuarios.map(u => (
          <div key={u.id} className="flex items-center justify-between px-6 py-4 border-b border-stone-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-stone-700">{u.nome}</p>
              <p className="text-xs text-stone-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full ${
                u.papel === 'admin' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {u.papel === 'admin' ? 'Admin' : 'Colaborador'}
              </span>
              {isAdmin && u.id !== eu?.usuario_id && (
                <button
                  onClick={() => handleRemover(u.id, u.nome)}
                  disabled={removendo === u.id}
                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition">
                  {removendo === u.id ? '…' : 'Remover'}
                </button>
              )}
            </div>
          </div>
        ))}
        {usuarios.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-10">Carregando…</p>
        )}
      </div>

      {/* Formulário de convite — apenas admin */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Convidar profissional</h2>

          {sucesso && <p className="text-teal-600 text-sm mb-3">{sucesso}</p>}
          {erro    && <p className="text-red-500 text-sm mb-3">{erro}</p>}

          <form onSubmit={handleConvidar} className="flex gap-3 flex-wrap">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@profissional.com" required
              className="flex-1 min-w-48 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
            <select value={papel} onChange={e => setPapel(e.target.value as 'colaborador' | 'admin')}
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50">
              <option value="colaborador">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={loading}
              className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
              {loading ? 'Enviando…' : 'Enviar convite'}
            </button>
          </form>
          <p className="text-xs text-stone-400 mt-3">
            O profissional receberá um e-mail com link para criar a conta (válido por 7 dias).
          </p>
        </div>
      )}
    </div>
  );
}
