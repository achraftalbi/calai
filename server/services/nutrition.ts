import type { NutritionData } from "@shared/schema";

// Using Edamam Nutrition Analysis API
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || process.env.EDAMAM_APP_ID_ENV_VAR || "default_app_id";
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || process.env.EDAMAM_APP_KEY_ENV_VAR || "default_app_key";

export async function getNutritionData(foodName: string): Promise<NutritionData | null> {
  try {
    // Edamam Nutrition Analysis API
    const response = await fetch(`https://api.edamam.com/api/nutrition-data?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(foodName)}`);
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();

    // If no nutrition data found, return null to fall back to AI estimates
    if (!data.calories) {
      return null;
    }

    return {
      calories: Math.round(data.calories || 0),
      protein: Math.round((data.totalNutrients?.PROCNT?.quantity || 0) * 10) / 10,
      carbs: Math.round((data.totalNutrients?.CHOCDF?.quantity || 0) * 10) / 10,
      fat: Math.round((data.totalNutrients?.FAT?.quantity || 0) * 10) / 10,
      fiber: Math.round((data.totalNutrients?.FIBTG?.quantity || 0) * 10) / 10,
      sugar: Math.round((data.totalNutrients?.SUGAR?.quantity || 0) * 10) / 10,
      sodium: Math.round((data.totalNutrients?.NA?.quantity || 0) * 10) / 10,
    };

  } catch (error) {
    console.error("Nutrition API error:", error);
    // Return null to fall back to AI nutritional estimates
    return null;
  }
}
