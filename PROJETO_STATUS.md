# Anamnese SaaS — Documento de Continuidade
> Use este arquivo para retomar o projeto em qualquer IA (Copilot, Cursor, ChatGPT etc.)

---

## 🧭 Visão geral do produto

Plataforma SaaS de fichas de anamnese para psicanalistas.
Cada psicanalista (tenant) tem seu próprio espaço isolado, gerencia seus pacientes e fichas digitalmente, com conformidade LGPD.

**Stack:**
- Frontend: Next.js 14 (App Router) + TailwindCSS + TypeScript
- Backend: Node.js + Express
- Banco: PostgreSQL com Row Level Security (RLS)
- Auth: JWT (jsonwebtoken) + bcrypt
- PDF: pdfkit (geração server-side)
- Hospedagem futura: Vercel (frontend) + Railway (backend)

---

## ✅ O QUE JÁ ESTÁ FEITO

### 1. Formulário HTML standalone (`index.html`)
- Ficha completa em HTML puro, 6 seções, barra de progresso, design psicanalítico
- Integração pendente: EmailJS (service ID, template ID, public key)

### 2. Banco de dados — `anamnese-api/schema.sql`
- 6 tabelas: tenants, usuarios, pacientes, fichas_anamnese, consentimentos_lgpd, logs_acesso
- UUID como PKs, RLS ativo via `current_setting('app.tenant_id')`, índices + GIN no JSONB

### 3. Backend — `anamnese-api/` ✅ COMPLETO

```
anamnese-api/
├── package.json          ← express, jwt, bcrypt, pg, pdfkit, nodemailer, nodemon
├── server.js             ← entry point (porta 3001)
├── schema.sql
├── .env.example
└── src/
    ├── config/db.js                    ← pool PostgreSQL
    ├── middleware/autenticar.js         ← JWT + set_config tenant (seguro)
    ├── middleware/erros.js
    ├── routes/auth.js, pacientes.js, fichas.js, publico.js, configuracoes.js
    ├── controllers/auth.js, pacientes.js, fichas.js, publico.js, configuracoes.js
    └── services/lgpd.js, email.js
```

**Todas as rotas implementadas:**

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/login` | Login → JWT | não |
| POST | `/auth/cadastro` | Cria tenant + admin | não |
| GET/POST | `/pacientes` | Lista / cria | sim |
| GET/PUT/DELETE | `/pacientes/:id` | CRUD | sim |
| GET | `/pacientes/:id/link-consentimento` | Gera JWT de consentimento LGPD | sim |
| GET/POST | `/fichas` | Lista / cria | sim |
| GET/PUT | `/fichas/:id` | Busca / atualiza | sim |
| GET | `/fichas/:id/exportar` | Gera e baixa PDF (pdfkit) | sim |
| GET | `/publico/consentimento/:token` | Valida link LGPD | não |
| POST | `/publico/consentimento/:token` | Registra consentimento | não |
| GET | `/configuracoes` | Dados do tenant/usuário | sim |
| PUT | `/configuracoes` | Atualiza nome/email | sim |
| PUT | `/configuracoes/senha` | Altera senha | sim |
| GET | `/health` | Health check | não |

### 4. Frontend — `anamnese-web/` ✅ MVP COMPLETO

```
anamnese-web/
├── package.json, tsconfig.json, next.config.mjs
├── tailwind.config.ts, postcss.config.mjs
├── .env.local            ← NEXT_PUBLIC_API_URL=http://localhost:3001
├── middleware.ts         ← protege rotas (exceto: /login /cadastro /consentimento)
└── src/
    ├── app/
    │   ├── layout.tsx + globals.css
    │   ├── (auth)/login/page.tsx          ← ✅ login
    │   ├── (auth)/cadastro/page.tsx       ← ✅ cadastro de tenant
    │   ├── consentimento/[token]/page.tsx ← ✅ página pública LGPD
    │   └── (dashboard)/
    │       ├── layout.tsx                 ← layout com Sidebar
    │       ├── page.tsx                   ← dashboard com cards de resumo
    │       ├── pacientes/page.tsx         ← ✅ lista com busca
    │       ├── pacientes/novo/page.tsx    ← ✅ formulário novo paciente
    │       ├── pacientes/[id]/page.tsx    ← ✅ detalhe + botão link LGPD
    │       ├── fichas/page.tsx            ← ✅ lista + filtro por status
    │       ├── fichas/nova/page.tsx       ← ✅ formulário 6 seções multi-step
    │       ├── fichas/[id]/page.tsx       ← ✅ visualização + exportar PDF + arquivar
    │       └── configuracoes/page.tsx     ← ✅ dados consultório + alterar senha
    ├── components/Sidebar.tsx             ← Início, Pacientes, Fichas, Configurações
    └── lib/api.ts, auth.ts
```

**Como rodar:**
```bash
# Backend
cd anamnese-api
npm install
cp .env.example .env   # preencher DATABASE_URL e JWT_SECRET
npm run db:setup       # cria tabelas
npm run dev            # porta 3001

# Frontend
cd anamnese-web
npm install
npm run dev            # porta 3000
```

---

## ✅ O QUE JÁ ESTÁ FEITO (atualizado)

### Deploy (código pronto — execução manual pendente)

- [x] `railway.json` configurado com `releaseCommand` (migração automática)
- [x] `scripts/migrate.js` — migração via Node.js, sem dependência de psql
- [x] `schema.sql` idempotente (IF NOT EXISTS + ADD COLUMN IF NOT EXISTS)
- [x] `vercel.json` configurado

### Prioridade 2 — Funcionalidades

- [x] **EmailJS no formulário standalone** (`index.html`) — IDs reais configurados
- [x] **Consentimento LGPD idempotente** — POST bloqueia uso duplo (409 se já consentido)

### Prioridade 3 — SaaS

- [x] **Sistema de planos e assinatura (Stripe)** — checkout, portal, webhook implementados
- [x] **Guard de trial/plano** — `verificarPlano.js` aplicado em `/pacientes` e `/fichas`

---

## ❌ O QUE FALTA FAZER

### Deploy — execução manual

- [ ] **Backend no Railway**: criar projeto apontando para `anamnese-api/`, adicionar PostgreSQL plugin, configurar variáveis de ambiente
- [ ] **Frontend na Vercel**: importar repo com root directory `anamnese-web/`, definir `NEXT_PUBLIC_API_URL`
- [ ] **Stripe webhook**: configurar endpoint no dashboard do Stripe

### Funcionalidades futuras

- [ ] Painel administrativo (ver todos os tenants, métricas)
- [ ] Múltiplos usuários por tenant (convite por e-mail, papel colaborador)

---

## 🔑 Decisões técnicas importantes

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Multi-tenancy | Coluna `tenant_id` + RLS | Mais simples para MVP |
| Auth | JWT stateless (8h) | Sem session store |
| Dados da ficha | JSONB | Flexível, sem migrations |
| Proteção de rotas | `middleware.ts` no Edge | Redireciona antes de carregar |
| Injeção de tenant | `set_config($1, $2, true)` | Seguro (sem SQL injection) |
| PDF | pdfkit (server-side) | A4, formatted, com auth |
| Link LGPD | JWT assinado (7d) | `/consentimento/:token` público |

---

## 📁 Estrutura do repositório

```
C:\projetos\anamnese\
├── PROJETO_STATUS.md      ← este arquivo
├── index.html             ← formulário HTML standalone
├── config.js              ← e-mail do psicanalista
├── anamnese-api/          ← backend Node.js (porta 3001)
├── anamnese-web/          ← frontend Next.js (porta 3000)
└── _docs/                 ← arquivos de referência originais
```

## 💬 Prompt para retomar

> "Sou o desenvolvedor do Anamnese SaaS — plataforma para psicanalistas gerenciarem fichas de anamnese.
> Stack: Next.js 14 (App Router) + Node.js/Express + PostgreSQL.
> Multi-tenancy via coluna tenant_id com Row Level Security.
> Auth JWT — middleware injeta `set_config('app.tenant_id', id, true)`.
> Backend COMPLETO com: CRUD pacientes/fichas, auth, PDF export (pdfkit), LGPD consent, configurações.
> Frontend COMPLETO com: login, cadastro, dashboard, pacientes, fichas multi-step, consent público, configurações.
> Leia PROJETO_STATUS.md detalhadamente antes de responder qualquer coisa."
