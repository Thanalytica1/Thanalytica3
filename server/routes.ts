import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertHealthAssessmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/user/:firebaseUid", async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(userData.firebaseUid);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Health Assessment routes
  app.get("/api/health-assessment/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const assessment = await storage.getHealthAssessment(userId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assessment" });
    }
  });

  app.post("/api/health-assessment", async (req, res) => {
    try {
      const { userId, ...assessmentData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const validatedData = insertHealthAssessmentSchema.parse(assessmentData);
      const assessment = await storage.createHealthAssessment({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  // Health Metrics routes
  app.get("/api/health-metrics/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const metrics = await storage.getHealthMetrics(userId);
      
      if (!metrics) {
        return res.status(404).json({ message: "Metrics not found" });
      }
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  // Recommendations routes
  app.get("/api/recommendations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const recommendations = await storage.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
