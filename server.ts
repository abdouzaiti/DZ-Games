import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  const isProd = process.env.NODE_ENV === "production";
  
  // In production, server.cjs is located inside the dist folder
  const distPath = isProd ? __dirname : path.resolve(process.cwd(), "dist");

  console.log(`[Server] Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(`[Server] Base Path: ${distPath}`);

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      console.log(`[Server] Serving static files from: ${distPath}`);
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error(`[Server] index.html not found at: ${indexPath}`);
          res.status(404).send("Build index.html not found");
        }
      });
    } else {
      console.error(`[Server] CRITICAL: dist folder not found at ${distPath}`);
      app.get("*", (req, res) => {
        res.status(500).send("Application build missing. Please run build script.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
