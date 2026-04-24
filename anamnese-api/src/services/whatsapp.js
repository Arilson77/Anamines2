const BASE = () => process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const KEY  = () => process.env.EVOLUTION_API_KEY;
const INST = () => process.env.EVOLUTION_INSTANCE || 'clinica';

function configurado() {
  return !!(BASE() && KEY());
}

async function chamar(method, path, body) {
  const res = await fetch(`${BASE()}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: KEY() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Evolution API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Formata número brasileiro para WhatsApp
function formatarNumero(tel) {
  let num = tel.replace(/\D/g, '');
  if (!num.startsWith('55')) num = '55' + num;
  // Garante 9º dígito em números de celular (11 dígitos com DDD)
  if (num.length === 12 && num[4] !== '9') {
    num = num.slice(0, 4) + '9' + num.slice(4);
  }
  return num;
}

exports.configurado = configurado;

exports.status = async () => {
  if (!configurado()) return { estado: 'nao_configurado' };
  try {
    const data = await chamar('GET', `/instance/connectionState/${INST()}`);
    return { estado: data?.instance?.state || 'desconhecido' };
  } catch {
    return { estado: 'erro' };
  }
};

exports.qrcode = async () => {
  const data = await chamar('GET', `/instance/connect/${INST()}`);
  if (data?.base64?.startsWith('data:')) {
    data.base64 = data.base64.split(',')[1];
  }
  return data;
};

exports.desconectar = async () => {
  return chamar('DELETE', `/instance/logout/${INST()}`);
};

exports.enviarTexto = async (telefone, texto) => {
  if (!configurado()) throw new Error('Evolution API não configurada');
  const numero = formatarNumero(telefone);
  return chamar('POST', `/message/sendText/${INST()}`, {
    number:      numero,
    textMessage: { text: texto },
  });
};

// Templates de mensagem

exports.textoConfirmacao = ({ nomePaciente, nomeProfissional, nomeClinica, dataHora, requerPreparacao, dataPreparacao, linkConfirmar }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const linhas = [
    `Olá, *${nomePaciente}*! 👋`,
    '',
    `Sua consulta com *${nomeProfissional}* em *${nomeClinica}* está marcada para:`,
    `📅 ${fmt(dataHora)}`,
    '',
    requerPreparacao && dataPreparacao
      ? `⚠️ Este procedimento requer *preparação prévia* (${fmt(dataPreparacao)}).`
      : '',
    'Por favor, confirme sua presença:',
    linkConfirmar,
    '',
    '_Se não puder comparecer, entre em contato com a clínica._',
  ].filter(Boolean);
  return linhas.join('\n');
};

exports.textoAvisoPreparacao = ({ nomePaciente, nomeClinica, dataHora, dataPreparacao, instrucoes }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return [
    `Olá, *${nomePaciente}*! 🏥`,
    '',
    `Sua consulta em *${nomeClinica}* está marcada para ${fmt(dataHora)}.`,
    dataPreparacao ? `\n⚠️ A preparação deve ser iniciada em: *${fmt(dataPreparacao)}*` : '',
    '',
    '*Instruções de preparação:*',
    instrucoes || 'Entre em contato com a clínica para detalhes.',
    '',
    '_Dúvidas? Responda esta mensagem._',
  ].filter(l => l !== undefined).join('\n');
};

exports.textoPrecadastro = ({ nomePaciente, nomeClinica, dataHora, requerPreparacao, instrucoes, linkPrecadastro }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return [
    `✅ *Consulta confirmada!*`,
    '',
    `Olá, *${nomePaciente}*! Sua consulta em *${nomeClinica}* está confirmada para ${fmt(dataHora)}.`,
    '',
    requerPreparacao && instrucoes ? `*Instruções de preparação:*\n${instrucoes}\n` : '',
    '📋 Preencha sua ficha antecipadamente para agilizar o atendimento:',
    linkPrecadastro,
  ].filter(Boolean).join('\n');
};
