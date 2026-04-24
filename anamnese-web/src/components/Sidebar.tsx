'use client';
import { usePathname, useRouter } from 'next/navigation';
import { removerToken, obterUsuario } from '@/lib/auth';

const LINKS_PRINCIPAIS = [
  { href: '/',                              label: 'Painel',          icone: '▦' },
  { href: '/agenda',                        label: 'Agenda',          icone: '📅' },
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade', icone: '🗓' },
  { href: '/pacientes',                     label: 'Pacientes',       icone: '👤' },
  { href: '/fichas',                        label: 'Fichas',          icone: '📋' },
];

const LINKS_CONFIG = [
  { href: '/configuracoes',                label: 'Configurações',    icone: '⚙',  apenasAdmin: false },
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
    return `flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
      ativo
        ? 'bg-teal-600 text-white font-medium'
        : 'text-teal-100 hover:bg-teal-600/50 hover:text-white'
    }`;
  }

  const configLinks = LINKS_CONFIG.filter(l => !l.apenasAdmin || isAdmin);

  return (
    <aside className="w-56 min-h-screen flex flex-col" style={{ background: '#0f766e' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-teal-600">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg font-bold">ψ</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-none">Anamne</p>
          <p className="text-teal-200 text-xs mt-0.5">Clínica Digital</p>
        </div>
      </div>

      {/* Usuário */}
      {usuario && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-teal-600">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">👤</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-teal-200">Bem-vindo,</p>
            <p className="text-white text-sm font-medium truncate">{usuario.nome?.split(' ')[0]}</p>
          </div>
        </div>
      )}

      {/* Nav principal */}
      <nav className="flex-1 py-2">
        {LINKS_PRINCIPAIS.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span className="w-5 text-center text-base">{link.icone}</span>
            {link.label}
          </a>
        ))}

        <div className="mt-4 mb-1 px-4">
          <p className="text-xs uppercase tracking-widest text-teal-300/70 font-semibold">Configurações</p>
        </div>

        {configLinks.map(link => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            <span className="w-5 text-center text-base">{link.icone}</span>
            {link.label}
          </a>
        ))}
      </nav>

      {/* Sair */}
      <button onClick={sair}
        className="flex items-center gap-3 px-4 py-3 text-sm text-teal-200 hover:bg-teal-600/50 hover:text-white transition-all border-t border-teal-600">
        <span className="w-5 text-center">↩</span> Sair
      </button>
    </aside>
  );
}
