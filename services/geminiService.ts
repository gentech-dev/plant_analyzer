
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, MOCK_PRODUCTS, PROPOSAL_SYSTEM_INSTRUCTION } from "../constants";
import { QuoteItem } from "../types";

// Helper to initialize AI
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLightingAdvice = async (
  prompt: string,
  history: { role: string; text: string }[]
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    // Construct a context string with product data
    // Updated to handle dynamic specs object
    const productContext = MOCK_PRODUCTS.map(p => {
        const specString = Object.entries(p.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        return `- ${p.name} (${p.category}): ${specString}, 價格 $${p.price}`;
    }).join('\n');

    const fullPrompt = `
    目前 Gentech 產品目錄資料:
    ${productContext}

    設計師問題: ${prompt}
    `;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: fullPrompt
    });

    return result.text || "抱歉，目前無法連線至 AI 顧問，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "系統連線錯誤：請檢查您的網路或 API Key 設定。";
  }
};

export const generateProjectProposal = async (items: QuoteItem[], projectName?: string): Promise<string> => {
  try {
    const ai = getAIClient();

    const itemsDescription = items.map(item => {
        const specString = Object.entries(item.specs)
            .filter(([k]) => ['CRI', 'UGR', '色溫', '光束角'].includes(k))
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        return `${item.name} x ${item.quantity} (類型: ${item.category}, ${specString})`;
    }).join('\n');

    let contextInfo = "";
    if (projectName) contextInfo += `專案名稱：${projectName}\n`;

    const prompt = `
    請根據以下資訊，為這個設計案撰寫一段照明設計提案：
    
    ${contextInfo}

    選用燈具清單：
    ${itemsDescription}
    
    請產出一篇約 300-500 字的提案文案。
    如果有提供「專案名稱」，請務必在文案開頭或標題中提及，讓提案更具客製化專業感。
    請根據燈具的規格 (CRI, UGR, 色溫) 來描述該空間將呈現的光影氛圍。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: PROPOSAL_SYSTEM_INSTRUCTION,
        temperature: 0.8, // Slightly higher for creativity
      }
    });

    return response.text || "無法生成提案，請重試。";
  } catch (error) {
    console.error("Proposal Generation Error:", error);
    return "系統忙碌中，無法自動生成提案文案。";
  }
};
