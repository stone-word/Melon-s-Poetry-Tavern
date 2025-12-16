import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import DialogueBox from './components/DialogueBox';
import { DialogueState, Role } from './types';
import * as GeminiService from './services/geminiService';

const App: React.FC = () => {
  const [dialogue, setDialogue] = useState<DialogueState>({
    isOpen: false,
    speakerName: '',
    content: '',
    isThinking: false,
    role: null
  });

  const handleCloseDialogue = () => {
    setDialogue(prev => ({ ...prev, isOpen: false }));
  };

  const handleSendInput = async (inputText: string) => {
    // Immediate feedback
    setDialogue(prev => ({
        ...prev,
        isThinking: true,
    }));

    // Logic to handle response based on role
    let responseText = "";
    
    if (dialogue.role === Role.POET) {
        responseText = await GeminiService.generatePoemEvaluation(inputText);
    } else if (dialogue.role === Role.CUSTOMER) {
        // Mock finding the customer identity - in real app pass identity through
        const mockIdentity = { 
            age: 30, gender: '男', occupation: '设计师', personality: '内向', 
            motivation: '找灵感', mood: '忧郁', isShanghainese: true 
        };
        responseText = await GeminiService.generateCustomerStory(mockIdentity);
    } else {
        responseText = await GeminiService.generateDialogue(inputText);
    }

    setDialogue(prev => ({
        ...prev,
        content: responseText,
        isThinking: false
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
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

      {/* Game Area */}
      <main className="flex-1 overflow-hidden relative flex justify-center items-center bg-slate-950">
        <GameCanvas 
            onOpenDialogue={setDialogue}
            dialogueState={dialogue}
        />
        
        {/* Dialogue Overlay */}
        <DialogueBox 
            dialogue={dialogue} 
            onClose={handleCloseDialogue}
            onSendInput={handleSendInput}
        />
      </main>

      {/* Footer Instructions */}
      <footer className="bg-slate-800 p-2 text-center text-xs text-slate-500 border-t border-slate-700">
        点击地面移动 • 点击角色对话 • 探索酒馆的故事
      </footer>
    </div>
  );
};

export default App;