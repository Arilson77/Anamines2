'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { obterToken } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Resumo = {
  totais: {
    total_pacientes: number;
    consultas_mes: number;
    realizadas_30d: number;
    canceladas_30d: number;
    total_fichas: number;
    lgpd_pendente: number;
  };
  porStatus: { status: string; total: number }[];
  porEspecialidade: { especialidade: string; cor: string | null; total: number }[];
  porMes: { mes: string; total: number }[];
  topPacientes: { nome: string; total: number }[];
};

const STATUS_COR: Record<string, string> = {
  agendada:  '#3b82f6',
  confirmada:'#14b8a6',
  realizada: '#22c55e',
  cancelada: '#ef4444',
  faltou:    '#f97316',
};

const STATUS_PT: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada',
  realizada: 'Realizada', cancelada: 'Cancelada', faltou: 'Faltou',
};

function Card({ label, valor, sub, cor }: { label: string; valor: number | string; sub?: string; cor: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">{label}</p>
      <p className={`text-4xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function RelatoriosPage() {
  const [dados,        setDados]        = useState<Resumo | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [exportando,   setExportando]   = useState(false);

  async function exportarPDF() {
    setExportando(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token  = obterToken();
      const res    = await fetch(`${apiUrl}/relatorios/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `relatorio-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setExportando(false); }
  }

  useEffect(() => {
    api.get<Resumo>('/relatorios/resumo').then(setDados).catch(() => null).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm text-center py-16">Carregando relatórios…</p>;
  if (!dados)  return <p className="text-red-400 text-sm text-center py-16">Erro ao carregar dados.</p>;

  const { totais, porStatus, porEspecialidade, porMes, topPacientes } = dados;

  const taxa = totais.realizadas_30d + totais.canceladas_30d > 0
    ? Math.round((totais.realizadas_30d / (totais.realizadas_30d + totais.canceladas_30d)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Botão exportar */}
      <div className="flex justify-end">
        <button onClick={exportarPDF} disabled={exportando}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2">
          {exportando ? 'Gerando PDF…' : '↓ Exportar PDF'}
        </button>
      </div>
      {/* Cards de totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Total de Pacientes"   valor={totais.total_pacientes} cor="text-teal-600"   sub="cadastrados" />
        <Card label="Consultas este mês"   valor={totais.consultas_mes}   cor="text-blue-500"   sub="no mês atual" />
        <Card label="Taxa de realização"   valor={`${taxa}%`}             cor="text-green-500"  sub="últimos 30 dias" />
        <Card label="LGPD pendente"        valor={totais.lgpd_pendente}   cor="text-orange-500" sub="sem consentimento" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultas por mês */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Consultas por mês</h2>
          {porMes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [v, 'Consultas']}
                />
                <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status das consultas */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status das consultas (90 dias)</h2>
          {porStatus.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porStatus} dataKey="total" nameKey="status"
                  cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) =>
                    `${STATUS_PT[status] ?? status} ${(percent * 100).toFixed(0)}%`
                  } labelLine={false}>
                  {porStatus.map((e) => (
                    <Cell key={e.status} fill={STATUS_COR[e.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v, name) => [v, STATUS_PT[name as string] ?? name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por especialidade */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Por especialidade (90 dias)</h2>
          {porEspecialidade.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {porEspecialidade.map((e) => {
                const max = porEspecialidade[0].total;
                const pct = Math.round((e.total / max) * 100);
                return (
                  <div key={e.especialidade}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{e.especialidade}</span>
                      <span className="font-semibold">{e.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: e.cor ?? '#14b8a6' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top pacientes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pacientes mais atendidos</h2>
          {topPacientes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {topPacientes.map((p, i) => (
                <div key={p.nome} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-teal-600">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.nome}</p>
                  </div>
                  <span className="text-sm font-bold text-teal-600">{p.total}</span>
                  <span className="text-xs text-gray-400">consultas</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Totais adicionais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card label="Realizadas (30d)"  valor={totais.realizadas_30d}  cor="text-green-500" />
        <Card label="Canceladas (30d)"  valor={totais.canceladas_30d}  cor="text-red-500"   />
        <Card label="Total de fichas"   valor={totais.total_fichas}    cor="text-purple-500" sub="anamneses" />
      </div>
    </div>
  );
}
