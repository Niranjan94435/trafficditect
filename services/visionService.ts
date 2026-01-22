
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const DETECTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: "One of: person, car, bus, truck, bike, animal.",
      },
      confidence: {
        type: Type.NUMBER,
      },
      ageGroup: {
        type: Type.STRING,
        description: "Persons only: Child, Teen, Adult, Senior.",
      },
      registrationNumber: {
        type: Type.STRING,
        description: "License plate if readable, else null.",
      },
      count: {
        type: Type.INTEGER,
      },
      box_2d: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "[ymin, xmin, ymax, xmax] (0-1000).",
      }
    },
    required: ["type", "confidence", "count", "box_2d"],
  },
};

export async function analyzeTrafficFrame(base64Image: string): Promise<DetectionResult[]> {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          parts: [
            { text: "Quick scan: car, bus, truck, bike, person, animal. Provide [ymin, xmin, ymax, xmax] for all. Extract plates and person ageGroup." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: DETECTION_SCHEMA,
        // Lower temperature for faster, more deterministic structural output
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Inference Error:", error);
    return [];
  }
}
