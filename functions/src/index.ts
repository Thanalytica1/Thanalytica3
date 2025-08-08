import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();
const db = getFirestore();

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "healthy", runtime: "firebase-functions" });
});

// Get user by Firebase UID
app.get("/api/user/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(400).json({ message: "Invalid Firebase UID" });
    }
    const snap = await db.collection("users").doc(firebaseUid).get();
    if (!snap.exists) return res.status(404).json({ message: "User not found" });
    return res.json({ id: snap.id, ...snap.data() });
  } catch (e) {
    return res.status(500).json({ message: "Failed to get user" });
  }
});

// Create user
app.post("/api/user", async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body || {};
    if (!firebaseUid || !email) {
      return res.status(400).json({ message: "firebaseUid and email are required" });
    }
    const ref = db.collection("users").doc(firebaseUid);
    const existing = await ref.get();
    if (existing.exists) {
      return res.json({ id: existing.id, ...existing.data() });
    }
    const user = {
      firebaseUid,
      email,
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      createdAt: new Date().toISOString(),
    };
    await ref.set(user);
    return res.status(201).json({ id: ref.id, ...user });
  } catch (e) {
    return res.status(500).json({ message: "Failed to create user" });
  }
});

// Health Assessment endpoints (minimal to unblock dashboard)
app.get("/api/health-assessment/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });
    const snap = await db
      .collection("health_assessments")
      .where("userId", "==", userId)
      .limit(1)
      .get();
    if (snap.empty) {
      // Return baseline so UI can render
      return res.json({
        userId,
        age: 35,
        trajectoryRating: "MODERATE",
        biologicalAge: 35,
        vitalityScore: 75,
      });
    }
    const doc = snap.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get assessment" });
  }
});

app.post("/api/health-assessment", async (req, res) => {
  try {
    const { userId, ...data } = req.body || {};
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Valid user ID is required" });
    }
    const docRef = await db.collection("health_assessments").add({
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const saved = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...saved.data() });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create assessment" });
  }
});

// Health Metrics endpoint (minimal defaults if none exist)
app.get("/api/health-metrics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });
    const snap = await db
      .collection("health_metrics")
      .where("userId", "==", userId)
      .limit(1)
      .get();
    if (snap.empty) {
      return res.json({
        userId,
        projectedLifespan: 120,
        sleepScore: 92,
        exerciseScore: 78,
        nutritionScore: 84,
        stressScore: 71,
        cognitiveScore: 89,
        cardiovascularRisk: "Low Risk",
        metabolicRisk: "Monitor",
      });
    }
    const doc = snap.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get metrics" });
  }
});

// Recommendations endpoint (optional for dashboard)
app.get("/api/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });
    const snap = await db
      .collection("recommendations")
      .where("userId", "==", userId)
      .get();
    const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(recs);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get recommendations" });
  }
});

// Keep 501 for everything else
app.all("/api/*", (_req, res) => {
  res.status(501).json({ message: "Endpoint not yet migrated to Firebase Functions" });
});

export const api = onRequest({ region: "us-central1" }, app);


