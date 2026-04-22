'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';

type Info = {
  clinica_nome: string;
  data_hora: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  precadastro_feito: boolean;
};

function fmt(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function PrecadastroPage() {
  const { token } = useParams<{ token: string }>();
  const [info,    setInfo]    = useState<Info | null>(null);
  const [nome,    setNome]    = useState('');
  const [tel,     setTel]     = useState('');
  const [nasc,    setNasc]    = useState('');
  const [feito,   setFeito]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');
  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${base}/publico/pre-cadastro/${token}`)
      .then(r => r.json())
      .then((d: Info) => {
        setInfo(d);
        setNome(d.nome || '');
        setTel(d.telefone || '');
        setNasc(d.data_nascimento ? d.data_nascimento.slice(0, 10) : '');
        setFeito(d.precadastro_feito);
      })
      .catch(() => setErro('Link inválido ou expirado.'));
  }, [token, base]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const r = await fetch(`${base}/publico/pre-cadastro/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone: tel, data_nascimento: nasc || undefined }),
      });
      if (!r.ok) throw new Error('Erro ao salvar');
      setFeito(true);
    } catch { setErro('Erro ao salvar. Tente novamente.'); }
    finally  { setLoading(false); }
  }

  if (erro && !info) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md w-full">
        <p className="text-red-500 text-sm">{erro}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-6">
          <span className="text-4xl text-stone-400">ψ</span>
          <h1 className="text-xl font-light italic text-stone-800 mt-2">{info?.clinica_nome}</h1>
          {info && <p className="text-sm text-stone-400 mt-1">Consulta: {fmt(info.data_hora)}</p>}
        </div>

        {feito ? (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
            <p className="text-teal-700 font-medium">✓ Dados salvos!</p>
            <p className="text-teal-600 text-sm mt-1">Obrigado. Até breve!</p>
          </div>
        ) : (
          <>
            <p className="text-stone-500 text-sm mb-5 text-center">
              Preencha seus dados para agilizar o atendimento. Campos opcionais.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Nome completo</label>
                <input value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Telefone / WhatsApp</label>
                <input value={tel} onChange={e => setTel(e.target.value)} type="tel"
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Data de nascimento</label>
                <input value={nasc} onChange={e => setNasc(e.target.value)} type="date"
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>

              {erro && <p className="text-red-500 text-sm">{erro}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
                {loading ? 'Salvando…' : 'Salvar dados'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
