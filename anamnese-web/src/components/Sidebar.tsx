'use client';
import { usePathname, useRouter } from 'next/navigation';
import { removerToken, obterUsuario } from '@/lib/auth';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  FileText,
  Settings,
  Stethoscope,
  ClipboardList,
  MessageCircle,
  UserCog,
  CreditCard,
  LogOut,
  BarChart2,
} from 'lucide-react';

const LINKS_PRINCIPAIS = [
  { href: '/',            label: 'Painel',          Icone: LayoutDashboard },
  { href: '/agenda',      label: 'Agenda',          Icone: CalendarDays    },
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade', Icone: Clock },
  { href: '/pacientes',   label: 'Pacientes',       Icone: Users           },
  { href: '/fichas',      label: 'Fichas',          Icone: FileText        },
  { href: '/relatorios',  label: 'Relatórios',      Icone: BarChart2       },
];

const LINKS_CONFIG = [
  { href: '/configuracoes',                label: 'Configurações',  Icone: Settings,       apenasAdmin: false },
  { href: '/configuracoes/especialidades', label: 'Especialidades', Icone: Stethoscope,    apenasAdmin: true  },
  { href: '/configuracoes/procedimentos',  label: 'Procedimentos',  Icone: ClipboardList,  apenasAdmin: true  },
  { href: '/configuracoes/whatsapp',       label: 'WhatsApp',       Icone: MessageCircle,  apenasAdmin: true  },
  { href: '/configuracoes/usuarios',       label: 'Equipe',         Icone: UserCog,        apenasAdmin: true  },
  { href: '/assinatura',                   label: 'Assinatura',     Icone: CreditCard,     apenasAdmin: true  },
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
    return `flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-lg mx-2 ${
      ativo
        ? 'bg-white/15 text-white font-medium'
        : 'text-teal-100/80 hover:bg-white/10 hover:text-white'
    }`;
  }

  const configLinks = LINKS_CONFIG.filter(l => !l.apenasAdmin || isAdmin);

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?';

  return (
    <aside className="w-56 min-h-screen flex flex-col" style={{ background: '#0f766e' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-base font-bold">ψ</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-none">Anamne</p>
          <p className="text-teal-200/70 text-xs mt-0.5">Clínica Digital</p>
        </div>
      </div>

      {/* Usuário */}
      {usuario && (
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {iniciais}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{usuario.nome?.split(' ')[0]}</p>
            <p className="text-teal-200/60 text-xs capitalize">{usuario.papel}</p>
          </div>
        </div>
      )}

      {/* Nav principal */}
      <nav className="flex-1 py-3 space-y-0.5">
        {LINKS_PRINCIPAIS.map(({ href, label, Icone }) => (
          <a key={href} href={href} className={linkClass(href)}>
            <Icone size={16} strokeWidth={1.75} className="flex-shrink-0" />
            <span>{label}</span>
          </a>
        ))}

        <div className="pt-4 pb-1.5 px-5">
          <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">Configurações</p>
        </div>

        {configLinks.map(({ href, label, Icone }) => (
          <a key={href} href={href} className={linkClass(href)}>
            <Icone size={16} strokeWidth={1.75} className="flex-shrink-0" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      {/* Sair */}
      <button onClick={sair}
        className="flex items-center gap-3 px-4 py-3.5 mx-2 mb-3 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all">
        <LogOut size={16} strokeWidth={1.75} />
        <span>Sair</span>
      </button>
    </aside>
  );
}
