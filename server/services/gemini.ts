import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  confidence: number;
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  try {
    const systemPrompt = `You are a nutrition expert. Analyze this food image and provide detailed nutritional information.

Return a JSON response with this exact format:
{
  "name": "food name",
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams), 
  "fat": number (in grams),
  "fiber": number (in grams),
  "sugar": number (in grams),
  "sodium": number (in milligrams),
  "servingSize": "description of serving size",
  "confidence": number (0-1, how confident you are in this analysis)
}

Be as accurate as possible with nutritional values. If you can't identify the food clearly, set confidence below 0.5.`;

    const contents = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      systemPrompt,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            fiber: { type: "number" },
            sugar: { type: "number" },
            sodium: { type: "number" },
            servingSize: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["name", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "servingSize", "confidence"],
        },
      },
      contents: contents,
    });

    const rawJson = response.text;
    console.log(`Gemini analysis result: ${rawJson}`);

    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const analysis: FoodAnalysis = JSON.parse(rawJson);
    
    // Validate the response
    if (!analysis.name || typeof analysis.calories !== 'number') {
      throw new Error("Invalid analysis format from Gemini");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to analyze food image with AI");
  }
}