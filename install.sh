#!/bin/bash

set -e

VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${VERDE}[OK]${NC} $1"; }
info() { echo -e "${AMARELO}[..] $1${NC}"; }
erro() { echo -e "${VERMELHO}[ERRO] $1${NC}"; exit 1; }

echo ""
echo "================================================"
echo "   Randoli Engenharia Solar — Instalador VPS"
echo "================================================"
echo ""

# ── 0. Perguntas interativas (personalização por cliente) ────────────────

read -rp "Domínio da aplicação (ex: projetos.seusistema.com.br): " DOMINIO_INPUT
DOMINIO=${DOMINIO_INPUT:-projetos.seu-dominio.com.br}

read -rp "Diretório de instalação [/root/randoli-solar]: " APP_DIR_INPUT
APP_DIR=${APP_DIR_INPUT:-/root/randoli-solar}

read -rp "Usuário do PostgreSQL [randoli]: " DB_USER_INPUT
DB_USER=${DB_USER_INPUT:-randoli}

read -rp "Nome do banco de dados [${DB_USER}_solar]: " DB_NAME_INPUT
DB_NAME_DEFAULT="${DB_USER}_solar"
DB_NAME=${DB_NAME_INPUT:-$DB_NAME_DEFAULT}

echo -n "Senha do banco de dados (será criada se não existir): "
read -rs DB_SENHA
echo ""

read -rp "E-mail de administrador (para certificados SSL): " EMAIL

read -rp "LICENSE_KEY (deixe vazio para configurar depois): " LICENSE_KEY
read -rp "LICENSE_SERVER_URL (deixe vazio para configurar depois): " LICENSE_SERVER_URL

APP_PORT=3000
SESSION_SECRET=$(tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 48)

echo ""
echo "Resumo das configurações:"
echo "  Domínio:          $DOMINIO"
echo "  Diretório app:    $APP_DIR"
echo "  DB user:          $DB_USER"
echo "  DB name:          $DB_NAME"
echo "  E-mail SSL:       $EMAIL"
echo ""
read -rp "Confirmar e continuar? [s/N]: " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
  erro "Instalação cancelada pelo usuário."
fi

# ── 1. Dependências do sistema ───────────────────────
info "Atualizando sistema e instalando dependências..."
apt-get update -qq
apt-get install -y -qq curl nginx postgresql postgresql-contrib ufw 2>/dev/null
ok "Dependências instaladas"

# ── 2. Node.js 20 ────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) instalado"
else
  ok "Node.js $(node -v) já instalado"
fi

# ── 3. PM2 ────────────────────────────────────────────
info "Instalando PM2..."
npm install -g pm2 --silent
ok "PM2 instalado"

# ── 4. PostgreSQL ─────────────────────────────────────
info "Configurando banco de dados..."
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_SENHA}';" 2>/dev/null || \
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_SENHA}';" || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
ok "Banco de dados configurado"

# ── 5. Clonar / Atualizar repositório ────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Atualizando código..."
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" reset --hard origin/main
else
  info "Clonando repositório..."
  git clone https://github.com/icarorandoli/randoli-solar.git "$APP_DIR"
fi
ok "Código pronto em $APP_DIR"

cd "$APP_DIR"

# ── 6. Arquivo .env ───────────────────────────────────
info "Criando arquivo .env..."
APP_URL_VAL="https://${DOMINIO}"
DB_SENHA_URL=$(echo "$DB_SENHA" | sed 's/@/%40/g; s/#/%23/g; s/!/%21/g; s/\$/%24/g')
cat > .env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_SENHA_URL}@localhost:5432/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
PORT=${APP_PORT}
APP_URL=${APP_URL_VAL}
LICENSE_KEY=${LICENSE_KEY}
LICENSE_SERVER_URL=${LICENSE_SERVER_URL}
EOF
ok ".env criado"

# ── 7. Instalar dependências Node ─────────────────────
info "Instalando dependências do projeto (pode demorar)..."
npm install
ok "Dependências instaladas"

# ── 8. Criar tabelas (migração segura para VPS) ───────
info "Criando/sincronizando tabelas no banco de dados..."
sudo -u postgres psql -d "${DB_NAME}" -f migrate_vps.sql
ok "Tabelas criadas/sincronizadas"

# ── 9. Build ──────────────────────────────────────────
info "Compilando o projeto (pode demorar 1-2 minutos)..."
npx tsx script/build.ts
ok "Build concluído"

# ── 9b. Pasta de uploads ───────────────────────────────
info "Criando pasta de uploads..."
mkdir -p "$APP_DIR/uploads"
ok "Pasta uploads pronta"

# ── 10. Iniciar com PM2 ───────────────────────────────
info "Iniciando servidor com PM2..."
pm2 delete randoli 2>/dev/null || true
pm2 start dist/index.cjs --name randoli
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
ok "Servidor iniciado com PM2"

# ── 11. Nginx ─────────────────────────────────────────
info "Configurando Nginx para $DOMINIO..."
cat > /etc/nginx/sites-available/randoli <<EOF
server {
    listen 80;
    server_name ${DOMINIO};
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/randoli /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
ok "Nginx configurado"

# ── 12. SSL ─────────────────────────────────────────
if [[ -n "$EMAIL" && "$DOMINIO" != "projetos.seu-dominio.com.br" ]]; then
  info "Instalando certificado SSL (HTTPS)..."
  apt-get install -y -qq certbot python3-certbot-nginx 2>/dev/null
  certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos -m "$EMAIL" 2>/dev/null && {
    ok "HTTPS ativado para $DOMINIO"
  } || {
    echo -e "${AMARELO}[AVISO] SSL falhou — verifique se o DNS já aponta para esta VPS.${NC}"
    echo "        Quando o DNS propagar, rode: sudo certbot --nginx -d $DOMINIO"
  }
else
  echo -e "${AMARELO}[AVISO] SSL não configurado automaticamente (e-mail ou domínio padrão ausentes).${NC}"
  echo "        Depois de configurar o DNS e o e-mail, rode: sudo certbot --nginx -d $DOMINIO"
fi

# ── 13. Firewall ──────────────────────────────────────
info "Configurando firewall..."
ufw allow ssh 2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true
ufw --force enable 2>/dev/null || true
ok "Firewall configurado"

# ── Resumo final ──────────────────────────────────────
echo ""
echo "================================================"
echo -e "${VERDE}   Instalação concluída com sucesso!${NC}"
echo "================================================"
echo ""
echo "  Acesse: https://${DOMINIO}"
echo ""
echo "  Login admin padrão: admin / admin123"
echo ""
echo "  Comandos úteis:"
echo "    pm2 logs randoli         — ver logs em tempo real"
echo "    pm2 restart randoli      — reiniciar o servidor"
echo "    pm2 status               — ver status do processo"
echo "    cd $APP_DIR && git pull && npx tsx script/build.ts && pm2 restart randoli"
echo ""
