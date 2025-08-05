import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertHealthAssessmentSchema, insertAnalyticsEventSchema, insertReferralSchema } from "@shared/schema";
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

  // Health AI Routes
  app.post("/api/health-ai/analyze-symptoms", async (req, res) => {
    try {
      const { symptoms, userId } = req.body;
      
      // Simple AI simulation for symptom analysis
      const analysis = analyzeSymptoms(symptoms);
      const insight = await storage.createHealthInsight({
        userId,
        type: 'symptom_analysis',
        query: `Symptoms: ${symptoms.join(', ')}`,
        response: analysis.response,
        confidence: analysis.confidence,
        sources: ['clinical_guidelines', 'user_history']
      });
      
      res.json(insight);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze symptoms" });
    }
  });

  app.post("/api/health-ai/suggest-interventions", async (req, res) => {
    try {
      const { goals, userId } = req.body;
      
      // Generate personalized interventions based on goals
      const interventions = await generateInterventions(goals, userId);
      res.json(interventions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate interventions" });
    }
  });

  app.post("/api/health-ai/answer-question", async (req, res) => {
    try {
      const { question, userId } = req.body;
      
      // Simple AI response simulation
      const answer = generateHealthAnswer(question, userId);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ message: "Failed to answer question" });
    }
  });

  app.get("/api/health-ai/predict-trends/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { metricType } = req.query;
      
      const trends = await storage.getHealthTrends(userId, metricType as string);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trends" });
    }
  });

  app.post("/api/health-ai/generate-model/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const predictions = await storage.generateAdvancedMetrics(userId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate health model" });
    }
  });

  app.get("/api/health-insights/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      const insights = await storage.getHealthInsights(userId, type as string);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to get health insights" });
    }
  });

  app.get("/api/health-trends/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { metricType, limit } = req.query;
      const trends = await storage.getHealthTrends(
        userId, 
        metricType as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to get health trends" });
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

  // AI Helper Methods
  function analyzeSymptoms(symptoms: string[]): { response: string; confidence: number } {
    // Simple symptom analysis simulation
    const commonSymptoms = ['fatigue', 'headache', 'stress', 'sleep issues', 'joint pain'];
    const matchedSymptoms = symptoms.filter(s => 
      commonSymptoms.some(cs => s.toLowerCase().includes(cs))
    );
    
    let response = "Based on the symptoms you've described:\n\n";
    
    if (matchedSymptoms.length > 0) {
      response += "Common patterns suggest:\n";
      if (symptoms.some(s => s.toLowerCase().includes('fatigue'))) {
        response += "• Consider improving sleep quality and duration\n";
        response += "• Evaluate stress levels and management techniques\n";
      }
      if (symptoms.some(s => s.toLowerCase().includes('headache'))) {
        response += "• Monitor hydration and screen time\n";
        response += "• Consider stress as a contributing factor\n";
      }
      response += "\nRecommended next steps:\n";
      response += "• Track symptoms for patterns\n";
      response += "• Consult with healthcare provider if symptoms persist\n";
      response += "• Consider lifestyle modifications based on your health assessment\n";
    } else {
      response += "While I can provide general wellness guidance, these specific symptoms warrant professional medical evaluation.\n\n";
      response += "Please consult with a healthcare provider for proper diagnosis and treatment.";
    }
    
    return {
      response,
      confidence: matchedSymptoms.length > 0 ? 0.7 : 0.3
    };
  }

  async function generateInterventions(goals: string[], userId: string): Promise<any[]> {
    // Get user data for personalized recommendations
    const assessment = await storage.getHealthAssessment(userId);
    const metrics = await storage.getHealthMetrics(userId);
    
    const interventions = [];
    
    for (const goal of goals) {
      const goalLower = goal.toLowerCase();
      
      if (goalLower.includes('weight') || goalLower.includes('fitness')) {
        interventions.push({
          title: "Metabolic Enhancement Program",
          description: "Combine strength training with cardio intervals to optimize body composition and metabolic health.",
          category: "exercise",
          priority: "high",
          actionItems: [
            "3x weekly strength training sessions",
            "2x weekly cardio intervals",
            "Daily movement tracking"
          ],
          estimatedImpact: 3.5
        });
      }
      
      if (goalLower.includes('sleep')) {
        interventions.push({
          title: "Sleep Optimization Protocol",
          description: "Systematic approach to improving sleep quality and duration for enhanced recovery.",
          category: "sleep",
          priority: "high",
          actionItems: [
            "Consistent sleep schedule (10:30 PM - 6:30 AM)",
            "Blue light filtering 2 hours before bed",
            "Temperature optimization (65-68°F)"
          ],
          estimatedImpact: 4.2
        });
      }
      
      if (goalLower.includes('stress') || goalLower.includes('mental')) {
        interventions.push({
          title: "Stress Resilience Building",
          description: "Evidence-based stress management techniques to improve mental clarity and emotional balance.",
          category: "stress",
          priority: "medium",
          actionItems: [
            "Daily 10-minute meditation practice",
            "Breathing exercises during work breaks",
            "Weekly nature exposure (2+ hours)"
          ],
          estimatedImpact: 2.8
        });
      }
    }
    
    return interventions;
  }

  function generateHealthAnswer(question: string, userId: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('biological age')) {
      return "Your biological age is calculated using multiple factors including sleep quality, exercise patterns, stress levels, and lifestyle choices. Based on your current assessment, focus on improving sleep consistency and adding strength training to potentially reduce your biological age by 2-4 years.";
    }
    
    if (questionLower.includes('longevity') || questionLower.includes('live longer')) {
      return "The key longevity factors in your control are: 1) Regular exercise (especially strength training), 2) Quality sleep (7-9 hours nightly), 3) Stress management, 4) Social connections, and 5) Continuous learning. Your current assessment shows the highest potential impact from optimizing sleep and adding structured exercise.";
    }
    
    if (questionLower.includes('trends') || questionLower.includes('progress')) {
      return "I'm analyzing your health trends across multiple metrics. Your assessment data shows areas for improvement in sleep and exercise consistency. I recommend focusing on these foundational areas first, as they typically drive improvements in other health markers within 4-6 weeks.";
    }
    
    return "Based on your health profile, I recommend focusing on the fundamentals: consistent sleep, regular movement, stress management, and nutritious eating. Your personalized recommendations in the dashboard provide specific, actionable steps tailored to your current health status and goals.";
  }

  // Analytics routes
  app.post("/api/analytics/event", async (req, res) => {
    try {
      const eventData = insertAnalyticsEventSchema.parse(req.body);
      const event = await storage.createAnalyticsEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  app.get("/api/analytics/events/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, eventName, limit = 100 } = req.query;
      
      const events = await storage.getAnalyticsEvents(userId, {
        startDate: startDate as string,
        endDate: endDate as string,
        eventName: eventName as string,
        limit: parseInt(limit as string),
      });
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics events" });
    }
  });

  app.get("/api/analytics/summary/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const summary = await storage.getAnalyticsSummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics summary" });
    }
  });

  // Admin analytics route
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const adminAnalytics = await storage.getAdminAnalytics();
      res.json(adminAnalytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ error: "Failed to fetch admin analytics" });
    }
  });

  // Referral System routes
  app.get("/api/referral-code/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let referralCode = await storage.getUserReferralCode(userId);
      
      if (!referralCode) {
        referralCode = await storage.generateReferralCode(userId);
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const shareableLink = `${baseUrl}?ref=${referralCode}`;
      
      res.json({ referralCode, shareableLink });
    } catch (error) {
      res.status(500).json({ message: "Failed to get referral code" });
    }
  });

  app.get("/api/referral-stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getReferralStats(userId);
      const referrals = await storage.getReferralsByUser(userId);
      
      res.json({ ...stats, referrals });
    } catch (error) {
      res.status(500).json({ message: "Failed to get referral stats" });
    }
  });

  app.post("/api/referral", async (req, res) => {
    try {
      const referralData = insertReferralSchema.parse(req.body);
      const referral = await storage.createReferral(referralData);
      res.status(201).json(referral);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid referral data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create referral" });
    }
  });

  app.post("/api/referral/track-click", async (req, res) => {
    try {
      const { referralCode } = req.body;
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }
      
      await storage.trackReferralClick(referralCode);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to track referral click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
