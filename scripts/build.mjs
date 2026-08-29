#!/usr/bin/env node
/**
 * Punto único de `npm run build`.
 *
 * Cloudflare Pages inyecta CF_PAGES=1. En ese entorno NO se corre Vite/Nitro
 * ni migraciones: el isolate no puede ejecutar pg/PGLite y el comando
 * `npm run build` del dashboard estaba rompiendo el deploy (ENOENT si la
 * rama era gh-pages, o 500 si se publicaba el Worker incompatible).
 *
 * En Pages se publica el folleto estático de docs/ → dist/.
 * En origen Node (Vercel/local) se mantiene vite build + migrate.
 */
import { cp, mkdir, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { constants } from "node:fs";

const isPages = process.env.CF_PAGES === "1";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function publishStaticBrochure() {
  const source = (await exists("docs/index.html"))
    ? "docs"
    : (await exists("DEMO/index.html"))
      ? "DEMO"
      : ".";
  console.log(`[build] CF_PAGES=1 — publicando sitio estático desde ${source}/ → dist/`);
  console.log("[build] La app con login/cámara NO corre en Pages. Ver docs/DEPLOY.md.");
  await mkdir("dist", { recursive: true });
  await cp(source, "dist", { recursive: true });
  await writeFile(
    "dist/_headers",
    `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`,
  );
  console.log("[build] listo — output: dist/");
}

async function buildOrigin() {
  await run("node", ["scripts/with-app-env.mjs", "vite", "build"]);
  await run("npm", ["run", "db:migrate"]);
}

if (isPages) {
  await publishStaticBrochure();
} else {
  await buildOrigin();
}
