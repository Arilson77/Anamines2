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
