import OpenAI from "openai";
import type { FoodAnalysisResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert nutritionist and food recognition AI. Analyze food images and provide accurate nutritional information. 
          
          Response format (JSON only):
          {
            "foodName": "specific dish name",
            "calories": number,
            "protein": number (grams),
            "carbs": number (grams), 
            "fat": number (grams),
            "confidence": number (0-1),
            "ingredients": ["ingredient1", "ingredient2"],
            "portionSize": "estimated portion description"
          }
          
          Guidelines:
          - Identify the main food items in the image
          - Estimate realistic portion sizes based on visual cues
          - Provide nutritional values per serving shown
          - Use confidence score based on image clarity and food recognition certainty
          - Include major ingredients visible in the dish
          - Be specific with food names (e.g., "Grilled Chicken Caesar Salad" not just "Salad")`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide detailed nutritional information. Focus on accuracy and realistic portion estimation."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      foodName: result.foodName || "Unknown Food",
      calories: Math.round(result.calories || 0),
      protein: Math.round((result.protein || 0) * 10) / 10, // round to 1 decimal
      carbs: Math.round((result.carbs || 0) * 10) / 10,
      fat: Math.round((result.fat || 0) * 10) / 10,
      confidence: Math.min(Math.max(result.confidence || 0, 0), 1), // clamp between 0-1
      ingredients: result.ingredients || [],
      portionSize: result.portionSize,
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze food image with AI");
  }
}
