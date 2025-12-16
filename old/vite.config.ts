import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前目录下的所有环境变量
  // 第三个参数设为 '' 表示加载所有变量，不仅仅是 VITE_ 开头的
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react()
    ],
    define: {
      // 将 process.env 填入前端代码中，这样 services/geminiService.ts 里的 process.env.API_KEY 就能正常工作了
      'process.env': JSON.stringify(env)
    }
  };
});