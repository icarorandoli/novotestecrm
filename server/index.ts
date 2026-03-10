import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import { seedDatabase } from "./seed";
import { initLicense, licenseMiddleware, licenseStatusHandler } from "./middleware/license";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// ─── LICENÇA ──────────────────────────────────────────────────────────────────
// Rota pública de status (usada pelo banner no frontend)
app.get("/api/license-status", licenseStatusHandler);

// Middleware que bloqueia escrita se licença inválida/expirada
app.use(licenseMiddleware);
// ──────────────────────────────────────────────────────────────────────────────

(async () => {
  // Verifica licença antes de subir o servidor
  await initLicense();

  await registerRoutes(httpServer, app);
  setupWebSocket(httpServer);
  await seedDatabase();

  // Auto-migrate: ensure inter_boleto_linha_digitavel column exists
  try {
    const { pool: dbPool } = await import("./db");
    await dbPool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_boleto_linha_digitavel TEXT`);
    console.log("[migration] inter_boleto_linha_digitavel column ensured");
  } catch (migErr: any) {
    console.warn("[migration] Could not ensure inter_boleto_linha_digitavel column:", migErr.message);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
