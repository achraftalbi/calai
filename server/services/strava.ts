/**
 * Strava Integration Service
 * Handles OAuth authentication and activity import from Strava
 */

import { db } from "../db";
import { providerTokens, activities, dailyMetrics, users } from "../../shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { calculateActivityCalories } from "./activityCalculations";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/strava/callback`;

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number;
  calories?: number;
  moving_time: number;
  average_speed: number;
  max_speed: number;
}

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Generate Strava OAuth authorization URL
 */
export function getStravaAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID!,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: 'activity:read',
    state: userId,
    approval_prompt: 'auto'
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeStravaCode(
  code: string, 
  userId: string
): Promise<void> {
  console.log("Starting Strava token exchange for user:", userId);
  
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Strava token exchange failed:", error);
    throw new Error(`Strava token exchange failed: ${response.status}`);
  }

  const tokens: StravaTokens = await response.json();
  console.log("Received tokens from Strava:", { 
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresAt: tokens.expires_at 
  });

  // Store tokens in database
  console.log("Attempting to store Strava tokens in database for user:", userId);
  try {
    await db
      .insert(providerTokens)
      .values({
        userId,
        provider: 'strava',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
        scope: 'activity:read',
      });
    console.log("Successfully inserted Strava tokens for user:", userId);
  } catch (error: any) {
    console.log("Insert failed, attempting update. Error code:", error.code);
    if (error.code === '23505') { // Unique constraint violation
      await db
        .update(providerTokens)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expires_at * 1000),
          scope: 'activity:read',
        })
        .where(
          and(
            eq(providerTokens.userId, userId),
            eq(providerTokens.provider, 'strava')
          )
        );
      console.log("Successfully updated Strava tokens for user:", userId);
    } else {
      console.error("Database error storing Strava tokens:", error);
      throw error;
    }
  }

  // Verify the tokens were saved
  const [savedToken] = await db
    .select()
    .from(providerTokens)
    .where(
      and(
        eq(providerTokens.userId, userId),
        eq(providerTokens.provider, 'strava')
      )
    );
  console.log("Verification - Strava token saved:", !!savedToken);
}

/**
 * Get valid Strava access token, refreshing if needed
 */
async function getStravaToken(userId: string): Promise<string | null> {
  const [tokenRecord] = await db
    .select()
    .from(providerTokens)
    .where(
      and(
        eq(providerTokens.userId, userId),
        eq(providerTokens.provider, 'strava')
      )
    );

  if (!tokenRecord) return null;

  // Check if token needs refresh
  if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
    if (!tokenRecord.refreshToken) return null;

    try {
      console.log("Refreshing Strava token for user:", userId);
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: tokenRecord.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        console.error('Failed to refresh Strava token:', response.status);
        return null;
      }

      const tokens: StravaTokens = await response.json();

      // Update token in database
      await db
        .update(providerTokens)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expires_at * 1000),
        })
        .where(eq(providerTokens.id, tokenRecord.id));

      console.log("Strava token refreshed successfully for user:", userId);
      return tokens.access_token;
    } catch (error) {
      console.error('Failed to refresh Strava token:', error);
      return null;
    }
  }

  return tokenRecord.accessToken;
}

/**
 * Map Strava activity types to our activity types
 */
function mapStravaActivityType(type: string, sportType: string): string {
  const typeMap: Record<string, string> = {
    'Run': 'run',
    'Walk': 'walk',
    'Hike': 'hiking',
    'Ride': 'cycle',
    'VirtualRide': 'cycle',
    'Swim': 'swim',
    'WeightTraining': 'strength',
    'Workout': 'strength',
    'Yoga': 'yoga',
    'Crossfit': 'strength_vigorous',
    'Rock Climbing': 'climbing',
    'Soccer': 'soccer',
    'Basketball': 'basketball',
    'Tennis': 'tennis',
    'Volleyball': 'volleyball',
    'Rowing': 'rowing',
    'Elliptical': 'elliptical',
    'StairStepper': 'elliptical',
  };

  return typeMap[sportType] || typeMap[type] || 'sports';
}

/**
 * Fetch activities from Strava
 */
export async function syncStravaActivities(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<StravaActivity[]> {
  const accessToken = await getStravaToken(userId);
  if (!accessToken) {
    throw new Error('No valid Strava token found');
  }

  const startEpoch = Math.floor(startDate.getTime() / 1000);
  const endEpoch = Math.floor(endDate.getTime() / 1000);

  console.log("Making Strava activities API call for user:", userId);
  console.log("Date range:", startDate.toISOString(), "to", endDate.toISOString());

  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${startEpoch}&before=${endEpoch}&per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Strava API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Strava API error response:", errorText);
      throw new Error(`Strava API error: ${response.status} - ${errorText}`);
    }

    const activities: StravaActivity[] = await response.json();
    console.log("Strava activities received:", activities.length);
    
    return activities;
  } catch (error) {
    console.error('Failed to fetch Strava activities:', error);
    throw error;
  }
}

/**
 * Import activities from Strava and store in database
 */
export async function importStravaData(userId: string): Promise<{
  activitiesImported: number;
  error?: string;
}> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log("Starting Strava data import for user:", userId);
  console.log("Fetching activities from:", thirtyDaysAgo.toISOString(), "to:", today.toISOString());

  try {
    // Sync activities from last 30 days
    const stravaActivities = await syncStravaActivities(userId, thirtyDaysAgo, today);
    console.log("Strava activities received:", stravaActivities.length);
    
    let activitiesImported = 0;
    
    // Get user for calorie calculations using storage service
    const { storage } = await import("../storage");
    const user = await storage.getUser(userId);
    const weightKg = user?.weightKg || 70;

    // Import each activity
    for (const stravaActivity of stravaActivities) {
      const startTime = new Date(stravaActivity.start_date);
      const durationMinutes = Math.round(stravaActivity.elapsed_time / 60);
      
      if (durationMinutes < 2) continue; // Skip very short activities
      
      const activityType = mapStravaActivityType(stravaActivity.type, stravaActivity.sport_type);
      
      // Use Strava calories if available, otherwise calculate
      let calories = stravaActivity.calories;
      let calculationDetails = null;
      
      if (!calories) {
        const calculation = calculateActivityCalories(activityType, durationMinutes, weightKg);
        calories = calculation.calories;
        calculationDetails = calculation;
      }
      
      // Check if activity already exists
      const [existingActivity] = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.source, 'strava'),
            eq(activities.start, startTime)
          )
        );
      
      if (!existingActivity) {
        await db.insert(activities).values({
          userId,
          source: 'strava',
          type: activityType,
          start: startTime,
          end: new Date(startTime.getTime() + stravaActivity.elapsed_time * 1000),
          calories,
          meta: {
            duration: durationMinutes,
            stravaId: stravaActivity.id,
            stravaType: stravaActivity.type,
            sportType: stravaActivity.sport_type,
            distance: stravaActivity.distance,
            elevationGain: stravaActivity.total_elevation_gain,
            averageSpeed: stravaActivity.average_speed,
            calculationDetails,
            stravaCalories: stravaActivity.calories || null,
          },
        });
        
        activitiesImported++;
        console.log(`Imported Strava activity: ${activityType} for ${durationMinutes} minutes, ${calories} calories`);
      }
    }

    console.log(`Strava import complete: ${activitiesImported} activities imported`);
    
    return {
      activitiesImported,
    };
  } catch (error) {
    console.error('Failed to import Strava data:', error);
    return {
      activitiesImported: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has valid Strava connection
 */
export async function checkStravaConnection(userId: string): Promise<{
  connected: boolean;
  lastSync?: string;
  totalActivities?: number;
  lastActivity?: string;
}> {
  try {
    const [tokenRecord] = await db
      .select()
      .from(providerTokens)
      .where(
        and(
          eq(providerTokens.userId, userId),
          eq(providerTokens.provider, 'strava')
        )
      );

    if (!tokenRecord) {
      return { connected: false };
    }

    // Count total activities
    const [activityCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.source, 'strava')
        )
      );

    // Get last activity
    const [lastActivity] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.source, 'strava')
        )
      )
      .orderBy(desc(activities.start))
      .limit(1);

    return {
      connected: true,
      lastSync: tokenRecord.createdAt?.toISOString(),
      totalActivities: activityCount?.count || 0,
      lastActivity: lastActivity?.start?.toISOString(),
    };
  } catch (error) {
    console.error("Error checking Strava connection:", error);
    return { connected: false };
  }
}

/**
 * Disconnect Strava integration
 */
export async function disconnectStrava(userId: string): Promise<void> {
  try {
    // Delete the token
    await db
      .delete(providerTokens)
      .where(
        and(
          eq(providerTokens.userId, userId),
          eq(providerTokens.provider, 'strava')
        )
      );

    console.log("Strava disconnected for user:", userId);
  } catch (error) {
    console.error("Error disconnecting Strava:", error);
    throw error;
  }
}