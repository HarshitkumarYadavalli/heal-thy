const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// Helper to query Gemini API
async function queryGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY environment variable is not defined");
    throw new HttpsError("failed-precondition", "Gemini API key is not configured on the server.");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.error("Gemini API call failed", { status: response.status, body: errText });
      throw new HttpsError("unavailable", `Gemini API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error("Error querying Gemini API", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message || "An error occurred while calling the AI service.");
  }
}

// Cloud Function to generate meal/workout plan
exports.generateMealPlan = onCall({ cors: true }, async (request) => {
  // onCall V2 puts the argument payload inside request.data
  const { onboardingData, followUpText } = request.data || {};

  let onboardingContext = "";
  if (onboardingData) {
    const healthCondStr = onboardingData.healthConditions && onboardingData.healthConditions.length > 0 
      ? onboardingData.healthConditions.join(", ") 
      : "None";
    
    let diabeticGuideline = "";
    if (onboardingData.healthConditions?.some(c => c.toLowerCase().includes("diabet"))) {
      diabeticGuideline = "CRITICAL DIETARY CONSTRAINT: The user is DIABETIC. Ensure all meal recommendations have a very low Glycemic Index (GI), limit simple sugars and refined grains, prioritize complex carbohydrates (like brown rice, millet, whole wheat, vegetables, and high fiber legumes), and provide health tips specifically targeted at blood sugar monitoring and portion management. ";
    }

    onboardingContext = `The user is ${onboardingData.age} years old, identifying as ${onboardingData.gender}, with a height of ${onboardingData.calculatedHeightCm} cm and weight of ${onboardingData.calculatedWeightKg} kg. Their calculated TDEE is ${onboardingData.tdee} kcal. They follow a ${onboardingData.dietType} diet with allergies/dislikes: [${onboardingData.allergies.join(", ") || "None"}], eat ${onboardingData.mealsPerDay} per day. Their activity level is ${onboardingData.routine} and they focus on: "${onboardingData.startingPoint}". They have medical health conditions: [${healthCondStr}]. ${diabeticGuideline}`;
  }

  const basePrompt = `${onboardingContext}Provide a JSON object for a 7-day healthy daywise meal and workout plan. The JSON must match this structure exactly: { "mealTitle": string, "summary": string, "days": [ { "dayName": string, "breakfast": string, "lunch": string, "snack": string, "dinner": string, "workout": string } ], "healthTips": string[], "followUpQuestion": string }. Provide details for 7 days (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Keep meals traditional Indian/customized, healthy, and tailored to the user's constraints. Respond with ONLY the raw JSON object, no markdown, no backticks, no explanation.`;
  
  const prompt = followUpText 
    ? `Based on the previous daywise plan context, the user had a follow-up query: "${followUpText}". ${onboardingContext}Generate an updated 7-day healthy daywise meal and workout plan matching this query. Return the same JSON structure: { "mealTitle": string, "summary": string, "days": [ { "dayName": string, "breakfast": string, "lunch": string, "snack": string, "dinner": string, "workout": string } ], "healthTips": string[], "followUpQuestion": string }. Respond with ONLY the raw JSON object, no markdown, no backticks, no explanation.`
    : basePrompt;

  const parsed = await queryGemini(prompt);

  const isValid =
    typeof parsed?.mealTitle === "string" &&
    typeof parsed?.summary === "string" &&
    Array.isArray(parsed?.days) &&
    parsed.days.length > 0 &&
    Array.isArray(parsed?.healthTips) &&
    typeof parsed?.followUpQuestion === "string";

  if (!isValid) {
    throw new HttpsError("invalid-argument", "Malformed meal plan data returned by AI model.");
  }

  return parsed;
});

// Cloud Function to parse food items and estimate nutrition macros
exports.estimateCalories = onCall({ cors: true }, async (request) => {
  const { foodText } = request.data || {};
  if (!foodText || !foodText.trim()) {
    throw new HttpsError("invalid-argument", "Food description is empty.");
  }

  const prompt = `Analyze this food description: "${foodText}". Estimate the total calories (kcal), protein (g), carbs (g), and fat (g) contained in it. Return ONLY a valid JSON object matching this structure: { "calories": number, "protein": number, "carbs": number, "fat": number, "foodSummary": string }. Keep estimations realistic for common ingredients/portions. Respond with ONLY the raw JSON object, no markdown backticks, no JSON prefix.`;

  const parsed = await queryGemini(prompt);
  return parsed;
});
