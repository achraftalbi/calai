import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foodScans = pgTable("food_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(), // grams
  carbs: real("carbs").notNull(), // grams
  fat: real("fat").notNull(), // grams
  confidence: real("confidence"), // AI confidence score 0-1
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack
  aiAnalysis: jsonb("ai_analysis"), // raw AI response
  scannedAt: timestamp("scanned_at").defaultNow(),
});

export const dailyStats = pgTable("daily_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalCalories: integer("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  scansCount: integer("scans_count").default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFoodScanSchema = createInsertSchema(foodScans).omit({
  id: true,
  scannedAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FoodScan = typeof foodScans.$inferSelect;
export type InsertFoodScan = z.infer<typeof insertFoodScanSchema>;
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// API response types
export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  ingredients?: string[];
  portionSize?: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}
