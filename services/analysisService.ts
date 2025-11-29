
import { GoogleGenAI, Type } from "@google/genai";
import { ChatSession, AIAnalysisResult, Project, Product, GlobalAIInsight } from "../types";

// Helper to initialize AI
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `
你是 Gentech (靖軒科技) 的 B2B 客戶關係分析專家。
你的任務是閱讀「室內設計師」與「客服人員」之間的對話紀錄，並進行深度的商業分析。

請輸出純 JSON 格式，包含以下欄位：
1. sentimentScore: 0-100 的分數 (0=極度不滿, 100=極度滿意)。
2. sentimentLabel: "positive" (正面), "neutral" (中性), "negative" (負面), "urgent" (緊急/憤怒)。
3. painPoints: 設計師在對話中提到的痛點、抱怨或遇到的困難 (Array of strings)。
4. productPreferences: 設計師表現出興趣的產品類型、風格或特定規格 (Array of strings)。
5. salesOpportunities: 潛在的銷售機會或追加銷售建議 (Array of strings)。
6. coachTips: 給客服人員的改進建議，或是做得好的地方 (Array of strings)。
7. summary: 50字以內的對話摘要。

請務必客觀、精準，並專注於商業價值。
`;

const GLOBAL_STRATEGY_INSTRUCTION = `
你是 Gentech (靖軒科技) 的「營運長 (COO)」兼「供應鏈策略專家」。
你的任務是分析公司整體的銷售數據、庫存狀況以及大量的客戶對話紀錄，提供宏觀的營運決策建議。

請根據提供的數據，輸出純 JSON 格式報告 (GlobalAIInsight)，包含：
1. marketTrends: 市場趨勢分析 (流行色溫、顏色、竄升產品)。
2. inventoryAdvice: 智慧補貨建議 (針對低庫存或熱銷品，建議補貨數量與理由)。
3. complaintSummary: 客訴議題熱點分析 (歸納常見問題、頻率與改善建議)。
4. strategicAdvice: 給管理層的一段總體策略建議 (約 100-150 字)。

請注意：
- 補貨建議必須具體 (例如建議補貨多少數量)。
- 客訴分析需歸納根本原因。
- 繁體中文回答。
`;

export const analyzeChatSession = async (session: ChatSession): Promise<AIAnalysisResult> => {
  try {
    const ai = getAIClient();

    // Format chat history for the prompt
    const chatHistoryText = session.messages.map(m => {
        const role = m.role === 'user' ? `設計師 (${session.userName})` : (m.role === 'agent' ? '客服人員' : 'AI 助手');
        const time = new Date(m.timestamp).toLocaleString();
        return `[${time}] ${role}: ${m.text}`;
    }).join('\n');

    const prompt = `
    請分析以下對話紀錄：
    客戶名稱：${session.userName}
    公司：${session.company || 'N/A'}

    === 對話紀錄開始 ===
    ${chatHistoryText}
    === 對話紀錄結束 ===
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sentimentScore: { type: Type.NUMBER },
                sentimentLabel: { type: Type.STRING, enum: ["positive", "neutral", "negative", "urgent"] },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                productPreferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                salesOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                coachTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
            },
            required: ["sentimentScore", "sentimentLabel", "painPoints", "productPreferences", "salesOpportunities", "coachTips", "summary"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");

    const analysisData = JSON.parse(resultText);

    return {
        ...analysisData,
        analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Return a fallback error result
    return {
        sentimentScore: 50,
        sentimentLabel: 'neutral',
        painPoints: ['分析失敗：無法連線至 AI 服務'],
        productPreferences: [],
        salesOpportunities: [],
        coachTips: [],
        summary: '系統發生錯誤，無法完成分析。',
        analyzedAt: new Date().toISOString()
    };
  }
};

export const generateGlobalInsight = async (
    projects: Project[], 
    products: Product[], 
    chatSessions: ChatSession[]
): Promise<GlobalAIInsight> => {
    try {
        const ai = getAIClient();

        // 1. Data Aggregation (Pre-processing)
        // A. Sales Trends (Last 90 Days)
        const recentProjects = projects.filter(p => {
            const d = new Date(p.date);
            const now = new Date();
            return (now.getTime() - d.getTime()) < (90 * 24 * 60 * 60 * 1000);
        });

        const productStats: Record<string, number> = {};
        const colorStats: Record<string, number> = {};
        const cctStats: Record<string, number> = {};

        recentProjects.forEach(p => {
            p.items.forEach(item => {
                productStats[item.name] = (productStats[item.name] || 0) + item.quantity;
                colorStats[item.selectedColor] = (colorStats[item.selectedColor] || 0) + item.quantity;
                cctStats[item.selectedCCT] = (cctStats[item.selectedCCT] || 0) + item.quantity;
            });
        });

        const topProducts = Object.entries(productStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, qty]) => `${name}: ${qty}件`)
            .join(', ');

        const topColors = Object.entries(colorStats).sort(([,a], [,b]) => b - a).slice(0, 3).map(([k]) => k).join(', ');
        const topCCTs = Object.entries(cctStats).sort(([,a], [,b]) => b - a).slice(0, 3).map(([k]) => k).join(', ');

        // B. Inventory Status
        const lowStockItems = products
            .filter(p => p.stock < 20)
            .map(p => `${p.name} (ID: ${p.id}, Stock: ${p.stock}, Price: ${p.price})`)
            .join('\n');

        // C. Chat Issues (Extract negative keywords)
        const complaintKeywords = ["壞", "不亮", "閃爍", "慢", "錯誤", "瑕疵", "維修", "抱怨", "生氣", "退貨", "換貨"];
        const relevantChatSnippets: string[] = [];
        
        chatSessions.forEach(session => {
            const recentMsgs = session.messages.slice(-10); // Check last 10 messages per session
            recentMsgs.forEach(m => {
                if (m.role === 'user' && complaintKeywords.some(k => m.text.includes(k))) {
                    relevantChatSnippets.push(`"${m.text}"`);
                }
            });
        });
        const chatIssuesContext = relevantChatSnippets.slice(0, 20).join('\n'); // Limit to 20 snippets

        // 2. Build Prompt
        const prompt = `
        請分析以下 Gentech 照明公司的營運數據，提供全域策略建議：

        【近期銷售數據 (近90天)】
        - 熱銷產品 TOP 10: ${topProducts}
        - 最受歡迎顏色: ${topColors}
        - 最受歡迎色溫: ${topCCTs}

        【庫存警示清單 (Stock < 20)】
        ${lowStockItems || "目前無低庫存商品。"}

        【近期客戶客訴/反饋摘要】
        ${chatIssuesContext || "近期無明顯客訴紀錄。"}

        請根據以上數據，分析市場偏好、建議哪些低庫存商品應優先補貨(並預估補貨量)、以及歸納客訴的主要問題點。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: GLOBAL_STRATEGY_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        marketTrends: {
                            type: Type.OBJECT,
                            properties: {
                                popularColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                                popularCCTs: { type: Type.ARRAY, items: { type: Type.STRING } },
                                risingProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }
                        },
                        inventoryAdvice: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    productId: { type: Type.STRING },
                                    productName: { type: Type.STRING },
                                    currentStock: { type: Type.NUMBER },
                                    suggestedRestock: { type: Type.NUMBER },
                                    reason: { type: Type.STRING }
                                }
                            }
                        },
                        complaintSummary: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    issue: { type: Type.STRING },
                                    frequency: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                                    suggestion: { type: Type.STRING }
                                }
                            }
                        },
                        strategicAdvice: { type: Type.STRING }
                    }
                }
            }
        });

        const resultText = response.text;
        if (!resultText) throw new Error("Empty response from AI");

        const data = JSON.parse(resultText);
        return {
            ...data,
            analyzedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error("Global Analysis Error:", error);
        // Fallback
        return {
            marketTrends: { popularColors: [], popularCCTs: [], risingProducts: [] },
            inventoryAdvice: [],
            complaintSummary: [],
            strategicAdvice: "系統忙碌中，無法生成策略報告。",
            analyzedAt: new Date().toISOString()
        };
    }
};
