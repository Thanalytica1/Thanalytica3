import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, corsConfig } from "./middleware/security";
import { generalRateLimit, cleanupRateLimit } from "./middleware/rateLimiting";
import { healthcareErrorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// Optimize for production
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for Cloud Run
  app.set('trust proxy', true);
  
  // Disable x-powered-by header for security
  app.disable('x-powered-by');
  
  // Set environment to production
  app.set('env', 'production');
}

// Apply security middleware first
app.use(securityHeaders);
app.use(corsConfig);

// Apply general rate limiting to all routes
app.use(generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  const server = await registerRoutes(app);

  // Apply healthcare-grade error handling
  app.use(healthcareErrorHandler);
  
  // Handle 404 routes
  app.use('*', notFoundHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run sets PORT=8080. Default to 5000 for local development.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Graceful shutdown handler for Cloud Run
  const gracefulShutdown = async (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    
    // Cleanup rate limiting resources
    await cleanupRateLimit();
    
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port} (${process.env.NODE_ENV || 'development'})`);
  });
})();
