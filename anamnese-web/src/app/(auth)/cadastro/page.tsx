'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleCadastro(e: FormEvent) {
    e.preventDefault();
    if (form.senha !== form.confirmar) {
      setErro('As senhas não coincidem');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await api.post('/auth/cadastro', { nome: form.nome, email: form.email, senha: form.senha });
      router.push('/login?cadastro=ok');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl text-stone-400">ψ</span>
          <h1 className="text-2xl font-light italic text-stone-800 mt-2">Criar conta</h1>
          <p className="text-sm text-stone-400 mt-1 tracking-widest uppercase">Anamnese</p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-4">
          {[
            { campo: 'nome',      label: 'Nome do consultório', type: 'text',     placeholder: 'Dra. Ana Souza' },
            { campo: 'email',     label: 'E-mail',              type: 'email',    placeholder: 'seu@email.com' },
            { campo: 'senha',     label: 'Senha',               type: 'password', placeholder: '••••••••' },
            { campo: 'confirmar', label: 'Confirmar senha',      type: 'password', placeholder: '••••••••' },
          ].map(({ campo, label, type, placeholder }) => (
            <div key={campo}>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">{label}</label>
              <input type={type} value={form[campo as keyof typeof form]}
                onChange={e => set(campo, e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                placeholder={placeholder} required />
            </div>
          ))}

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-widest uppercase hover:bg-stone-700 transition disabled:opacity-50">
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          Já tem conta?{' '}
          <a href="/login" className="text-stone-600 underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
