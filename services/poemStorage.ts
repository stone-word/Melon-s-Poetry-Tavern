/**
 * ==============================================================================
 * 诗歌存储服务 (Poem Storage Service)
 * ==============================================================================
 * 负责管理玩家创作的诗歌记录，包括顾客信息、对话历史和诗歌内容
 * 支持本地存储（localStorage）和云存储（Supabase）
 */

import { CustomerIdentity } from '../types';
import { supabase } from './supabaseClient';

// 诗歌记录接口
export interface PoemRecord {
  id: string; // 唯一标识符
  timestamp: number; // 创建时间戳
  poem: {
    title: string;
    author: string;
    content: string;
  };
  customer: CustomerIdentity; // 顾客完整信息
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
  }>; // 完整对话历史
  customerReaction?: string; // 顾客对诗歌的反应
}

// 诗歌数据库接口
export interface PoemDatabase {
  poems: PoemRecord[];
  totalCount: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'mellon_poem_database';

/**
 * 获取诗歌数据库
 */
export const getPoemDatabase = (): PoemDatabase => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取诗歌数据库失败:', error);
  }
  
  // 返回默认空数据库
  return {
    poems: [],
    totalCount: 0,
    lastUpdated: Date.now()
  };
};

/**
 * 保存诗歌数据库
 */
const savePoemDatabase = (database: PoemDatabase): boolean => {
  try {
    database.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    return true;
  } catch (error) {
    console.error('保存诗歌数据库失败:', error);
    return false;
  }
};

/**
 * 添加新的诗歌记录（同时保存到本地和云端）
 */
export const addPoemRecord = async (
  poem: { title: string; author: string; content: string },
  customer: CustomerIdentity,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  customerReaction?: string,
  saveToCloud: boolean = true // 新增参数，默认保存到云端
): Promise<string> => {
  const newRecord: PoemRecord = {
    id: generatePoemId(),
    timestamp: Date.now(),
    poem,
    customer,
    conversationHistory: conversationHistory.map(msg => ({
      ...msg,
      timestamp: Date.now()
    })),
    customerReaction
  };
  
  // 根据参数决定保存位置
  if (saveToCloud) {
    // 保存到云端（普通诗歌）
    try {
      await saveToCloudInternal(newRecord);
      return newRecord.id;
    } catch (error) {
      console.warn('云端保存失败:', error);
      throw new Error('保存诗歌到云端失败');
    }
  } else {
    // 保存到本地（圣诞老人的诗）
    const database = getPoemDatabase();
    database.poems.unshift(newRecord);
    database.totalCount = database.poems.length;
    const localSuccess = savePoemDatabase(database);
    
    if (localSuccess) {
      return newRecord.id;
    } else {
      throw new Error('保存诗歌记录到本地失败');
    }
  }
};

/**
 * 获取所有诗歌记录（按时间倒序）
 */
export const getAllPoemRecords = (): PoemRecord[] => {
  const database = getPoemDatabase();
  return database.poems.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * 根据ID获取诗歌记录
 */
export const getPoemRecordById = (id: string): PoemRecord | null => {
  const database = getPoemDatabase();
  return database.poems.find(poem => poem.id === id) || null;
};

/**
 * 获取诗歌统计信息
 */
export const getPoemStatistics = () => {
  const database = getPoemDatabase();
  const poems = database.poems;
  
  // 按顾客职业分组统计
  const occupationStats: Record<string, number> = {};
  poems.forEach(record => {
    const occupation = record.customer.occupation;
    occupationStats[occupation] = (occupationStats[occupation] || 0) + 1;
  });
  
  // 按月份分组统计
  const monthlyStats: Record<string, number> = {};
  poems.forEach(record => {
    const date = new Date(record.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
  });
  
  return {
    totalPoems: database.totalCount,
    occupationStats,
    monthlyStats,
    lastUpdated: database.lastUpdated
  };
};

/**
 * 搜索诗歌记录
 */
export const searchPoemRecords = (query: string): PoemRecord[] => {
  const database = getPoemDatabase();
  const lowerQuery = query.toLowerCase();
  
  return database.poems.filter(record => {
    return (
      record.poem.title.toLowerCase().includes(lowerQuery) ||
      record.poem.content.toLowerCase().includes(lowerQuery) ||
      record.poem.author.toLowerCase().includes(lowerQuery) ||
      record.customer.occupation.toLowerCase().includes(lowerQuery) ||
      record.customer.personality.toLowerCase().includes(lowerQuery)
    );
  });
};

/**
 * 导出诗歌数据库（用于备份）
 */
export const exportPoemDatabase = (): string => {
  const database = getPoemDatabase();
  return JSON.stringify(database, null, 2);
};

/**
 * 导入诗歌数据库（用于恢复）
 */
export const importPoemDatabase = (jsonData: string): boolean => {
  try {
    const database: PoemDatabase = JSON.parse(jsonData);
    
    // 验证数据结构
    if (!database.poems || !Array.isArray(database.poems)) {
      throw new Error('无效的数据格式');
    }
    
    return savePoemDatabase(database);
  } catch (error) {
    console.error('导入诗歌数据库失败:', error);
    return false;
  }
};

/**
 * 清空诗歌数据库
 */
export const clearPoemDatabase = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('清空诗歌数据库失败:', error);
    return false;
  }
};

/**
 * 生成唯一的诗歌ID
 */
const generatePoemId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `poem_${timestamp}_${random}`;
};

/**
 * 获取存储使用情况
 */
export const getStorageUsage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const sizeInBytes = data ? new Blob([data]).size : 0;
    const sizeInKB = Math.round(sizeInBytes / 1024 * 100) / 100;
    
    return {
      sizeInBytes,
      sizeInKB,
      recordCount: getPoemDatabase().totalCount
    };
  } catch (error) {
    return {
      sizeInBytes: 0,
      sizeInKB: 0,
      recordCount: 0
    };
  }
};

// ============================================================================
// 云存储相关函数
// ============================================================================

/**
 * 保存诗歌到云端
 */
const saveToCloudInternal = async (record: PoemRecord): Promise<void> => {
  const { error } = await supabase
    .from('poems')
    .insert({
      title: record.poem.title,
      author: record.poem.author,
      content: record.poem.content,
      customer_info: record.customer,
      conversation_history: record.conversationHistory,
    });

  if (error) {
    throw error;
  }
};

/**
 * 从云端获取所有诗歌（全球玩家的诗歌）
 */
export const getAllPoemsFromCloud = async (): Promise<PoemRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 转换为本地格式
    return (data || []).map(item => ({
      id: `cloud_${item.id}`,
      timestamp: new Date(item.created_at).getTime(),
      poem: {
        title: item.title,
        author: item.author,
        content: item.content,
      },
      customer: item.customer_info,
      conversationHistory: item.conversation_history,
    }));
  } catch (error) {
    console.error('从云端获取诗歌失败:', error);
    return [];
  }
};

/**
 * 搜索云端诗歌
 */
export const searchCloudPoems = async (query: string): Promise<PoemRecord[]> => {
  try {
    const lowerQuery = query.toLowerCase();
    
    // 获取所有诗歌并在客户端过滤（简单实现）
    const allPoems = await getAllPoemsFromCloud();
    
    return allPoems.filter(record => {
      return (
        record.poem.title.toLowerCase().includes(lowerQuery) ||
        record.poem.content.toLowerCase().includes(lowerQuery) ||
        record.poem.author.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('搜索云端诗歌失败:', error);
    return [];
  }
};

/**
 * 检查圣诞礼物诗歌是否已存在
 */
export const hasSantaGiftPoem = (): boolean => {
  const database = getPoemDatabase();
  return database.poems.some(poem => 
    poem.poem.title === '给你的圣诞礼物' && 
    poem.poem.author === '你的圣诞老人'
  );
};