'use client';
import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RedefinirSenhaPage() {
  const { token }  = useParams<{ token: string }>();
  const router     = useRouter();
  const [senha,    setSenha]    = useState('');
  const [confirma, setConfirma] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirma) return setErro('As senhas não coincidem.');
    if (senha.length < 8)   return setErro('A senha deve ter no mínimo 8 caracteres.');
    setErro('');
    setLoading(true);
    try {
      await api.post('/auth/redefinir-senha', { token, nova_senha: senha });
      router.push('/login?redefinida=1');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Link inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl text-stone-400">ψ</span>
          <h1 className="text-2xl font-light italic text-stone-800 mt-2">Nova senha</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Nova senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              placeholder="Mínimo 8 caracteres" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Confirmar senha</label>
            <input type="password" value={confirma} onChange={e => setConfirma(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              placeholder="Repita a nova senha" required />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
