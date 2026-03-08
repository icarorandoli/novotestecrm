# Randoli Solar v3

Portal SaaS para gestão de projetos fotovoltaicos — painel admin + portal de integradores.

---

## Instalação do Zero (VPS)

### Pré-requisitos

- Ubuntu 22.04+
- Node.js 20+
- PostgreSQL 14+
- PM2 (`npm install -g pm2`)
- Nginx

---

### 1. Clonar o repositório

```bash
git clone https://github.com/icarorandoli/randoli-solar-v3.git randoli-solar
cd randoli-solar
```

---

### 2. Criar o banco de dados

```bash
sudo -u postgres psql << 'SQL'
CREATE USER randoli WITH PASSWORD 'SUA_SENHA_AQUI';
CREATE DATABASE randoli_solar OWNER randoli;
GRANT ALL PRIVILEGES ON DATABASE randoli_solar TO randoli;
SQL
```

Rodar as migrações:

```bash
PGPASSWORD='SUA_SENHA_AQUI' psql -h localhost -U randoli -d randoli_solar -f migrate_vps.sql
```

Recriar a tabela de sessão (necessária após cada rebuild):

```bash
PGPASSWORD='SUA_SENHA_AQUI' psql -h localhost -U randoli -d randoli_solar -c "
CREATE TABLE IF NOT EXISTS \"session\" (
  \"sid\" varchar NOT NULL COLLATE \"default\",
  \"sess\" json NOT NULL,
  \"expire\" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);
ALTER TABLE \"session\" ADD CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON \"session\" (\"expire\");
"
```

---

### 3. Arquivo `.env`

Criar o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://randoli:SUA_SENHA_AQUI@localhost/randoli_solar
SESSION_SECRET=uma-chave-secreta-longa-e-aleatoria
MP_ACCESS_TOKEN=seu-access-token-mercadopago
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
NODE_ENV=production
PORT=3000
```

---

### 4. Instalar dependências e build

```bash
npm install
npm run build
```

---

### 5. Corrigir permissões do banco (caso necessário)

```bash
sudo -u postgres psql -d randoli_solar -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO randoli;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO randoli;
"
```

---

### 6. Iniciar com PM2

```bash
pm2 start dist/index.cjs --name randoli
pm2 save
pm2 startup
```

---

### 7. Nginx (proxy reverso)

```nginx
server {
    listen 80;
    server_name projetos.randolisolar.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar HTTPS com Certbot:

```bash
certbot --nginx -d projetos.randolisolar.com.br
```

---

## Atualização (VPS já configurado)

```bash
cd /root/randoli-solar
git pull origin main
npm install --silent
npm run build
pm2 restart randoli
```

> Se houver erro de permissão no banco após rebuild, rodar o comando do passo 5.

---

## Credenciais padrão

| Usuário | Senha | Papel |
|---------|-------|-------|
| admin | admin123 | Admin |

> Altere a senha do admin imediatamente após o primeiro acesso em **Configurações → Usuários**.

---

## Stack

- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + Drizzle ORM
- **Banco**: PostgreSQL
- **Autenticação**: Sessão via express-session + Google OAuth
- **Pagamentos**: Mercado Pago
- **Upload**: Object Storage (Replit) / local
