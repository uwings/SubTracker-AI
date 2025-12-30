
import { GoogleGenAI, Type } from "@google/genai";
import { BillingCycle, Subscription, SubIntent, PaymentPlatform } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedResponse extends Partial<Subscription> {
  intent: SubIntent;
}

export const parseSubscriptionText = async (text: string): Promise<ParsedResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a smart subscription manager. Analyze this input: "${text}".
      
      Instructions:
      1. Determine intent: 'DELETE', 'CANCEL', 'UPDATE', or 'CREATE'.
      2. Normalize name to official brand.
      3. CRITICAL: Distinguish between 'ONE_TIME' and 'LIFETIME'.
         - 'ONE_TIME': Single payment for a limited duration (e.g., "buy 1 month").
         - 'LIFETIME': Single payment for permanent access (e.g., "buyout", "lifetime").
      4. Detect platform: 'ALIPAY', 'WECHAT', 'APPLE', 'GOOGLE', 'CREDIT_CARD', 'PAYPAL', or 'OTHER'.
      5. Default cycle: 'MONTHLY'.
      
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ['CREATE', 'UPDATE', 'DELETE', 'CANCEL'] },
            name: { type: Type.STRING },
            cost: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            billingCycle: { type: Type.STRING, enum: Object.values(BillingCycle) },
            platform: { type: Type.STRING, enum: Object.values(PaymentPlatform) },
            autoRenew: { type: Type.BOOLEAN },
            startDate: { type: Type.STRING },
            category: { type: Type.STRING },
            websiteUrl: { type: Type.STRING },
            notes: { type: Type.STRING }
          },
          required: ["intent", "name"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) return null;

    const parsed = JSON.parse(textOutput.trim());
    
    if (parsed.websiteUrl) {
      const domain = parsed.websiteUrl.replace(/https?:\/\//, '').split('/')[0];
      parsed.logoUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    }

    return parsed as ParsedResponse;
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return null;
  }
};
