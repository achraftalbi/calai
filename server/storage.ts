import { type User, type InsertUser, type FoodScan, type InsertFoodScan, type DailyStats, type InsertDailyStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food scan methods
  createFoodScan(scan: InsertFoodScan): Promise<FoodScan>;
  getUserFoodScans(userId: string, limit: number, offset: number): Promise<FoodScan[]>;
  getFoodScan(id: string): Promise<FoodScan | undefined>;
  
  // Daily stats methods
  getDailyStats(userId: string, date: string): Promise<DailyStats | null>;
  updateDailyStats(userId: string, nutrition: { calories: number; protein: number; carbs: number; fat: number }): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private foodScans: Map<string, FoodScan>;
  private dailyStats: Map<string, DailyStats>; // key format: `${userId}:${date}`

  constructor() {
    this.users = new Map();
    this.foodScans = new Map();
    this.dailyStats = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      dailyCalorieGoal: insertUser.dailyCalorieGoal ?? 2000,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createFoodScan(insertScan: InsertFoodScan): Promise<FoodScan> {
    const id = randomUUID();
    const scan: FoodScan = {
      ...insertScan,
      id,
      confidence: insertScan.confidence ?? null,
      mealType: insertScan.mealType ?? null,
      aiAnalysis: insertScan.aiAnalysis ?? null,
      scannedAt: new Date(),
    };
    this.foodScans.set(id, scan);
    return scan;
  }

  async getUserFoodScans(userId: string, limit: number, offset: number): Promise<FoodScan[]> {
    const userScans = Array.from(this.foodScans.values())
      .filter(scan => scan.userId === userId)
      .sort((a, b) => new Date(b.scannedAt!).getTime() - new Date(a.scannedAt!).getTime())
      .slice(offset, offset + limit);
    
    return userScans;
  }

  async getFoodScan(id: string): Promise<FoodScan | undefined> {
    return this.foodScans.get(id);
  }

  async getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    const key = `${userId}:${date}`;
    return this.dailyStats.get(key) || null;
  }

  async updateDailyStats(userId: string, nutrition: { calories: number; protein: number; carbs: number; fat: number }): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const key = `${userId}:${today}`;
    
    let stats = this.dailyStats.get(key);
    
    if (!stats) {
      stats = {
        id: randomUUID(),
        userId,
        date: today,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        scansCount: 0,
      };
    }

    // Add to daily totals
    stats.totalCalories = (stats.totalCalories ?? 0) + nutrition.calories;
    stats.totalProtein = (stats.totalProtein ?? 0) + nutrition.protein;
    stats.totalCarbs = (stats.totalCarbs ?? 0) + nutrition.carbs;
    stats.totalFat = (stats.totalFat ?? 0) + nutrition.fat;
    stats.scansCount = (stats.scansCount ?? 0) + 1;

    this.dailyStats.set(key, stats);
  }
}

export const storage = new MemStorage();
