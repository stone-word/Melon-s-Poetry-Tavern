/**
 * ==============================================================================
 * 入口文件 (Entry Point)
 * ==============================================================================
 * 负责挂载 React 应用到 DOM 节点。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// === 1. 获取根节点 ===
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// === 2. 初始化并渲染应用 ===
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);