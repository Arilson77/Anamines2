'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

type StatusPlano = { status: string; dias_restantes: number | null };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [plano, setPlano] = useState<StatusPlano | null>(null);

  useEffect(() => {
    api.get<StatusPlano>('/cobranca/status').then(setPlano).catch(() => null);
  }, []);

  const mostrarBanner = plano?.status === 'trial' && (plano.dias_restantes ?? 0) <= 7;
  const expirado      = plano?.status === 'expirada';

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {expirado && (
          <div className="bg-red-600 text-white text-sm text-center py-2 px-4">
            Seu trial expirou.{' '}
            <Link href="/planos" className="underline font-semibold">Assine agora para continuar usando</Link>.
          </div>
        )}
        {mostrarBanner && !expirado && (
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

