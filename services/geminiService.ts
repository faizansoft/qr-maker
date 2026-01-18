
import { GoogleGenAI, Type } from "@google/genai";
import { AIStyleSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAIStyleSuggestion(content: string): Promise<AIStyleSuggestion> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this content for a QR code: "${content}". 
      Suggest a complete professional design theme. Choose values from these specific allowed sets:
      - dotType: ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded']
      - cornerSquareType: ['square', 'dot', 'extra-rounded']
      - cornerDotType: ['square', 'dot']
      
      Suggest colors in Hex format. The corner colors can be different from the main pattern color for an accent effect.
      Make the selection thematic (e.g., 'classy' for luxury links, 'dots' for tech, 'extra-rounded' for friendly/social).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryColor: { type: Type.STRING, description: "Main pattern color" },
            secondaryColor: { type: Type.STRING, description: "Background color" },
            cornerSquareColor: { type: Type.STRING, description: "Outer corner color" },
            cornerDotColor: { type: Type.STRING, description: "Inner corner eye color" },
            dotType: { type: Type.STRING, description: "One of the allowed dot types" },
            cornerSquareType: { type: Type.STRING, description: "One of the allowed corner square types" },
            cornerDotType: { type: Type.STRING, description: "One of the allowed corner dot types" },
            mood: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: [
            "primaryColor", 
            "secondaryColor", 
            "cornerSquareColor", 
            "cornerDotColor", 
            "dotType", 
            "cornerSquareType", 
            "cornerDotType", 
            "mood", 
            "description"
          ]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as AIStyleSuggestion;
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return {
      primaryColor: "#000000",
      secondaryColor: "#FFFFFF",
      cornerSquareColor: "#000000",
      cornerDotColor: "#000000",
      dotType: "square",
      cornerSquareType: "square",
      cornerDotType: "square",
      mood: "Neutral",
      description: "Default fallback style."
    };
  }
}
