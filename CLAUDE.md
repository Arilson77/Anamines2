# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anamnese SaaS — platform for psychoanalysts to manage patient anamnesis forms digitally, with LGPD compliance. Multi-tenant architecture where each psychoanalyst (tenant) has a fully isolated workspace.

**Stack:** Next.js 14 (App Router) + Node.js/Express + PostgreSQL + Stripe + Railway/Vercel

## Commands

### Backend (`anamnese-api/`)
```bash
npm run dev          # Start dev server on port 3001
npm run db:setup     # Run schema migrations via Node.js (not psql)
npm test             # Run all tests (requires DATABASE_URL_TEST)
npm run lint         # ESLint
npm run format       # Prettier
```

Run a single test file:
```bash
npx jest src/tests/auth.test.js --runInBand
```

### Frontend (`anamnese-web/`)
```bash
npm run dev    # Start Next.js on port 3000
npm run build  # Production build
npm run lint   # Next.js ESLint
```

## Architecture

### Multi-tenancy
Every database table (except `tenants` and `usuarios`) is isolated via **PostgreSQL Row Level Security (RLS)** using `current_setting('app.tenant_id')::UUID`. The `autenticar` middleware injects this setting per-request via `SELECT set_config('app.tenant_id', tenant_id, true)` — this is transaction-scoped and SQL-injection safe.

### Auth flow
- JWT is stateless (8h expiry), signed with `JWT_SECRET`
- **Backend** (`autenticar.js`): validates JWT, injects `app.tenant_id` into PostgreSQL session, attaches `req.usuario` and `req.dbClient`
- **Frontend middleware** (`middleware.ts`): runs on Edge, reads token from cookie `anamnese_token`, verifies with `jose` (not jsonwebtoken — Edge-compatible)
- **Frontend API calls** (`lib/auth.ts`): token stored in `localStorage` as `anamnese_token`, read by `lib/api.ts`

> Note: there's a dual-storage pattern — cookie for Edge middleware auth checks, localStorage for API calls.

### Subscription guard
`verificarPlano.js` middleware is applied to `/pacientes` and `/fichas` routes. It checks `assinatura_status` and `trial_termina_em` from the `tenants` table, auto-updates expired trials, and returns **402** if access is blocked. The frontend (`lib/api.ts`) redirects to `/planos` on 402.

### Stripe integration
`src/controllers/cobranca.js` — Stripe is initialized lazily per-request via `getStripe()` (not at module load time) to avoid caching issues in Railway restarts. PLANOS object is also module-level but price_ids are read at module load.

### PDF export
`GET /fichas/:id/exportar` — generates A4 PDF server-side with pdfkit, streams directly to response with `Content-Disposition: attachment`.

### LGPD consent flow
1. Psychoanalyst generates a signed JWT link (7d expiry) via `GET /pacientes/:id/link-consentimento`
2. Patient accesses public page `/consentimento/:token` (no auth required)
3. `POST /publico/consentimento/:token` is idempotent — returns 409 if already consented

### Frontend route structure
- `(auth)/` — public: `/login`, `/cadastro`
- `(dashboard)/` — protected by Edge middleware: all main app pages
- `consentimento/[token]/` — public patient consent page
- `planos/` — public pricing page (calls authenticated `/cobranca/checkout` endpoint)

### Testing
Tests require a real PostgreSQL instance (`DATABASE_URL_TEST`). `globalSetup.js` runs `schema.sql` via `psql` binary before tests. `helpers.js` provides `limparBanco()` (truncates all tables) and `criarTenant()`.

> `globalSetup.js` uses `psql` binary (unlike production which uses `scripts/migrate.js`). Tests must run with `--runInBand` (no parallelism) due to shared DB state.

## Key environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | API | PostgreSQL connection |
| `DATABASE_URL_TEST` | API | Separate test database |
| `JWT_SECRET` | API | Signs all JWTs (auth + LGPD consent) |
| `FRONTEND_URL` | API | CORS + Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | API | Must start with `sk_live_` or `sk_test_` |
| `STRIPE_PRICE_BASICO` / `STRIPE_PRICE_PRO` | API | Stripe Price IDs (start with `price_`, NOT `prod_`) |
| `NEXT_PUBLIC_API_URL` | Web | Backend URL, inlined at build time |
| `JWT_SECRET` | Web | Edge middleware JWT verification |

## Deploy

- **Backend**: Railway, root directory `anamnese-api/`. `releaseCommand` in `railway.json` auto-runs migrations on every deploy.
- **Frontend**: Vercel, root directory `anamnese-web/`. `NEXT_PUBLIC_API_URL` must point to Railway URL.
- **`trust proxy`** is set to `1` in `app.js` — required for rate limiter to work correctly behind Railway's reverse proxy.
