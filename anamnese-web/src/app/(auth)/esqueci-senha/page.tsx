'use client';
import { useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function EsqueciSenhaPage() {
  const [email,   setEmail]   = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/auth/esqueceu-senha', { email });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl text-stone-400">ψ</span>
          <h1 className="text-2xl font-light italic text-stone-800 mt-2">Esqueci minha senha</h1>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-stone-600">
              Se o e-mail existir em nossa base, você receberá as instruções em breve.
            </p>
            <a href="/login" className="text-stone-500 text-sm underline">Voltar ao login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                placeholder="seu@email.com" required />
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50">
              {loading ? 'Enviando…' : 'Enviar instruções'}
            </button>

            <p className="text-center text-sm text-stone-400">
              <a href="/login" className="text-stone-600 underline">Voltar ao login</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
