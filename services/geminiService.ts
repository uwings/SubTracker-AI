
import { GoogleGenAI, Type } from "@google/genai";
import { BillingCycle, Subscription, SubIntent, PaymentPlatform } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedResponse extends Partial<Subscription> {
  intent: SubIntent;
}

export const parseSubscriptionText = async (text: string, existingCategories: string[] = []): Promise<ParsedResponse | null> => {
  try {
    const categoriesContext = existingCategories.length > 0 
      ? `目前已有的分类有: ${existingCategories.join(', ')}。请尽量从中选择最合适的分类，如果没有合适的再创建新分类。`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个智能订阅管理助手。请分析用户的输入: "${text}"。
      
      指令规则（必须严格遵守）:
      1. 确定意图: 'DELETE' (删除), 'CANCEL' (取消续费), 'UPDATE' (更新), 或 'CREATE' (创建)。
      2. 将名称标准化为官方品牌名。
      3. 订阅类型与续费逻辑互斥规则:
         - 如果用户提到“买断”、“终身”、“永久”，必须设为 'LIFETIME' 周期，且 'autoRenew' 必须为 false。
         - 如果用户提到“买一个月”、“只用一次”，必须设为 'ONE_TIME' 周期，且 'autoRenew' 必须为 false。
         - 只有 'MONTHLY' (按月) 或 'YEARLY' (按年) 周期可以设 'autoRenew' 为 true。
      4. 检测平台: 'ALIPAY' (支付宝), 'WECHAT' (微信支付), 'APPLE' (苹果支付), 'GOOGLE', 'CREDIT_CARD' (信用卡), 'PAYPAL', 或 'OTHER'。
      5. 分类指导: ${categoriesContext}
      
      请严格返回 JSON 格式。`,
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
    
    // 如果是 LIFETIME 或 ONE_TIME，AI 如果识别错了强制纠正
    if (parsed.billingCycle === BillingCycle.LIFETIME || parsed.billingCycle === BillingCycle.ONE_TIME) {
      parsed.autoRenew = false;
    }

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
