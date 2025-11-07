import { GoogleGenAI, Type } from '@google/genai';
import { FeatureIdea, VitalsHistory, VitalSignType, HealthInsight, NewVitalData, ConsultationSummary, Patient, SmartAlert, DailyLogEntry } from '../types.ts';

// Helper function to get the API client on demand
const getAiClient = (): GoogleGenAI => {
  // As per guidelines, the API key is expected to be in process.env.API_KEY.
  // The GoogleGenAI constructor will handle the case where the key is missing or invalid.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    throw new Error("Failed to communicate with the AI model. Please try again later.");
  }
};

export const getHealthInsights = async (vitals: VitalsHistory, patient: Patient): Promise<HealthInsight> => {
  const simplifiedVitals = {
    heartRate: vitals[VitalSignType.HeartRate].map(r => Math.round(r.value)),
    bloodPressure: vitals[VitalSignType.BloodPressure].map(r => `${r.value.systolic}/${r.value.diastolic}`),
    temperature: vitals[VitalSignType.Temperature].map(r => r.value.toFixed(1)),
    oxygenSaturation: vitals[VitalSignType.OxygenSaturation].map(r => r.value.toFixed(1)),
  };

  const prompt = `
    Analyze the following 24-hour vital signs history for an elderly patient with the following medical history: ${patient.medicalSummary.conditions.join(', ')}.
    Data: ${JSON.stringify(simplifiedVitals)}
    Identify any potential trends, patterns, or anomalies, keeping their medical history in mind.
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
    throw new Error("Failed to generate health insights. Please try again later.");
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
        throw new Error("AI could not process the voice input. Please try again.");
    }
};

export const getConsultationSummary = async (vitals: VitalsHistory, patient: Patient): Promise<ConsultationSummary> => {
    const simplifiedVitals = {
        heartRate: vitals[VitalSignType.HeartRate].slice(-10).map(r => Math.round(r.value)), // last 10 readings
        bloodPressure: vitals[VitalSignType.BloodPressure].slice(-10).map(r => `${r.value.systolic}/${r.value.diastolic}`),
        temperature: vitals[VitalSignType.Temperature].slice(-10).map(r => r.value.toFixed(1)),
        oxygenSaturation: vitals[VitalSignType.OxygenSaturation].slice(-10).map(r => r.value.toFixed(1)),
    };

    const prompt = `
        You are an AI assistant for a doctor during a live video consultation with an elderly patient.
        The patient's key medical conditions are: ${patient.medicalSummary.conditions.join(', ')}.
        Analyze the patient's most recent vital signs provided below.
        Provide a concise, bullet-pointed summary for the doctor. Highlight critical trends, values outside the normal range, and suggest potential questions the doctor might want to ask to probe further.
        The summary should be easily scannable. Do not provide medical advice, but rather clinical points of interest.
        Vital Signs Data: ${JSON.stringify(simplifiedVitals)}
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            keyObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Bulleted list of key clinical observations from the vitals data."
            },
            suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Bulleted list of questions the doctor could ask the patient based on the data."
            }
        },
        required: ["keyObservations", "suggestedQuestions"]
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
        const summary = JSON.parse(jsonText);

        if (!summary.keyObservations || !summary.suggestedQuestions) {
            throw new Error("Invalid response format from API.");
        }

        return summary as ConsultationSummary;
    } catch (error) {
        console.error("Error fetching consultation summary from Gemini API:", error);
        throw new Error("Failed to generate AI consultation summary. Please try again later.");
    }
};

export const summarizeMedicalHistory = async (history: string): Promise<{ conditions: string[], allergies: string[] }> => {
    const prompt = `
        Parse the following medical history text.
        Extract a list of major medical conditions and a list of allergies.
        Keep the names concise.
        Text: "${history}"
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            conditions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of patient's medical conditions."
            },
            allergies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of patient's allergies."
            }
        },
        required: ["conditions", "allergies"]
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
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error summarizing medical history:", error);
        throw new Error("Failed to summarize medical history. Please try again later.");
    }
};

export const getSmartAlerts = async (vitals: VitalsHistory, patient: Patient): Promise<Omit<SmartAlert, 'id' | 'timestamp'>[]> => {
    const prompt = `
      Act as a clinical monitoring AI. Analyze the last 7 days of vital signs for an elderly patient with this history: ${patient.medicalSummary.conditions.join(', ')}.
      Establish the patient's baseline from the data. Identify up to 3 subtle but potentially important deviations or patterns that might not trigger a standard threshold alert.
      For each finding, provide a clear 'finding' (the what) and a 'context' (the why it's noteworthy).
      Classify severity as 'Observation' for minor deviations or 'Warning' for more concerning patterns.
      Data (last 7 days): ${JSON.stringify(vitals)}
    `;
  
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: "Either 'Observation' or 'Warning'." },
          finding: { type: Type.STRING, description: "A one-sentence summary of the anomaly." },
          context: { type: Type.STRING, description: "Why this finding is noteworthy for this patient." },
        },
        required: ["severity", "finding", "context"],
      },
    };
  
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Error generating smart alerts:", error);
      throw new Error("Failed to generate AI-powered smart alerts. Please try again later.");
    }
};

export const getDietaryAndActivityInsights = async (logs: DailyLogEntry[], vitals: VitalsHistory): Promise<string[]> => {
    const prompt = `
      Analyze the provided daily logs of meals and activities alongside the patient's vital signs for the same period.
      Identify up to 3 potential correlations or insights. For example, does a certain activity correlate with better blood pressure? Does a type of meal correlate with higher heart rate?
      Phrase the insights as simple, observational statements for a caregiver. Do not give medical advice.
      
      Daily Logs: ${JSON.stringify(logs.map(l => `${l.timestamp.toLocaleString()}: ${l.type} - ${l.description}`))}
      Vitals Data: ${JSON.stringify(vitals)}
    `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        insights: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "An observational insight correlating logs and vitals.",
          },
        },
      },
      required: ["insights"],
    };
  
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      const result = JSON.parse(response.text.trim());
      return result.insights;
    } catch (error) {
      console.error("Error generating correlation insights:", error);
      throw new Error("Failed to generate AI-powered correlation insights. Please try again later.");
    }
  };