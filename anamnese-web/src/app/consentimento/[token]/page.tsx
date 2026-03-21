'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Info = {
  paciente:                 string;
  consultorio:              string;
  consentimento_registrado: boolean;
};

const TERMO = `Este formulário coleta informações pessoais e clínicas com a finalidade exclusiva de viabilizar o atendimento psicanalítico. Os dados são de uso restrito do profissional responsável e não serão compartilhados com terceiros.

De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), você tem o direito de solicitar a correção, exclusão ou portabilidade dos seus dados a qualquer momento, pelo mesmo canal por onde foi atendido(a).

Ao confirmar o consentimento, você autoriza o armazenamento seguro das informações fornecidas neste formulário de anamnese.`;

export default function ConsentimentoPage() {
  const { token }   = useParams<{ token: string }>();
  const BASE        = process.env.NEXT_PUBLIC_API_URL;

  const [info,    setInfo]    = useState<Info | null>(null);
  const [aceito,  setAceito]  = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro,    setErro]    = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/publico/consentimento/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) return setErro(data.erro);
        setInfo(data);
        if (data.consentimento_registrado) setEnviado(true);
      })
      .catch(() => setErro('Não foi possível verificar o link. Verifique sua conexão.'));
  }, [token, BASE]);

  async function registrar() {
    setLoading(true);
    try {
      const r    = await fetch(`${BASE}/publico/consentimento/${token}`, { method: 'POST' });
      const data = await r.json();
      if (data.erro) setErro(data.erro);
      else setEnviado(true);
    } catch {
      setErro('Erro ao registrar consentimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl text-stone-300">ψ</span>
          <h1 className="text-2xl font-light italic text-stone-800 mt-3">Termo de Consentimento</h1>
          <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">Proteção de Dados — LGPD</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
            {erro}
          </div>
        )}

        {!erro && !info && (
          <p className="text-center text-stone-400 text-sm">Verificando link…</p>
        )}

        {info && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {/* Info do paciente */}
            <div className="px-8 py-6 border-b border-stone-100">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Consultório</p>
              <p className="text-stone-700 font-medium">{info.consultorio}</p>
              <p className="text-xs uppercase tracking-widest text-stone-400 mt-3 mb-1">Paciente</p>
              <p className="text-stone-700">{info.paciente}</p>
            </div>

            {enviado ? (
              <div className="px-8 py-10 text-center">
                <p className="text-4xl mb-3">✓</p>
                <p className="text-teal-700 font-medium text-lg mb-1">Consentimento registrado</p>
                <p className="text-stone-400 text-sm">
                  Seu consentimento foi registrado com sucesso. Você pode fechar esta página.
                </p>
              </div>
            ) : (
              <>
                {/* Texto do termo */}
                <div className="px-8 py-6 border-b border-stone-100">
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Termos de uso dos dados</p>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{TERMO}</p>
                </div>

                {/* Checkbox + botão */}
                <div className="px-8 py-6 space-y-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-stone-700 cursor-pointer" />
                    <span className="text-sm text-stone-600 leading-snug">
                      Li e compreendi o termo acima e <strong>consinto</strong> com o armazenamento dos meus dados para fins de atendimento psicanalítico.
                    </span>
                  </label>

                  <button onClick={registrar} disabled={!aceito || loading}
                    className="w-full bg-stone-800 text-white rounded-full py-3 text-sm font-medium tracking-wide hover:bg-stone-700 disabled:opacity-40 transition">
                    {loading ? 'Registrando…' : 'Confirmar consentimento'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-stone-300 mt-8">
          Este link é de uso único e pessoal.
        </p>
      </div>
    </div>
  );
}
