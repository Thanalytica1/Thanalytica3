// Health Metrics Cloud Functions
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import { HealthMetric, healthMetricSchema } from "../../../shared/health-schema";

const db = getFirestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Get health metrics for a user
app.get("/metrics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 100, startDate, endDate } = req.query;

    let query = db.collection(`users/${userId}/healthMetrics`);
    
    if (type) {
      query = query.where("type", "==", type) as any;
    }
    
    if (startDate) {
      query = query.where("recordedAt", ">=", startDate) as any;
    }
    
    if (endDate) {
      query = query.where("recordedAt", "<=", endDate) as any;
    }
    
    query = query.orderBy("recordedAt", "desc").limit(Number(limit)) as any;
    
    const snapshot = await query.get();
    const metrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    res.status(500).json({ error: "Failed to fetch health metrics" });
  }
});

// Create new health metric
app.post("/metrics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate the data
    const validatedData = healthMetricSchema.parse({
      ...req.body,
      userId
    });
    
    const metricData: Partial<HealthMetric> = {
      ...validatedData,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection(`users/${userId}/healthMetrics`).add(metricData);
    
    res.status(201).json({
      id: docRef.id,
      ...metricData
    });
  } catch (error) {
    console.error("Error creating health metric:", error);
    res.status(400).json({ error: "Invalid health metric data" });
  }
});

// Get metric trends and analytics
app.get("/analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "30d", type } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "365d":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    let query = db.collection(`users/${userId}/healthMetrics`)
      .where("recordedAt", ">=", startDate.toISOString())
      .where("recordedAt", "<=", endDate.toISOString());
    
    if (type) {
      query = query.where("type", "==", type) as any;
    }
    
    const snapshot = await query.get();
    const metrics = snapshot.docs.map(doc => doc.data());
    
    // Calculate trends and insights
    const analytics = calculateHealthTrends(metrics, String(type));
    
    res.json(analytics);
  } catch (error) {
    console.error("Error calculating health analytics:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

// Helper function to calculate health trends
function calculateHealthTrends(metrics: any[], metricType?: string) {
  if (metrics.length === 0) {
    return {
      trend: "insufficient_data",
      average: null,
      improvement: null,
      insights: ["Not enough data to calculate trends"]
    };
  }
  
  // Sort by recorded date
  metrics.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  
  const values = metrics.map(m => m.value);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate trend (simple linear regression)
  const n = values.length;
  const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  let trend: string;
  if (Math.abs(slope) < 0.01) {
    trend = "stable";
  } else if (slope > 0) {
    trend = "improving";
  } else {
    trend = "declining";
  }
  
  const improvement = ((values[values.length - 1] - values[0]) / values[0]) * 100;
  
  const insights = generateHealthInsights(metricType, trend, improvement, average);
  
  return {
    trend,
    average: Math.round(average * 100) / 100,
    improvement: Math.round(improvement * 100) / 100,
    dataPoints: values.length,
    insights
  };
}

function generateHealthInsights(metricType?: string, trend?: string, improvement?: number, average?: number): string[] {
  const insights: string[] = [];
  
  if (!metricType || !trend) return insights;
  
  switch (metricType) {
    case "weight":
      if (trend === "improving" && improvement && improvement < 0) {
        insights.push("Great progress on weight management!");
      } else if (trend === "declining" && improvement && improvement > 2) {
        insights.push("Consider reviewing your nutrition and exercise plan");
      }
      break;
    case "sleep_hours":
      if (average && average < 7) {
        insights.push("Aim for 7-9 hours of sleep for optimal health");
      } else if (average && average > 9) {
        insights.push("Consider if you're getting too much sleep");
      }
      break;
    case "steps":
      if (average && average < 8000) {
        insights.push("Try to increase daily activity to reach 10,000 steps");
      }
      break;
    case "resting_hr":
      if (trend === "improving" && improvement && improvement < 0) {
        insights.push("Lower resting heart rate indicates improved fitness");
      }
      break;
    default:
      if (trend === "improving") {
        insights.push("Your metrics are trending in a positive direction");
      } else if (trend === "declining") {
        insights.push("Consider reviewing your health habits");
      }
  }
  
  return insights;
}

export const healthMetrics = onRequest({ region: "us-central1" }, app);