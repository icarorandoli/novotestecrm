#!/bin/bash
# ============================================================
#  deploy.sh — Randoli Solar CRM
#  Use este script para instalar ou atualizar o CRM
#  em qualquer VPS de cliente.
#
#  Uso:
#    chmod +x deploy.sh
#    ./deploy.sh          # atualiza instalação existente
#    ./deploy.sh --fresh  # instalação do zero
# ============================================================

set -e

REPO="https://github.com/icarorandoli/novotestecrm.git"
APP_DIR="/root/randoli-solar"
APP_NAME="randoli"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ─── INSTALAÇÃO FRESH ─────────────────────────────────────────────────────────
if [[ "$1" == "--fresh" ]]; then
  log "Iniciando instalação do zero..."

  if [ -d "$APP_DIR" ]; then
    warn "Diretório $APP_DIR já existe. Removendo..."
    rm -rf "$APP_DIR"
  fi

  log "Clonando repositório..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"

  if [ ! -f ".env" ]; then
    warn ".env não encontrado. Criando modelo..."
    cat > .env << 'EOF'
# ─── BANCO DE DADOS ───────────────────────────────────────
DATABASE_URL=postgresql://randoli:SENHA_AQUI@localhost/randoli_solar

# ─── SESSÃO ───────────────────────────────────────────────
SESSION_SECRET=mude-para-uma-chave-longa-e-aleatoria

# ─── LICENÇA (obrigatório) ────────────────────────────────
LICENSE_KEY=RAND-XXXX-XXXX-XXXX-XXXX
LICENSE_SERVER_URL=https://licenses.randolisolar.com.br

# ─── MERCADO PAGO (opcional) ──────────────────────────────
MP_ACCESS_TOKEN=

# ─── GOOGLE OAUTH (opcional) ──────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ─── SERVIDOR ─────────────────────────────────────────────
NODE_ENV=production
PORT=3000
EOF
    warn "Edite o arquivo .env antes de continuar:"
    warn "  nano $APP_DIR/.env"
    warn "Após editar, rode: ./deploy.sh"
    exit 0
  fi

  log "Instalando dependências..."
  npm install --silent

  log "Gerando build..."
  npm run build

  log "Iniciando com PM2..."
  pm2 start dist/index.cjs --name "$APP_NAME"
  pm2 save

  log "Instalação concluída! CRM rodando na porta $(grep PORT .env | cut -d= -f2 || echo 3000)"
  exit 0
fi

# ─── ATUALIZAÇÃO ──────────────────────────────────────────────────────────────
log "Atualizando CRM Randoli Solar..."

if [ ! -d "$APP_DIR" ]; then
  err "Diretório $APP_DIR não encontrado. Use ./deploy.sh --fresh para instalar."
fi

cd "$APP_DIR"

# Salva o .env atual
if [ -f ".env" ]; then
  cp .env /tmp/randoli_env_backup
  log ".env salvo em backup"
fi

log "Baixando atualizações..."
git pull origin main

# Restaura o .env (git pull não sobrescreve, mas por segurança)
if [ -f "/tmp/randoli_env_backup" ]; then
  cp /tmp/randoli_env_backup .env
  log ".env restaurado"
fi

log "Instalando dependências..."
npm install --silent

log "Gerando build..."
npm run build

# Recria tabela de sessão (necessária após rebuild)
log "Atualizando banco de dados..."
DB_URL=$(grep DATABASE_URL .env | cut -d= -f2-)
if [ -n "$DB_URL" ]; then
  psql "$DB_URL" -c "
    CREATE TABLE IF NOT EXISTS \"session\" (
      \"sid\" varchar NOT NULL COLLATE \"default\",
      \"sess\" json NOT NULL,
      \"expire\" timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);
    ALTER TABLE \"session\" ADD CONSTRAINT IF NOT EXISTS \"session_pkey\" PRIMARY KEY (\"sid\");
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON \"session\" (\"expire\");
  " 2>/dev/null || warn "Tabela de sessão já existe ou não foi possível criar."
fi

log "Reiniciando servidor..."
pm2 restart "$APP_NAME" || pm2 start dist/index.cjs --name "$APP_NAME"
pm2 save

log "Atualização concluída! ✨"
echo ""
echo "Status do processo:"
pm2 show "$APP_NAME" | grep -E "status|uptime|restarts" || true
