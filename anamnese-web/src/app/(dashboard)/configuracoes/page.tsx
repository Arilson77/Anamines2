'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

type Config = { nome: string; email: string; nome_usuario: string; papel: string };

export default function ConfiguracoesPage() {
  const [config,        setConfig]        = useState<Config | null>(null);
  const [nome,          setNome]          = useState('');
  const [email,         setEmail]         = useState('');
  const [senhaAtual,    setSenhaAtual]    = useState('');
  const [senhaNova,     setSenhaNova]     = useState('');
  const [msg,           setMsg]           = useState('');
  const [erro,          setErro]          = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingSenha,  setLoadingSenha]  = useState(false);

  useEffect(() => {
    api.get<Config>('/configuracoes').then(data => {
      setConfig(data);
      setNome(data.nome);
      setEmail(data.email);
    }).catch(() => setErro('Erro ao carregar configurações'));
  }, []);

  function limpar() { setMsg(''); setErro(''); }

  async function salvarConfig(e: FormEvent) {
    e.preventDefault();
    limpar();
    setLoadingConfig(true);
    try {
      await api.put('/configuracoes', { nome, email });
      setMsg('Configurações salvas com sucesso.');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoadingConfig(false);
    }
  }

  async function alterarSenha(e: FormEvent) {
    e.preventDefault();
    limpar();
    setLoadingSenha(true);
    try {
      await api.put('/configuracoes/senha', { senha_atual: senhaAtual, senha_nova: senhaNova });
      setSenhaAtual('');
      setSenhaNova('');
      setMsg('Senha alterada com sucesso.');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setLoadingSenha(false);
    }
  }

  if (!config) return <p className="text-stone-400 text-sm">Carregando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-light italic text-stone-800 mb-8">Configurações</h1>

      {msg  && <p className="text-teal-700 text-sm bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-6">{msg}</p>}
      {erro && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{erro}</p>}

      {/* Dados do consultório */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Dados do consultório</h2>
        <form onSubmit={salvarConfig} className="space-y-4">
          <div>
            <label htmlFor="nome_consultorio" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
              Nome do consultório
            </label>
            <input id="nome_consultorio" value={nome} onChange={e => setNome(e.target.value)} required
              placeholder="Nome do consultório"
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
          </div>
          <div>
            <label htmlFor="email_contato" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
              E-mail de contato
            </label>
            <input id="email_contato" type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="contato@consultorio.com"
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
          </div>
          <button type="submit" disabled={loadingConfig}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm hover:bg-stone-700 disabled:opacity-50 transition">
            {loadingConfig ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Alterar senha</h2>
        <form onSubmit={alterarSenha} className="space-y-4">
          <div>
            <label htmlFor="senha_atual" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Senha atual</label>
            <input id="senha_atual" type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required
              placeholder="Senha atual" autoComplete="current-password"
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
          </div>
          <div>
            <label htmlFor="senha_nova" className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
              Nova senha (mín. 8 caracteres)
            </label>
            <input id="senha_nova" type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
              minLength={8} required placeholder="Nova senha"
              autoComplete="new-password"
              className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
          </div>
          <button type="submit" disabled={loadingSenha}
            className="bg-stone-800 text-white rounded-full px-6 py-2.5 text-sm hover:bg-stone-700 disabled:opacity-50 transition">
            {loadingSenha ? 'Salvando…' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
