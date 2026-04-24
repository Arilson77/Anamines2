const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.notificarNovaFicha = async (emailTerapeuta, nomePaciente) => {
  await transporter.sendMail({
    from:    `"Anamnese App" <${process.env.SMTP_USER}>`,
    to:      emailTerapeuta,
    subject: 'Nova ficha de anamnese recebida',
    text:    `Uma nova ficha de ${nomePaciente} foi recebida. Acesse o painel para visualizar.`,
    // Nunca enviar dados clínicos por e-mail!
  });
};

exports.avisarTrialExpirando = async (email, nome, diasRestantes) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  await transporter.sendMail({
    from:    `"Anamnese" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `Seu trial encerra em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`,
    text: [
      `Olá, ${nome}!`,
      '',
      `Seu período de trial gratuito encerra em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}.`,
      'Para continuar usando o Anamnese sem interrupção, escolha um plano:',
      '',
      `${base}/planos`,
      '',
      'Qualquer dúvida, responda este e-mail.',
    ].join('\n'),
  });
};

exports.enviarConvite = async (emailConvidado, nomeConsultorio, link) => {
  await transporter.sendMail({
    from:    `"Anamnese" <${process.env.SMTP_USER}>`,
    to:      emailConvidado,
    subject: `Você foi convidado para ${nomeConsultorio}`,
    text: [
      `Olá!`,
      '',
      `Você foi convidado para fazer parte do consultório "${nomeConsultorio}" no Anamnese.`,
      'Clique no link abaixo para criar sua conta (válido por 7 dias):',
      '',
      link,
      '',
      'Se não reconhece este convite, ignore este e-mail.',
    ].join('\n'),
  });
};

exports.enviarConfirmacaoConsulta = async ({ email, nomePaciente, nomeProfissional, nomeClinica, dataHora, requerPreparacao, dataPreparacao, linkConfirmar }) => {
  const fmt   = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });
  const linhas = [
    `Olá, ${nomePaciente}!`,
    '',
    `Sua consulta com ${nomeProfissional} em ${nomeClinica} está marcada para:`,
    `📅 ${fmt(dataHora)}`,
    '',
    requerPreparacao && dataPreparacao
      ? `⚠️  Este procedimento requer preparação. Após confirmar, você receberá as instruções.\n    Data de preparação: ${fmt(dataPreparacao)}`
      : '',
    'Confirme sua presença clicando no link:',
    linkConfirmar,
    '',
    'Se não puder comparecer, entre em contato com a clínica.',
  ].filter(l => l !== undefined);
  await transporter.sendMail({
    from: `"${nomeClinica}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Confirme sua consulta — ${fmt(dataHora)}`,
    text: linhas.join('\n'),
  });
};

exports.enviarAvisoPreparacao = async ({ email, nomePaciente, nomeClinica, dataHora, dataPreparacao, instrucoes }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });
  await transporter.sendMail({
    from: `"${nomeClinica}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Instruções de preparação para sua consulta',
    text: [
      `Olá, ${nomePaciente}!`,
      '',
      `Sua consulta está marcada para ${fmt(dataHora)}.`,
      dataPreparacao ? `A preparação deve ser iniciada em: ${fmt(dataPreparacao)}` : '',
      '',
      'Instruções de preparação:',
      instrucoes || 'Entre em contato com a clínica para detalhes.',
      '',
      'Dúvidas? Entre em contato com a clínica.',
    ].filter(Boolean).join('\n'),
  });
};

exports.enviarFichaPrecadastro = async ({ email, nomePaciente, nomeClinica, dataHora, requerPreparacao, instrucoes, linkPrecadastro }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });
  await transporter.sendMail({
    from: `"${nomeClinica}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Sua consulta está confirmada — ${fmt(dataHora)}`,
    text: [
      `Olá, ${nomePaciente}!`,
      '',
      `Sua consulta em ${nomeClinica} está confirmada para ${fmt(dataHora)}.`,
      '',
      requerPreparacao && instrucoes ? `Instruções de preparação:\n${instrucoes}\n` : '',
      'Para agilizar seu atendimento, preencha sua ficha antecipadamente:',
      linkPrecadastro,
      '',
      'O preenchimento é opcional mas agiliza o atendimento.',
    ].filter(Boolean).join('\n'),
  });
};

exports.enviarLembrete2h = async ({ email, nomePaciente, nomeProfissional, nomeClinica, dataHora }) => {
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });
  await transporter.sendMail({
    from: `"${nomeClinica}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Lembrete: sua consulta começa em 2 horas`,
    text: [
      `Olá, ${nomePaciente}!`,
      '',
      `Este é um lembrete de que sua consulta com ${nomeProfissional} em ${nomeClinica} começa em aproximadamente 2 horas.`,
      `📅 ${fmt(dataHora)}`,
      '',
      'Boa consulta!',
    ].join('\n'),
  });
};

exports.enviarRedefinicaoSenha = async (email, nome, link) => {
  await transporter.sendMail({
    from:    `"Anamnese" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Redefinição de senha',
    text: [
      `Olá, ${nome}!`,
      '',
      'Recebemos uma solicitação para redefinir a senha da sua conta.',
      'Clique no link abaixo (válido por 1 hora):',
      '',
      link,
      '',
      'Se não foi você, ignore este e-mail.',
    ].join('\n'),
  });
};
