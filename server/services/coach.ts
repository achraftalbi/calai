import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  dailyMetrics, activities, users, foodScans, dailyStats,
  type DailyMetrics, type Activity, type User, type CoachTodayResponse 
} from "@shared/schema";
import { calculateBMR, calculateStepsCalories, calculateNetCalories } from "./bmr";

/**
 * Get today's coach data for a user
 */
export async function getTodayCoachData(userId: string, date: string): Promise<CoachTodayResponse> {
  // Get user profile for BMR calculation
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new Error('User not found');
  }

  // Get or create daily metrics
  let [metrics] = await db
    .select()
    .from(dailyMetrics)
    .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)));

  if (!metrics) {
    // Create initial metrics entry
    await db.insert(dailyMetrics).values({
      userId,
      date,
      intakeKcal: 0,
      activeKcal: 0,
      bmrKcal: 0,
      steps: 0,
    });
    
    [metrics] = await db
      .select()
      .from(dailyMetrics)
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)));
  }

  // Calculate BMR if we have user data
  let bmrKcal = metrics.bmrKcal || 0;
  if (user.weightKg && user.heightCm && user.age && user.gender && bmrKcal === 0) {
    bmrKcal = calculateBMR({
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      age: user.age,
      gender: user.gender as 'male' | 'female',
    });
    
    // Update metrics with calculated BMR
    await db
      .update(dailyMetrics)
      .set({ bmrKcal })
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)));
    
    metrics.bmrKcal = bmrKcal;
  }

  // Get intake calories from daily stats
  const [stats] = await db
    .select()
    .from(dailyStats)
    .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));

  const intakeKcal = stats?.totalCalories || 0;

  // Update intake in metrics if different
  if (intakeKcal !== (metrics.intakeKcal || 0)) {
    await db
      .update(dailyMetrics)
      .set({ intakeKcal })
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)));
    metrics.intakeKcal = intakeKcal;
  }

  // Get today's activities
  const todayActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        sql`DATE(${activities.start}) = ${date}`
      )
    )
    .orderBy(desc(activities.start));

  // Calculate active calories from activities
  const activeKcal = todayActivities.reduce((total, activity) => {
    return total + (activity.calories || 0);
  }, 0);

  // Update active calories in metrics if different
  if (activeKcal !== (metrics.activeKcal || 0)) {
    await db
      .update(dailyMetrics)
      .set({ activeKcal })
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)));
    metrics.activeKcal = activeKcal;
  }

  // Calculate net calories
  const netKcal = calculateNetCalories(intakeKcal, bmrKcal, activeKcal);

  // Get connected sources
  const sources: string[] = [];
  const manualActivities = todayActivities.filter(a => a.source === 'manual');
  if (manualActivities.length > 0) sources.push('manual');

  // Calculate top drivers (simplified version)
  const topDrivers = {
    burning: [
      { name: 'BMR (Base Metabolism)', percentage: bmrKcal > 0 ? Math.round((bmrKcal / (bmrKcal + activeKcal)) * 100) : 0 },
      { name: 'Activities', percentage: activeKcal > 0 ? Math.round((activeKcal / (bmrKcal + activeKcal)) * 100) : 0 },
    ].filter(d => d.percentage > 0),
    intake: [
      { name: 'Food Scans', percentage: 100 },
    ],
  };

  return {
    date,
    intakeKcal,
    activeKcal,
    bmrKcal,
    steps: metrics.steps || 0,
    netKcal,
    sources,
    activities: todayActivities,
    topDrivers,
  };
}

/**
 * Add manual activity
 */
export async function addManualActivity(
  userId: string,
  activityData: {
    type: string;
    start?: string;
    end?: string;
    steps?: number;
    calories?: number;
    duration?: number; // minutes
  }
): Promise<Activity> {
  const now = new Date();
  const start = activityData.start ? new Date(activityData.start) : now;
  const end = activityData.end 
    ? new Date(activityData.end)
    : activityData.duration
    ? new Date(start.getTime() + activityData.duration * 60000)
    : start;

  // Estimate calories if not provided
  let calories = activityData.calories;
  if (!calories && activityData.duration) {
    // Simple calorie estimation based on activity type and duration
    const caloriesPerMinute = getCaloriesPerMinute(activityData.type);
    calories = Math.round(activityData.duration * caloriesPerMinute);
  }

  const [activity] = await db
    .insert(activities)
    .values({
      userId,
      source: 'manual',
      type: activityData.type,
      start,
      end,
      steps: activityData.steps,
      calories,
      meta: { duration: activityData.duration },
    })
    .returning();

  return activity;
}

/**
 * Add manual steps for a date
 */
export async function addManualSteps(userId: string, date: string, steps: number): Promise<void> {
  // Get user weight for calorie calculation
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const weightKg = user?.weightKg || 70; // Default weight if not set

  // Calculate calories from steps
  const calories = calculateStepsCalories(steps, weightKg);

  // Update or insert daily metrics
  await db
    .insert(dailyMetrics)
    .values({
      userId,
      date,
      steps,
      activeKcal: calories,
    })
    .onConflictDoUpdate({
      target: [dailyMetrics.userId, dailyMetrics.date],
      set: {
        steps,
        activeKcal: calories,
        updatedAt: new Date(),
      },
    });
}

/**
 * Simple calorie estimation per minute by activity type
 */
function getCaloriesPerMinute(activityType: string): number {
  const calorieRates: Record<string, number> = {
    'walk': 5,
    'run': 12,
    'cycle': 8,
    'swim': 10,
    'strength': 6,
    'yoga': 3,
    'dance': 7,
    'sports': 9,
    'default': 5,
  };

  return calorieRates[activityType.toLowerCase()] || calorieRates.default;
}

/**
 * Update user's BMR when weight changes
 */
export async function updateUserBMR(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.weightKg || !user.heightCm || !user.age || !user.gender) {
    return;
  }

  const bmrKcal = calculateBMR({
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    age: user.age,
    gender: user.gender as 'male' | 'female',
  });

  // Update today's BMR
  const today = new Date().toISOString().split('T')[0];
  await db
    .insert(dailyMetrics)
    .values({
      userId,
      date: today,
      bmrKcal,
    })
    .onConflictDoUpdate({
      target: [dailyMetrics.userId, dailyMetrics.date],
      set: {
        bmrKcal,
        updatedAt: new Date(),
      },
    });
}