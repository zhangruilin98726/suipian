
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, AIAnalysis } from "../types";

// Always use named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFragment = async (text: string): Promise<AIAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个深邃、富有同情心的星河引路人。请分析以下这段情绪文字，并以JSON格式返回。你的回复应当充满文学感和治愈感，像是一首短诗的一角。

      情绪类别指南：
      - HAPPY: 喜悦、成功、希望
      - CALM: 平静、释然、冥想
      - ANXIOUS: 焦虑、迷茫、急躁
      - SAD: 悲伤、失落、孤独
      - ANGRY: 愤怒、不平、爆发
      - REMEMBERING: 思念、追忆、怀念已故或远方的亲人（带有永恒、温柔、跨越时空的感觉）
      - AWAKENING: 觉醒、启发、顿悟、看到曙光（一种理性的清澈感或长夜后的第一抹希望）

      JSON 结构：
      1. sentiment: 情绪类别 (上述7种之一)
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
