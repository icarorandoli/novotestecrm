import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, access } from "fs/promises";
import { constants as fsConstants } from "fs";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // Tenta buildar o client apenas se existir entrada do frontend.
  // Se não existir (por exemplo, uso só como API), continua e builda apenas o servidor.
  try {
    await access("client/index.html", fsConstants.F_OK);
    console.log("building client...");
    await viteBuild();
  } catch {
    console.warn("[build] client/index.html não encontrado, pulando build do client (API only).");
  }

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: allDeps,
    logLevel: "info",
  });

  console.log("copying session table SQL...");
  await copyFile(
    "node_modules/connect-pg-simple/table.sql",
    "dist/table.sql"
  );
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
