'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Info = {
  paciente_nome: string;
  profissional_nome: string;
  clinica_nome: string;
  data_hora: string;
  status: string;
  requer_preparacao: boolean;
  instrucoes_preparacao: string | null;
  confirmado_em: string | null;
};

function fmt(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function ConfirmarConsultaPage() {
  const { token }   = useParams<{ token: string }>();
  const [info,      setInfo]      = useState<Info | null>(null);
  const [etapa,     setEtapa]     = useState<'carregando' | 'pendente' | 'confirmada' | 'erro'>('carregando');
  const [loading,   setLoading]   = useState(false);
  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${base}/publico/confirmar-consulta/${token}`)
      .then(r => r.json())
      .then((d: Info) => {
        setInfo(d);
        setEtapa(d.confirmado_em ? 'confirmada' : 'pendente');
      })
      .catch(() => setEtapa('erro'));
  }, [token, base]);

  async function confirmar() {
    setLoading(true);
    try {
      const r = await fetch(`${base}/publico/confirmar-consulta/${token}`, { method: 'POST' });
      if (r.ok) setEtapa('confirmada');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <span className="text-4xl text-stone-400">ψ</span>
        <h1 className="text-xl font-light italic text-stone-800 mt-2 mb-6">
          {info?.clinica_nome ?? 'Clínica'}
        </h1>

        {etapa === 'carregando' && <p className="text-stone-400 text-sm">Carregando…</p>}

        {etapa === 'erro' && (
          <p className="text-red-500 text-sm">Link inválido ou expirado.</p>
        )}

        {(etapa === 'pendente' || etapa === 'confirmada') && info && (
          <>
            <div className="bg-stone-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
              <p className="text-stone-500"><span className="font-medium text-stone-700">Paciente:</span> {info.paciente_nome}</p>
              <p className="text-stone-500"><span className="font-medium text-stone-700">Profissional:</span> {info.profissional_nome}</p>
              <p className="text-stone-500"><span className="font-medium text-stone-700">Data/hora:</span> {fmt(info.data_hora)}</p>
            </div>

            {etapa === 'pendente' && (
              <>
                <p className="text-stone-600 text-sm mb-6">Confirme sua presença na consulta acima.</p>
                <button onClick={confirmar} disabled={loading}
                  className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
                  {loading ? 'Confirmando…' : 'Confirmar presença'}
                </button>
              </>
            )}

            {etapa === 'confirmada' && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-teal-700 font-medium mb-1">✓ Presença confirmada!</p>
                <p className="text-teal-600 text-sm">
                  {info.requer_preparacao
                    ? 'Em breve você receberá um e-mail com as instruções de preparação e o link para preencher sua ficha.'
                    : 'Em breve você receberá um e-mail com o link para preencher sua ficha antecipadamente.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
