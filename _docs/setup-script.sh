#!/bin/bash
# =============================================================
# setup.sh — Cria toda a estrutura do projeto Anamnese SaaS
# Uso: bash setup.sh
# =============================================================

echo "🌿 Criando estrutura do projeto Anamnese SaaS..."

# =============================================================
# BACKEND — anamnese-api
# =============================================================
mkdir -p anamnese-api/src/config
mkdir -p anamnese-api/src/middleware
mkdir -p anamnese-api/src/routes
mkdir -p anamnese-api/src/controllers
mkdir -p anamnese-api/src/services

# ---------- package.json ----------
cat > anamnese-api/package.json << 'EOF'
{
  "name": "anamnese-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start":    "node server.js",
    "dev":      "nodemon server.js",
    "db:setup": "psql $DATABASE_URL -f schema.sql"
  },
  "dependencies": {
    "bcrypt":       "^5.1.1",
    "cors":         "^2.8.5",
    "dotenv":       "^16.4.5",
    "express":      "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "nodemailer":   "^6.9.13",
    "pg":           "^8.11.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOF

# ---------- .env.example ----------
cat > anamnese-api/.env.example << 'EOF'
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/anamnese_db

# JWT — gere um segredo forte:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=seu_segredo_aqui

# Servidor
PORT=3001
FRONTEND_URL=http://localhost:3000

# E-mail (opcional por enquanto)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_app
EOF

# ---------- .gitignore ----------
cat > anamnese-api/.gitignore << 'EOF'
node_modules/
.env
EOF

# ---------- server.js ----------
cat > anamnese-api/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./src/routes/auth');
const pacientesRoutes = require('./src/routes/pacientes');
const fichasRoutes    = require('./src/routes/fichas');
const erros           = require('./src/middleware/erros');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/auth',      authRoutes);
app.use('/pacientes', pacientesRoutes);
app.use('/fichas',    fichasRoutes);

app.use(erros);

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
EOF

# ---------- schema.sql ----------
cat > anamnese-api/schema.sql << 'EOF'
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  plano     TEXT NOT NULL DEFAULT 'trial',
  ativo     BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  papel      TEXT NOT NULL DEFAULT 'admin',
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pacientes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome               TEXT NOT NULL,
  email              TEXT,
  telefone           TEXT,
  data_nascimento    DATE,
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fichas_anamnese (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  dados         JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'rascunho',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fichas_atualizado_em
  BEFORE UPDATE ON fichas_anamnese
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TABLE consentimentos_lgpd (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  aceito      BOOLEAN NOT NULL DEFAULT true,
  aceito_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_origem   TEXT,
  versao_termo TEXT NOT NULL DEFAULT '1.0'
);

CREATE TABLE logs_acesso (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao       TEXT NOT NULL,
  recurso    TEXT NOT NULL,
  ip_origem  TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pacientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_anamnese    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimentos_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso        ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_pacientes    ON pacientes          USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY tenant_fichas       ON fichas_anamnese    USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY tenant_consentimentos ON consentimentos_lgpd USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY tenant_logs         ON logs_acesso        USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_pacientes_tenant ON pacientes(tenant_id);
CREATE INDEX idx_fichas_tenant    ON fichas_anamnese(tenant_id);
CREATE INDEX idx_fichas_paciente  ON fichas_anamnese(paciente_id);
CREATE INDEX idx_logs_tenant      ON logs_acesso(tenant_id);
CREATE INDEX idx_fichas_dados     ON fichas_anamnese USING GIN(dados);
EOF

# ---------- src/config/db.js ----------
cat > anamnese-api/src/config/db.js << 'EOF'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => console.error('Erro no pool do banco:', err));
module.exports = pool;
EOF

# ---------- src/middleware/autenticar.js ----------
cat > anamnese-api/src/middleware/autenticar.js << 'EOF'
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

async function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ erro: 'Token ausente' });
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const client  = await pool.connect();
    await client.query(`SET LOCAL app.tenant_id = '${payload.tenant_id}'`);
    req.usuario  = payload;
    req.dbClient = client;
    res.on('finish', () => client.release());
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = autenticar;
EOF

# ---------- src/middleware/erros.js ----------
cat > anamnese-api/src/middleware/erros.js << 'EOF'
function erros(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno do servidor' });
}
module.exports = erros;
EOF

# ---------- src/routes/auth.js ----------
cat > anamnese-api/src/routes/auth.js << 'EOF'
const router = require('express').Router();
const ctrl   = require('../controllers/auth');
router.post('/login',    ctrl.login);
router.post('/cadastro', ctrl.cadastro);
module.exports = router;
EOF

# ---------- src/routes/pacientes.js ----------
cat > anamnese-api/src/routes/pacientes.js << 'EOF'
const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/pacientes');
router.use(autenticar);
router.get('/',      ctrl.listar);
router.get('/:id',   ctrl.buscar);
router.post('/',     ctrl.criar);
router.put('/:id',   ctrl.atualizar);
router.delete('/:id', ctrl.remover);
module.exports = router;
EOF

# ---------- src/routes/fichas.js ----------
cat > anamnese-api/src/routes/fichas.js << 'EOF'
const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/fichas');
router.use(autenticar);
router.get('/',             ctrl.listar);
router.get('/:id',          ctrl.buscar);
router.post('/',            ctrl.criar);
router.put('/:id',          ctrl.atualizar);
router.get('/:id/exportar', ctrl.exportar);
module.exports = router;
EOF

# ---------- src/controllers/auth.js ----------
cat > anamnese-api/src/controllers/auth.js << 'EOF'
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

exports.login = async (req, res, next) => {
  const { email, senha } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, tenant_id, nome, senha_hash, papel FROM usuarios WHERE email = $1',
      [email]
    );
    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash)))
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    const { id, tenant_id, nome, papel } = rows[0];
    const token = jwt.sign({ usuario_id: id, tenant_id, papel },
      process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, nome });
  } catch (err) { next(err); }
};

exports.cadastro = async (req, res, next) => {
  const { nome, email, senha } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [tenant] } = await client.query(
      'INSERT INTO tenants (nome, email) VALUES ($1, $2) RETURNING id',
      [nome, email]
    );
    const hash = await bcrypt.hash(senha, 12);
    await client.query(
      `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenant.id, nome, email, hash]
    );
    await client.query('COMMIT');
    res.status(201).json({ mensagem: 'Conta criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};
EOF

# ---------- src/controllers/pacientes.js ----------
cat > anamnese-api/src/controllers/pacientes.js << 'EOF'
const lgpd = require('../services/lgpd');

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT id, nome, email, telefone, criado_em FROM pacientes ORDER BY nome'
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT * FROM pacientes WHERE id = $1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { nome, email, telefone, data_nascimento } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO pacientes (tenant_id, nome, email, telefone, data_nascimento)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, nome, criado_em`,
      [req.usuario.tenant_id, nome, email, telefone, data_nascimento]
    );
    await lgpd.log(req.dbClient, req.usuario, 'criou_paciente', `paciente:${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { nome, email, telefone } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `UPDATE pacientes SET nome=$1, email=$2, telefone=$3
       WHERE id=$4 RETURNING id, nome`,
      [nome, email, telefone, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    await lgpd.log(req.dbClient, req.usuario, 'editou_paciente', `paciente:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM pacientes WHERE id = $1', [req.params.id]);
    await lgpd.log(req.dbClient, req.usuario, 'removeu_paciente', `paciente:${req.params.id}`);
    res.status(204).send();
  } catch (err) { next(err); }
};
EOF

# ---------- src/controllers/fichas.js ----------
cat > anamnese-api/src/controllers/fichas.js << 'EOF'
const lgpd = require('../services/lgpd');

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.id, p.nome AS paciente, f.status, f.criado_em
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
    await lgpd.log(req.dbClient, req.usuario, 'visualizou_ficha', `ficha:${req.params.id}`);
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
    await lgpd.log(req.dbClient, req.usuario, 'criou_ficha', `ficha:${rows[0].id}`);
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
    await lgpd.log(req.dbClient, req.usuario, 'editou_ficha', `ficha:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.exportar = async (req, res, next) => {
  res.json({ mensagem: 'Exportação de PDF em breve' });
};
EOF

# ---------- src/services/lgpd.js ----------
cat > anamnese-api/src/services/lgpd.js << 'EOF'
exports.log = async (dbClient, usuario, acao, recurso) => {
  await dbClient.query(
    `INSERT INTO logs_acesso (tenant_id, usuario_id, acao, recurso)
     VALUES ($1, $2, $3, $4)`,
    [usuario.tenant_id, usuario.usuario_id, acao, recurso]
  );
};

exports.registrarConsentimento = async (dbClient, tenantId, pacienteId, ip) => {
  await dbClient.query(
    `INSERT INTO consentimentos_lgpd (tenant_id, paciente_id, ip_origem)
     VALUES ($1, $2, $3)`,
    [tenantId, pacienteId, ip]
  );
  await dbClient.query(
    'UPDATE pacientes SET consentimento_lgpd = true WHERE id = $1',
    [pacienteId]
  );
};
EOF

# ---------- src/services/email.js ----------
cat > anamnese-api/src/services/email.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.notificarNovaFicha = async (emailTerapeuta, nomePaciente) => {
  await transporter.sendMail({
    from:    `"Anamnese App" <${process.env.SMTP_USER}>`,
    to:      emailTerapeuta,
    subject: 'Nova ficha de anamnese recebida',
    text:    `Uma nova ficha de ${nomePaciente} foi recebida. Acesse o painel para visualizar.`,
  });
};
EOF

echo "✅ Backend criado em anamnese-api/"

# =============================================================
# FRONTEND — anamnese-web (estrutura de pastas + arquivos lib)
# =============================================================
mkdir -p anamnese-web/src/app/\(auth\)/login
mkdir -p anamnese-web/src/app/\(auth\)/cadastro
mkdir -p anamnese-web/src/app/\(dashboard\)/pacientes
mkdir -p anamnese-web/src/app/\(dashboard\)/fichas
mkdir -p anamnese-web/src/components
mkdir -p anamnese-web/src/lib

# ---------- .env.local ----------
cat > anamnese-web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# ---------- .gitignore ----------
cat > anamnese-web/.gitignore << 'EOF'
node_modules/
.next/
.env.local
EOF

# ---------- src/lib/auth.ts ----------
cat > anamnese-web/src/lib/auth.ts << 'EOF'
const TOKEN_KEY = 'anamnese_token';

export function salvarToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaAutenticado(): boolean {
  const token = obterToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}

export function obterUsuario() {
  const token = obterToken();
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}
EOF

# ---------- src/lib/api.ts ----------
cat > anamnese-web/src/lib/api.ts << 'EOF'
import { obterToken, removerToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = obterToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    removerToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error((erro as any).erro || 'Erro na requisição');
  }
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export type Paciente = { id: string; nome: string; email: string; telefone: string; criado_em: string; };
export type Ficha    = { id: string; paciente: string; status: 'rascunho' | 'enviada' | 'arquivada'; dados: Record<string, unknown>; criado_em: string; };
EOF

# ---------- middleware.ts ----------
cat > anamnese-web/middleware.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

const ROTAS_PUBLICAS = ['/login', '/cadastro'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ROTAS_PUBLICAS.some(r => pathname.startsWith(r)) || pathname.startsWith('/_next') || pathname.startsWith('/favicon'))
    return NextResponse.next();
  const token = req.cookies.get('anamnese_token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
EOF

# ---------- src/components/Sidebar.tsx ----------
cat > anamnese-web/src/components/Sidebar.tsx << 'EOF'
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { removerToken } from '@/lib/auth';

const LINKS = [
  { href: '/',          label: 'Início',    icone: '⌂' },
  { href: '/pacientes', label: 'Pacientes', icone: '♡' },
  { href: '/fichas',    label: 'Fichas',    icone: '☰' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function sair() {
    removerToken();
    document.cookie = 'anamnese_token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <aside className="w-56 min-h-screen bg-stone-900 text-stone-300 flex flex-col px-4 py-8">
      <div className="text-center mb-10">
        <span className="text-3xl text-stone-400">ψ</span>
        <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Anamnese</p>
      </div>
      <nav className="flex-1 space-y-1">
        {LINKS.map(link => (
          <a key={link.href} href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
              pathname === link.href ? 'bg-stone-700 text-white' : 'hover:bg-stone-800 text-stone-400'
            }`}>
            <span>{link.icone}</span>{link.label}
          </a>
        ))}
      </nav>
      <button onClick={sair} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition mt-4">
        <span>→</span> Sair
      </button>
    </aside>
  );
}
EOF

# ---------- PROJETO_STATUS.md na raiz ----------
cat > PROJETO_STATUS.md << 'EOF'
# Anamnese SaaS — Documento de Continuidade

## Stack
- Frontend: Next.js 14 (App Router) + TailwindCSS + TypeScript
- Backend:  Node.js + Express
- Banco:    PostgreSQL + Row Level Security (RLS)
- Auth:     JWT + bcrypt

## Projetos
- anamnese-api/  → backend (porta 3001)
- anamnese-web/  → frontend (porta 3000)

## Para retomar — cole este prompt em outra IA:
"Estou desenvolvendo um SaaS de fichas de anamnese para psicanalistas.
Stack: Next.js 14 + Node.js/Express + PostgreSQL.
Multi-tenancy via coluna tenant_id com Row Level Security no PostgreSQL.
Auth com JWT — o middleware injeta SET LOCAL app.tenant_id na conexão do banco após validar o token.
Backend estruturado em routes → controllers → services.
Frontend com App Router, route groups (auth) e (dashboard), middleware.ts para proteção de rotas, lib/api.ts com fetch + Bearer token automático.
Leia o arquivo PROJETO_STATUS.md para ver o que já foi feito e o que falta."

## O que falta (MVP)
- [ ] Tela de cadastro (/cadastro/page.tsx)
- [ ] Página nova ficha (/fichas/nova/page.tsx) — adaptar formulário HTML
- [ ] Página ver ficha (/fichas/[id]/page.tsx)
- [ ] Página novo paciente (/pacientes/novo/page.tsx)
- [ ] Página detalhe paciente (/pacientes/[id]/page.tsx)
- [ ] Exportação de PDF (pdfkit ou puppeteer)
- [ ] Consentimento LGPD no fluxo do paciente
- [ ] Deploy: Railway (backend) + Vercel (frontend)
EOF

echo ""
echo "✅ Frontend criado em anamnese-web/"
echo ""
echo "============================================"
echo "  PRÓXIMOS PASSOS"
echo "============================================"
echo ""
echo "1. Instalar o backend:"
echo "   cd anamnese-api"
echo "   npm install"
echo "   cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET"
echo "   npm run db:setup       # cria as tabelas no PostgreSQL"
echo "   npm run dev"
echo ""
echo "2. Criar o projeto Next.js:"
echo "   cd ../anamnese-web"
echo "   npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias '@/*'"
echo "   npm run dev"
echo ""
echo "3. Abrir os dois no VS Code:"
echo "   code ."
echo ""
echo "🌿 Estrutura criada com sucesso!"
