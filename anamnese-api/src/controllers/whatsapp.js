const waSvc = require('../services/whatsapp');

exports.status = async (req, res) => {
  try {
    const st = await waSvc.status();
    res.json(st);
  } catch (err) {
    res.json({ estado: 'erro', detalhe: err.message });
  }
};

exports.qrcode = async (req, res) => {
  try {
    const data = await waSvc.qrcode();
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

exports.desconectar = async (req, res) => {
  try {
    await waSvc.desconectar();
    res.json({ mensagem: 'Desconectado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

exports.testar = async (req, res) => {
  const { telefone } = req.body;
  if (!telefone) return res.status(400).json({ erro: 'Informe o telefone' });
  try {
    await waSvc.enviarTexto(
      telefone,
      `✅ Teste de conexão do *${req.usuario.nome || 'sistema'}*.\n\nWhatsApp configurado com sucesso!`
    );
    res.json({ mensagem: 'Mensagem de teste enviada' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
