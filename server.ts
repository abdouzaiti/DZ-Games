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
  
  // Use absolute paths relative to project root
  const distPath = path.resolve(process.cwd(), "dist");

  console.log(`[Server] Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(`[Server] Dist Path: ${distPath}`);

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
      // Disable automatic index.html serving so our wildcard handler with injection can catch it
      app.use(express.static(distPath, { index: false }));
      
      app.get("*", (req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          try {
            let content = fs.readFileSync(indexPath, "utf8");
            
            // Inject runtime env vars for Supabase
            // We use simple string replacement, which is safe for index.html
            const env = {
              SUPABASE_URL: process.env.SUPABASE_URL || '',
              SUPABASE_KEY: process.env.SUPABASE_KEY || ''
            };
            const envScript = `\n<script>window._env_ = ${JSON.stringify(env)};</script>\n`;
            
            if (content.includes('<head>')) {
              content = content.replace('<head>', `<head>${envScript}`);
            } else {
              content = envScript + content;
            }
            
            res.setHeader('Content-Type', 'text/html');
            res.send(content);
          } catch (err) {
            console.error(`[Server] Error processing index.html:`, err);
            res.status(500).send("Error loading application");
          }
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
