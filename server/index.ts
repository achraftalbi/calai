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

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
      } catch (viteError) {
        log(`Vite setup error: ${viteError instanceof Error ? viteError.message : viteError}`, "error");
        // Continue without Vite in case of setup errors
        log("Continuing without Vite development setup", "warning");
      }
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Add server error handling
    server.on('error', (error: any) => {
      log(`Server error: ${error.message}`, "error");
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`, "error");
      }
    });

    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      log(`Server is ready to accept connections on http://0.0.0.0:${port}`);
    });

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
