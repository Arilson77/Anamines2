'use client';
import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { salvarToken } from '@/lib/auth';

function LoginForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [erro,    setErro]    = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { token } = await api.post<{ token: string; nome: string }>('/auth/login', { email, senha });
      salvarToken(token);
      document.cookie = `anamnese_token=${token}; path=/; max-age=28800; SameSite=Strict`;
      router.push(params.get('redirect') || '/');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl text-stone-400">ψ</span>
          <h1 className="text-2xl font-light italic text-stone-800 mt-2">Anamnese</h1>
          <p className="text-sm text-stone-400 mt-1 tracking-widest uppercase">Área do profissional</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              placeholder="seu@email.com" required />
          </div>
          <div>
            <label htmlFor="senha" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Senha</label>
            <input id="senha" name="senha" type="password" autoComplete="current-password"
              value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              placeholder="••••••••" required />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          Sem conta?{' '}
          <a href="/cadastro" className="text-stone-600 underline">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
