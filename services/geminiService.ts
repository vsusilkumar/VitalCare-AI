import { GoogleGenAI, Type } from '@google/genai';
import { FeatureIdea, VitalsHistory, VitalSignType, HealthInsight, NewVitalData } from '../types.ts';

// Helper function to get the API client on demand
const getAiClient = (): GoogleGenAI => {
  const apiKey = sessionStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please set it in the header.");
  }
  return new GoogleGenAI({ apiKey });
};


export const getFeatureIdeas = async (): Promise<FeatureIdea[]> => {
  const prompt = `
    Generate 5 innovative feature ideas for a patient vitals management app, 
    focusing on elderly care. Provide a list of features with a brief description for each.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The name of the feature idea.",
        },
        description: {
          type: Type.STRING,
          description: "A brief description of the feature.",
        },
      },
      required: ["name", "description"],
    },
  };

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const ideas = JSON.parse(jsonText);
    
    if (!Array.isArray(ideas) || ideas.some(idea => typeof idea.name !== 'string' || typeof idea.description !== 'string')) {
      throw new Error("Invalid response format from API.");
    }

    return ideas as FeatureIdea[];
  } catch (error) {
    console.error("Error fetching feature ideas from Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not found")) {
        throw error;
    }
    throw new Error("Failed to communicate with the AI model.");
  }
};

export const getHealthInsights = async (vitals: VitalsHistory): Promise<HealthInsight> => {
  const simplifiedVitals = {
    heartRate: vitals[VitalSignType.HeartRate].map(r => Math.round(r.value)),
    bloodPressure: vitals[VitalSignType.BloodPressure].map(r => `${r.value.systolic}/${r.value.diastolic}`),
    temperature: vitals[VitalSignType.Temperature].map(r => r.value.toFixed(1)),
    oxygenSaturation: vitals[VitalSignType.OxygenSaturation].map(r => r.value.toFixed(1)),
  };

  const prompt = `
    Analyze the following 24-hour vital signs history for an elderly patient.
    Data: ${JSON.stringify(simplifiedVitals)}
    Identify any potential trends, patterns, or anomalies.
    Provide a concise summary of the patient's overall status and a list of 2-3 actionable recommendations.
    Frame the response as a helpful, non-diagnostic insight for a caregiver. Do not provide medical advice.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A brief summary of the patient's vital signs over the last 24 hours.",
      },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "A list of actionable recommendations for the caregiver.",
      },
    },
    required: ["summary", "recommendations"],
  };

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const insights = JSON.parse(jsonText);
    
    if (typeof insights.summary !== 'string' || !Array.isArray(insights.recommendations)) {
      throw new Error("Invalid response format from API.");
    }

    return insights as HealthInsight;
  } catch (error) {
    console.error("Error fetching health insights from Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not found")) {
        throw error;
    }
    throw new Error("Failed to communicate with the AI model for health insights.");
  }
};

export const parseVitalsFromText = async (text: string): Promise<Partial<NewVitalData>> => {
    const prompt = `
      Extract vital signs from the following text. The text is a voice transcription.
      Text: "${text}"
      Identify values for heart rate (in bpm), blood pressure (systolic and diastolic, in mmHg), temperature (in Celsius), and oxygen saturation (as a percentage).
      For blood pressure, "120 over 80" means systolic is 120 and diastolic is 80.
      Return only the numeric values. If a value is not mentioned, do not include it in the response.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            heartRate: { type: Type.NUMBER, description: "Heart rate in beats per minute." },
            systolic: { type: Type.NUMBER, description: "Systolic blood pressure in mmHg." },
            diastolic: { type: Type.NUMBER, description: "Diastolic blood pressure in mmHg." },
            temperature: { type: Type.NUMBER, description: "Body temperature in Celsius." },
            oxygenSaturation: { type: Type.NUMBER, description: "Blood oxygen saturation percentage." },
        },
    };

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error parsing vitals from text with Gemini API:", error);
        if (error instanceof Error && error.message.includes("API key not found")) {
            throw error;
        }
        throw new Error("AI could not understand the provided text. Please try again.");
    }
};