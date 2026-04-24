'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Paciente = {
  id: string; nome: string; email: string; telefone: string;
  data_nascimento: string | null; consentimento_lgpd: boolean; criado_em: string;
};
type Consulta = {
  id: string; data_hora: string; duracao_minutos: number; status: string;
  observacoes: string | null; profissional_nome: string;
  especialidade_nome: string | null; especialidade_cor: string | null;
  procedimento_nome: string | null;
};
type Ficha = { id: string; criado_em: string; atualizado_em: string; profissional_nome: string };
type Prontuario = { paciente: Paciente; consultas: Consulta[]; fichas: Ficha[] };

const STATUS_COR: Record<string, string> = {
  agendada:  'bg-blue-100 text-blue-700',
  confirmada:'bg-teal-100 text-teal-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-600',
  faltou:    'bg-orange-100 text-orange-700',
};
const STATUS_PT: Record<string, string> = {
  agendada:'Agendada', confirmada:'Confirmada', realizada:'Realizada', cancelada:'Cancelada', faltou:'Faltou',
};

function fmt(d: string) {
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function calcIdade(d: string | null) {
  if (!d) return null;
  return `${Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 86400000))} anos`;
}

export default function ProntuarioPage() {
  const { id } = useParams<{ id: string }>();
  const [dados,   setDados]   = useState<Prontuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [link,    setLink]    = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api.get<Prontuario>(`/pacientes/${id}/prontuario`)
      .then(setDados).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  async function gerarLinkLGPD() {
    try {
      const data = await api.get<{ link: string }>(`/pacientes/${id}/link-consentimento`);
      setLink(data.link);
    } catch { /* silent */ }
  }

  function copiarLink() {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-16">Carregando prontuário…</p>;
  if (!dados)  return <p className="text-red-400 text-sm text-center py-16">Paciente não encontrado.</p>;

  const { paciente: p, consultas, fichas } = dados;
  const realizadas = consultas.filter(c => c.status === 'realizada').length;
  const proxima    = consultas.find(c => c.status === 'agendada' || c.status === 'confirmada');
  const idade      = calcIdade(p.data_nascimento);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/pacientes" className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Pacientes
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">{p.nome}</h1>
          {idade && <p className="text-sm text-gray-400 mt-0.5">{idade} · Prontuário completo</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/agenda/nova?paciente_id=${p.id}`}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition">
            + Nova consulta
          </Link>
          <Link href={`/fichas/nova?paciente_id=${p.id}`}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition">
            + Nova ficha
          </Link>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Consultas</p>
          <p className="text-3xl font-bold text-teal-600">{consultas.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{realizadas} realizadas</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Fichas</p>
          <p className="text-3xl font-bold text-purple-600">{fichas.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">anamneses</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Próxima</p>
          <p className="text-sm font-semibold text-gray-700 mt-1 leading-tight">
            {proxima ? new Date(proxima.data_hora).toLocaleDateString('pt-BR') : '—'}
          </p>
          <p className="text-xs text-gray-400">
            {proxima ? new Date(proxima.data_hora).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : 'sem agendamento'}
          </p>
        </div>
        <div className={`bg-white rounded-lg border p-4 ${p.consentimento_lgpd ? 'border-gray-200' : 'border-orange-200'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">LGPD</p>
          <p className={`text-sm font-semibold mt-1 ${p.consentimento_lgpd ? 'text-green-600' : 'text-orange-500'}`}>
            {p.consentimento_lgpd ? '✓ Consentido' : '⚠ Pendente'}
          </p>
          {!p.consentimento_lgpd && (
            <button onClick={gerarLinkLGPD} className="text-xs text-orange-500 underline mt-0.5">Gerar link</button>
          )}
        </div>
      </div>

      {/* Link LGPD gerado */}
      {link && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-xs text-gray-600 truncate">{link}</p>
          <button onClick={copiarLink}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
            {copiado ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados pessoais */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados pessoais</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'E-mail',      valor: p.email || '—' },
              { label: 'Telefone',    valor: p.telefone || '—' },
              { label: 'Nascimento',  valor: p.data_nascimento ? fmtData(p.data_nascimento) : '—' },
              { label: 'Cadastrado',  valor: fmtData(p.criado_em) },
            ].map(({ label, valor }) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-gray-700 font-medium">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Histórico de consultas */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Consultas ({consultas.length})</h2>
          {consultas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhuma consulta registrada.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {consultas.map(c => (
                <Link key={c.id} href={`/agenda/${c.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition border border-gray-100">
                  {c.especialidade_cor && (
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.especialidade_cor }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{fmt(c.data_hora)}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.profissional_nome}{c.especialidade_nome ? ` · ${c.especialidade_nome}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COR[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_PT[c.status] ?? c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fichas de anamnese */}
      {fichas.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Fichas de anamnese ({fichas.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fichas.map(f => (
              <Link key={f.id} href={`/fichas/${f.id}`}
                className="border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition">
                <p className="text-sm font-medium text-gray-700">{fmtData(f.criado_em)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.profissional_nome}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
