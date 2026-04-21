'use client';
import Link from 'next/link';

const INDIVIDUAL = [
  {
    nome: 'Trial', preco: 'Grátis', periodo: '14 dias',
    descricao: 'Para conhecer o sistema sem compromisso.',
    itens: ['1 profissional', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD'],
    cta: 'Começar grátis', href: '/cadastro', destaque: false,
  },
  {
    nome: 'Básico', preco: 'R$ 49', periodo: 'por mês',
    descricao: 'Ideal para consultórios individuais.',
    itens: ['1 profissional', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD', 'Suporte por e-mail'],
    cta: 'Assinar Básico', plano: 'basico', destaque: true,
  },
  {
    nome: 'Pro', preco: 'R$ 99', periodo: 'por mês',
    descricao: 'Mais recursos para o profissional individual.',
    itens: ['1 profissional', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD', 'Suporte prioritário'],
    cta: 'Assinar Pro', plano: 'pro', destaque: false,
  },
];

const CLINICA = [
  {
    nome: 'Clínica S', preco: 'R$ 199', periodo: 'por mês',
    descricao: 'Para clínicas pequenas.',
    itens: ['Até 5 profissionais', 'Dados isolados por profissional', 'Admin com visão total', 'Todos os recursos individuais'],
    cta: 'Assinar Clínica S', plano: 'clinica_s', destaque: false,
  },
  {
    nome: 'Clínica M', preco: 'R$ 349', periodo: 'por mês',
    descricao: 'Para clínicas em crescimento.',
    itens: ['Até 10 profissionais', 'Dados isolados por profissional', 'Admin com visão total', 'Todos os recursos individuais'],
    cta: 'Assinar Clínica M', plano: 'clinica_m', destaque: true,
  },
  {
    nome: 'Clínica L', preco: 'R$ 499', periodo: 'por mês',
    descricao: 'Para grandes clínicas.',
    itens: ['Até 15 profissionais', 'Dados isolados por profissional', 'Admin com visão total', 'Todos os recursos individuais'],
    cta: 'Assinar Clínica L', plano: 'clinica_l', destaque: false,
  },
];

export default function PlanosPage() {
  async function assinar(plano: string) {
    try {
      const token = localStorage.getItem('anamnese_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cobranca/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plano }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.erro || 'Erro ao iniciar pagamento');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      alert('Erro ao conectar com o servidor');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-3xl mb-2">ψ</div>
          <h1 className="text-3xl font-light italic text-stone-800 mb-3">Escolha seu plano</h1>
          <p className="text-stone-500">Comece gratuitamente, assine quando quiser.</p>
        </div>

        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-stone-400 mb-6">Profissional individual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {INDIVIDUAL.map(p => (
            <div
              key={p.nome}
              className={`rounded-2xl p-8 flex flex-col ${
                p.destaque
                  ? 'bg-stone-800 text-white ring-2 ring-stone-800 scale-[1.03]'
                  : 'bg-white border border-stone-200'
              }`}
            >
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${p.destaque ? 'text-stone-400' : 'text-teal-600'}`}>
                  {p.nome}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl font-semibold ${p.destaque ? 'text-white' : 'text-stone-800'}`}>{p.preco}</span>
                  <span className={`text-sm mb-1 ${p.destaque ? 'text-stone-400' : 'text-stone-400'}`}>{p.periodo}</span>
                </div>
                <p className={`text-sm ${p.destaque ? 'text-stone-400' : 'text-stone-500'}`}>{p.descricao}</p>
              </div>

              <ul className="flex-1 space-y-2 mb-8">
                {p.itens.map(item => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${p.destaque ? 'text-stone-300' : 'text-stone-600'}`}>
                    <span className="text-teal-500">✓</span> {item}
                  </li>
                ))}
              </ul>

              {p.href ? (
                <Link href={p.href}
                  className={`text-center rounded-full py-3 px-6 text-sm font-medium transition ${
                    p.destaque
                      ? 'bg-white text-stone-800 hover:bg-stone-100'
                      : 'bg-stone-800 text-white hover:bg-stone-700'
                  }`}>
                  {p.cta}
                </Link>
              ) : (
                <button onClick={() => assinar(p.plano!)}
                  className={`rounded-full py-3 px-6 text-sm font-medium transition ${
                    p.destaque
                      ? 'bg-white text-stone-800 hover:bg-stone-100'
                      : 'bg-stone-800 text-white hover:bg-stone-700'
                  }`}>
                  {p.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-stone-400 mb-6">Clínicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {CLINICA.map(p => (
            <div key={p.nome} className={`rounded-2xl p-8 flex flex-col ${
              p.destaque ? 'bg-stone-800 text-white ring-2 ring-stone-800 scale-[1.03]' : 'bg-white border border-stone-200'
            }`}>
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${p.destaque ? 'text-stone-400' : 'text-teal-600'}`}>{p.nome}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl font-semibold ${p.destaque ? 'text-white' : 'text-stone-800'}`}>{p.preco}</span>
                  <span className={`text-sm mb-1 ${p.destaque ? 'text-stone-400' : 'text-stone-400'}`}>{p.periodo}</span>
                </div>
                <p className={`text-sm ${p.destaque ? 'text-stone-400' : 'text-stone-500'}`}>{p.descricao}</p>
              </div>
              <ul className="flex-1 space-y-2 mb-8">
                {p.itens.map(item => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${p.destaque ? 'text-stone-300' : 'text-stone-600'}`}>
                    <span className="text-teal-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => assinar(p.plano)}
                className={`rounded-full py-3 px-6 text-sm font-medium transition ${
                  p.destaque ? 'bg-white text-stone-800 hover:bg-stone-100' : 'bg-stone-800 text-white hover:bg-stone-700'
                }`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-stone-400 text-sm mt-10">
          Dúvidas? <a href="mailto:arilson33alves@gmail.com" className="underline">Entre em contato</a>
        </p>
      </div>
    </div>
  );
}
