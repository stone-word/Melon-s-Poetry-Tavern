/**
 * ==============================================================================
 * Vite 构建配置 (Build Config)
 * ==============================================================================
 * 配置 React 插件及 GitHub Pages 部署路径。
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署路径
  base: process.env.NODE_ENV === 'production' ? '/Melon-s-Poetry-Tavern/' : '/',
  plugins: [
    react()
  ]
});