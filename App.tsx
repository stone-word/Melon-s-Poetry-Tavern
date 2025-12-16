/**
 * ==============================================================================
 * 主应用组件 (Main App Component)
 * ==============================================================================
 * 负责整体布局、状态提升 (State Lifting) 以及核心业务逻辑的协调。
 */

import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import DialogueBox from './components/DialogueBox';
import { DialogueState, Role } from './types';
import * as GeminiService from './services/geminiService';

const App: React.FC = () => {
  // === 1. 全局 UI 状态 ===
  const [dialogue, setDialogue] = useState<DialogueState>({
    isOpen: false,
    speakerName: '',
    content: '',
    isThinking: false,
    role: null
  });

  // === 2. 事件处理器 ===
  
  // 关闭对话框
  const handleCloseDialogue = () => {
    setDialogue(prev => ({ ...prev, isOpen: false }));
  };

  // 处理用户在对话框中的输入 (发送给 AI)
  const handleSendInput = async (inputText: string) => {
    // 立即反馈：进入思考状态
    setDialogue(prev => ({
        ...prev,
        isThinking: true,
    }));

    // 根据角色分发处理逻辑
    let responseText = "";
    
    if (dialogue.role === Role.POET) {
        // 诗人逻辑：评价诗歌
        responseText = await GeminiService.generatePoemEvaluation(inputText);
    } else if (dialogue.role === Role.CUSTOMER) {
        // 顾客逻辑：生成故事 (Mock 数据，实际应读取 Agent 属性)
        const mockIdentity = { 
            age: 30, gender: '男', occupation: '设计师', personality: '内向', 
            motivation: '找灵感', mood: '忧郁', isShanghainese: true 
        };
        responseText = await GeminiService.generateCustomerStory(mockIdentity);
    } else {
        // 通用对话逻辑
        responseText = await GeminiService.generateDialogue(inputText);
    }

    // 更新对话内容并取消思考状态
    setDialogue(prev => ({
        ...prev,
        content: responseText,
        isThinking: false
    }));
  };

  // === 3. 渲染布局 ===
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* 3.1 顶部导航栏 (Header) */}
      <header className="bg-slate-800 p-4 shadow-md border-b border-slate-700 flex justify-between items-center z-10">
        <div>
            <h1 className="text-2xl font-bold text-amber-500 tracking-wider">Mellon's Poetry Tavern</h1>
            <p className="text-xs text-slate-400">React + AI Native Framework</p>
        </div>
        <div className="text-sm text-slate-400">
            {process.env.API_KEY ? 
                <span className="text-emerald-400">● AI Online</span> : 
                <span className="text-red-400">● AI Offline (No Key)</span>
            }
        </div>
      </header>

      {/* 3.2 游戏主区域 (Main) */}
      <main className="flex-1 overflow-hidden relative flex justify-center items-center bg-slate-950">
        <GameCanvas 
            onOpenDialogue={setDialogue}
            dialogueState={dialogue}
        />
        
        {/* 对话框覆盖层 (Overlay) */}
        <DialogueBox 
            dialogue={dialogue} 
            onClose={handleCloseDialogue}
            onSendInput={handleSendInput}
        />
      </main>

      {/* 3.3 底部状态栏 (Footer) */}
      <footer className="bg-slate-800 p-2 text-center text-xs text-slate-500 border-t border-slate-700">
        点击地面移动 • 点击角色对话 • 探索酒馆的故事
      </footer>
    </div>
  );
};

export default App;