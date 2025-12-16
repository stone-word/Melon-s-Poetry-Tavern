/**
 * ==============================================================================
 * 对话框组件 (Dialogue UI)
 * ==============================================================================
 * 显示角色对话、打字机效果以及玩家输入交互区域。
 */

import React, { useState, useEffect, useRef } from 'react';
import { DialogueState, Role } from '../types';

interface DialogueBoxProps {
  dialogue: DialogueState;
  onClose: () => void;
  onSendInput: (text: string) => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onClose, onSendInput }) => {
  // === 1. 本地状态 ===
  const [inputText, setInputText] = useState('');
  const [displayedText, setDisplayedText] = useState(''); // 当前显示文本（用于打字机）
  const [showInput, setShowInput] = useState(false);      // 是否显示输入框
  
  // Refs 用于管理定时器和打字机游标
  const textIndex = useRef(0);
  const timerRef = useRef<number | null>(null);

  // === 2. 打字机效果逻辑 ===
  useEffect(() => {
    // 重置状态
    setDisplayedText('');
    textIndex.current = 0;
    setShowInput(false);
    
    if (timerRef.current) clearInterval(timerRef.current);

    // 如果是思考状态，直接显示 Loading
    if (dialogue.isThinking) {
      setDisplayedText("正在思考...");
      return;
    }

    const fullText = dialogue.content;
    
    // 启动打字机定时器
    timerRef.current = window.setInterval(() => {
      if (textIndex.current < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(textIndex.current));
        textIndex.current++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        // 文本播放完毕，根据角色显示交互选项
        if (dialogue.role === Role.POET || dialogue.role === Role.CUSTOMER) {
            setShowInput(true);
        }
      }
    }, 30); // 打字速度

    // 清理函数
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dialogue.content, dialogue.isThinking, dialogue.role]);

  // 如果对话框未打开，不渲染任何内容
  if (!dialogue.isOpen) return null;

  // === 3. 交互处理 ===
  const handleSend = () => {
    if (inputText.trim()) {
      onSendInput(inputText);
      setInputText('');
    }
  };

  // === 4. 渲染视图 ===
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl bg-slate-900/90 border-2 border-slate-600 rounded-lg p-6 shadow-2xl z-50 text-slate-100 backdrop-blur-sm">
      {/* 标题栏 */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-amber-400">{dialogue.speakerName}</h3>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* 文本内容区域 */}
      <div className="min-h-[80px] text-lg leading-relaxed mb-4 font-serif whitespace-pre-wrap">
        {displayedText}
      </div>

      {/* 输入与交互区域 (Context sensitive) */}
      {showInput && !dialogue.isThinking && (
        <div className="flex gap-2 animate-fade-in-up">
           {dialogue.role === Role.POET ? (
             /* 诗人交互：文本输入框 */
             <>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入你的心情关键词，或粘贴你的诗..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-semibold transition-colors"
                >
                    发送
                </button>
             </>
           ) : (
             /* 普通NPC交互：预设按钮 */
            <div className="flex gap-2 w-full justify-end">
                 <button 
                    onClick={() => onSendInput("请说说你的故事")}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                    请说说你的故事
                </button>
                <button 
                    onClick={() => onSendInput("我是来听诗的")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                    我为你写首诗吧
                </button>
            </div>
           )}
        </div>
      )}
    </div>
  );
};

export default DialogueBox;