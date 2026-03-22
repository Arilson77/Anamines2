'use client';
import Link from 'next/link';

const planos = [
  {
    nome: 'Trial',
    preco: 'Grátis',
    periodo: '14 dias',
    descricao: 'Para conhecer o sistema sem compromisso.',
    itens: ['1 usuário', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD'],
    cta: 'Começar grátis',
    href: '/cadastro',
    destaque: false,
  },
  {
    nome: 'Básico',
    preco: 'R$ 49',
    periodo: 'por mês',
    descricao: 'Ideal para consultórios individuais.',
    itens: ['1 usuário', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD', 'Suporte por e-mail'],
    cta: 'Assinar Básico',
    plano: 'basico',
    destaque: true,
  },
  {
    nome: 'Pro',
    preco: 'R$ 99',
    periodo: 'por mês',
    descricao: 'Para clínicas com múltiplos profissionais.',
    itens: ['Até 5 usuários', 'Pacientes ilimitados', 'Fichas de anamnese', 'Exportação PDF', 'Consentimento LGPD', 'Suporte prioritário', 'Relatórios avançados'],
    cta: 'Assinar Pro',
    plano: 'pro',
    destaque: false,
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planos.map(p => (
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

        <p className="text-center text-stone-400 text-sm mt-10">
          Dúvidas? <a href="mailto:arilson33alves@gmail.com" className="underline">Entre em contato</a>
        </p>
      </div>
    </div>
  );
}
