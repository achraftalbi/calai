import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${message}`, "error");
      res.status(status).json({ message });
    });

    // Start server first, then setup Vite separately to avoid crashes
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Add server error handling
    server.on('error', (error: any) => {
      log(`Server error: ${error.message}`, "error");
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`, "error");
      }
    });

    // Start server immediately
    await new Promise<void>((resolve) => {
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
        log(`Server is ready to accept connections on http://0.0.0.0:${port}`);
        resolve();
      });
    });

    // Setup Vite after server is listening to prevent crashes
    if (app.get("env") === "development") {
      setTimeout(async () => {
        try {
          await setupVite(app, server);
          log("Vite setup completed after server start", "info");
        } catch (viteError) {
          log(`Vite setup error: ${viteError instanceof Error ? viteError.message : viteError}`, "error");
          log("Server continues running without Vite", "warning");
          
          // Add fallback route for non-API requests
          app.use("*", (req, res, next) => {
            if (req.path.startsWith('/api')) {
              return next(); // Let API routes handle themselves
            }
            res.status(200).send(`
              <html>
                <head><title>CalAI</title></head>
                <body>
                  <h1>CalAI - Development Mode</h1>
                  <p>Server is running successfully!</p>
                  <p>Frontend development server temporarily unavailable.</p>
                  <p>API endpoints are working normally at <code>/api/*</code></p>
                </body>
              </html>
            `);
          });
        }
      }, 1000);
    } else {
      serveStatic(app);
    }

    // Handle uncaught exceptions and promise rejections
    process.on('uncaughtException', (error) => {
      log(`Uncaught Exception: ${error.message}`, "error");
      console.error(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "error");
      console.error(reason);
    });

  } catch (error) {
    log(`Server startup error: ${error instanceof Error ? error.message : error}`, "error");
    console.error(error);
    process.exit(1);
  }
})();
