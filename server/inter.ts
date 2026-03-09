import https from "https";
import { URL } from "url";

export interface InterConfig {
  clientId: string;
  clientSecret: string;
  certificate: string;
  privateKey: string;
  pixKey: string;
  environment: "sandbox" | "production";
}

const BASE_URLS = {
  production: "https://cdpj.partners.bancointer.com.br",
  sandbox: "https://cdpj-sandbox.partners.uatinter.co",
};

// Scopes tried in priority order
const SCOPE_PRIORITY = ["cob.write", "cobv.write", "boleto-cobranca.write"];

interface TokenCache {
  token: string;
  expiresAt: number;
  scope: string;
}

const tokenCache = new Map<string, TokenCache>();

export function cleanPem(pem: string): string {
  const lines = pem.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return lines.join("\n") + "\n";
}

function httpsRequest(
  baseUrl: string,
  path: string,
  method: string,
  cert: string,
  key: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(baseUrl + path);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method,
      cert: cleanPem(cert),
      key: cleanPem(key),
      rejectUnauthorized: true,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(body ? { "Content-Length": Buffer.byteLength(body).toString() } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: raw ? JSON.parse(raw) : {} });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function requestToken(
  config: InterConfig,
  scope: string
): Promise<{ status: number; data: any }> {
  const baseUrl = BASE_URLS[config.environment];
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope,
  }).toString();

  const cert = cleanPem(config.certificate);
  const key = cleanPem(config.privateKey);
  const parsed = new URL(baseUrl + "/oauth/v2/token");

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: "POST",
      cert,
      key,
      rejectUnauthorized: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Tries scopes in priority order, caches the first working token.
 * Returns { token, scope } so callers can pick the right endpoint.
 */
async function getAccessTokenWithScope(
  config: InterConfig
): Promise<{ token: string; scope: string }> {
  const baseKey = `${config.environment}:${config.clientId}`;

  // Check cache for any previously working scope
  for (const scope of SCOPE_PRIORITY) {
    const cacheKey = `${baseKey}:${scope}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt - 30_000) {
      return { token: cached.token, scope };
    }
  }

  // Try each scope until one works
  const errors: string[] = [];
  for (const scope of SCOPE_PRIORITY) {
    const result = await requestToken(config, scope);
    if (result.status === 200 && result.data.access_token) {
      const expiresIn = result.data.expires_in || 3600;
      tokenCache.set(`${baseKey}:${scope}`, {
        token: result.data.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
        scope,
      });
      console.log(`[inter] ✓ Token OK com scope: ${scope} (ambiente: ${config.environment})`);
      return { token: result.data.access_token, scope };
    }
    const errMsg = JSON.stringify(result.data);
    console.warn(`[inter] Scope "${scope}" não disponível: ${result.status} — ${errMsg}`);
    if (result.status === 429) {
      // Rate limited — no point trying other scopes, all will 429
      throw new Error(
        `Limite de requisições atingido no Banco Inter (HTTP 429). ` +
        `Aguarde 5 a 15 minutos antes de tentar novamente.`
      );
    }
    errors.push(`${scope}: ${result.status}`);
  }

  throw new Error(
    `Inter OAuth falhou para todos os escopos [${SCOPE_PRIORITY.join(", ")}]. ` +
    `Erros: ${errors.join("; ")}. ` +
    `Verifique os escopos registrados em developers.inter.co.`
  );
}

export interface InterPixResult {
  txid: string;
  pixCopiaECola: string;
  qrCodeBase64: string;
  status: string;
}

function futureDateISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateTxid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let txid = "";
  for (let i = 0; i < 26; i++) {
    txid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return txid;
}

// ── PIX Cob (cob.write) ────────────────────────────────────────────────────
async function createPixCob(
  config: InterConfig,
  token: string,
  txid: string,
  numericValue: number,
  description: string
): Promise<InterPixResult> {
  const baseUrl = BASE_URLS[config.environment];

  const body = JSON.stringify({
    calendario: { expiracao: 2592000 }, // 30 days in seconds
    valor: { original: numericValue.toFixed(2) },
    chave: config.pixKey,
    solicitacaoPagador: description.slice(0, 140),
  });

  const res = await httpsRequest(
    baseUrl,
    `/pix/v2/cob/${txid}`,
    "PUT",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` },
    body
  );

  if (res.status !== 200 && res.status !== 201) {
    console.error("[inter] PIX Cob error:", res.status, res.data);
    throw new Error(`Inter PIX cob falhou: ${res.status} — ${JSON.stringify(res.data)}`);
  }

  const pixCopiaECola: string = res.data.pixCopiaECola || res.data.brcode || "";
  const returnedTxid: string = res.data.txid || txid;

  // Try to get QR code image
  let qrCodeBase64 = "";
  try {
    const qrRes = await httpsRequest(
      baseUrl,
      `/pix/v2/cob/${returnedTxid}/qrcode`,
      "GET",
      config.certificate,
      config.privateKey,
      { Authorization: `Bearer ${token}` }
    );
    if (qrRes.status === 200) {
      const img: string = qrRes.data.imagem || qrRes.data.imagemQrcode || "";
      qrCodeBase64 = img.startsWith("data:") ? img.split(",")[1] : img;
    }
  } catch (e) {
    console.warn("[inter] Não foi possível obter imagem do QR code:", e);
  }

  console.log("[inter] ✓ PIX Cob criado. txid:", returnedTxid);
  return { txid: returnedTxid, pixCopiaECola, qrCodeBase64, status: res.data.status || "ATIVA" };
}

// ── PIX Cobv (cobv.write) ──────────────────────────────────────────────────
async function createPixCobv(
  config: InterConfig,
  token: string,
  txid: string,
  numericValue: number,
  description: string
): Promise<InterPixResult> {
  const baseUrl = BASE_URLS[config.environment];

  const body = JSON.stringify({
    calendario: {
      dataDeVencimento: futureDateISO(30),
      validadeAposVencimento: 30,
    },
    valor: { original: numericValue.toFixed(2) },
    chave: config.pixKey,
    solicitacaoPagador: description.slice(0, 140),
  });

  const res = await httpsRequest(
    baseUrl,
    `/pix/v2/cobv/${txid}`,
    "PUT",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` },
    body
  );

  if (res.status !== 200 && res.status !== 201) {
    console.error("[inter] PIX Cobv error:", res.status, res.data);
    throw new Error(`Inter PIX cobv falhou: ${res.status} — ${JSON.stringify(res.data)}`);
  }

  const pixCopiaECola: string = res.data.pixCopiaECola || res.data.brcode || "";
  const returnedTxid: string = res.data.txid || txid;

  // Try to get QR code image
  let qrCodeBase64 = "";
  try {
    const qrRes = await httpsRequest(
      baseUrl,
      `/pix/v2/cobv/${returnedTxid}/qrcode`,
      "GET",
      config.certificate,
      config.privateKey,
      { Authorization: `Bearer ${token}` }
    );
    if (qrRes.status === 200) {
      const img: string = qrRes.data.imagem || qrRes.data.imagemQrcode || "";
      qrCodeBase64 = img.startsWith("data:") ? img.split(",")[1] : img;
    }
  } catch (e) {
    console.warn("[inter] Não foi possível obter imagem do QR code cobv:", e);
  }

  console.log("[inter] ✓ PIX Cobv criado. txid:", returnedTxid);
  return { txid: returnedTxid, pixCopiaECola, qrCodeBase64, status: res.data.status || "ATIVA" };
}

// ── BoletoHíbrido (boleto-cobranca.write) ──────────────────────────────────
async function createBolepix(
  config: InterConfig,
  token: string,
  seuNumero: string,
  numericValue: number,
  pagadorNome: string,
  pagadorCpfCnpj: string,
  projectTitle: string,
  ticket: string,
  pagadorAddress?: {
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  }
): Promise<InterPixResult> {
  const baseUrl = BASE_URLS[config.environment];

  // Inter BolePIX minimum is R$ 2.50
  if (numericValue < 2.5) {
    throw new Error(`Valor mínimo para cobrança Banco Inter é R$ 2,50 (recebido: R$ ${numericValue.toFixed(2)})`);
  }

  // Determine tipoPessoa from CPF/CNPJ length (CPF=11 digits, CNPJ=14 digits)
  const digits = pagadorCpfCnpj.replace(/\D/g, "");
  const tipoPessoa = digits.length <= 11 ? "FISICA" : "JURIDICA";

  // Build pagador — only include address fields when we have real data
  // (Inter rejects explicit null values, but accepts absent keys)
  const pagador: Record<string, any> = {
    cpfCnpj: digits,
    tipoPessoa,
    nome: pagadorNome.slice(0, 100),
  };
  if (pagadorAddress?.endereco) pagador.endereco = pagadorAddress.endereco.slice(0, 90);
  if (pagadorAddress?.numero) pagador.numero = pagadorAddress.numero.slice(0, 10);
  if (pagadorAddress?.bairro) pagador.bairro = pagadorAddress.bairro.slice(0, 60);
  if (pagadorAddress?.cidade) pagador.cidade = pagadorAddress.cidade.slice(0, 60);
  if (pagadorAddress?.uf) pagador.uf = pagadorAddress.uf.slice(0, 2).toUpperCase();
  if (pagadorAddress?.cep) {
    const cepDigits = pagadorAddress.cep.replace(/\D/g, "");
    if (cepDigits.length === 8) pagador.cep = cepDigits;
  }

  const cobBody = JSON.stringify({
    seuNumero,
    valorNominal: numericValue,
    dataVencimento: futureDateISO(30),
    numDiasAgenda: 60,
    pagador,
    mensagem: {
      linha1: `Projeto Solar: ${projectTitle}`.slice(0, 70),
      linha2: `Ticket: ${ticket}`.slice(0, 70),
    },
  });

  // Correct path confirmed by diagnostic: /cobranca/v3/cobrancas (ASCII, no special chars)
  const paths = [
    "/cobranca/v3/cobrancas",
    "/cobranca-bolepix/v3/cobrancas",
  ];

  let cobRes = { status: 0, data: {} as any };
  let usedPath = "";
  for (const p of paths) {
    cobRes = await httpsRequest(
      baseUrl, p, "POST",
      config.certificate, config.privateKey,
      { Authorization: `Bearer ${token}` },
      cobBody
    );
    console.log(`[inter] BolePIX ${p} → HTTP ${cobRes.status}`);
    if (cobRes.status === 200 || cobRes.status === 201) { usedPath = p; break; }
    if (cobRes.status !== 404) break; // non-404 error → stop trying paths
  }

  if (cobRes.status !== 200 && cobRes.status !== 201) {
    console.error("[inter] Bolepix error:", cobRes.status, cobRes.data);
    throw new Error(`Inter cobrança falhou: ${cobRes.status} — ${JSON.stringify(cobRes.data)}`);
  }
  console.log("[inter] BolePIX respondeu com sucesso no path:", usedPath);

  const d = cobRes.data;
  const nossoNumero: string = d.nossoNumero || seuNumero;
  const pixCopiaECola: string = d.pixCopiaECola || d.qrCode || d.pix?.pixCopiaECola || "";
  const qrCodeBase64: string = d.imagemQrcode || d.qrCodeBase64 || "";

  console.log("[inter] ✓ BolePIX criado. nossoNumero:", nossoNumero);
  return { txid: nossoNumero, pixCopiaECola, qrCodeBase64, status: d.situacao || "EMITIDO" };
}

// ── Main export ────────────────────────────────────────────────────────────
export async function createInterPixCharge({
  config,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  integradorName,
  integradorCpfCnpj,
}: {
  config: InterConfig;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  integradorName?: string;
  integradorCpfCnpj?: string;
}): Promise<InterPixResult> {
  const numericValue = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para cobrança Inter");
  }

  const { token, scope } = await getAccessTokenWithScope(config);
  const ticket = ticketNumber || projectId.slice(0, 8).toUpperCase();
  const seuNumero = ticket.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15);
  const txid = generateTxid();
  const description = `Projeto Solar: ${projectTitle} | Ticket: ${ticket}`;
  const pagadorNome = integradorName || "Integrador Solar";
  // CPF/CNPJ is required by Inter BolePIX API; use integrador's or a placeholder
  const pagadorCpfCnpj = integradorCpfCnpj || "00000000000";

  if (scope === "cob.write") {
    return createPixCob(config, token, txid, numericValue, description);
  } else if (scope === "cobv.write") {
    return createPixCobv(config, token, txid, numericValue, description);
  } else {
    return createBolepix(config, token, seuNumero, numericValue, pagadorNome, pagadorCpfCnpj, projectTitle, ticket);
  }
}

export async function getInterPixStatus(
  config: InterConfig,
  txid: string
): Promise<{ status: string; paidAt?: string }> {
  const { token, scope } = await getAccessTokenWithScope(config);
  const baseUrl = BASE_URLS[config.environment];

  let res = { status: 0, data: {} as any };
  if (scope === "cob.write") {
    res = await httpsRequest(baseUrl, `/pix/v2/cob/${txid}`, "GET", config.certificate, config.privateKey, { Authorization: `Bearer ${token}` });
  } else if (scope === "cobv.write") {
    res = await httpsRequest(baseUrl, `/pix/v2/cobv/${txid}`, "GET", config.certificate, config.privateKey, { Authorization: `Bearer ${token}` });
  } else {
    // Use confirmed working path (ASCII, no special chars)
    const statusPaths = [
      `/cobranca/v3/cobrancas/${txid}`,
      `/cobranca-bolepix/v3/cobrancas/${txid}`,
    ];
    for (const p of statusPaths) {
      res = await httpsRequest(baseUrl, p, "GET", config.certificate, config.privateKey, { Authorization: `Bearer ${token}` });
      if (res.status === 200 || res.status !== 404) break;
    }
  }

  if (res.status !== 200) {
    throw new Error(`Inter status check falhou: ${res.status}`);
  }

  // Normalize status across APIs
  const rawStatus: string = res.data.status || res.data.situacao || "EMITIDO";
  // Map Inter PIX statuses to our internal format
  const statusMap: Record<string, string> = {
    CONCLUIDA: "PAGO",
    REMOVIDA_PELO_USUARIO_RECEBEDOR: "CANCELADO",
    REMOVIDA_PELO_PSP: "CANCELADO",
    PAGO: "PAGO",
  };
  const situacao = statusMap[rawStatus] || rawStatus;

  const paidAt: string | undefined =
    res.data.pix?.[0]?.horario ||
    res.data.dataPagamento ||
    res.data.pixPago?.[0]?.horario;

  return { status: situacao, paidAt };
}

export async function testInterConnection(
  config: InterConfig
): Promise<{ ok: boolean; message: string; scope?: string }> {
  try {
    const baseKey = `${config.environment}:${config.clientId}`;
    const now = Date.now();

    // Check if we already have valid cached tokens — avoid unnecessary OAuth requests (rate limit)
    const cachedWorking: string[] = [];
    for (const scope of SCOPE_PRIORITY) {
      const cached = tokenCache.get(`${baseKey}:${scope}`);
      if (cached && cached.expiresAt > now + 60_000) {
        cachedWorking.push(scope);
      }
    }
    if (cachedWorking.length > 0) {
      return {
        ok: true,
        message: `Conexão com Banco Inter OK (token em cache). Escopos ativos: ${cachedWorking.join(", ")}`,
        scope: cachedWorking[0],
      };
    }

    const errors: string[] = [];
    const working: string[] = [];

    for (const scope of SCOPE_PRIORITY) {
      const result = await requestToken(config, scope);
      if (result.status === 200 && result.data.access_token) {
        working.push(scope);
        const expiresIn = result.data.expires_in || 3600;
        tokenCache.set(`${baseKey}:${scope}`, {
          token: result.data.access_token,
          expiresAt: Date.now() + expiresIn * 1000,
          scope,
        });
      } else if (result.status === 429) {
        return {
          ok: false,
          message: `Limite de requisições atingido no Banco Inter (HTTP 429). Aguarde 5 a 15 minutos e tente novamente.`,
        };
      } else {
        errors.push(`${scope} (${result.status})`);
      }
    }

    if (working.length === 0) {
      return {
        ok: false,
        message:
          `Autenticação Inter falhou para todos os escopos. ` +
          `Erros: ${errors.join(", ")}. ` +
          `Verifique as credenciais e escopos em developers.inter.co.`,
      };
    }

    return {
      ok: true,
      message: `Conexão com Banco Inter OK! Escopos disponíveis: ${working.join(", ")}`,
      scope: working[0],
    };
  } catch (err: any) {
    return { ok: false, message: err.message || "Falha na conexão com o Banco Inter." };
  }
}

export interface InterDiagnosticResult {
  oauthTests: Array<{ scope: string; status: number; ok: boolean; error?: string }>;
  pathTests: Array<{ path: string; method: string; status: number; body: string }>;
  workingScope: string | null;
  recommendation: string;
}

/**
 * Diagnostic function: tests OAuth scopes + API paths without creating real charges.
 * Uses GET/HEAD requests to probe endpoints and find which ones respond (not 404).
 */
export async function diagnoseInterApi(config: InterConfig): Promise<InterDiagnosticResult> {
  const baseUrl = BASE_URLS[config.environment];
  const baseKey = `${config.environment}:${config.clientId}`;

  const now = Date.now();
  const oauthTests: InterDiagnosticResult["oauthTests"] = [];
  let workingScope: string | null = null;
  let workingToken: string | null = null;

  for (const scope of SCOPE_PRIORITY) {
    // Use cached token if still valid — avoids hammering Inter and getting rate-limited
    const cached = tokenCache.get(`${baseKey}:${scope}`);
    if (cached && cached.expiresAt > now + 60_000) {
      oauthTests.push({ scope, status: 200, ok: true, error: undefined });
      if (!workingScope) {
        workingScope = scope;
        workingToken = cached.token;
      }
      continue;
    }

    const result = await requestToken(config, scope);
    const ok = result.status === 200 && !!result.data.access_token;
    oauthTests.push({
      scope,
      status: result.status,
      ok,
      error: ok ? undefined : (result.status === 429 ? "Rate limit: aguarde 5-15 minutos" : JSON.stringify(result.data).slice(0, 200)),
    });
    if (ok && !workingScope) {
      workingScope = scope;
      workingToken = result.data.access_token;
      tokenCache.set(`${baseKey}:${scope}`, {
        token: result.data.access_token,
        expiresAt: Date.now() + (result.data.expires_in || 3600) * 1000,
        scope,
      });
    }
    // If rate limited, skip remaining scopes
    if (result.status === 429) break;
  }

  const pathTests: InterDiagnosticResult["pathTests"] = [];

  if (workingToken) {
    // Test paths that would be used for charge creation/retrieval (GET probe)
    const probePaths = [
      "/cobranca-bolepix/v3/cobran\u00E7as",
      "/cobranca-bolepix/v3/cobrancas",
      "/cobranca/v3/cobran\u00E7as",
      "/cobranca/v3/cobrancas",
      "/pix/v2/cob",
      "/pix/v2/cobv",
      "/banking/v2/billet",
    ];

    for (const p of probePaths) {
      try {
        const r = await httpsRequest(
          baseUrl, p, "GET",
          config.certificate, config.privateKey,
          { Authorization: `Bearer ${workingToken}` }
        );
        const bodyStr = typeof r.data === "string"
          ? r.data.slice(0, 100)
          : JSON.stringify(r.data).slice(0, 100);
        pathTests.push({ path: p, method: "GET", status: r.status, body: bodyStr });
      } catch (e: any) {
        pathTests.push({ path: p, method: "GET", status: 0, body: e.message });
      }
    }
  }

  // Build recommendation
  let recommendation = "";
  const rateLimited = oauthTests.some(t => t.status === 429);
  if (!workingScope && rateLimited) {
    recommendation = "Limite de requisições atingido (HTTP 429). A API do Inter bloqueou temporariamente. Aguarde 5 a 15 minutos e tente o diagnóstico novamente.";
  } else if (!workingScope) {
    recommendation = "Nenhum escopo OAuth funcionou. Verifique as credenciais (clientId, clientSecret, certificado, chave privada) e os escopos registrados em developers.inter.co.";
  } else {
    const working = pathTests.filter(p => p.status !== 404 && p.status !== 0);
    if (working.length === 0) {
      recommendation = `OAuth funcionou com escopo "${workingScope}", mas todos os paths retornaram 404. Verifique se o produto correto (Boleto/PIX) está habilitado na conta Inter em https://developers.inter.co.`;
    } else {
      recommendation = `Paths respondendo: ${working.map(p => `${p.path} (HTTP ${p.status})`).join(", ")}`;
    }
  }

  return { oauthTests, pathTests, workingScope, recommendation };
}
