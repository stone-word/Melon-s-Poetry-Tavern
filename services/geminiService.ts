/**
 * ==============================================================================
 * AI 服务层 (Gemini / DeepSeek Service)
 * ==============================================================================
 * 负责与后端 LLM API 进行通信，处理对话生成、故事生成和诗歌点评。
 */

import { CustomerIdentity } from "../types";

// === 1. API 配置 ===
// 注意：在 Vite 中通过 define 注入的 process.env.API_KEY
const apiKey = process.env.API_KEY || '';
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/**
 * 检查 API Key 是否已配置
 * @returns boolean - API Key 是否存在且不为空
 */
export const isAPIConfigured = (): boolean => {
  return !!apiKey && apiKey.trim().length > 0;
};

// === 2. 基础请求封装 ===
/**
 * 通用的 DeepSeek 调用函数
 * @param messages 对话历史
 * @param maxTokens 最大生成长度
 */
const callDeepSeek = async (messages: any[], maxTokens: number = 200): Promise<string> => {
  // Fallback: 如果没有 Key，返回本地兜底文本
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

// === 3. 业务功能接口 ===

/**
 * 生成通用 NPC 对话
 */
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

/**
 * 根据 NPC 身份生成背景故事
 */
export const generateCustomerStory = async (identity: CustomerIdentity): Promise<string> => {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  const prompt = `
    你现在身处上海的一家酒馆。
    身份设定：${identity.age}岁的${identity.occupation}，性别${identity.gender}，${nationalityInfo}${locationInfo}。
    性格：${identity.personality}。
    心情：${identity.mood}。
    来店原因：${identity.motivation}。
    
    请用第一人称讲述一个关于你今天为什么来这里的小故事（150字以内）。
    不要过于戏剧化，要真实、接地气，符合你的身份信息和文化背景。
  `;
  
  const messages = [
    { role: "system", content: "你是一个擅长讲故事的普通市民。" },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 300);
};

/**
 * 生成顾客来店动机
 */
export const generateCustomerMotivation = async (identity: CustomerIdentity): Promise<string> => {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  const prompt = `请为这位顾客生成一句简短的来店动机（15-25字）：
身份：${identity.age}岁${identity.gender}性${identity.occupation}，${nationalityInfo}${locationInfo}
性格：${identity.personality}
情绪：${identity.mood}

要求：
1. 符合身份特征和当前情绪
2. 真实自然，不要过于戏剧化
3. 15-25字，简洁明了
4. 只返回动机内容，不要其他解释
5. 以接近口语的内心独白方式表达

示例格式：工作好累，找个地方放松一下吧……`;
  
  const messages = [
    { role: "system", content: "你是一个了解各行各业人群心理的观察者，擅长分析人们的行为动机。" },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 50);
};

/**
 * 生成故事续集
 */
export const generateStorySequel = async (identity: CustomerIdentity, previousStory: string): Promise<string> => {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  const prompt = `
    你刚才讲了这个故事：
    "${previousStory}"
    
    现在有人问你"然后呢？"，请继续讲述后续发生的事情。
    
    身份设定：${identity.age}岁的${identity.occupation}，性别${identity.gender}，${nationalityInfo}${locationInfo}。
    性格：${identity.personality}。
    心情：${identity.mood}。
    
    要求：
    1. 用第一人称继续讲述
    2. 内容要与前面的故事连贯
    3. 300字左右
    4. 保持真实、接地气的风格
    5. 可以有一些转折或新的细节
  `;
  
  const messages = [
    { role: "system", content: "你是一个擅长讲故事的普通市民，善于把故事讲得生动有趣。" },
    { role: "user", content: prompt }
  ];
  return callDeepSeek(messages, 500);
};

/**
 * 生成聊天回复
 */
export const generateChatResponse = async (
  identity: CustomerIdentity, 
  playerMessage: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<string> => {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  // 构建系统提示
  const systemPrompt = `
    你是一个在上海酒馆里的顾客，正在与酒保进行友好的交流。
    
    身份设定：${identity.age}岁的${identity.occupation}，性别${identity.gender}，${nationalityInfo}${locationInfo}。
    性格：${identity.personality}。
    心情：${identity.mood}。
    来店原因：${identity.motivation}。
    
    要求：
    1. 用第一人称回应
    2. 符合你的身份、性格和当前心情
    3. 回应要自然、真实
    4. 150字以内
    5. 可以分享一些个人想法或经历
    6. 根据之前的对话内容，保持对话的连贯性和一致性
  `;
  
  // 构建消息历史
  const messages = [
    { role: "system", content: systemPrompt }
  ];
  
  // 添加对话历史
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });
  
  // 添加当前玩家消息
  messages.push({
    role: 'user',
    content: playerMessage
  });
  
  return callDeepSeek(messages, 300);
};

/**
 * 诗人点评功能
 */
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

/**
 * 生成顾客对诗歌的反应
 */
export const generatePoemResponse = async (
  identity: CustomerIdentity, 
  poem: { title: string; author: string; content: string },
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<string> => {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  const systemPrompt = `
    你是一个在上海酒馆里的顾客，刚刚收到了酒保为你专门创作的一首诗。
    
    身份设定：${identity.age}岁的${identity.occupation}，性别${identity.gender}，${nationalityInfo}${locationInfo}。
    性格：${identity.personality}。
    心情：${identity.mood}。
    来店原因：${identity.motivation}。
    
    要求：
    1. 用第一人称表达对这首诗的感受和反应
    2. 符合你的身份、性格和文化背景
    3. 表现出真实的情感反应（感动、惊喜、共鸣等）
    4. 可以结合自己的经历或感受来回应
    5. 200字左右
    6. 语气要自然、真诚
    7. 根据之前的对话内容，保持一致性
  `;
  
  const poemText = `《${poem.title}》\n作者：${poem.author}\n\n${poem.content}`;
  
  // 构建消息历史
  const messages = [
    { role: "system", content: systemPrompt }
  ];
  
  // 添加对话历史（最近的几轮对话）
  const recentHistory = conversationHistory.slice(-6); // 只保留最近3轮对话
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });
  
  // 添加诗歌内容
  messages.push({
    role: 'user',
    content: `酒保为我写了这首诗：\n\n${poemText}`
  });
  
  return callDeepSeek(messages, 400);
};

/**
 * 从心情中提取关键词
 */
export const extractKeywordFromMood = async (mood: string): Promise<string> => {
  if (!apiKey) {
    // 离线模式：简单处理，取前2个字
    return mood.length > 2 ? mood.substring(0, 2) : mood;
  }

  try {
    const prompt = `请从以下句子中提取1个最核心的情感关键词（只需一个词）：
句子："${mood}"
关键词：`;

    const messages = [
      { role: "system", content: "你是一个关键词提取工具，只输出一个词。" },
      { role: "user", content: prompt }
    ];

    const response = await callDeepSeek(messages, 10);
    // 清理可能的标点
    return response.replace(/[.,。，！!?？、]/g, '').trim();
  } catch (error) {
    console.warn('关键词提取失败，使用原心情词:', error);
    return mood.length > 3 ? mood.substring(0, 3) : mood;
  }
};

/**
 * 获取近义词
 */
export const getSynonyms = async (keyword: string): Promise<string[]> => {
  if (!apiKey) {
    return []; // 离线模式不尝试近义词
  }

  try {
    const prompt = `请为"${keyword}"提供3个最相关的字（用逗号分隔，不要解释）：
例如：雨天 → 雨,阴,湿
近义词：`;

    const messages = [
      { role: "system", content: "你是近义词提取工具，只输出逗号分隔的词。" },
      { role: "user", content: prompt }
    ];

    const response = await callDeepSeek(messages, 20);
    const synonyms = response.split(/[,，、]/).map(s => s.trim()).filter(s => s);
    
    console.log(`近义词: ${synonyms.join(', ')}`);
    return synonyms;
  } catch (error) {
    console.warn('近义词搜索失败:', error);
    return [];
  }
};

/**
 * 调用AI创作新诗
 */
export const createNewPoemWithAI = async (mood: string): Promise<string> => {
  const prompt = `你是一个叫王子瓜的现代诗人，身处上海。
玩家的心情关键词是："${mood}"。
请以此为灵感，创作一首简短的现代诗片段（3行，不要超过4行）。
要求：结合上海意象（如梧桐、高架、便利店、雨水、外滩等），不要任何解释，直接输出诗句。`;

  try {
    const messages = [
      { role: "system", content: prompt },
      { role: "user", content: "请创作一首诗" }
    ];

    const response = await callDeepSeek(messages, 100);
    console.log('AI创作新诗:', response.substring(0, 50) + '...');
    return response;
  } catch (error) {
    console.error('AI创作失败:', error);
    return `关于"${mood}"，上海沉默着。\n梧桐叶落，外滩灯起，\n心事藏在黄浦江底。`;
  }
};