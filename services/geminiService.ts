
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Strictly adhering to GoogleGenAI initialization guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeneratedPost {
  title: string;
  description: string;
  ingredients: string[];
  tags: string[];
}

export interface GeneratedMenu {
  title: string;
  items: Array<{
    name: string;
    description: string;
    price?: number;
  }>;
}

export async function generateFoodPostAI(dishIdea: string): Promise<GeneratedPost> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a professional food content creator. Generate a food post for: ${dishIdea}. 
    Include a mouth-watering description, a list of ingredients, and relevant tags.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "ingredients", "tags"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateMenuIdeaAI(style: string, audience: string): Promise<GeneratedMenu> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a restaurant menu planner. Create a complete menu idea. 
    Style: ${style}. Target Audience: ${audience}. 
    Provide 5-8 dishes with descriptions and optional prices.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER }
              },
              required: ["name", "description"]
            }
          }
        },
        required: ["title", "items"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateFoodImage(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High quality food photography: ${prompt}, appetizing, cinematic lighting, top-down view.` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}
