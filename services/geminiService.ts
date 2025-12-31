
import { GoogleGenAI, Type } from "@google/genai";
import { BillingCycle, Subscription, SubIntent, PaymentPlatform, AIConfig } from "../types";
import { fetchBrandMetadata } from "./brandService";

export interface ParsedResponse extends Partial<Subscription> {
  intent: SubIntent;
}

const getAIConfig = (): AIConfig => {
  const saved = localStorage.getItem('subtracker_ai_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse AI config", e);
    }
  }
  return { provider: 'gemini', geminiModel: 'gemini-3-flash-preview' };
};

export const parseSubscriptionText = async (text: string, existingCategories: string[] = []): Promise<ParsedResponse | null> => {
  const config = getAIConfig();
  const categoriesContext = existingCategories.length > 0 
    ? `目前已有的分类有: ${existingCategories.join(', ')}。`
    : "";

  const systemInstruction = `你是一个专业的个人财务助理。分析用户的输入并将其转化为结构化数据：
      输入: "${text}"
      
      规则:
      1. 意图检测: CREATE (新增), UPDATE (修改), DELETE (删除), CANCEL (退订)。
      2. 周期匹配: 识别关键词如“月”、“年”、“买断/永久”、“一次性”、“阶段”。
      3. 自动纠错: 比如用户说“Netflix 10块”，如果是美元区服务请默认识别为 USD。
      4. 互斥性: LIFETIME 和 ONE_TIME 的 autoRenew 必须为 false。
      ${categoriesContext}

      请仅返回 JSON。`;

  try {
    let output = "";

    if (config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: systemInstruction,
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
              category: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["intent", "name"]
          }
        }
      });
      output = response.text || "";
    } else if (config.provider === 'custom' && config.customConfig) {
      const { apiKey, baseUrl, model } = config.customConfig;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that strictly outputs JSON.' },
            { role: 'user', content: systemInstruction }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });
      
      if (!response.ok) throw new Error(`Custom AI Provider Error: ${response.statusText}`);
      const data = await response.json();
      output = data.choices[0].message.content || "";
    }

    if (!output) return null;
    const parsed = JSON.parse(output.trim());
    
    // 自动补全品牌元数据
    const brand = fetchBrandMetadata(parsed.name);
    return {
      ...parsed,
      logoUrl: brand.logoUrl,
      websiteUrl: brand.websiteUrl
    } as ParsedResponse;
  } catch (error) {
    console.error("SubTracker AI Error:", error);
    return null;
  }
};
