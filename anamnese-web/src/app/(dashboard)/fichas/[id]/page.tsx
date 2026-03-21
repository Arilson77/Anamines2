'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Ficha } from '@/lib/api';
import { obterToken } from '@/lib/auth';

const SECOES: { titulo: string; campos: { campo: string; label: string }[] }[] = [
  {
    titulo: 'Identificação',
    campos: [
      { campo: 'nascimento',    label: 'Data de nascimento' },
      { campo: 'genero',        label: 'Gênero' },
      { campo: 'profissao',     label: 'Profissão' },
      { campo: 'estado_civil',  label: 'Estado civil' },
      { campo: 'telefone',      label: 'Telefone' },
      { campo: 'email_paciente', label: 'E-mail' },
    ],
  },
  {
    titulo: 'Motivo da busca',
    campos: [
      { campo: 'queixa',       label: 'Queixa principal' },
      { campo: 'tempo_queixa', label: 'Tempo de sofrimento' },
      { campo: 'gatilho',      label: 'Gatilho / evento desencadeante' },
      { campo: 'intensidade',  label: 'Intensidade (1–10)' },
    ],
  },
  {
    titulo: 'História familiar',
    campos: [
      { campo: 'familia',      label: 'Composição familiar' },
      { campo: 'infancia',     label: 'Infância e adolescência' },
      { campo: 'fratria',      label: 'Irmãos / Fratria' },
      { campo: 'pais',         label: 'Relação com os pais' },
      { campo: 'hist_familia', label: 'Histórico familiar' },
    ],
  },
  {
    titulo: 'Saúde',
    campos: [
      { campo: 'terapia_anterior',  label: 'Terapia anterior' },
      { campo: 'terapia_detalhes',  label: 'Detalhes da terapia' },
      { campo: 'medicacoes',        label: 'Medicamentos' },
      { campo: 'saude_geral',       label: 'Saúde geral' },
      { campo: 'substancias',       label: 'Substâncias' },
    ],
  },
  {
    titulo: 'Vida afetiva',
    campos: [
      { campo: 'relacionamentos', label: 'Relacionamentos afetivos' },
      { campo: 'vida_sexual',     label: 'Vida sexual' },
      { campo: 'trabalho',        label: 'Vida profissional' },
      { campo: 'social_feel',     label: 'Vida social' },
    ],
  },
  {
    titulo: 'Espaço livre',
    campos: [
      { campo: 'expectativas', label: 'Expectativas com a terapia' },
      { campo: 'livre',        label: 'Espaço livre' },
      { campo: 'como_chegou',  label: 'Como chegou até aqui' },
    ],
  },
];

export default function DetalheFichaPage() {
  const { id }  = useParams<{ id: string }>();
  const [ficha,   setFicha]   = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  useEffect(() => {
    api.get<Ficha>(`/fichas/${id}`).then(setFicha).catch(() => setErro('Ficha não encontrada'));
  }, [id]);

  async function arquivar() {
    if (!ficha) return;
    setLoading(true);
    try {
      await api.put(`/fichas/${id}`, { dados: ficha.dados, status: 'arquivada' });
      setFicha(f => f ? { ...f, status: 'arquivada' } : f);
    } catch {
      setErro('Erro ao arquivar');
    } finally {
      setLoading(false);
    }
  }

  async function exportarPDF() {
    if (!ficha) return;
    setLoading(true);
    try {
      const token = obterToken();
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas/${id}/exportar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Erro ao gerar PDF');
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ficha-${ficha.paciente.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro('Erro ao exportar PDF');
    } finally {
      setLoading(false);
    }
  }

  if (erro)  return <p className="text-red-500">{erro}</p>;
  if (!ficha) return <p className="text-stone-400 text-sm">Carregando…</p>;

  const dados = ficha.dados as Record<string, string>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/fichas" className="text-stone-400 hover:text-stone-600 text-sm">← Fichas</a>
        <h1 className="text-2xl font-light italic text-stone-800">{ficha.paciente}</h1>
        <span className={`text-xs px-3 py-1 rounded-full ml-2 ${
          ficha.status === 'enviada'  ? 'bg-teal-100 text-teal-700' :
          ficha.status === 'rascunho' ? 'bg-amber-100 text-amber-700' :
          'bg-stone-100 text-stone-500'
        }`}>{ficha.status}</span>
      </div>

      <div className="flex gap-2 mb-8">
        <a href={`/fichas/nova?paciente_id=${ficha.paciente_id}`}
          className="text-xs px-4 py-2 border border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 transition">
          + Nova ficha para este paciente
        </a>
        <button onClick={exportarPDF} disabled={loading}
          className="text-xs px-4 py-2 border border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition">
          ↓ Exportar PDF
        </button>
        {ficha.status !== 'arquivada' && (
          <button onClick={arquivar} disabled={loading}
            className="text-xs px-4 py-2 border border-stone-200 rounded-full text-stone-500 hover:bg-stone-50 disabled:opacity-50 transition">
            {loading ? '…' : 'Arquivar'}
          </button>
        )}
        <span className="text-xs px-4 py-2 border border-stone-100 rounded-full text-stone-400">
          {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <div className="space-y-6">
        {SECOES.map(secao => (
          <div key={secao.titulo} className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-100 pb-3">
              {secao.titulo}
            </h2>
            <div className="space-y-4">
              {secao.campos.map(({ campo, label }) => {
                const val = dados[campo];
                if (!val) return null;
                return (
                  <div key={campo}>
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{val}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
