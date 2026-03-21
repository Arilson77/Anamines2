const PDFDocument = require('pdfkit');
const lgpdService = require('../services/lgpd');

const ROTULOS = {
  genero: 'Gênero', profissao: 'Profissão', estado_civil: 'Estado civil', telefone: 'Telefone',
  email_paciente: 'E-mail do paciente',
  queixa: 'Queixa principal', tempo_queixa: 'Tempo de sofrimento',
  gatilho: 'Gatilho / evento desencadeante', intensidade: 'Intensidade do sofrimento',
  familia: 'Composição familiar', infancia: 'Infância e adolescência',
  fratria: 'Irmãos / Fratria', pais: 'Relação com os pais', hist_familia: 'Histórico familiar',
  terapia_anterior: 'Terapia anterior', terapia_detalhes: 'Detalhes da terapia',
  medicacoes: 'Medicamentos', saude_geral: 'Saúde geral', substancias: 'Substâncias',
  relacionamentos: 'Relacionamentos', vida_sexual: 'Vida sexual',
  trabalho: 'Vida profissional', social_feel: 'Vida social',
  expectativas: 'Expectativas', livre: 'Espaço livre', como_chegou: 'Como chegou',
};

const SECOES_PDF = [
  { titulo: 'Identificação',    campos: ['genero', 'profissao', 'estado_civil', 'telefone', 'email_paciente'] },
  { titulo: 'Motivo da Busca',  campos: ['queixa', 'tempo_queixa', 'gatilho', 'intensidade'] },
  { titulo: 'História Familiar', campos: ['familia', 'infancia', 'fratria', 'pais', 'hist_familia'] },
  { titulo: 'Saúde',            campos: ['terapia_anterior', 'terapia_detalhes', 'medicacoes', 'saude_geral', 'substancias'] },
  { titulo: 'Vida Afetiva',     campos: ['relacionamentos', 'vida_sexual', 'trabalho', 'social_feel'] },
  { titulo: 'Espaço Livre',     campos: ['expectativas', 'livre', 'como_chegou'] },
];

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.id, f.paciente_id, p.nome AS paciente, f.status, f.criado_em
       FROM fichas_anamnese f
       JOIN pacientes p ON p.id = f.paciente_id
       ORDER BY f.criado_em DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.*, p.nome AS paciente
       FROM fichas_anamnese f
       JOIN pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Ficha não encontrada' });
    await lgpdService.log(req.dbClient, req.usuario, 'visualizou_ficha', `ficha:${req.params.id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { paciente_id, dados } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO fichas_anamnese (tenant_id, paciente_id, dados)
       VALUES ($1,$2,$3) RETURNING id, criado_em`,
      [req.usuario.tenant_id, paciente_id, JSON.stringify(dados)]
    );
    await lgpdService.log(req.dbClient, req.usuario, 'criou_ficha', `ficha:${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { dados, status } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `UPDATE fichas_anamnese SET dados=$1, status=$2
       WHERE id=$3 RETURNING id`,
      [JSON.stringify(dados), status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Ficha não encontrada' });
    await lgpdService.log(req.dbClient, req.usuario, 'editou_ficha', `ficha:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.exportar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.*, p.nome AS paciente
       FROM fichas_anamnese f
       JOIN pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Ficha não encontrada' });

    const ficha = rows[0];
    const dados = ficha.dados || {};
    const nomeArquivo = `ficha-${ficha.paciente.replace(/\s+/g, '-')}.pdf`;

    await lgpdService.log(req.dbClient, req.usuario, 'exportou_ficha', `ficha:${req.params.id}`);

    const doc = new PDFDocument({ margin: 55, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    doc.pipe(res);

    // ── Cabeçalho ──────────────────────────────────────────────
    doc.fillColor('#1c1917')
       .fontSize(22).font('Helvetica-Bold').text('ψ  Ficha de Anamnese', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#78716c')
       .text('Atendimento Psicanalítico · Sigilo Profissional', { align: 'center' });
    doc.moveDown(0.8);
    doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#d4c9be').lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Identificação ──────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1c1917').text(ficha.paciente);
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#78716c')
       .text(`Data da ficha: ${new Date(ficha.criado_em).toLocaleDateString('pt-BR')}   ·   Status: ${ficha.status}`);
    doc.moveDown(1.2);

    // ── Seções ─────────────────────────────────────────────────
    for (const secao of SECOES_PDF) {
      // Título da seção
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#78716c')
         .text(secao.titulo.toUpperCase(), { characterSpacing: 1.5 });
      doc.moveDown(0.3);
      doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#e5e0db').lineWidth(0.5).stroke();
      doc.moveDown(0.5);

      let temConteudo = false;
      for (const campo of secao.campos) {
        const val = dados[campo];
        if (!val || val === 'nao') continue;
        temConteudo = true;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#a8a29e')
           .text((ROTULOS[campo] || campo).toUpperCase(), { characterSpacing: 0.8 });
        doc.moveDown(0.1);
        doc.fontSize(10).font('Helvetica').fillColor('#1c1917')
           .text(String(val), { lineGap: 3, paragraphGap: 2 });
        doc.moveDown(0.6);
      }

      if (!temConteudo) {
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#c0b9b2').text('(sem informação registrada)');
        doc.moveDown(0.5);
      }
      doc.moveDown(0.5);
    }

    // ── Rodapé ─────────────────────────────────────────────────
    const paginaAltura = doc.page.height;
    doc.fontSize(8).fillColor('#c0b9b2')
       .text(
         'Documento confidencial — uso exclusivo do profissional de saúde.',
         55, paginaAltura - 50,
         { align: 'center', width: 485 }
       );

    doc.end();
  } catch (err) { next(err); }
};
