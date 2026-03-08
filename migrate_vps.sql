-- ============================================================
-- MIGRAÇÃO COMPLETA RANDOLI SOLAR
-- Roda com segurança — usa IF NOT EXISTS em tudo
-- 
-- Como executar no VPS:
--   psql -U randoli -d randoli_solar -f migrate_vps.sql
-- OU como superusuário (se der erro de permissão):
--   sudo -u postgres psql -d randoli_solar -f /root/randoli-solar/migrate_vps.sql
-- ============================================================

-- ── 1. ENUM: user_role (adicionar valores novos) ─────────────
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'engenharia';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'financeiro';
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 2. ENUM: project_status (adicionar valores novos) ────────
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'aguardando_art';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'parecer_acesso';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'instalacao';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'vistoria';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'projeto_aprovado';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'homologado';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'finalizado';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'cancelado';
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 3. ENUM: tipo_conexao ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tipo_conexao AS ENUM ('monofasico', 'bifasico', 'trifasico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. ENUM: client_type ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('PF', 'PJ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. ENUM: notif_type ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notif_type AS ENUM ('document', 'message', 'payment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 6. ENUM: document_type ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'rg_cnh','cpf_cnpj_doc','conta_energia','procuracao','foto_local',
    'diagrama_unifilar','memorial_descritivo','art','contrato',
    'projeto_aprovado','parecer_concessionaria','comprovante_pagamento','outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 7. USERS: colunas que podem estar faltando ───────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf_cnpj text;

-- ── 8. CLIENTS: colunas de endereço ──────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address text;

-- ── 9. PROJECTS: todas as colunas novas ──────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS concessionaria text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_protocolo text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_instalacao text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tipo_conexao tipo_conexao;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amperagem_disjuntor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nome_cliente text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cpf_cnpj_cliente text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS telefone_cliente text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marca_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modelo_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quantidade_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marca_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modelo_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quantidade_paineis text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS valor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_link text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_qr_code text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_payment_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_txid text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_copia_cola text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_qr_code_base64 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_status text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_engineer_id varchar REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_installer_id varchar REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_manager_id varchar REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();

-- ── 10. CHAT MESSAGES: colunas de leitura ────────────────────
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_by_integrador boolean NOT NULL DEFAULT false;

-- ── 11. STATUS_CONFIGS (cria se não existir) ─────────────────
CREATE TABLE IF NOT EXISTS status_configs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar NOT NULL UNIQUE,
  label varchar NOT NULL,
  color varchar NOT NULL DEFAULT 'slate',
  show_in_kanban boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT NOW()
);

-- ── 12. NOTIFICATIONS (cria se não existir) ──────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  type notif_type NOT NULL,
  title text NOT NULL,
  body text,
  project_id varchar REFERENCES projects(id),
  project_title text,
  ticket_number text,
  read_at timestamp,
  created_at timestamp DEFAULT NOW()
);

-- ── 13. AUDIT_LOGS (cria se não existir) ─────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id),
  user_name text,
  user_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id varchar,
  entity_label text,
  payload text,
  created_at timestamp DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);

-- ── 14. PRICING_RANGES (cria se não existir) ─────────────────
CREATE TABLE IF NOT EXISTS pricing_ranges (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  min_kwp numeric NOT NULL,
  max_kwp numeric NOT NULL,
  price numeric NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT NOW()
);

-- ── 15. CLIENT_PRICING (cria se não existir) ─────────────────
CREATE TABLE IF NOT EXISTS client_pricing (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id varchar NOT NULL REFERENCES clients(id),
  range_id varchar REFERENCES pricing_ranges(id),
  price numeric NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT NOW()
);

-- ── 16. PARTNERS (cria se não existir) ───────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT NOW()
);

-- ── 17. PASSWORD_RESET_TOKENS (cria se não existir) ──────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  token text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT NOW()
);

-- ── 18. SOLAR_IRRADIATION (nova — módulo IA) ─────────────────
CREATE TABLE IF NOT EXISTS solar_irradiation (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  irradiation_kwh_m2_day numeric(5,2) NOT NULL
);

-- ── 19. SOLAR_PANELS (nova — módulo IA) ──────────────────────
CREATE TABLE IF NOT EXISTS solar_panels (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  power_w integer NOT NULL,
  efficiency_pct numeric(5,2) NOT NULL,
  voltage_voc numeric(6,2),
  current_isc numeric(6,2),
  active boolean NOT NULL DEFAULT true
);

-- ── 20. SOLAR_INVERTERS (nova — módulo IA) ───────────────────
CREATE TABLE IF NOT EXISTS solar_inverters (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  power_kw numeric(6,2) NOT NULL,
  phases integer NOT NULL DEFAULT 1,
  mppt_count integer NOT NULL DEFAULT 1,
  min_mppt_voltage integer,
  max_mppt_voltage integer,
  active boolean NOT NULL DEFAULT true
);

-- ── 21. SESSION (connect-pg-simple) ──────────────────────────
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ── 22. PERMISSÕES ────────────────────────────────────────────
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO randoli;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO randoli;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO randoli;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO randoli;

-- ============================================================
-- Migração concluída com sucesso!
-- ============================================================
