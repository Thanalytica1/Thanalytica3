import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

// Minimal Express app to host HTTPS endpoints on Firebase Functions
const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health endpoint (used by the client today)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "healthy", runtime: "firebase-functions" });
});

// Placeholder for remaining routes migrated from Express
// TODO: Port handlers from `server/routes.ts`, `server/oauth-routes.ts`, `server/sync-routes.ts`
app.all("/api/*", (_req, res) => {
  res.status(501).json({ message: "Endpoint not yet migrated to Firebase Functions" });
});

export const api = onRequest({ region: "us-central1" }, app);


