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
