/**
 * ==============================================================================
 * Supabase 客户端配置
 * ==============================================================================
 * 用于连接 Supabase 云数据库
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase 环境变量未正确配置！请检查 .env 文件');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 诗歌数据类型（与数据库表对应）
export interface SupabasePoemRecord {
  id?: number;
  created_at?: string;
  title: string;
  author: string;
  content: string;
  customer_info: any; // JSON 格式的顾客信息
  conversation_history: any; // JSON 格式的对话历史
}
