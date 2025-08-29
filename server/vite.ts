import type { Express } from "express";
import path from "path";
import fs from "fs";
import serveStatic from "serve-static";
import { fileURLToPath } from "url";

export function log(message: string) {
  const now = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[server ${now}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  const { createServer } = await import("vite");
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const vite = await createServer({
    root: path.resolve(dirname, "..", "client"),
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);
  return server;
}

export function serveStatic(app: Express) {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(dirname, "..", "dist", "public");
  const indexHtml = path.join(publicDir, "index.html");

  if (!fs.existsSync(publicDir)) {
    log(`static directory not found at ${publicDir}`);
    return;
  }

  app.use(serveStatic(publicDir));

  app.get("*", (_req, res) => {
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).send("Not Found");
    }
  });
}
