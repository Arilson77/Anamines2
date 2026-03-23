'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Paciente } from '@/lib/api';

type Dados = Record<string, string>;
type SetFn = (campo: string, valor: string) => void;

const INPUT_CLASS =
  'w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50';
const LABEL_CLASS =
  'block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1';

function Campo({
  label, campo, dados, set, type = 'text', placeholder = '',
}: {
  label: string; campo: string; dados: Dados; set: SetFn; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={campo} className={LABEL_CLASS}>{label}</label>
      <input id={campo} type={type} value={dados[campo]} onChange={e => set(campo, e.target.value)}
        className={INPUT_CLASS} placeholder={placeholder} />
    </div>
  );
}

function Textarea({
  label, campo, dados, set, placeholder = '',
}: {
  label: string; campo: string; dados: Dados; set: SetFn; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={campo} className={LABEL_CLASS}>{label}</label>
      <textarea id={campo} value={dados[campo]} onChange={e => set(campo, e.target.value)} rows={4}
        className={`${INPUT_CLASS} resize-none`} placeholder={placeholder} />
    </div>
  );
}

function Select({
  label, campo, dados, set, options,
}: {
  label: string; campo: string; dados: Dados; set: SetFn;
  options: { val: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={campo} className={LABEL_CLASS}>{label}</label>
      <select id={campo} value={dados[campo]} onChange={e => set(campo, e.target.value)} className={INPUT_CLASS}>
        <option value="">— escolha —</option>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
    </div>
  );
}

const SECOES = [
  { titulo: 'Identificação',    icone: '◯' },
  { titulo: 'Motivo da busca',  icone: '◎' },
  { titulo: 'História familiar',icone: '◈' },
  { titulo: 'Saúde',            icone: '◇' },
  { titulo: 'Vida afetiva',     icone: '◆' },
  { titulo: 'Espaço livre',     icone: '◉' },
];

export default function NovaFichaPage() {
  return (
    <Suspense>
      <NovaFichaForm />
    </Suspense>
  );
}

function NovaFichaForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [step,      setStep]      = useState(0);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [erro,      setErro]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const [dados, setDados] = useState<Dados>({
    // Identificação
    paciente_id:  params.get('paciente_id') || '',
    nascimento: '', genero: '', profissao: '',
    estado_civil: '', telefone: '', email_paciente: '',
    // Motivo da busca
    queixa: '', tempo_queixa: '', gatilho: '', intensidade: '5',
    // História familiar
    familia: '', infancia: '', fratria: '', pais: '', hist_familia: '',
    // Saúde
    terapia_anterior: 'nao', terapia_detalhes: '',
    medicacoes: '', saude_geral: '', substancias: 'nao',
    // Vida afetiva
    relacionamentos: '', vida_sexual: '', trabalho: '', social_feel: '',
    // Espaço livre
    expectativas: '', livre: '', como_chegou: '',
  });

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setPacientes).catch(console.error);
  }, []);

  function set(campo: string, valor: string) {
    setDados(d => ({ ...d, [campo]: valor }));
  }

  const secaoAtual = [
    // 0 — Identificação
    <div key={0} className="space-y-4">
      <div>
        <label htmlFor="paciente_id" className={LABEL_CLASS}>Paciente *</label>
        <select id="paciente_id" value={dados.paciente_id} onChange={e => set('paciente_id', e.target.value)}
          className={INPUT_CLASS} required>
          <option value="">— selecione —</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo dados={dados} set={set} label="Data de nascimento" campo="nascimento" type="date" />
        <Select dados={dados} set={set} label="Gênero" campo="genero" options={[
          { val: 'feminino', label: 'Feminino' },
          { val: 'masculino', label: 'Masculino' },
          { val: 'nao_binario', label: 'Não-binário' },
          { val: 'outro', label: 'Outro / Prefiro não responder' },
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo dados={dados} set={set} label="Profissão" campo="profissao" placeholder="Ex: professora" />
        <Select dados={dados} set={set} label="Estado civil" campo="estado_civil" options={[
          { val: 'solteiro', label: 'Solteiro(a)' },
          { val: 'casado', label: 'Casado(a)' },
          { val: 'divorciado', label: 'Divorciado(a)' },
          { val: 'viuvo', label: 'Viúvo(a)' },
          { val: 'uniao_estavel', label: 'União estável' },
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo dados={dados} set={set} label="Telefone" campo="telefone" placeholder="(11) 99999-9999" />
        <Campo dados={dados} set={set} label="E-mail do paciente" campo="email_paciente" type="email" placeholder="paciente@email.com" />
      </div>
    </div>,

    // 1 — Motivo da busca
    <div key={1} className="space-y-4">
      <Textarea dados={dados} set={set} label="Queixa principal" campo="queixa"
        placeholder="Descreva o principal motivo que trouxe o paciente à terapia…" />
      <Campo dados={dados} set={set} label="Há quanto tempo sente isso?" campo="tempo_queixa" placeholder="Ex: 3 meses, 2 anos…" />
      <Textarea dados={dados} set={set} label="Existe algum gatilho ou evento desencadeante?" campo="gatilho"
        placeholder="Algo que pode ter iniciado ou intensificado o problema…" />
      <div>
        <label className={`${LABEL_CLASS} mb-2`}>
          Intensidade do sofrimento (1 = leve · 10 = muito intenso)
        </label>
        <div className="flex items-center gap-4">
          <input type="range" min="1" max="10" value={dados.intensidade}
            onChange={e => set('intensidade', e.target.value)}
            className="flex-1 accent-stone-700" />
          <span className="text-2xl font-light text-stone-700 w-8 text-center">{dados.intensidade}</span>
        </div>
      </div>
    </div>,

    // 2 — História familiar
    <div key={2} className="space-y-4">
      <Textarea dados={dados} set={set} label="Composição familiar atual" campo="familia"
        placeholder="Com quem mora? Como é a dinâmica familiar?" />
      <Textarea dados={dados} set={set} label="Infância e adolescência" campo="infancia"
        placeholder="Memórias marcantes, ambiente familiar na infância…" />
      <Campo dados={dados} set={set} label="Irmãos / Fratria" campo="fratria" placeholder="Ex: 2 irmãos mais velhos" />
      <Textarea dados={dados} set={set} label="Relação com os pais" campo="pais"
        placeholder="Como descreve a relação com o pai e a mãe?" />
      <Textarea dados={dados} set={set} label="Histórico familiar de saúde mental" campo="hist_familia"
        placeholder="Doenças mentais, vícios, perdas significativas na família…" />
    </div>,

    // 3 — Saúde
    <div key={3} className="space-y-4">
      <Select dados={dados} set={set} label="Já fez terapia anteriormente?" campo="terapia_anterior" options={[
        { val: 'nao', label: 'Não' },
        { val: 'sim', label: 'Sim' },
      ]} />
      {dados.terapia_anterior === 'sim' && (
        <Textarea dados={dados} set={set} label="Detalhes sobre a terapia anterior" campo="terapia_detalhes"
          placeholder="Quanto tempo, abordagem, motivo de encerramento…" />
      )}
      <Textarea dados={dados} set={set} label="Uso de medicamentos" campo="medicacoes"
        placeholder="Psiquiátricos, contínuos ou outros relevantes (ou 'nenhum')…" />
      <Textarea dados={dados} set={set} label="Estado geral de saúde" campo="saude_geral"
        placeholder="Doenças crônicas, cirurgias, condições físicas importantes…" />
      <Select dados={dados} set={set} label="Uso de álcool, tabaco ou outras substâncias?" campo="substancias" options={[
        { val: 'nao', label: 'Não' },
        { val: 'alcool', label: 'Álcool' },
        { val: 'tabaco', label: 'Tabaco' },
        { val: 'multiplos', label: 'Múltiplas substâncias' },
      ]} />
    </div>,

    // 4 — Vida afetiva
    <div key={4} className="space-y-4">
      <Textarea dados={dados} set={set} label="Relacionamentos afetivos" campo="relacionamentos"
        placeholder="Histórico de relacionamentos, padrões recorrentes…" />
      <Textarea dados={dados} set={set} label="Vida sexual" campo="vida_sexual"
        placeholder="Somente se o paciente trouxer espontaneamente ou for relevante…" />
      <Textarea dados={dados} set={set} label="Vida profissional e financeira" campo="trabalho"
        placeholder="Satisfação no trabalho, situação financeira, estressores…" />
      <Select dados={dados} set={set} label="Como se sente socialmente?" campo="social_feel" options={[
        { val: 'conectado',   label: 'Conectado — tenho suporte social' },
        { val: 'isolado',     label: 'Isolado — poucas conexões' },
        { val: 'ambivalente', label: 'Ambivalente — sentimentos mistos' },
      ]} />
    </div>,

    // 5 — Espaço livre
    <div key={5} className="space-y-4">
      <Textarea dados={dados} set={set} label="Expectativas com a terapia" campo="expectativas"
        placeholder="O que espera alcançar? Como imagina que a terapia pode ajudar?" />
      <Textarea dados={dados} set={set} label="Espaço livre" campo="livre"
        placeholder="Algo que não foi perguntado e que considera importante compartilhar…" />
      <Select dados={dados} set={set} label="Como chegou até aqui?" campo="como_chegou" options={[
        { val: 'indicacao',  label: 'Indicação de alguém' },
        { val: 'busca',      label: 'Busca na internet' },
        { val: 'convenio',   label: 'Convênio / plano de saúde' },
        { val: 'redes',      label: 'Redes sociais' },
        { val: 'outro',      label: 'Outro' },
      ]} />
    </div>,
  ];

  async function salvar(status: 'rascunho' | 'enviada') {
    if (!dados.paciente_id) { setErro('Selecione um paciente'); return; }
    setErro('');
    setLoading(true);
    try {
      await api.post('/fichas', { paciente_id: dados.paciente_id, dados, status });
      router.push('/fichas');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const progresso = Math.round(((step + 1) / SECOES.length) * 100);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/fichas" className="text-stone-400 hover:text-stone-600 text-sm">← Fichas</a>
        <h1 className="text-2xl font-light italic text-stone-800">Nova ficha de anamnese</h1>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>{SECOES[step].icone} {SECOES[step].titulo}</span>
          <span>{step + 1} / {SECOES.length}</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {/* Navegação por seções */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {SECOES.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
              i === step
                ? 'bg-stone-800 text-white border-stone-800'
                : i < step
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'text-stone-400 border-stone-200 hover:bg-stone-100'
            }`}>
            {s.icone} {s.titulo}
          </button>
        ))}
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-stone-200 p-8">
        {secaoAtual[step]}

        {erro && <p className="text-red-500 text-sm mt-4">{erro}</p>}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="px-5 py-2.5 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition">
            ← Anterior
          </button>

          <div className="flex gap-2">
            {step < SECOES.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-6 py-2.5 bg-stone-800 text-white rounded-full text-sm hover:bg-stone-700 transition">
                Próximo →
              </button>
            ) : (
              <>
                <button onClick={() => salvar('rascunho')} disabled={loading}
                  className="px-5 py-2.5 border border-stone-300 rounded-full text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition">
                  Salvar rascunho
                </button>
                <button onClick={() => salvar('enviada')} disabled={loading}
                  className="px-6 py-2.5 bg-stone-800 text-white rounded-full text-sm hover:bg-stone-700 disabled:opacity-50 transition">
                  {loading ? 'Salvando…' : 'Enviar ficha'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
