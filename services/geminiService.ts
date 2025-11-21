
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlantAnalysis } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for strict JSON output
const plantAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    commonName: {
      type: Type.STRING,
      description: "植物的通用俗名（繁體中文）。",
    },
    scientificName: {
      type: Type.STRING,
      description: "植物的學名（拉丁文）。",
    },
    plantSize: {
      type: Type.STRING,
      enum: ["Small", "Medium", "Large"],
      description: "預估植物實體大小。Small: 桌上型/小型(<30cm), Medium: 中型/一般室內盆栽(30-90cm), Large: 大型/落地/樹型(>90cm)。",
    },
    lpc: {
      type: Type.STRING,
      description: "光補償點 (LPC) 數值或範圍的文字描述（例如 '20 µmol/m²/s'）。",
    },
    ppfd: {
      type: Type.STRING,
      description: "建議的生長 PPFD 範圍文字描述（例如 '200-400 µmol/m²/s'）。",
    },
    lightSummary: {
      type: Type.STRING,
      description: "關於植物光照需求與擺放位置建議的繁體中文簡介。",
    },
    confidenceLevel: {
      type: Type.STRING,
      description: "辨識信心指數 (高、中、低)。",
    },
    numericValues: {
      type: Type.OBJECT,
      description: "用於繪製圖表的數值估計。",
      properties: {
        lpc: { type: Type.NUMBER, description: "光補償點的數值 (µmol/m²/s)。" },
        ppfdMin: { type: Type.NUMBER, description: "建議 PPFD 範圍的下限 (µmol/m²/s)。" },
        ppfdMax: { type: Type.NUMBER, description: "建議 PPFD 範圍的上限 (µmol/m²/s)。" },
        saturation: { type: Type.NUMBER, description: "估計的光飽和點 (µmol/m²/s)。" },
      },
      required: ["lpc", "ppfdMin", "ppfdMax", "saturation"],
    },
    spectrum: {
      type: Type.OBJECT,
      description: "光譜需求分析。",
      properties: {
        bluePercent: { type: Type.NUMBER, description: "藍光需求佔比 (0-100)。觀葉植物通常較高 (50-70)。" },
        redPercent: { type: Type.NUMBER, description: "紅光需求佔比 (0-100)。開花/多肉植物通常較高 (50-70)。" },
        description: { type: Type.STRING, description: "針對該植物的光譜需求說明（例如：'此植物為觀葉植物，需較多藍光促進葉片生長'）。" },
      },
      required: ["bluePercent", "redPercent", "description"],
    },
  },
  required: ["commonName", "scientificName", "plantSize", "lpc", "ppfd", "lightSummary", "confidenceLevel", "numericValues", "spectrum"],
};

export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<PlantAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    const prompt = `
      請辨識這張圖片中的植物，並進行專業的光照需求分析。
      
      為了確保數據的科學一致性，請先判斷該植物屬於以下哪一個「光照需求類別」，並**嚴格採用**對應的標準數值輸出，不要隨意生成數值。

      【標準化光照分級表】(Standardized Light Categories):

      1. **低光照/耐陰植物 (Low Light / Shade Tolerant)**
         - 代表植物：虎尾蘭、蕨類、粗肋草、萬年青。
         - 特性：不可直射陽光，耐陰性強。
         - [數值標準] LPC: 10 | PPFD 建議: 50 - 150 | 飽和點: 400

      2. **中光照/明亮散射光 (Medium Light / Bright Indirect)**
         - 代表植物：龜背芋、蔓綠絨、合果芋、觀音蓮、一般室內觀葉植物。
         - 特性：喜歡明亮散射光，可接受溫和晨光。
         - [數值標準] LPC: 20 | PPFD 建議: 150 - 350 | 飽和點: 800

      3. **中高光照/部分直射光 (Medium-High Light / Partial Sun)**
         - 代表植物：琴葉榕、天堂鳥(室內馴化)、橡膠樹、斑葉植物。
         - 特性：需要較強的散射光或部分直射光才能生長良好。
         - [數值標準] LPC: 40 | PPFD 建議: 400 - 700 | 飽和點: 1200

      4. **高光照/全日照 (High Light / Full Sun)**
         - 代表植物：多肉植物(大部分)、仙人掌、果樹、羅漢松、戶外草花。
         - 特性：需要全日照或極強人工光源。
         - [數值標準] LPC: 80 | PPFD 建議: 800 - 1200 | 飽和點: 2000

      ---

      【光譜分析邏輯】(Spectrum Logic):
      - **觀葉植物 (Foliage)**: 偏好藍光 (400-500nm) 以促進葉片生長與緊實防徒長。建議: Blue 60% / Red 40%。
      - **開花/結果/多肉植物 (Flowering/Succulents)**: 偏好紅光 (600-700nm) 以促進開花、轉色與根系發展。建議: Blue 30% / Red 70%。
      - **均衡型**: Blue 50% / Red 50%。

      ---
      
      **任務執行步驟：**
      1. 辨識植物品種。
      2. 依據品種特性，將其歸類至上述 4 個類別中的其中一項。
      3. **numericValues 必須完全填入該類別對應的 [數值標準]。** (例如：若判斷為龜背芋，ppfdMin 必須是 150，ppfdMax 必須是 350)。
      4. 依據圖片中的參照物（如花盆、葉片大小）判斷「實體大小 (plantSize)」：
         - Small: <30cm (桌上型)
         - Medium: 30-90cm (一般落地/中型)
         - Large: >90cm (大型/樹型，如羅漢松、大型天堂鳥)
      5. 判斷光譜需求 (spectrum) 並填寫 Blue/Red 比例。
      
      請以繁體中文回傳 JSON。
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: plantAnalysisSchema,
        temperature: 0.0, // 設定為 0 以確保同一植物每次分析結果數值完全一致
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini 沒有回傳回應。");
    }

    const data = JSON.parse(text) as PlantAnalysis;
    return data;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "分析植物圖片時發生錯誤。");
  }
};
