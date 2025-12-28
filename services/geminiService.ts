
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, AIAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFragment = async (text: string): Promise<AIAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个深邃、富有同情心的星河引路人。请分析以下这段情绪文字，并以JSON格式返回。你的回复应当充满文学感和治愈感，像是一首短诗的一角。

      JSON 结构：
      1. sentiment: 情绪类别 (HAPPY, CALM, ANXIOUS, SAD, ANGRY 之一)
      2. intensity: 情绪强度 (1-10)
      3. reply: 一句富有诗意、深度的共情回复 (25字以内，具有文学美感)
      4. tags: 3个富有质感的标签 (如 #余震, #破晓, #深潜 等)
      
      文字内容："${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            reply: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["sentiment", "intensity", "reply", "tags"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      sentiment: result.sentiment as Sentiment,
      intensity: result.intensity,
      reply: result.reply,
      tags: result.tags
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      sentiment: Sentiment.CALM,
      intensity: 5,
      reply: "万物皆有裂痕，那是光照进来的地方。",
      tags: ["#无名", "#归处"]
    };
  }
};
