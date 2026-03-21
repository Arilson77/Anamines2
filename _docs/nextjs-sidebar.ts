'use client';
import { usePathname, useRouter } from 'next/navigation';
import { removerToken } from '@/lib/auth';

const LINKS = [
  { href: '/',           label: 'Início',    icone: '⌂' },
  { href: '/pacientes',  label: 'Pacientes', icone: '♡' },
  { href: '/fichas',     label: 'Fichas',    icone: '☰' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function sair() {
    removerToken();
    document.cookie = 'anamnese_token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <aside className="w-56 min-h-screen bg-stone-900 text-stone-300 flex flex-col px-4 py-8">
      <div className="text-center mb-10">
        <span className="text-3xl text-stone-400">ψ</span>
        <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Anamnese</p>
      </div>

      <nav className="flex-1 space-y-1">
        {LINKS.map(link => {
          const ativo = pathname === link.href;
          return (
            <a key={link.href} href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                ativo
                  ? 'bg-stone-700 text-white'
                  : 'hover:bg-stone-800 text-stone-400'
              }`}>
              <span>{link.icone}</span>
              {link.label}
            </a>
          );
        })}
      </nav>

      <button onClick={sair}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition mt-4">
        <span>→</span> Sair
      </button>
    </aside>
  );
}
