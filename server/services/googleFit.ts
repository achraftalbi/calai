/**
 * Google Fit API integration for automatic activity tracking
 */

import { OAuth2Client } from 'google-auth-library';
import { db } from '../db';
import { providerTokens, activities, dailyStats, users, dailyMetrics } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { calculateActivityCalories } from './activityCalculations';

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.location.read'
];

export interface GoogleFitActivity {
  name: string;
  startTimeMillis: string;
  endTimeMillis: string;
  activityType: number;
  calories?: number;
  steps?: number;
  distance?: number;
}

export interface GoogleFitSteps {
  date: string;
  steps: number;
}

/**
 * Get Google Fit authorization URL
 */
export function getGoogleFitAuthUrl(userId: string): string {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google-fit/callback`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_FIT_SCOPES,
    state: userId, // Pass userId in state to identify user after callback
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleFitCode(
  code: string, 
  userId: string
): Promise<void> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google-fit/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens in database
  try {
    await db
      .insert(providerTokens)
      .values({
        userId,
        provider: 'google_fit',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: GOOGLE_FIT_SCOPES.join(' '),
      });
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      // Update existing record
      await db
        .update(providerTokens)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: GOOGLE_FIT_SCOPES.join(' '),
        })
        .where(
          and(
            eq(providerTokens.userId, userId),
            eq(providerTokens.provider, 'google_fit')
          )
        );
    } else {
      throw error;
    }
  }
}

/**
 * Get user's Google Fit token and refresh if needed
 */
async function getGoogleFitToken(userId: string): Promise<string | null> {
  const [tokenRecord] = await db
    .select()
    .from(providerTokens)
    .where(
      and(
        eq(providerTokens.userId, userId),
        eq(providerTokens.provider, 'google_fit')
      )
    );

  if (!tokenRecord) return null;

  // Check if token needs refresh
  if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
    if (!tokenRecord.refreshToken) return null;

    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: tokenRecord.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update token in database
      await db
        .update(providerTokens)
        .set({
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        })
        .where(eq(providerTokens.id, tokenRecord.id));

      return credentials.access_token || null;
    } catch (error) {
      console.error('Failed to refresh Google Fit token:', error);
      return null;
    }
  }

  return tokenRecord.accessToken;
}

/**
 * Map Google Fit activity types to our activity types
 */
function mapGoogleFitActivityType(activityType: number): string {
  const activityMap: Record<number, string> = {
    7: 'walk',        // Walking
    8: 'run',         // Running
    1: 'cycle',       // Biking
    56: 'swim',       // Swimming
    79: 'strength',   // Strength training
    28: 'yoga',       // Yoga
    9: 'dance',       // Dancing
    15: 'sports',     // General sports
    16: 'basketball', // Basketball
    17: 'volleyball', // Volleyball
    18: 'tennis',     // Tennis
    19: 'soccer',     // Soccer/Football
  };

  return activityMap[activityType] || 'sports';
}

/**
 * Fetch activities from Google Fit
 */
export async function syncGoogleFitActivities(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleFitActivity[]> {
  const accessToken = await getGoogleFitToken(userId);
  if (!accessToken) {
    throw new Error('No valid Google Fit token found');
  }

  const startTimeMillis = startDate.getTime();
  const endTimeMillis = endDate.getTime();

  try {
    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startTimeMillis).toISOString()}&endTime=${new Date(endTimeMillis).toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.session || []).map((session: any) => ({
      name: session.name || mapGoogleFitActivityType(session.activityType),
      startTimeMillis: session.startTimeMillis,
      endTimeMillis: session.endTimeMillis,
      activityType: session.activityType,
    }));
  } catch (error) {
    console.error('Failed to fetch Google Fit activities:', error);
    throw error;
  }
}

/**
 * Fetch daily steps from Google Fit
 */
export async function syncGoogleFitSteps(
  userId: string,
  date: Date
): Promise<number> {
  const accessToken = await getGoogleFitToken(userId);
  if (!accessToken) {
    throw new Error('No valid Google Fit token found');
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const response = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 24 hours
          startTimeMillis: startOfDay.getTime(),
          endTimeMillis: endOfDay.getTime(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.status}`);
    }

    const data = await response.json();
    
    let totalSteps = 0;
    (data.bucket || []).forEach((bucket: any) => {
      (bucket.dataset || []).forEach((dataset: any) => {
        (dataset.point || []).forEach((point: any) => {
          if (point.value && point.value[0] && point.value[0].intVal) {
            totalSteps += point.value[0].intVal;
          }
        });
      });
    });

    return totalSteps;
  } catch (error) {
    console.error('Failed to fetch Google Fit steps:', error);
    throw error;
  }
}

/**
 * Import activities from Google Fit and store in database
 */
export async function importGoogleFitData(userId: string): Promise<{
  activitiesImported: number;
  stepsUpdated: boolean;
}> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    // Sync activities from last 24 hours
    const fitActivities = await syncGoogleFitActivities(userId, yesterday, today);
    
    let activitiesImported = 0;
    
    // Get user weight for calorie calculations
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const weightKg = user?.weightKg || 70;

    // Import each activity
    for (const fitActivity of fitActivities) {
      const startTime = new Date(parseInt(fitActivity.startTimeMillis));
      const endTime = new Date(parseInt(fitActivity.endTimeMillis));
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      if (durationMinutes < 5) continue; // Skip very short activities
      
      const activityType = mapGoogleFitActivityType(fitActivity.activityType);
      const calculationDetails = calculateActivityCalories(activityType, durationMinutes, weightKg);
      
      // Check if activity already exists
      const [existingActivity] = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.source, 'google_fit'),
            eq(activities.start, startTime)
          )
        );
      
      if (!existingActivity) {
        await db.insert(activities).values({
          userId,
          source: 'google_fit',
          type: activityType,
          start: startTime,
          end: endTime,
          calories: calculationDetails.calories,
          steps: fitActivity.steps,
          meta: {
            duration: durationMinutes,
            googleFitActivityType: fitActivity.activityType,
            calculationDetails,
          },
        });
        
        activitiesImported++;
      }
    }

    // Sync today's steps
    const todaySteps = await syncGoogleFitSteps(userId, today);
    const todayDate = today.toISOString().split('T')[0];
    
    // Update daily metrics with steps
    await db
      .insert(dailyMetrics)
      .values({
        userId,
        date: todayDate,
        steps: todaySteps,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailyMetrics.userId, dailyMetrics.date],
        set: {
          steps: todaySteps,
          updatedAt: new Date(),
        },
      });

    return {
      activitiesImported,
      stepsUpdated: todaySteps > 0,
    };
  } catch (error) {
    console.error('Failed to import Google Fit data:', error);
    throw error;
  }
}

/**
 * Disconnect Google Fit integration
 */
export async function disconnectGoogleFit(userId: string): Promise<void> {
  await db
    .delete(providerTokens)
    .where(
      and(
        eq(providerTokens.userId, userId),
        eq(providerTokens.provider, 'google_fit')
      )
    );
}