'use client';
import { usePathname, useRouter } from 'next/navigation';
import { removerToken, obterUsuario } from '@/lib/auth';

const LINKS_PRINCIPAIS = [
  { href: '/',                              label: 'Início',          icone: '⌂' },
  { href: '/agenda',                        label: 'Agenda',          icone: '📅' },
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade', icone: '🗓' },
  { href: '/pacientes',                     label: 'Pacientes',       icone: '♡' },
  { href: '/fichas',                        label: 'Fichas',          icone: '☰' },
];

const LINKS_CONFIG = [
  { href: '/configuracoes',                label: 'Perfil / Clínica', icone: '⚙',  apenasAdmin: false },
  { href: '/configuracoes/especialidades', label: 'Especialidades',   icone: '🏥', apenasAdmin: true  },
  { href: '/configuracoes/procedimentos',  label: 'Procedimentos',    icone: '🩺', apenasAdmin: true  },
  { href: '/configuracoes/whatsapp',       label: 'WhatsApp',         icone: '💬', apenasAdmin: true  },
  { href: '/configuracoes/usuarios',       label: 'Equipe',           icone: '👥', apenasAdmin: true  },
  { href: '/assinatura',                   label: 'Assinatura',       icone: '★',  apenasAdmin: true  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const usuario  = obterUsuario();
  const isAdmin  = usuario?.papel === 'admin';

  function sair() {
    removerToken();
    document.cookie = 'anamnese_token=; path=/; max-age=0';
    router.push('/login');
  }

  function linkClass(href: string) {
    const ativo = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
      ativo ? 'bg-stone-700 text-white' : 'hover:bg-stone-800 text-stone-400'
    }`;
  }

  const configLinks = LINKS_CONFIG.filter(l => !l.apenasAdmin || isAdmin);

  return (
    <aside className="w-56 min-h-screen bg-stone-900 text-stone-300 flex flex-col px-4 py-8">
      <div className="text-center mb-10">
        <span className="text-3xl text-stone-400">ψ</span>
        <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">ANAMNE</p>
      </div>

      <nav className="flex-1 space-y-1">
        {LINKS_PRINCIPAIS.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span>{link.icone}</span>
            {link.label}
          </a>
        ))}

        <div className="pt-4 pb-1">
          <p className="text-xs uppercase tracking-widest text-stone-600 px-4">Configurações</p>
        </div>

        {configLinks.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span>{link.icone}</span>
            {link.label}
          </a>
        ))}
      </nav>

      <button onClick={sair}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition mt-4">
        <span>→</span> Sair
      </button>
    </aside>
  );
}
