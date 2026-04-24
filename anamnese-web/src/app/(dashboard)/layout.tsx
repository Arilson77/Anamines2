'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

type StatusPlano = { status: string; dias_restantes: number | null };

const TITULOS: Record<string, string> = {
  '/':                              'Painel de Controle',
  '/agenda':                        'Agenda',
  '/agenda/nova':                   'Nova Consulta',
  '/pacientes':                     'Pacientes',
  '/fichas':                        'Fichas',
  '/configuracoes':                 'Configurações',
  '/configuracoes/disponibilidade': 'Disponibilidade',
  '/configuracoes/especialidades':  'Especialidades',
  '/configuracoes/procedimentos':   'Procedimentos',
  '/configuracoes/whatsapp':        'WhatsApp',
  '/configuracoes/usuarios':        'Equipe',
  '/assinatura':                    'Assinatura',
  '/relatorios':                    'Relatórios',
};

const DIAS_PT = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [plano, setPlano]   = useState<StatusPlano | null>(null);
  const [agora, setAgora]   = useState(new Date());
  const pathname            = usePathname();
  const usuario             = obterUsuario();

  useEffect(() => {
    api.get<StatusPlano>('/cobranca/status').then(setPlano).catch(() => null);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const mostrarBanner = plano?.status === 'trial' && (plano.dias_restantes ?? 0) <= 7;
  const expirado      = plano?.status === 'expirada';
  const inadimplente  = plano?.status === 'inadimplente';

  const titulo = Object.entries(TITULOS)
    .filter(([k]) => pathname === k || (k !== '/' && pathname.startsWith(k)))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Painel';

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?';

  const papelLabel: Record<string, string> = { admin: 'Administrador', colaborador: 'Colaborador' };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          {/* Data e hora — esquerda */}
          <div className="flex items-center gap-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-light text-teal-600 leading-none">{pad(agora.getDate())}</span>
              <div className="pb-1">
                <p className="text-sm font-semibold text-gray-700 leading-tight">{DIAS_PT[agora.getDay()]}</p>
                <p className="text-xs text-gray-400">{MESES_PT[agora.getMonth()]}, {agora.getFullYear()}</p>
                <p className="text-xs text-teal-500 font-mono">
                  {pad(agora.getHours())}:{pad(agora.getMinutes())}:{pad(agora.getSeconds())}
                </p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200 ml-2" />
            <h1 className="text-base font-semibold text-gray-600">{titulo}</h1>
          </div>

          {/* Usuário — direita */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700 leading-tight">{usuario?.nome ?? '—'}</p>
              <p className="text-xs text-gray-400">{papelLabel[usuario?.papel ?? ''] ?? usuario?.papel}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{iniciais}</span>
            </div>
          </div>
        </header>

        {/* Banners */}
        {expirado && (
          <div className="bg-red-600 text-white text-sm text-center py-2 px-4">
            Seu trial expirou.{' '}
            <Link href="/planos" className="underline font-semibold">Assine agora para continuar usando</Link>.
          </div>
        )}
        {inadimplente && (
          <div className="bg-orange-500 text-white text-sm text-center py-2 px-4">
            Pagamento pendente.{' '}
            <Link href="/assinatura" className="underline font-semibold">Gerenciar assinatura</Link>
          </div>
        )}
        {mostrarBanner && !expirado && !inadimplente && (
          <div className="bg-amber-500 text-white text-sm text-center py-2 px-4">
            Trial encerra em <strong>{plano!.dias_restantes} {plano!.dias_restantes === 1 ? 'dia' : 'dias'}</strong>.{' '}
            <Link href="/planos" className="underline font-semibold">Ver planos</Link>
          </div>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
