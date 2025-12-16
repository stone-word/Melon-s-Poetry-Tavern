import { CustomerIdentity } from "../types";

// 获取配置的 API Key
// 注意：在 Vite 中通过 define 注入的 process.env.API_KEY
const apiKey = process.env.API_KEY || '';
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// 通用的 DeepSeek 调用函数
const callDeepSeek = async (messages: any[], maxTokens: number = 200): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing. Using offline fallback.");
    return "（开发者未配置 DeepSeek API Key，但我依然在这里倾听。）";
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // DeepSeek V3/V2.5
        messages: messages,
        max_tokens: maxTokens,
        temperature: 1.3, // DeepSeek 推荐较高的温度以增加创造力
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("DeepSeek API Error:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "...";
  } catch (error) {
    console.error("DeepSeek Network Error:", error);
    return "（似乎被某种神秘力量干扰了，无法开口。）";
  }
};

export const generateDialogue = async (
  prompt: string, 
  systemInstruction: string = "你是一个文字冒险游戏中的NPC。"
): Promise<string> => {
  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 150);
};

export const generateCustomerStory = async (identity: CustomerIdentity): Promise<string> => {
  const prompt = `
    你现在身处上海的一家酒馆。
    身份设定：${identity.age}岁的${identity.occupation}，性别${identity.gender}。
    性格：${identity.personality}。
    心情：${identity.mood}。
    来店原因：${identity.motivation}。
    ${identity.isShanghainese ? '你是上海本地人。' : ''}
    
    请用第一人称讲述一个关于你今天为什么来这里的小故事（200字以内）。
    不要过于戏剧化，要真实、接地气，符合你的身份。
  `;
  
  const messages = [
    { role: "system", content: "你是一个擅长讲故事的普通市民。" },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 300);
};

export const generatePoemEvaluation = async (poem: string): Promise<string> => {
   const prompt = `
    玩家写了一首诗：
    "${poem}"
    
    请作为一位现代诗人（类似王子瓜风格），给出简短的点评（50字以内）。
    语气要文艺、略带忧郁但透着温暖。
  `;
  
  const messages = [
    { role: "system", content: "你是一位驻扎在酒馆的现代诗人。" },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 100);
};