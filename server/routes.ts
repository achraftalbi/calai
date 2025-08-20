import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { analyzeFoodImage } from "./services/gemini";
// import { getNutritionData } from "./services/nutrition";
import { insertFoodScanSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
