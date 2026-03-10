/**
 * ============================================================
 *  MIDDLEWARE DE LICENÇA — Randoli Solar
 *  Arquivo: server/middleware/license.ts
 *
 *  Adicione ao .env do cliente:
 *    LICENSE_KEY=RAND-XXXX-XXXX-XXXX-XXXX
 *    LICENSE_SERVER_URL=https://licenses.seudominio.com.br
 * ============================================================
 */

import { Request, Response, NextFunction } from "express";
import https from "https";
import http from "http";

const LICENSE_KEY = process.env.LICENSE_KEY || "";
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || "";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const WARNING_DAYS = 7;

// Estado em memória (reseta só ao reiniciar o processo)
let licenseState: {
  valid: boolean;
  checked: boolean;
  warning: boolean;
  daysLeft: number;
  expiresAt: string | null;
  reason: string;
  lastCheck: Date | null;
} = {
  valid: false,
  checked: false,
  warning: false,
  daysLeft: 0,
  expiresAt: null,
  reason: "Licença ainda não verificada",
  lastCheck: null,
};

// ─── FUNÇÃO DE VALIDAÇÃO ──────────────────────────────────────────────────────
async function validateLicense(): Promise<void> {
  if (!LICENSE_KEY || !LICENSE_SERVER_URL) {
    licenseState = {
      ...licenseState,
      valid: false,
      checked: true,
      reason: "LICENSE_KEY ou LICENSE_SERVER_URL não configurados no .env",
    };
    console.error("❌ [Licença] Variáveis de ambiente não configuradas.");
    return;
  }

  return new Promise((resolve) => {
    const body = JSON.stringify({
      license_key: LICENSE_KEY,
      domain: process.env.BASE_URL || "",
    });

    const url = new URL("/validate", LICENSE_SERVER_URL);
    const lib = url.protocol === "https:" ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 10000, // 10s timeout
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          licenseState = {
            valid: json.valid === true,
            checked: true,
            warning: json.warning === true,
            daysLeft: json.days_left || 0,
            expiresAt: json.expires_at || null,
            reason: json.reason || "",
            lastCheck: new Date(),
          };

          if (json.valid) {
            if (json.warning) {
              console.warn(
                `⚠️  [Licença] Válida — vence em ${json.days_left} dia(s)! Renove em breve.`
              );
            } else {
              console.log(
                `✅ [Licença] Válida — ${json.days_left} dia(s) restantes.`
              );
            }
          } else {
            console.error(`❌ [Licença] Inválida — ${json.reason}`);
          }
        } catch {
          // Se não conseguir parsear, mantém o último estado válido
          console.error("❌ [Licença] Resposta inválida do servidor.");
        }
        resolve();
      });
    });

    req.on("error", () => {
      // Em caso de falha de rede: se já era válida, mantém por segurança
      // Isso permite até 24h offline (próximo check)
      console.warn("⚠️  [Licença] Não foi possível contatar o servidor. Mantendo estado anterior.");
      resolve();
    });

    req.on("timeout", () => {
      req.destroy();
      console.warn("⚠️  [Licença] Timeout ao contatar servidor de licenças.");
      resolve();
    });

    req.write(body);
    req.end();
  });
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
export async function initLicense(): Promise<void> {
  console.log("🔑 [Licença] Verificando licença...");
  await validateLicense();

  // Revalida a cada 24h
  setInterval(async () => {
    console.log("🔄 [Licença] Revalidando licença (check periódico)...");
    await validateLicense();
  }, CHECK_INTERVAL_MS);
}

// ─── MIDDLEWARE HTTP ──────────────────────────────────────────────────────────
export function licenseMiddleware(req: Request, res: Response, next: NextFunction) {
  // Rotas que sempre passam (login, assets, health)
  const allowedPaths = [
    "/api/login",
    "/api/logout",
    "/api/license-status",
    "/health",
  ];

  const isAllowed = allowedPaths.some((p) => req.path.startsWith(p));
  if (isAllowed) return next();

  // Se ainda não verificou (startup), deixa passar por ora
  if (!licenseState.checked) return next();

  // Licença inválida/expirada → bloqueia API
  if (!licenseState.valid) {
    // Deixa GET de leitura passar (dados visíveis)
    if (req.method === "GET" && req.path.startsWith("/api/")) {
      res.setHeader("X-License-Warning", "expired");
      return next();
    }

    // Bloqueia qualquer escrita
    if (req.path.startsWith("/api/")) {
      return res.status(402).json({
        error: "Licença inválida ou expirada",
        reason: licenseState.reason,
        expired: true,
      });
    }
  }

  // Licença válida mas em período de aviso → injeta header para o frontend
  if (licenseState.warning) {
    res.setHeader("X-License-Warning", `expires-in-${licenseState.daysLeft}`);
  }

  next();
}

// ─── ROTA DE STATUS (use no seu router) ──────────────────────────────────────
export function licenseStatusHandler(_req: Request, res: Response) {
  res.json({
    valid: licenseState.valid,
    warning: licenseState.warning,
    days_left: licenseState.daysLeft,
    expires_at: licenseState.expiresAt,
    reason: licenseState.reason,
    last_check: licenseState.lastCheck,
  });
}
