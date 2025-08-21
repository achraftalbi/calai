/**
 * Enhanced activity calorie calculations using MET (Metabolic Equivalent of Task) values
 * Based on scientific research and standardized metabolic rates
 */

export interface ActivityMetrics {
  type: string;
  met: number;
  description: string;
  caloriesPerMinute: (weightKg: number) => number;
}

/**
 * Comprehensive MET values for different activities and intensities
 */
export const ACTIVITY_MET_VALUES: Record<string, ActivityMetrics> = {
  // Walking activities
  'walk': {
    type: 'walk',
    met: 3.5,
    description: 'Walking, 3.5 mph, level ground',
    caloriesPerMinute: (weightKg) => Math.round((3.5 * weightKg * 3.5) / 200)
  },
  'walk_brisk': {
    type: 'walk_brisk',
    met: 4.3,
    description: 'Walking, 4.0 mph, level ground',
    caloriesPerMinute: (weightKg) => Math.round((4.3 * weightKg * 3.5) / 200)
  },
  'walk_uphill': {
    type: 'walk_uphill',
    met: 6.0,
    description: 'Walking uphill, 3.5 mph, 1-5% grade',
    caloriesPerMinute: (weightKg) => Math.round((6.0 * weightKg * 3.5) / 200)
  },

  // Running activities
  'run': {
    type: 'run',
    met: 9.8,
    description: 'Running, 6.0 mph (10 min/mile)',
    caloriesPerMinute: (weightKg) => Math.round((9.8 * weightKg * 3.5) / 200)
  },
  'run_fast': {
    type: 'run_fast',
    met: 12.3,
    description: 'Running, 7.5 mph (8 min/mile)',
    caloriesPerMinute: (weightKg) => Math.round((12.3 * weightKg * 3.5) / 200)
  },
  'jog': {
    type: 'jog',
    met: 7.0,
    description: 'Jogging, general',
    caloriesPerMinute: (weightKg) => Math.round((7.0 * weightKg * 3.5) / 200)
  },

  // Cycling activities
  'cycle': {
    type: 'cycle',
    met: 6.8,
    description: 'Cycling, 12-14 mph, moderate effort',
    caloriesPerMinute: (weightKg) => Math.round((6.8 * weightKg * 3.5) / 200)
  },
  'cycle_light': {
    type: 'cycle_light',
    met: 5.8,
    description: 'Cycling, <10 mph, leisure',
    caloriesPerMinute: (weightKg) => Math.round((5.8 * weightKg * 3.5) / 200)
  },
  'cycle_vigorous': {
    type: 'cycle_vigorous',
    met: 10.0,
    description: 'Cycling, 16-19 mph, vigorous effort',
    caloriesPerMinute: (weightKg) => Math.round((10.0 * weightKg * 3.5) / 200)
  },

  // Swimming activities
  'swim': {
    type: 'swim',
    met: 8.3,
    description: 'Swimming, freestyle, moderate pace',
    caloriesPerMinute: (weightKg) => Math.round((8.3 * weightKg * 3.5) / 200)
  },
  'swim_vigorous': {
    type: 'swim_vigorous',
    met: 10.0,
    description: 'Swimming, freestyle, vigorous effort',
    caloriesPerMinute: (weightKg) => Math.round((10.0 * weightKg * 3.5) / 200)
  },
  'swim_backstroke': {
    type: 'swim_backstroke',
    met: 7.0,
    description: 'Swimming, backstroke, general',
    caloriesPerMinute: (weightKg) => Math.round((7.0 * weightKg * 3.5) / 200)
  },

  // Strength training
  'strength': {
    type: 'strength',
    met: 5.0,
    description: 'Weight lifting, general',
    caloriesPerMinute: (weightKg) => Math.round((5.0 * weightKg * 3.5) / 200)
  },
  'strength_vigorous': {
    type: 'strength_vigorous',
    met: 6.0,
    description: 'Weight lifting, vigorous effort',
    caloriesPerMinute: (weightKg) => Math.round((6.0 * weightKg * 3.5) / 200)
  },
  'bodyweight': {
    type: 'bodyweight',
    met: 4.3,
    description: 'Calisthenics, push-ups, sit-ups',
    caloriesPerMinute: (weightKg) => Math.round((4.3 * weightKg * 3.5) / 200)
  },

  // Yoga and flexibility
  'yoga': {
    type: 'yoga',
    met: 2.5,
    description: 'Yoga, Hatha',
    caloriesPerMinute: (weightKg) => Math.round((2.5 * weightKg * 3.5) / 200)
  },
  'yoga_power': {
    type: 'yoga_power',
    met: 4.0,
    description: 'Yoga, Power',
    caloriesPerMinute: (weightKg) => Math.round((4.0 * weightKg * 3.5) / 200)
  },
  'stretching': {
    type: 'stretching',
    met: 2.3,
    description: 'Stretching, mild',
    caloriesPerMinute: (weightKg) => Math.round((2.3 * weightKg * 3.5) / 200)
  },

  // Dance
  'dance': {
    type: 'dance',
    met: 5.0,
    description: 'Dancing, general',
    caloriesPerMinute: (weightKg) => Math.round((5.0 * weightKg * 3.5) / 200)
  },
  'dance_aerobic': {
    type: 'dance_aerobic',
    met: 7.3,
    description: 'Aerobic dance',
    caloriesPerMinute: (weightKg) => Math.round((7.3 * weightKg * 3.5) / 200)
  },

  // Sports
  'sports': {
    type: 'sports',
    met: 6.5,
    description: 'Sports, general',
    caloriesPerMinute: (weightKg) => Math.round((6.5 * weightKg * 3.5) / 200)
  },
  'basketball': {
    type: 'basketball',
    met: 8.0,
    description: 'Basketball, general',
    caloriesPerMinute: (weightKg) => Math.round((8.0 * weightKg * 3.5) / 200)
  },
  'tennis': {
    type: 'tennis',
    met: 7.3,
    description: 'Tennis, general',
    caloriesPerMinute: (weightKg) => Math.round((7.3 * weightKg * 3.5) / 200)
  },
  'soccer': {
    type: 'soccer',
    met: 10.0,
    description: 'Soccer, competitive',
    caloriesPerMinute: (weightKg) => Math.round((10.0 * weightKg * 3.5) / 200)
  },
  'volleyball': {
    type: 'volleyball',
    met: 4.0,
    description: 'Volleyball, recreational',
    caloriesPerMinute: (weightKg) => Math.round((4.0 * weightKg * 3.5) / 200)
  },

  // Other activities
  'climbing': {
    type: 'climbing',
    met: 8.0,
    description: 'Rock climbing, general',
    caloriesPerMinute: (weightKg) => Math.round((8.0 * weightKg * 3.5) / 200)
  },
  'hiking': {
    type: 'hiking',
    met: 6.0,
    description: 'Hiking, cross country',
    caloriesPerMinute: (weightKg) => Math.round((6.0 * weightKg * 3.5) / 200)
  },
  'rowing': {
    type: 'rowing',
    met: 7.0,
    description: 'Rowing, moderate effort',
    caloriesPerMinute: (weightKg) => Math.round((7.0 * weightKg * 3.5) / 200)
  },
  'elliptical': {
    type: 'elliptical',
    met: 5.0,
    description: 'Elliptical trainer, general',
    caloriesPerMinute: (weightKg) => Math.round((5.0 * weightKg * 3.5) / 200)
  }
};

/**
 * Get enhanced calorie calculation for an activity
 */
export function calculateActivityCalories(
  activityType: string, 
  durationMinutes: number, 
  weightKg: number = 70
): {
  calories: number;
  caloriesPerMinute: number;
  met: number;
  description: string;
} {
  const activity = ACTIVITY_MET_VALUES[activityType.toLowerCase()] || ACTIVITY_MET_VALUES['sports'];
  const caloriesPerMinute = activity.caloriesPerMinute(weightKg);
  const calories = Math.round(caloriesPerMinute * durationMinutes);

  return {
    calories,
    caloriesPerMinute,
    met: activity.met,
    description: activity.description
  };
}

/**
 * Get all available activity types for UI
 */
export function getAvailableActivities(): Array<{
  value: string;
  label: string;
  met: number;
  description: string;
}> {
  return Object.values(ACTIVITY_MET_VALUES).map(activity => ({
    value: activity.type,
    label: activity.type.charAt(0).toUpperCase() + activity.type.slice(1).replace('_', ' '),
    met: activity.met,
    description: activity.description
  }));
}