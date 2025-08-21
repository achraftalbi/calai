/**
 * BMR (Basal Metabolic Rate) calculation service using Mifflin-St Jeor equation
 */

export interface BMRInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Male: 10*kg + 6.25*cm - 5*age + 5
 * Female: 10*kg + 6.25*cm - 5*age - 161
 */
export function calculateBMR(input: BMRInput): number {
  const { weightKg, heightCm, age, gender } = input;
  
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
}

/**
 * Estimate calories burned from steps
 * Formula: steps × weight(kg) × 0.0005 (conservative estimate)
 */
export function calculateStepsCalories(steps: number, weightKg: number): number {
  return Math.round(steps * weightKg * 0.0005);
}

/**
 * Calculate net calories: Eaten - (BMR + ActiveKcal)
 */
export function calculateNetCalories(intakeKcal: number, bmrKcal: number, activeKcal: number): number {
  return intakeKcal - (bmrKcal + activeKcal);
}

/**
 * Convert weight between units
 */
export function convertWeight(weight: number, fromUnit: 'kg' | 'lb', toUnit: 'kg' | 'lb'): number {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'lb' && toUnit === 'kg') {
    return weight * 0.453592;
  } else {
    return weight * 2.20462;
  }
}

/**
 * Convert height between units
 */
export function convertHeight(height: number, fromUnit: 'cm' | 'ft', toUnit: 'cm' | 'ft'): number {
  if (fromUnit === toUnit) return height;
  
  if (fromUnit === 'ft' && toUnit === 'cm') {
    return height * 30.48;
  } else {
    return height / 30.48;
  }
}

/**
 * Get net calories color classification
 */
export function getNetCaloriesColor(netKcal: number): 'green' | 'amber' | 'red' {
  if (netKcal <= 0) return 'green';
  if (netKcal <= 200) return 'amber';
  return 'red';
}