import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anamnese — Atendimento Psicanalítico',
  description: 'Plataforma segura de fichas de anamnese',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
