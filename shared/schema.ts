import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with extended profile information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Goals and preferences
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
  dailyProteinGoal: integer("daily_protein_goal").default(120),
  dailyCarbsGoal: integer("daily_carbs_goal").default(250),
  dailyFatGoal: integer("daily_fat_goal").default(70),
  dailyWaterGoal: integer("daily_water_goal").default(8), // glasses
  
  // Profile info
  age: integer("age"),
  gender: text("gender"), // male, female, other
  heightCm: integer("height_cm"),
  activityLevel: text("activity_level").default("sedentary"), // sedentary, lightly_active, moderately_active, very_active
  goalType: text("goal_type").default("maintain"), // lose_weight, gain_weight, maintain, build_muscle
  
  // Subscription
  subscriptionStatus: text("subscription_status").default("free"), // free, trial, pro
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // Trial tracking
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Usage limits
  dailyScansUsed: integer("daily_scans_used").default(0),
  lastScanResetDate: date("last_scan_reset_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  totalFiber: real("total_fiber").default(0),
  totalSugar: real("total_sugar").default(0),
  totalSodium: real("total_sodium").default(0),
  scansCount: integer("scans_count").default(0),
  waterGlasses: integer("water_glasses").default(0),
  exerciseMinutes: integer("exercise_minutes").default(0),
  exerciseCaloriesBurned: integer("exercise_calories_burned").default(0),
}, (table) => {
  return {
    userDateIdx: index("daily_stats_user_date_idx").on(table.userId, table.date),
  };
});

// Weight tracking
export const weightEntries = pgTable("weight_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weightKg: real("weight_kg").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userDateIdx: index("weight_entries_user_date_idx").on(table.userId, table.date),
  };
});

// Water intake tracking
export const waterEntries = pgTable("water_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  glasses: integer("glasses").notNull(), // number of glasses
  date: date("date").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => {
  return {
    userDateIdx: index("water_entries_user_date_idx").on(table.userId, table.date),
  };
});

// Exercise tracking
export const exerciseEntries = pgTable("exercise_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  exerciseType: text("exercise_type").notNull(), // running, walking, cycling, weightlifting, etc.
  duration: integer("duration").notNull(), // minutes
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userDateIdx: index("exercise_entries_user_date_idx").on(table.userId, table.date),
  };
});

// User streaks and achievements
export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  streakType: text("streak_type").notNull(), // daily_logging, water_goal, calorie_goal
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastUpdateDate: date("last_update_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userTypeIdx: index("user_streaks_user_type_idx").on(table.userId, table.streakType),
  };
});

// Achievement badges
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // streak, weight_loss, nutrition, etc.
  requirement: jsonb("requirement"), // { type: "streak", value: 7, metric: "daily_logging" }
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements (earned badges)
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => {
  return {
    userAchievementIdx: index("user_achievements_user_achievement_idx").on(table.userId, table.achievementId),
  };
});

// Nutrition database for accurate food data
export const nutritionDatabase = pgTable("nutrition_database", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  foodName: text("food_name").notNull(),
  brand: text("brand"),
  barcode: text("barcode"),
  servingSize: text("serving_size"),
  servingUnit: text("serving_unit"),
  
  // Macronutrients per serving
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  sugar: real("sugar"),
  sodium: real("sodium"),
  
  // Micronutrients (premium feature)
  vitaminA: real("vitamin_a"),
  vitaminC: real("vitamin_c"),
  calcium: real("calcium"),
  iron: real("iron"),
  
  // Data source and verification
  dataSource: text("data_source").default("usda"), // usda, edamam, user_verified
  verified: boolean("verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    foodNameIdx: index("nutrition_database_food_name_idx").on(table.foodName),
    barcodeIdx: index("nutrition_database_barcode_idx").on(table.barcode),
  };
});

// Insert schemas for existing tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  dailyScansUsed: true,
  lastScanResetDate: true,
});

export const insertFoodScanSchema = createInsertSchema(foodScans).omit({
  id: true,
  scannedAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Insert schemas for new tables
export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({
  id: true,
  createdAt: true,
});

export const insertWaterEntrySchema = createInsertSchema(waterEntries).omit({
  id: true,
  timestamp: true,
});

export const insertExerciseEntrySchema = createInsertSchema(exerciseEntries).omit({
  id: true,
  createdAt: true,
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertNutritionDatabaseSchema = createInsertSchema(nutritionDatabase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for existing tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FoodScan = typeof foodScans.$inferSelect;
export type InsertFoodScan = z.infer<typeof insertFoodScanSchema>;
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// Types for new tables
export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;
export type WaterEntry = typeof waterEntries.$inferSelect;
export type InsertWaterEntry = z.infer<typeof insertWaterEntrySchema>;
export type ExerciseEntry = typeof exerciseEntries.$inferSelect;
export type InsertExerciseEntry = z.infer<typeof insertExerciseEntrySchema>;
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type NutritionDatabaseEntry = typeof nutritionDatabase.$inferSelect;
export type InsertNutritionDatabaseEntry = z.infer<typeof insertNutritionDatabaseSchema>;

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
