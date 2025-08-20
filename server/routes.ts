import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { analyzeFoodImage } from "./services/openai";
// import { getNutritionData } from "./services/nutrition";
import { insertFoodScanSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User management
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Food scanning endpoints
  app.post("/api/food-scan/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/food-scan/analyze", async (req, res) => {
    try {
      const { imageUrl, userId } = req.body;
      
      if (!imageUrl || !userId) {
        return res.status(400).json({ error: "imageUrl and userId are required" });
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
      
      // For now, we'll just use AI analysis directly
      // TODO: Add enhanced nutrition data lookup when needed
      const finalAnalysis = aiAnalysis;

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

      res.json({
        scan: foodScan,
        analysis: finalAnalysis,
      });

    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ error: "Failed to analyze food image" });
    }
  });

  // Get user's food scans
  app.get("/api/food-scans/:userId", async (req, res) => {
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

  // Get daily stats
  app.get("/api/daily-stats/:userId/:date", async (req, res) => {
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
