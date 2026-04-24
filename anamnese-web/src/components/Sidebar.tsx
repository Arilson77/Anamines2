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
    router.push('/login');
  }

  function linkClass(href: string) {
    const ativo = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      ativo
        ? 'bg-teal-50 text-teal-700 border border-teal-200'
        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
    }`;
  }

  const configLinks = LINKS_CONFIG.filter(l => !l.apenasAdmin || isAdmin);

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-stone-200 flex flex-col px-3 py-6">
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-teal-600">ψ</span>
          <div>
            <p className="text-sm font-semibold text-stone-800 leading-none">Anamne</p>
            <p className="text-xs text-stone-400 tracking-wide">Clínica Digital</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {LINKS_PRINCIPAIS.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span className="text-base w-5 text-center">{link.icone}</span>
            {link.label}
          </a>
        ))}

        <div className="pt-5 pb-1.5 px-3">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Configurações</p>
        </div>

        {configLinks.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span className="text-base w-5 text-center">{link.icone}</span>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="border-t border-stone-100 pt-3 mt-3">
        {usuario && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-stone-700 truncate">{usuario.nome}</p>
            <p className="text-xs text-stone-400 capitalize">{usuario.papel}</p>
          </div>
        )}
        <button onClick={sair}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all">
          <span className="w-5 text-center">→</span> Sair
        </button>
      </div>
    </aside>
  );
}
