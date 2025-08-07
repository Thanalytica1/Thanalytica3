"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const https_1 = require("firebase-functions/v2/https");
// Minimal Express app to host HTTPS endpoints on Firebase Functions
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: false, limit: "10mb" }));
// Health endpoint (used by the client today)
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy", runtime: "firebase-functions" });
});
// Placeholder for remaining routes migrated from Express
// TODO: Port handlers from `server/routes.ts`, `server/oauth-routes.ts`, `server/sync-routes.ts`
app.all("/api/*", (_req, res) => {
    res.status(501).json({ message: "Endpoint not yet migrated to Firebase Functions" });
});
exports.api = (0, https_1.onRequest)({ region: "us-central1" }, app);
