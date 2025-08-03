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

  // Wearable Device routes
  app.get("/api/wearable-connections/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const connections = await storage.getWearableConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wearable connections" });
    }
  });

  app.post("/api/wearable-connections", async (req, res) => {
    try {
      const connection = await storage.createWearableConnection(req.body);
      res.status(201).json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to create wearable connection" });
    }
  });

  app.delete("/api/wearable-connections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWearableConnection(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete wearable connection" });
    }
  });

  app.get("/api/wearable-data/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { dataType, startDate, endDate } = req.query;
      const data = await storage.getWearableData(
        userId,
        dataType as string,
        startDate as string,
        endDate as string
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wearable data" });
    }
  });

  // Oura Ring OAuth callback
  app.get("/api/auth/oura/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = state; // We'll pass userId as state parameter
      
      // Exchange code for access token
      // Note: This would require OURA_CLIENT_ID and OURA_CLIENT_SECRET environment variables
      const tokenResponse = await fetch('https://api.ouraring.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.OURA_CLIENT_ID || '',
          client_secret: process.env.OURA_CLIENT_SECRET || '',
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.BASE_URL}/api/auth/oura/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      
      // Store the connection
      await storage.createWearableConnection({
        userId: userId as string,
        deviceType: 'oura',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      });

      res.redirect('/?connected=oura');
    } catch (error) {
      console.error('Oura OAuth error:', error);
      res.redirect('/?error=oura_connection_failed');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
