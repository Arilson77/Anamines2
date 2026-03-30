# Anamines2 — Plataforma SaaS de Fichas de Anamnese

Plataforma para psicanalistas e profissionais de saúde mental gerenciarem fichas de anamnese digitalmente, com conformidade **LGPD**.

**Demo:** https://anamines2-omega.vercel.app

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js |
| Banco de dados | PostgreSQL com Row-Level Security (RLS) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| PDF | PDFKit (server-side) |
| Pagamentos | Stripe |
| E-mail | Nodemailer (SMTP) |
| Monitoramento | Sentry + LogSnag |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Estrutura do Projeto

```
Anamines2/
├── anamnese-api/       # Backend REST API (Node.js + Express)
├── anamnese-web/       # Frontend (Next.js 14)
├── _docs/              # Documentação e exemplos auxiliares
└── PROJETO_STATUS.md   # Documento de continuidade do projeto
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js >= 20
- PostgreSQL >= 14

### 1. Backend

```bash
cd anamnese-api
npm install
cp .env.example .env   # preencha as variáveis (veja seção abaixo)
npm run db:setup       # cria as tabelas no banco
npm run dev            # inicia na porta 3001
```

### 2. Frontend

```bash
cd anamnese-web
npm install
# crie um arquivo .env.local com:
# NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev            # inicia na porta 3000
```

---

## Variáveis de Ambiente

### Backend (`anamnese-api/.env`)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `JWT_SECRET` | Segredo para assinar JWTs (mín. 64 chars) | Sim |
| `PORT` | Porta do servidor (padrão: 3001) | Não |
| `FRONTEND_URL` | URL do frontend (para CORS e links) | Sim |
| `SMTP_HOST` | Host do servidor SMTP | Não |
| `SMTP_PORT` | Porta SMTP (ex: 587) | Não |
| `SMTP_USER` | Usuário SMTP | Não |
| `SMTP_PASS` | Senha SMTP | Não |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | Não* |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe | Não* |
| `SENTRY_DSN` | DSN do Sentry (monitoramento de erros) | Não |
| `LOGSNAG_TOKEN` | Token do LogSnag (eventos) | Não |
| `LOGSNAG_PROJECT` | Nome do projeto no LogSnag | Não |

> *Obrigatória para funcionalidades de assinatura/pagamento.

### Frontend (`anamnese-web/.env.local`)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base do backend (ex: `http://localhost:3001`) |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do Sentry para o frontend |

---

## Banco de Dados

O schema completo está em `anamnese-api/schema.sql`. Tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Clínicas/psicanalistas (multi-tenancy) |
| `usuarios` | Usuários do sistema (admin/colaborador) |
| `pacientes` | Pacientes de cada tenant |
| `fichas_anamnese` | Fichas em formato JSONB (6 seções) |
| `consentimentos_lgpd` | Registros de consentimento dos pacientes |
| `logs_acesso` | Auditoria de todas as ações (LGPD) |

O isolamento entre tenants é garantido por **Row-Level Security** no PostgreSQL, via `current_setting('app.tenant_id')`.

---

## Rodar Testes

```bash
cd anamnese-api
npm test
```

Os testes cobrem:
- Autenticação (login e cadastro)
- Isolamento de tenant (RLS)
- Fluxo de consentimento LGPD

> Requer uma instância PostgreSQL de teste. Configure `DATABASE_URL_TEST` no `.env`.

---

## Deploy

### Frontend (Vercel)
Conecte o repositório à Vercel e configure as variáveis de ambiente do frontend.

### Backend (Railway)
1. Crie um projeto no Railway apontando para `anamnese-api/`
2. Configure as variáveis de ambiente
3. O `railway.json` já está configurado para deploy automático

---

## Conformidade LGPD

- Todo acesso a dados de pacientes é registrado em `logs_acesso`
- Pacientes recebem link com token JWT (7 dias) para assinar o termo digitalmente
- Consentimentos ficam registrados com IP, data/hora e versão do termo
- RLS no banco garante isolamento total entre tenants
