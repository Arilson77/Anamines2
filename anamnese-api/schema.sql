-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TENANTS (cada psicanalista/consultório)
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                   TEXT NOT NULL,
  email                  TEXT NOT NULL UNIQUE,
  plano                  TEXT NOT NULL DEFAULT 'trial', -- trial | basico | pro
  assinatura_status      TEXT NOT NULL DEFAULT 'trial', -- trial | ativa | expirada | cancelada
  trial_termina_em       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  assinatura_termina_em  TIMESTAMPTZ,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  ativo                  BOOLEAN NOT NULL DEFAULT true,
  criado_em              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona colunas novas em bancos existentes (idempotente)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS assinatura_status      TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_termina_em       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS assinatura_termina_em  TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- =============================================
-- 2. USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  papel       TEXT NOT NULL DEFAULT 'admin', -- admin | colaborador
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 3. PACIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS pacientes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  email               TEXT,
  telefone            TEXT,
  data_nascimento     DATE,
  consentimento_lgpd  BOOLEAN NOT NULL DEFAULT false,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. FICHAS DE ANAMNESE
-- =============================================
CREATE TABLE IF NOT EXISTS fichas_anamnese (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  dados         JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'rascunho', -- rascunho | enviada | arquivada
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

CREATE OR REPLACE TRIGGER trigger_fichas_atualizado_em
  BEFORE UPDATE ON fichas_anamnese
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- =============================================
-- 5. CONSENTIMENTOS LGPD
-- =============================================
CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id  UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  aceito       BOOLEAN NOT NULL DEFAULT true,
  aceito_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_origem    TEXT,
  versao_termo TEXT NOT NULL DEFAULT '1.0'
);

-- =============================================
-- 6. LOGS DE ACESSO (auditoria LGPD)
-- =============================================
CREATE TABLE IF NOT EXISTS logs_acesso (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao        TEXT NOT NULL,
  recurso     TEXT NOT NULL,
  ip_origem   TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE pacientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_anamnese     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimentos_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso         ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes'           AND policyname = 'tenant_pacientes')      THEN CREATE POLICY tenant_pacientes      ON pacientes           USING (tenant_id = current_setting('app.tenant_id')::UUID); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fichas_anamnese'     AND policyname = 'tenant_fichas')         THEN CREATE POLICY tenant_fichas         ON fichas_anamnese     USING (tenant_id = current_setting('app.tenant_id')::UUID); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consentimentos_lgpd' AND policyname = 'tenant_consentimentos') THEN CREATE POLICY tenant_consentimentos ON consentimentos_lgpd USING (tenant_id = current_setting('app.tenant_id')::UUID); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logs_acesso'         AND policyname = 'tenant_logs')           THEN CREATE POLICY tenant_logs           ON logs_acesso         USING (tenant_id = current_setting('app.tenant_id')::UUID); END IF;
END $$;

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_pacientes_tenant ON pacientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fichas_tenant    ON fichas_anamnese(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fichas_paciente  ON fichas_anamnese(paciente_id);
CREATE INDEX IF NOT EXISTS idx_logs_tenant      ON logs_acesso(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fichas_dados     ON fichas_anamnese USING GIN(dados);
