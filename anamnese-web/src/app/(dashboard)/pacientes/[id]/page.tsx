'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Paciente, Ficha } from '@/lib/api';

export default function DetalhePacientePage() {
  const { id } = useParams<{ id: string }>();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [fichas,   setFichas]   = useState<Ficha[]>([]);
  const [erro,     setErro]     = useState('');
  const [link,     setLink]     = useState('');
  const [copiado,  setCopiado]  = useState(false);

  useEffect(() => {
    api.get<Paciente>(`/pacientes/${id}`).then(setPaciente).catch(() => setErro('Paciente não encontrado'));
    api.get<Ficha[]>('/fichas').then(fs => setFichas(fs.filter(f => f.paciente_id === id)));
  }, [id]);

  async function gerarLinkLGPD() {
    try {
      const data = await api.get<{ link: string }>(`/pacientes/${id}/link-consentimento`);
      setLink(data.link);
    } catch {
      setErro('Erro ao gerar link de consentimento');
    }
  }

  function copiarLink() {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (erro) return <p className="text-red-500">{erro}</p>;
  if (!paciente) return <p className="text-stone-400 text-sm">Carregando…</p>;

  const idade = paciente.data_nascimento
    ? Math.floor((Date.now() - new Date(paciente.data_nascimento).getTime()) / 31557600000)
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <a href="/pacientes" className="text-stone-400 hover:text-stone-600 text-sm">← Pacientes</a>
        <h1 className="text-2xl font-light italic text-stone-800">{paciente.nome}</h1>
      </div>

      {/* Dados do paciente */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Dados cadastrais</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'E-mail',    val: paciente.email    || '—' },
            { label: 'Telefone',  val: paciente.telefone || '—' },
            { label: 'Nascimento', val: paciente.data_nascimento ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
            { label: 'Idade',     val: idade !== null ? `${idade} anos` : '—' },
            { label: 'LGPD',      val: paciente.consentimento_lgpd ? 'Consentimento registrado' : 'Pendente' },
            { label: 'Cadastrado em', val: new Date(paciente.criado_em).toLocaleDateString('pt-BR') },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-xs text-stone-400 uppercase tracking-wide">{label}</p>
              <p className="text-stone-700 mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consentimento LGPD */}
      {!paciente.consentimento_lgpd && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Consentimento LGPD pendente</p>
              <p className="text-sm text-amber-700">Gere e compartilhe o link de consentimento com o paciente.</p>
            </div>
            <button onClick={gerarLinkLGPD}
              className="flex-shrink-0 text-xs px-4 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition">
              Gerar link
            </button>
          </div>
          {link && (
            <div className="flex items-center gap-2 mt-3 bg-white border border-amber-200 rounded-xl px-4 py-2">
              <p className="flex-1 text-xs text-stone-600 truncate">{link}</p>
              <button onClick={copiarLink}
                className="flex-shrink-0 text-xs px-3 py-1 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition">
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fichas do paciente */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-light text-stone-700">Fichas de anamnese</h2>
        <a href={`/fichas/nova?paciente_id=${id}`}
          className="bg-stone-800 text-white text-xs rounded-full px-5 py-2 hover:bg-stone-700 transition">
          + Nova ficha
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {fichas.map(f => (
          <a key={f.id} href={`/fichas/${f.id}`}
            className="flex items-center justify-between px-6 py-4 border-b border-stone-100 hover:bg-stone-50 transition last:border-0">
            <p className="text-sm text-stone-700">{new Date(f.criado_em).toLocaleDateString('pt-BR')}</p>
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
