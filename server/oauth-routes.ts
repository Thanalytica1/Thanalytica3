import type { Express } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { z } from "zod";

// OAuth configuration
const GARMIN_BASE_URL = "https://connectapi.garmin.com";
const WHOOP_BASE_URL = "https://api.whoop.com";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

// Helper to generate OAuth 1.0a signature for Garmin
function generateOAuth1Signature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret = ""
) {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  // Create signature base string
  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  
  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Generate signature
  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");
}

export function registerOAuthRoutes(app: Express) {
  // Garmin OAuth 1.0a flow
  app.get("/auth/garmin/initiate", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const consumerKey = process.env.GARMIN_CLIENT_KEY;
      const consumerSecret = process.env.GARMIN_CLIENT_SECRET;

      if (!consumerKey || !consumerSecret) {
        return res.status(500).json({ message: "Garmin OAuth not configured" });
      }

      // OAuth 1.0a parameters
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString("hex");
      const callbackUrl = `${APP_BASE_URL}/auth/garmin/callback`;

      const params = {
        oauth_callback: callbackUrl,
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: timestamp,
        oauth_version: "1.0",
      };

      // Generate signature
      const requestTokenUrl = `${GARMIN_BASE_URL}/oauth/request_token`;
      const signature = generateOAuth1Signature(
        "POST",
        requestTokenUrl,
        params,
        consumerSecret
      );

      // Add signature to params
      const authHeader = `OAuth ${Object.keys(params)
        .map(key => `${key}="${encodeURIComponent((params as any)[key])}"`)
        .join(", ")}, oauth_signature="${encodeURIComponent(signature)}"`;

      // Request temporary token
      const response = await fetch(requestTokenUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Garmin OAuth failed: ${response.statusText}`);
      }

      const responseText = await response.text();
      const responseParams = new URLSearchParams(responseText);
      const oauthToken = responseParams.get("oauth_token");
      const oauthTokenSecret = responseParams.get("oauth_token_secret");

      // Store temporary token secret (optional)
      if (oauthTokenSecret && typeof (storage as any).storeTemporaryToken === 'function') {
        await (storage as any).storeTemporaryToken(userId, "garmin", oauthTokenSecret);
      }

      // Redirect to Garmin authorization
      const authorizeUrl = `${GARMIN_BASE_URL}/oauth/authorize?oauth_token=${oauthToken}`;
      res.json({ authorizeUrl });
    } catch (error) {
      console.error("Garmin OAuth initiate error:", error);
      res.status(500).json({ message: "Failed to initiate Garmin OAuth" });
    }
  });

  app.get("/auth/garmin/callback", async (req, res) => {
    try {
      const { oauth_token, oauth_verifier, userId } = req.query;
      
      if (!oauth_token || !oauth_verifier || !userId) {
        return res.status(400).json({ message: "Missing OAuth parameters" });
      }

      const consumerKey = process.env.GARMIN_CLIENT_KEY;
      const consumerSecret = process.env.GARMIN_CLIENT_SECRET;

      if (!consumerKey || !consumerSecret) {
        return res.status(500).json({ message: "Garmin OAuth not configured" });
      }

      // Get temporary token secret if available
      let tokenSecret = "";
      if (typeof (storage as any).getTemporaryToken === 'function') {
        tokenSecret = await (storage as any).getTemporaryToken(userId as string, "garmin");
        if (!tokenSecret) {
          return res.status(400).json({ message: "Invalid OAuth session" });
        }
      }

      // Exchange for access token
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString("hex");

      const params = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: timestamp,
        oauth_token: oauth_token as string,
        oauth_verifier: oauth_verifier as string,
        oauth_version: "1.0",
      };

      const accessTokenUrl = `${GARMIN_BASE_URL}/oauth/access_token`;
      const signature = generateOAuth1Signature(
        "POST",
        accessTokenUrl,
        params,
        consumerSecret,
        tokenSecret
      );

      const authHeader = `OAuth ${Object.keys(params)
        .map(key => `${key}="${encodeURIComponent((params as any)[key])}"`)
        .join(", ")}, oauth_signature="${encodeURIComponent(signature)}"`;

      const response = await fetch(accessTokenUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Garmin OAuth failed: ${response.statusText}`);
      }

      const responseText = await response.text();
      const responseParams = new URLSearchParams(responseText);
      const accessToken = responseParams.get("oauth_token");
      const accessTokenSecret = responseParams.get("oauth_token_secret");

      // Store access token
      await storage.createWearableConnection({
        userId: userId as string,
        deviceType: "garmin",
        accessToken: accessToken || "",
        tokenSecret: accessTokenSecret || "",
        isActive: true,
      });

      // Redirect to wearables page
      res.redirect("/wearables?connected=garmin");
    } catch (error) {
      console.error("Garmin OAuth callback error:", error);
      res.status(500).json({ message: "Failed to complete Garmin OAuth" });
    }
  });

  // Whoop OAuth 2.0 flow
  app.get("/auth/whoop/initiate", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const clientId = process.env.WHOOP_CLIENT_ID;
      const redirectUri = `${APP_BASE_URL}/auth/whoop/callback`;

      if (!clientId) {
        return res.status(500).json({ message: "Whoop OAuth not configured" });
      }

      // Generate state for CSRF protection
      const state = crypto.randomBytes(16).toString("hex");
      if (typeof (storage as any).storeTemporaryToken === 'function') {
        await (storage as any).storeTemporaryToken(userId, "whoop", state);
      }

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "read:recovery read:cycles read:workout read:sleep",
        state: state,
      });

      const authorizeUrl = `${WHOOP_BASE_URL}/oauth/authorize?${params}`;
      res.json({ authorizeUrl });
    } catch (error) {
      console.error("Whoop OAuth initiate error:", error);
      res.status(500).json({ message: "Failed to initiate Whoop OAuth" });
    }
  });

  app.get("/auth/whoop/callback", async (req, res) => {
    try {
      const { code, state, userId } = req.query;
      
      if (!code || !state || !userId) {
        return res.status(400).json({ message: "Missing OAuth parameters" });
      }

      // Verify state
      if (typeof (storage as any).getTemporaryToken === 'function') {
        const savedState = await (storage as any).getTemporaryToken(userId as string, "whoop");
        if (savedState && savedState !== state) {
          return res.status(400).json({ message: "Invalid OAuth state" });
        }
      }

      const clientId = process.env.WHOOP_CLIENT_ID;
      const clientSecret = process.env.WHOOP_CLIENT_SECRET;
      const redirectUri = `${APP_BASE_URL}/auth/whoop/callback`;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ message: "Whoop OAuth not configured" });
      }

      // Exchange code for access token
      const tokenResponse = await fetch(`${WHOOP_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Whoop OAuth failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      // Store access token
      await storage.createWearableConnection({
        userId: userId as string,
        deviceType: "whoop",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        isActive: true,
      });

      // Redirect to wearables page
      res.redirect("/wearables?connected=whoop");
    } catch (error) {
      console.error("Whoop OAuth callback error:", error);
      res.status(500).json({ message: "Failed to complete Whoop OAuth" });
    }
  });

  // Refresh Whoop token
  app.post("/auth/whoop/refresh", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const connection = await storage.getWearableConnection(userId, "whoop");
      if (!connection || !connection.refreshToken) {
        return res.status(400).json({ message: "No valid Whoop connection found" });
      }

      const clientId = process.env.WHOOP_CLIENT_ID;
      const clientSecret = process.env.WHOOP_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ message: "Whoop OAuth not configured" });
      }

      // Refresh token
      const tokenResponse = await fetch(`${WHOOP_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: connection.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Whoop token refresh failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      // Update tokens
      await storage.updateWearableConnection(connection.id, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });

      res.json({ message: "Token refreshed successfully" });
    } catch (error) {
      console.error("Whoop token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh Whoop token" });
    }
  });
}