import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTodayCoachData, addManualActivity, addManualSteps } from "./services/coach";
import { updateUserBMR } from "./services/coach";
import { getGoogleFitAuthUrl, exchangeGoogleFitCode, importGoogleFitData, disconnectGoogleFit } from "./services/googleFit";
import { insertActivitySchema, insertPushSubscriptionSchema, type ManualActivityRequest, type ManualStepsRequest, providerTokens, dailyStats, activities, dailyMetrics } from "@shared/schema";
import { count, and, eq } from "drizzle-orm";
import { db } from "./db";
import { ObjectStorageService } from "./objectStorage";
import { analyzeFoodImage } from "./services/gemini";
// import { getNutritionData } from "./services/nutrition";
import { insertFoodScanSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile management
  app.put('/api/auth/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Start trial endpoint
  app.post('/api/auth/user/start-trial', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.startTrial(userId);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ error: "Failed to start trial" });
    }
  });

  // Food scanning endpoints (protected)
  app.post("/api/food-scan/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/food-scan/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl } = req.body;
      const userId = req.user.claims.sub; // Get user ID from auth
      
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      // Check scan limits for non-pro users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has reached daily scan limit
      const today = new Date().toISOString().split('T')[0];
      if (user.subscriptionStatus === 'free' && 
          user.lastScanResetDate !== today) {
        // Reset daily scans for new day
        await storage.updateUser(userId, {
          dailyScansUsed: 0,
          lastScanResetDate: today,
        });
      }

      if (user.subscriptionStatus === 'free' && 
          (user.dailyScansUsed || 0) >= 50) {
        return res.status(429).json({ 
          error: "Daily scan limit reached", 
          message: "Upgrade to Pro for unlimited scans" 
        });
      }

      // Normalize the object path
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageUrl);
      
      // Get the image file for analysis
      const imageFile = await objectStorageService.getObjectEntityFile(normalizedPath);
      
      // Convert image to base64 for OpenAI analysis
      const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = imageFile.createReadStream();
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
      
      const base64Image = imageBuffer.toString('base64');
      
      // Analyze with OpenAI Vision
      const aiAnalysis = await analyzeFoodImage(base64Image);
      
      // Map Gemini analysis to our expected format
      const finalAnalysis = {
        foodName: aiAnalysis.name,
        calories: aiAnalysis.calories,
        protein: aiAnalysis.protein,
        carbs: aiAnalysis.carbs,
        fat: aiAnalysis.fat,
        confidence: aiAnalysis.confidence,
        portionSize: aiAnalysis.servingSize,
      };

      // Save the scan to storage
      const scanData = {
        userId,
        imageUrl: normalizedPath,
        foodName: finalAnalysis.foodName,
        calories: finalAnalysis.calories,
        protein: finalAnalysis.protein,
        carbs: finalAnalysis.carbs,
        fat: finalAnalysis.fat,
        confidence: finalAnalysis.confidence,
        aiAnalysis: aiAnalysis,
      };

      const foodScan = await storage.createFoodScan(scanData);
      
      // Update daily stats
      await storage.updateDailyStats(userId, {
        calories: finalAnalysis.calories,
        protein: finalAnalysis.protein,
        carbs: finalAnalysis.carbs,
        fat: finalAnalysis.fat,
      });

      // Update user scan count for free users
      if (user.subscriptionStatus === 'free') {
        await storage.updateUser(userId, {
          dailyScansUsed: (user.dailyScansUsed || 0) + 1,
        });
      }

      res.json({
        scan: foodScan,
        analysis: finalAnalysis,
      });

    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ error: "Failed to analyze food image" });
    }
  });

  // Get user's food scans (protected)
  app.get("/api/food-scans/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit = "10", offset = "0" } = req.query;
      
      const scans = await storage.getUserFoodScans(
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json(scans);
    } catch (error) {
      console.error("Error fetching food scans:", error);
      res.status(500).json({ error: "Failed to fetch food scans" });
    }
  });

  // Get daily stats (protected)
  app.get("/api/daily-stats/:userId/:date", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, date } = req.params;
      const stats = await storage.getDailyStats(userId, date);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      res.status(500).json({ error: "Failed to fetch daily stats" });
    }
  });

  // PayPal payment routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Subscription management endpoints
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planType } = req.body; // 'monthly' or 'yearly'
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate subscription end date
      const now = new Date();
      const endDate = new Date(now);
      if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user subscription status
      const updatedUser = await storage.updateUser(userId, {
        subscriptionStatus: 'pro',
        subscriptionEndsAt: endDate,
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Subscription activated successfully!" 
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const updatedUser = await storage.updateUser(userId, {
        subscriptionStatus: 'free',
        subscriptionEndsAt: null,
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Subscription cancelled successfully" 
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Coach feature endpoints
  app.get("/api/coach/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      const data = await getTodayCoachData(userId, today);
      res.json(data);
    } catch (error) {
      console.error("Error fetching coach data:", error);
      res.status(500).json({ error: "Failed to fetch coach data" });
    }
  });

  app.post("/api/manual/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityData = req.body as ManualActivityRequest;
      
      const activity = await addManualActivity(userId, activityData);
      res.json({ id: activity.id, activity });
    } catch (error) {
      console.error("Error adding manual activity:", error);
      res.status(500).json({ error: "Failed to add activity" });
    }
  });

  app.post("/api/manual/steps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, steps } = req.body as ManualStepsRequest;
      
      await addManualSteps(userId, date, steps);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error adding manual steps:", error);
      res.status(500).json({ error: "Failed to add steps" });
    }
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { endpoint, p256dh, auth } = req.body;
      
      // TODO: Implement push subscription storage
      res.json({ ok: true });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/integrations/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider, deleteData } = req.body;
      
      // TODO: Implement provider disconnection
      res.json({ ok: true });
    } catch (error) {
      console.error("Error disconnecting provider:", error);
      res.status(500).json({ error: "Failed to disconnect provider" });
    }
  });

  // Update user profile with BMR recalculation
  app.put('/api/auth/user/profile-with-bmr', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Update user profile
      const user = await storage.updateUser(userId, updates);
      
      // Recalculate BMR if weight changed
      if (updates.weightKg) {
        await updateUserBMR(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile with BMR:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Google Fit integration endpoints
  app.get("/api/google-fit/auth", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const authUrl = getGoogleFitAuthUrl(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting Google Fit auth URL:", error);
      res.status(500).json({ error: "Failed to get authorization URL" });
    }
  });

  // Add Google Fit status endpoint
  app.get("/api/google-fit/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user has Google Fit token
      const [tokenRecord] = await db
        .select()
        .from(providerTokens)
        .where(
          and(
            eq(providerTokens.userId, userId),
            eq(providerTokens.provider, 'google_fit')
          )
        );
      
      if (!tokenRecord) {
        return res.json({ connected: false });
      }

      // Get activity count and steps data
      const [activityCount] = await db
        .select({ count: count() })
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.source, 'google_fit')
          )
        );

      const today = new Date().toISOString().split('T')[0];
      const [todayStats] = await db
        .select()
        .from(dailyMetrics)
        .where(
          and(
            eq(dailyMetrics.userId, userId),
            eq(dailyMetrics.date, today)
          )
        );

      res.json({
        connected: true,
        lastSync: tokenRecord.createdAt?.toISOString(),
        totalActivities: activityCount?.count || 0,
        todaySteps: todayStats?.steps || 0,
      });
    } catch (error) {
      console.error("Error getting Google Fit status:", error);
      res.status(500).json({ error: "Failed to get Google Fit status" });
    }
  });

  app.get("/api/auth/google-fit/callback", async (req, res) => {
    try {
      const { code, state: userId } = req.query;
      
      if (!code || !userId) {
        console.error("Missing code or userId:", { code: !!code, userId: !!userId });
        return res.status(400).json({ error: "Missing authorization code or user ID" });
      }
      
      console.log("Attempting to exchange Google Fit code for user:", userId);
      await exchangeGoogleFitCode(code as string, userId as string);
      console.log("Google Fit code exchange successful for user:", userId);
      
      // Redirect back to Coach page with success
      res.redirect('/coach?connected=google-fit');
    } catch (error) {
      console.error("Error exchanging Google Fit code:", error);
      res.redirect('/coach?error=google-fit-failed');
    }
  });

  app.post("/api/google-fit/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await importGoogleFitData(userId);
      res.json(result);
    } catch (error) {
      console.error("Error syncing Google Fit data:", error);
      res.status(500).json({ error: "Failed to sync Google Fit data" });
    }
  });

  app.delete("/api/google-fit/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await disconnectGoogleFit(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting Google Fit:", error);
      res.status(500).json({ error: "Failed to disconnect Google Fit" });
    }
  });

  // Serve food images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(404).json({ error: "Image not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
