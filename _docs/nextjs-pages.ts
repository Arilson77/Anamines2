// ============================================================
// app/layout.tsx — layout raiz
// ============================================================
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anamnese — Atendimento Psicanalítico',
  description: 'Plataforma segura de fichas de anamnese',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}


// ============================================================
// app/(auth)/login/page.tsx — tela de login
// ============================================================
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { salvarToken } from '@/lib/auth';

export default function LoginPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { token } = await api.post<{ token: string; nome: string }>(
        '/auth/login', { email, senha }
      );
      salvarToken(token);

      // Salva também num cookie para o middleware.ts conseguir ler
      document.cookie = `anamnese_token=${token}; path=/; max-age=28800; SameSite=Strict`;

      const redirect = params.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login');
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
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 bg-stone-50"
              placeholder="seu@email.com" required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Senha</label>
            <input
              type="password" value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 bg-stone-50"
              placeholder="••••••••" required
            />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50"
          >
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


// ============================================================
// app/(dashboard)/layout.tsx — layout com sidebar
// ============================================================
'use client';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}


// ============================================================
// app/(dashboard)/page.tsx — dashboard inicial
// ============================================================
'use client';
import { useEffect, useState } from 'react';
import { api, Paciente, Ficha } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

export default function DashboardPage() {
  const usuario = obterUsuario();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [fichas, setFichas]       = useState<Ficha[]>([]);

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(console.error);
    api.get<Ficha[]>('/fichas').then(setFichas).catch(console.error);
  }, []);

  const cards = [
    { label: 'Pacientes',        valor: pacientes.length,                          cor: 'bg-teal-50  border-teal-200'   },
    { label: 'Fichas enviadas',  valor: fichas.filter(f => f.status === 'enviada').length, cor: 'bg-stone-50 border-stone-200' },
    { label: 'Rascunhos',        valor: fichas.filter(f => f.status === 'rascunho').length, cor: 'bg-amber-50 border-amber-200' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">
        Olá, {usuario?.papel === 'admin' ? 'Dr(a).' : ''} 👋
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

      <h2 className="text-lg font-light text-stone-700 mb-4">Fichas recentes</h2>
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


// ============================================================
// app/(dashboard)/pacientes/page.tsx
// ============================================================
'use client';
import { useEffect, useState } from 'react';
import { api, Paciente } from '@/lib/api';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca]         = useState('');

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes);
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

      <input
        type="text" placeholder="Buscar por nome…" value={busca}
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
