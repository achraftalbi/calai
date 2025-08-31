import { 
  type User, type InsertUser, 
  type FoodScan, type InsertFoodScan, 
  type DailyStats, type InsertDailyStats,
  type WeightEntry, type InsertWeightEntry,
  type WaterEntry, type InsertWaterEntry,
  type ExerciseEntry, type InsertExerciseEntry,
  type UserStreak, type InsertUserStreak,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type NutritionDatabaseEntry, type InsertNutritionDatabaseEntry,
  users, foodScans, dailyStats, weightEntries, waterEntries, exerciseEntries,
  userStreaks, achievements, userAchievements, nutritionDatabase
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User methods (Replit Auth compatible)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: Partial<User> & { id: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;
  startTrial(userId: string): Promise<User>;
  
  // Food scan methods
  createFoodScan(scan: InsertFoodScan): Promise<FoodScan>;
  getUserFoodScans(userId: string, limit: number, offset: number): Promise<FoodScan[]>;
  getFoodScan(id: string): Promise<FoodScan | undefined>;
  
  // Daily stats methods
  getDailyStats(userId: string, date: string): Promise<DailyStats | null>;
  updateDailyStats(userId: string, nutrition: { calories: number; protein: number; carbs: number; fat: number }): Promise<void>;
  
  // Weight tracking
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  getUserWeightEntries(userId: string, limit?: number): Promise<WeightEntry[]>;
  
  // Water tracking
  addWaterGlass(userId: string, date: string): Promise<void>;
  getWaterIntake(userId: string, date: string): Promise<number>;
  
  // Exercise tracking
  createExerciseEntry(entry: InsertExerciseEntry): Promise<ExerciseEntry>;
  getUserExerciseEntries(userId: string, date: string): Promise<ExerciseEntry[]>;
  
  // Streaks and achievements
  getUserStreaks(userId: string): Promise<UserStreak[]>;
  updateStreak(userId: string, streakType: string, increment: boolean): Promise<void>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(userId: string, achievementId: string): Promise<void>;
  
  // Nutrition database
  searchNutritionDatabase(query: string, limit?: number): Promise<NutritionDatabaseEntry[]>;
  getNutritionByBarcode(barcode: string): Promise<NutritionDatabaseEntry | undefined>;
  addNutritionEntry(entry: InsertNutritionDatabaseEntry): Promise<NutritionDatabaseEntry>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: Partial<User> & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        subscriptionStatus: "pro",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async startTrial(userId: string): Promise<User> {
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3); // 3-day trial

    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: "trial",
        trialStartedAt: trialStart,
        trialEndsAt: trialEnd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createFoodScan(insertScan: InsertFoodScan): Promise<FoodScan> {
    const [scan] = await db
      .insert(foodScans)
      .values(insertScan)
      .returning();
    return scan;
  }

  async getUserFoodScans(userId: string, limit: number, offset: number): Promise<FoodScan[]> {
    const scans = await db
      .select()
      .from(foodScans)
      .where(eq(foodScans.userId, userId))
      .orderBy(desc(foodScans.scannedAt))
      .limit(limit)
      .offset(offset);
    return scans;
  }

  async getFoodScan(id: string): Promise<FoodScan | undefined> {
    const [scan] = await db.select().from(foodScans).where(eq(foodScans.id, id));
    return scan || undefined;
  }

  async getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    return stats || null;
  }

  async updateDailyStats(userId: string, nutrition: { calories: number; protein: number; carbs: number; fat: number }): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to get existing stats
    const existing = await this.getDailyStats(userId, today);
    
    if (existing) {
      // Update existing stats
      await db
        .update(dailyStats)
        .set({
          totalCalories: (existing.totalCalories ?? 0) + nutrition.calories,
          totalProtein: (existing.totalProtein ?? 0) + nutrition.protein,
          totalCarbs: (existing.totalCarbs ?? 0) + nutrition.carbs,
          totalFat: (existing.totalFat ?? 0) + nutrition.fat,
          scansCount: (existing.scansCount ?? 0) + 1,
        })
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, today)));
    } else {
      // Create new stats
      await db
        .insert(dailyStats)
        .values({
          userId,
          date: today,
          totalCalories: nutrition.calories,
          totalProtein: nutrition.protein,
          totalCarbs: nutrition.carbs,
          totalFat: nutrition.fat,
          scansCount: 1,
        });
    }
  }

  // Weight tracking methods
  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const [weightEntry] = await db
      .insert(weightEntries)
      .values(entry)
      .returning();
    return weightEntry;
  }

  async getUserWeightEntries(userId: string, limit: number = 30): Promise<WeightEntry[]> {
    const entries = await db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.date))
      .limit(limit);
    return entries;
  }

  // Water tracking methods
  async addWaterGlass(userId: string, date: string): Promise<void> {
    const existing = await this.getDailyStats(userId, date);
    
    if (existing) {
      await db
        .update(dailyStats)
        .set({
          waterGlasses: (existing.waterGlasses ?? 0) + 1,
        })
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    } else {
      await db
        .insert(dailyStats)
        .values({
          userId,
          date,
          waterGlasses: 1,
        });
    }
  }

  async getWaterIntake(userId: string, date: string): Promise<number> {
    const stats = await this.getDailyStats(userId, date);
    return stats?.waterGlasses ?? 0;
  }

  // Exercise tracking methods
  async createExerciseEntry(entry: InsertExerciseEntry): Promise<ExerciseEntry> {
    const [exerciseEntry] = await db
      .insert(exerciseEntries)
      .values(entry)
      .returning();
    return exerciseEntry;
  }

  async getUserExerciseEntries(userId: string, date: string): Promise<ExerciseEntry[]> {
    const entries = await db
      .select()
      .from(exerciseEntries)
      .where(and(eq(exerciseEntries.userId, userId), eq(exerciseEntries.date, date)))
      .orderBy(desc(exerciseEntries.createdAt));
    return entries;
  }

  // Streaks and achievements methods
  async getUserStreaks(userId: string): Promise<UserStreak[]> {
    const streaks = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));
    return streaks;
  }

  async updateStreak(userId: string, streakType: string, increment: boolean): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing streak
    const [existing] = await db
      .select()
      .from(userStreaks)
      .where(and(eq(userStreaks.userId, userId), eq(userStreaks.streakType, streakType)));
    
    if (existing) {
      const newCurrent = increment ? (existing.currentStreak ?? 0) + 1 : 0;
      const newLongest = Math.max(existing.longestStreak ?? 0, newCurrent);
      
      await db
        .update(userStreaks)
        .set({
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastUpdateDate: today,
          updatedAt: new Date(),
        })
        .where(and(eq(userStreaks.userId, userId), eq(userStreaks.streakType, streakType)));
    } else {
      await db
        .insert(userStreaks)
        .values({
          userId,
          streakType,
          currentStreak: increment ? 1 : 0,
          longestStreak: increment ? 1 : 0,
          lastUpdateDate: today,
        });
    }
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievementsWithDetails = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        earnedAt: userAchievements.earnedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
    
    return userAchievementsWithDetails;
  }

  async awardAchievement(userId: string, achievementId: string): Promise<void> {
    // Check if already earned
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
    
    if (!existing) {
      await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
        });
    }
  }

  // Nutrition database methods
  async searchNutritionDatabase(query: string, limit: number = 20): Promise<NutritionDatabaseEntry[]> {
    // Simple text search - in production you'd want full-text search
    const entries = await db
      .select()
      .from(nutritionDatabase)
      .where(eq(nutritionDatabase.foodName, query)) // Simplified - you'd want LIKE or full-text search
      .limit(limit);
    return entries;
  }

  async getNutritionByBarcode(barcode: string): Promise<NutritionDatabaseEntry | undefined> {
    const [entry] = await db
      .select()
      .from(nutritionDatabase)
      .where(eq(nutritionDatabase.barcode, barcode));
    return entry || undefined;
  }

  async addNutritionEntry(entry: InsertNutritionDatabaseEntry): Promise<NutritionDatabaseEntry> {
    const [nutritionEntry] = await db
      .insert(nutritionDatabase)
      .values(entry)
      .returning();
    return nutritionEntry;
  }
}

export const storage = new DatabaseStorage();
