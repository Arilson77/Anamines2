// Retorna disponibilidade de um profissional (ou do próprio usuário)
exports.listar = async (req, res, next) => {
  try {
    const profId = req.query.profissional_id || req.usuario.usuario_id;
    const [{ rows: grade }, { rows: bloqueios }] = await Promise.all([
      req.dbClient.query(
        'SELECT * FROM disponibilidades WHERE profissional_id=$1 ORDER BY dia_semana, hora_inicio',
        [profId]
      ),
      req.dbClient.query(
        `SELECT * FROM bloqueios WHERE profissional_id=$1
         AND data_fim >= CURRENT_DATE ORDER BY data_inicio`,
        [profId]
      ),
    ]);
    res.json({ grade, bloqueios });
  } catch (err) { next(err); }
};

// Salva grade semanal inteira (substitui tudo do profissional)
// Body: { profissional_id?, slots: [{dia_semana, hora_inicio, hora_fim, ativo}] }
exports.salvarGrade = async (req, res, next) => {
  const profId = req.body.profissional_id || req.usuario.usuario_id;
  const { slots = [] } = req.body;
  const client = req.dbClient;
  try {
    await client.query('DELETE FROM disponibilidades WHERE profissional_id=$1', [profId]);
    for (const s of slots) {
      if (!s.ativo) continue;
      await client.query(
        `INSERT INTO disponibilidades (tenant_id, profissional_id, dia_semana, hora_inicio, hora_fim)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.usuario.tenant_id, profId, s.dia_semana, s.hora_inicio, s.hora_fim]
      );
    }
    const { rows } = await client.query(
      'SELECT * FROM disponibilidades WHERE profissional_id=$1 ORDER BY dia_semana, hora_inicio',
      [profId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// Adiciona um bloqueio
exports.criarBloqueio = async (req, res, next) => {
  const { profissional_id, data_inicio, data_fim, motivo } = req.body;
  const profId = profissional_id || req.usuario.usuario_id;
  try {
    const { rows: [b] } = await req.dbClient.query(
      `INSERT INTO bloqueios (tenant_id, profissional_id, data_inicio, data_fim, motivo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.usuario.tenant_id, profId, data_inicio, data_fim, motivo || null]
    );
    res.status(201).json(b);
  } catch (err) { next(err); }
};

// Remove um bloqueio
exports.removerBloqueio = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM bloqueios WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
};

// Retorna slots disponíveis em uma data para um profissional
// GET /disponibilidade/slots?profissional_id=&data=YYYY-MM-DD&duracao=50
exports.slots = async (req, res, next) => {
  const { profissional_id, data, duracao = 50 } = req.query;
  const profId = profissional_id || req.usuario.usuario_id;
  try {
    const dataObj = new Date(data + 'T00:00:00');
    const diaSemana = dataObj.getDay(); // 0=dom

    const [{ rows: grade }, { rows: bloqueados }, { rows: ocupados }] = await Promise.all([
      req.dbClient.query(
        'SELECT hora_inicio, hora_fim FROM disponibilidades WHERE profissional_id=$1 AND dia_semana=$2 AND ativo=true',
        [profId, diaSemana]
      ),
      req.dbClient.query(
        `SELECT 1 FROM bloqueios WHERE profissional_id=$1
         AND $2::date BETWEEN data_inicio AND data_fim`,
        [profId, data]
      ),
      req.dbClient.query(
        `SELECT data_hora, duracao_minutos FROM consultas
         WHERE profissional_id=$1 AND DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')=$2
         AND status NOT IN ('cancelada','faltou')`,
        [profId, data]
      ),
    ]);

    if (bloqueados.length > 0) return res.json({ slots: [], bloqueado: true });
    if (grade.length === 0)    return res.json({ slots: [], bloqueado: false });

    const duracaoMin = Number(duracao);
    const slots = [];

    for (const periodo of grade) {
      const [hI, mI] = periodo.hora_inicio.split(':').map(Number);
      const [hF, mF] = periodo.hora_fim.split(':').map(Number);
      let cursor = hI * 60 + mI;
      const fim  = hF * 60 + mF;

      while (cursor + duracaoMin <= fim) {
        const hh    = String(Math.floor(cursor / 60)).padStart(2, '0');
        const mm    = String(cursor % 60).padStart(2, '0');
        const slotStr = `${data}T${hh}:${mm}:00`;

        const conflito = ocupados.some(c => {
          const cIni = new Date(c.data_hora).getTime();
          const cFim = cIni + c.duracao_minutos * 60000;
          const sIni = new Date(slotStr).getTime();
          const sFim = sIni + duracaoMin * 60000;
          return sIni < cFim && sFim > cIni;
        });

        if (!conflito) slots.push(`${hh}:${mm}`);
        cursor += duracaoMin;
      }
    }

    res.json({ slots, bloqueado: false });
  } catch (err) { next(err); }
};
