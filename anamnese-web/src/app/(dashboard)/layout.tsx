'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

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
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [plano, setPlano] = useState<StatusPlano | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    api.get<StatusPlano>('/cobranca/status').then(setPlano).catch(() => null);
  }, []);

  const mostrarBanner = plano?.status === 'trial' && (plano.dias_restantes ?? 0) <= 7;
  const expirado      = plano?.status === 'expirada';
  const inadimplente  = plano?.status === 'inadimplente';

  const titulo = Object.entries(TITULOS)
    .filter(([k]) => pathname === k || (k !== '/' && pathname.startsWith(k)))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Painel';

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-700">{titulo}</h1>
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

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
