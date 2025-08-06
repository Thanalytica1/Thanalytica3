import type { Express } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { format } from "date-fns";

const GARMIN_API_URL = "https://apis.garmin.com/wellness-api/rest";
const WHOOP_API_URL = "https://api.whoop.com/v1";

// Rate limiting configuration
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Check rate limit
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);
  
  if (!limit || limit.resetTime < now) {
    rateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Helper to generate OAuth 1.0a header for Garmin
function generateGarminAuthHeader(
  method: string,
  url: string,
  accessToken: string,
  tokenSecret: string,
  consumerKey: string,
  consumerSecret: string
) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const params = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key as keyof typeof params])}`)
    .join("&");

  // Create signature base
  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  
  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Generate signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  // Build auth header
  return `OAuth ${Object.keys(params)
    .map(key => `${key}="${encodeURIComponent(params[key as keyof typeof params])}"`)
    .join(", ")}, oauth_signature="${encodeURIComponent(signature)}"`;
}

export function registerSyncRoutes(app: Express) {
  // Sync Garmin data
  app.get("/sync/garmin", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const date = req.query.date as string || format(new Date(), "yyyy-MM-dd");
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Check rate limit
      if (!checkRateLimit(`garmin:${userId}`)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before syncing again.",
          retryAfter: 60 
        });
      }

      // Get connection
      const connection = await storage.getWearableConnection(userId, "garmin");
      if (!connection || !connection.isActive) {
        return res.status(404).json({ message: "No active Garmin connection found" });
      }

      const consumerKey = process.env.GARMIN_CLIENT_KEY;
      const consumerSecret = process.env.GARMIN_CLIENT_SECRET;

      if (!consumerKey || !consumerSecret) {
        return res.status(500).json({ message: "Garmin API not configured" });
      }

      try {
        // Fetch daily summary
        const summaryUrl = `${GARMIN_API_URL}/dailies?uploadStartTimeInSeconds=${Math.floor(new Date(date).getTime() / 1000)}&uploadEndTimeInSeconds=${Math.floor((new Date(date).getTime() + 86400000) / 1000)}`;
        
        const authHeader = generateGarminAuthHeader(
          "GET",
          summaryUrl,
          connection.accessToken || "",
          connection.tokenSecret || "",
          consumerKey,
          consumerSecret
        );

        const response = await fetch(summaryUrl, {
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          // Token expired
          await storage.updateWearableConnection(connection.id, {
            isActive: false,
            connectionStatus: "expired",
          });
          return res.status(401).json({ message: "Garmin token expired. Please reconnect." });
        }

        if (!response.ok) {
          throw new Error(`Garmin API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Process and structure the data
        const garminData = {
          date,
          steps: data[0]?.totalSteps || 0,
          distance: data[0]?.totalDistanceMeters || 0,
          calories: data[0]?.activeKilocalories || 0,
          sleepHours: (data[0]?.sleepTimeInSeconds || 0) / 3600,
          restingHeartRate: data[0]?.restingHeartRateInBeatsPerMinute || null,
          stressScore: data[0]?.averageStressLevel || null,
          activeMinutes: data[0]?.moderateIntensityMinutes || 0,
          floorsClimbed: data[0]?.floorsAscended || 0,
        };

        // Store raw data
        await storage.saveWearablesData({
          userId,
          device: "garmin",
          date,
          dataJson: garminData,
        });

        // Update last sync time
        await storage.updateWearableConnection(connection.id, {
          lastSyncAt: new Date(),
        });

        res.json({
          message: "Garmin data synced successfully",
          data: garminData,
        });
      } catch (apiError) {
        // Handle API-specific errors
        if (apiError instanceof Error && apiError.message.includes("API error")) {
          return res.status(503).json({ 
            message: "Garmin API is temporarily unavailable. Please try again later.",
            retryAfter: 300 
          });
        }
        throw apiError;
      }
    } catch (error) {
      console.error("Garmin sync error:", error);
      res.status(500).json({ message: "Failed to sync Garmin data" });
    }
  });

  // Sync Whoop data
  app.get("/sync/whoop", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const date = req.query.date as string || format(new Date(), "yyyy-MM-dd");
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Check rate limit
      if (!checkRateLimit(`whoop:${userId}`)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before syncing again.",
          retryAfter: 60 
        });
      }

      // Get connection
      const connection = await storage.getWearableConnection(userId, "whoop");
      if (!connection || !connection.isActive) {
        return res.status(404).json({ message: "No active Whoop connection found" });
      }

      // Check token expiration
      if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
        // Attempt to refresh token
        try {
          const refreshResponse = await fetch("/auth/whoop/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });

          if (!refreshResponse.ok) {
            await storage.updateWearableConnection(connection.id, {
              isActive: false,
              connectionStatus: "expired",
            });
            return res.status(401).json({ message: "Whoop token expired. Please reconnect." });
          }

          // Get updated connection
          const updatedConnection = await storage.getWearableConnection(userId, "whoop");
          if (updatedConnection) {
            connection.accessToken = updatedConnection.accessToken;
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ message: "Failed to refresh Whoop token" });
        }
      }

      try {
        // Fetch cycle data (includes recovery, strain, and sleep)
        const cycleUrl = `${WHOOP_API_URL}/cycle?start=${date}&end=${date}`;
        
        const response = await fetch(cycleUrl, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          // Token expired
          await storage.updateWearableConnection(connection.id, {
            isActive: false,
            connectionStatus: "expired",
          });
          return res.status(401).json({ message: "Whoop token expired. Please reconnect." });
        }

        if (response.status === 429) {
          // Rate limited by Whoop
          return res.status(429).json({ 
            message: "Whoop API rate limit exceeded. Please try again later.",
            retryAfter: 3600 
          });
        }

        if (!response.ok) {
          throw new Error(`Whoop API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Process and structure the data
        const whoopData = {
          date,
          recoveryScore: data.cycles?.[0]?.recovery?.score || null,
          strainScore: data.cycles?.[0]?.strain?.score || null,
          sleepPerformance: data.cycles?.[0]?.sleep?.score || null,
          hrv: data.cycles?.[0]?.recovery?.hrv?.rmssd || null,
          restingHeartRate: data.cycles?.[0]?.recovery?.resting_heart_rate || null,
          respiratoryRate: data.cycles?.[0]?.recovery?.respiratory_rate || null,
          sleepDuration: data.cycles?.[0]?.sleep?.duration_in_bed || 0,
          sleepEfficiency: data.cycles?.[0]?.sleep?.efficiency || null,
          sleepDisturbances: data.cycles?.[0]?.sleep?.disturbances || 0,
        };

        // Store raw data
        await storage.saveWearablesData({
          userId,
          device: "whoop",
          date,
          dataJson: whoopData,
        });

        // Update last sync time
        await storage.updateWearableConnection(connection.id, {
          lastSyncAt: new Date(),
        });

        res.json({
          message: "Whoop data synced successfully",
          data: whoopData,
        });
      } catch (apiError) {
        // Handle API-specific errors
        if (apiError instanceof Error && apiError.message.includes("API error")) {
          return res.status(503).json({ 
            message: "Whoop API is temporarily unavailable. Please try again later.",
            retryAfter: 300 
          });
        }
        throw apiError;
      }
    } catch (error) {
      console.error("Whoop sync error:", error);
      res.status(500).json({ message: "Failed to sync Whoop data" });
    }
  });

  // Get synced data for a user
  app.get("/api/wearables-data/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, device } = req.query;

      const data = await storage.getWearablesData(
        userId,
        startDate as string,
        endDate as string,
        device as string
      );

      res.json(data);
    } catch (error) {
      console.error("Get wearables data error:", error);
      res.status(500).json({ message: "Failed to get wearables data" });
    }
  });

  // Manual sync all devices for a user
  app.post("/api/sync-all/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const results = {
        garmin: { success: false, message: "" },
        whoop: { success: false, message: "" },
      };

      // Try to sync Garmin
      try {
        const garminResponse = await fetch(`/sync/garmin?userId=${userId}`);
        if (garminResponse.ok) {
          results.garmin = { success: true, message: "Synced successfully" };
        } else {
          const error = await garminResponse.json();
          results.garmin = { success: false, message: error.message };
        }
      } catch (error) {
        results.garmin = { success: false, message: "Sync failed" };
      }

      // Try to sync Whoop
      try {
        const whoopResponse = await fetch(`/sync/whoop?userId=${userId}`);
        if (whoopResponse.ok) {
          results.whoop = { success: true, message: "Synced successfully" };
        } else {
          const error = await whoopResponse.json();
          results.whoop = { success: false, message: error.message };
        }
      } catch (error) {
        results.whoop = { success: false, message: "Sync failed" };
      }

      res.json(results);
    } catch (error) {
      console.error("Sync all error:", error);
      res.status(500).json({ message: "Failed to sync devices" });
    }
  });
}