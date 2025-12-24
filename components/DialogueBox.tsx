/**
 * ==============================================================================
 * 对话框组件 (Dialogue UI)
 * ==============================================================================
 * 显示角色对话、打字机效果以及玩家输入交互区域。
 */

import React, { useState, useEffect, useRef } from 'react';
import { DialogueState, Role, CustomerIdentity } from '../types';

interface DialogueBoxProps {
  dialogue: DialogueState;
  onClose: () => void;
  onSendInput: (text: string) => void;
  customerIdentity?: CustomerIdentity; // 顾客身份信息（用于显示动机）
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>; // 对话历史
  onTypingComplete?: (content: string) => void; // 打字机效果完成回调
  poetDialogueState?: 'initial' | 'choice' | 'listening' | 'sharing'; // 诗人对话状态
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onClose, onSendInput, customerIdentity, conversationHistory = [], onTypingComplete, poetDialogueState = 'initial' }) => {
  // 添加自定义滚动条样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.7);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.9);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // === 1. 本地状态 ===
  const [inputText, setInputText] = useState('');
  const [displayedText, setDisplayedText] = useState(''); // 当前显示文本（用于打字机）
  const [customerThinkingText, setCustomerThinkingText] = useState(''); // 顾客思考文本
  const [storyRequested, setStoryRequested] = useState(false); // 是否已请求故事
  const [storyCompleted, setStoryCompleted] = useState(false); // 故事是否显示完成
  const [showChatInput, setShowChatInput] = useState(false); // 是否显示聊天输入框
  const [buttonsDisabled, setButtonsDisabled] = useState(false); // 按钮是否禁用
  const [isTyping, setIsTyping] = useState(false); // 是否正在进行打字机效果
  
  // Refs 用于管理定时器和打字机游标
  const textIndex = useRef(0);
  const timerRef = useRef<number | null>(null);
  const storyAreaRef = useRef<HTMLDivElement>(null);

  // 检查是否为音乐家对话（只读）
  const isMusician = (dialogue as any).isMusician;

  // 生成随机的顾客思考文本
  const generateCustomerThinkingText = () => {
    const commonTexts = ["好吧...", "让我想想怎么说...", "说来话长...", "你想知道？让我告诉你...", "..."];
    const rareTexts = ["既然你诚心诚意地发问了...", "趁我还没喝醉..."];
    
    // 10%概率使用稀有文本
    if (Math.random() < 0.1) {
      return rareTexts[Math.floor(Math.random() * rareTexts.length)];
    } else {
      return commonTexts[Math.floor(Math.random() * commonTexts.length)];
    }
  };

  // === 2. 打字机效果逻辑 ===
  useEffect(() => {
    // 清理之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 如果是睡眠状态或显示内容为 'zzz...'，直接显示 zzz...，并将故事视为已完成，禁用交互
    if (dialogue.isSleeping || dialogue.content === 'zzz...') {
      setDisplayedText('zzz...');
      setIsTyping(false);
      textIndex.current = 0;
      setStoryRequested(true);
      setStoryCompleted(true);
      setButtonsDisabled(true);
      return;
    }

    // 如果是思考状态，清空显示文本但不启动打字机效果
    if (dialogue.isThinking) {
      setDisplayedText('');
      setIsTyping(false);
      textIndex.current = 0;
      return;
    }

    // 如果没有内容，不启动打字机效果
    if (!dialogue.content) {
      setDisplayedText('');
      setIsTyping(false);
      textIndex.current = 0;
      return;
    }

    const fullText = dialogue.content;
    
    // 重置状态并启动打字机效果
    setIsTyping(true);
    textIndex.current = 1; // 从第二个字符开始
    setDisplayedText(fullText.charAt(0)); // 立即显示第一个字符，避免空白期
    
    // 如果只有一个字符，直接完成
    if (fullText.length <= 1) {
      setIsTyping(false);
      if (dialogue.role === Role.CUSTOMER) {
        setStoryCompleted(true);
        if (onTypingComplete) {
          onTypingComplete(fullText);
        }
      } else if (dialogue.role === Role.BARTENDER || dialogue.role === Role.WAITER || dialogue.role === Role.CLEANER) {
        // 工作人员也需要通知完成
        if (onTypingComplete) {
          onTypingComplete(fullText);
        }
      }
      return;
    }
    
    // 启动打字机定时器
    timerRef.current = window.setInterval(() => {
      if (textIndex.current < fullText.length) {
        setDisplayedText(fullText.substring(0, textIndex.current + 1));
        textIndex.current++;
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsTyping(false);
        // 如果是顾客角色，标记故事显示完成并通知父组件
        if (dialogue.role === Role.CUSTOMER) {
          setStoryCompleted(true);
          // 通知父组件打字机效果完成，可以将内容添加到历史记录
          if (onTypingComplete) {
            onTypingComplete(fullText);
          }
          // 延迟清空当前显示内容，确保历史记录更新完成
          setTimeout(() => {
            setDisplayedText('');
          }, 50);
        } else if (dialogue.role === Role.BARTENDER || dialogue.role === Role.WAITER || dialogue.role === Role.CLEANER) {
          // 工作人员也需要通知完成并清空
          if (onTypingComplete) {
            onTypingComplete(fullText);
          }
          setTimeout(() => {
            setDisplayedText('');
          }, 50);
        }
      }
    }, 30); // 打字速度

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [dialogue.content, dialogue.isThinking, dialogue.role, dialogue.isOpen]);

  // 重置状态当对话框关闭时
  useEffect(() => {
    if (!dialogue.isOpen) {
      setStoryRequested(false);
      setStoryCompleted(false);
      setShowChatInput(false);
      setButtonsDisabled(false);
      setCustomerThinkingText('');
      setDisplayedText('');
      setInputText('');
      setIsTyping(false);
    }
  }, [dialogue.isOpen]);

  // 监听对话状态，控制按钮禁用
  useEffect(() => {
    // 如果当前对话是睡眠顾客或显式显示 'zzz...'，始终禁用按钮
    if (dialogue.isSleeping || dialogue.content === 'zzz...') {
      setButtonsDisabled(true);
      setShowChatInput(false);
      setStoryRequested(true);
      setStoryCompleted(true);
      return;
    }
    if (dialogue.role === Role.CUSTOMER && storyCompleted) {
      // 如果正在思考，禁用按钮
      if (dialogue.isThinking) {
        setButtonsDisabled(true);
        setShowChatInput(false);
      } else if (dialogue.content) {
        // 内容生成完成，启用按钮
        setButtonsDisabled(false);
      }
    }
  }, [dialogue.isThinking, dialogue.content, dialogue.role, storyCompleted, dialogue.isSleeping]);

  // 自动滚动到对话区域底部
  useEffect(() => {
    if (storyAreaRef.current) {
      storyAreaRef.current.scrollTop = storyAreaRef.current.scrollHeight;
    }
  }, [conversationHistory, displayedText, customerThinkingText]);

  // 如果对话框未打开，不渲染任何内容
  if (!dialogue.isOpen) return null;

  // 音乐家专属只读对话框
  if (isMusician) {
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm bg-slate-900/90 border-2 border-slate-600 rounded-lg p-6 shadow-2xl z-50 text-slate-100 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-amber-400">音乐家 周某</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">🎵 🎶 🎵</span>
        </div>
        <div className="text-center text-lg text-white font-semibold">哎呦，不错哦</div>
      </div>
    );
  }

  // === 3. 交互处理 ===
  const handleSend = () => {
    if (inputText.trim()) {
      onSendInput(inputText);
      setInputText('');
      // 如果是在聊天模式，发送后关闭输入框并禁用按钮
      if (showChatInput) {
        setShowChatInput(false);
        setButtonsDisabled(true);
        setCustomerThinkingText(generateCustomerThinkingText());
      }
    }
  };

  // === 4. 渲染视图 ===
  // 构建标题显示（顾客使用姓氏+称呼格式）
  const displayName = dialogue.role === Role.CUSTOMER && customerIdentity
    ? `顾客${customerIdentity.surname}${customerIdentity.gender === '男' ? '先生' : '女士'}`
    : dialogue.speakerName;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl bg-slate-900/90 border-2 border-slate-600 rounded-lg p-6 shadow-2xl z-50 text-slate-100 backdrop-blur-sm">
      {/* 标题栏 */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-amber-400">{displayName}</h3>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* 顾客详细信息（年龄、职业、MBTI） */}
      {dialogue.role === Role.CUSTOMER && customerIdentity && (
        <div className="mb-2">
          <p className="text-sm text-slate-300">
            {customerIdentity.age}岁，{customerIdentity.occupation}，{customerIdentity.personality.split(' ')[0]}
          </p>
        </div>
      )}
      
      {/* 工作人员详细信息 */}
      {(dialogue.role === Role.BARTENDER || dialogue.role === Role.WAITER || dialogue.role === Role.CLEANER) && dialogue.staffIdentity && (
        <div className="mb-2">
          <p className="text-sm text-slate-300">
            {dialogue.staffIdentity.age}岁，{dialogue.staffIdentity.mbti}
          </p>
        </div>
      )}
      
      {/* 顾客来店动机显示区域（圣诞老人不显示） */}
      {dialogue.role === Role.CUSTOMER && (
        <div className="mb-3">
          <p className="text-sm text-gray-400 italic">
            {customerIdentity?.motivation ? `"${customerIdentity.motivation}"` : '"..."'}
          </p>
        </div>
      )}
      
      {/* 顾客故事内容区域 - 在点击按钮后立即显示，插入在动机和按钮之间 */}
      {dialogue.role === Role.CUSTOMER && (dialogue.isSleeping || dialogue.content === 'zzz...' || storyRequested) && (
        <div 
          ref={storyAreaRef}
          className="min-h-[80px] max-h-60 overflow-y-auto text-base leading-relaxed mb-4 text-white whitespace-pre-wrap custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#64748b #1e293b'
          }}
        >
          {/* 如果是睡眠，直接显示 zzz */}
          {dialogue.isSleeping || dialogue.content === 'zzz...' ? (
            <div className="flex items-center justify-center min-h-[80px]"><div className="text-2xl font-bold text-sky-200">zzz...</div></div>
          ) : (
            <>
              {/* 显示历史对话 */}
              {conversationHistory.map((msg, index) => (
                <div key={index} className="mb-2">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end pr-2">
                      <span className="text-blue-300 italic font-medium inline-block max-w-[50%] text-right break-words">{msg.content}</span>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              ))}
              
              {/* 当前正在显示的内容 - 只在思考状态或正在打字时显示 */}
              {dialogue.isThinking ? (
                <div className="mb-2">
                  <span>{customerThinkingText}</span>
                </div>
              ) : isTyping && displayedText ? (
                <div className="mb-2">
                  <span>{displayedText}</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
      
      {/* 工作人员对话内容区域 - 完全复刻顾客的显示方式 */}
      {(dialogue.role === Role.BARTENDER || dialogue.role === Role.WAITER || dialogue.role === Role.CLEANER) && (
        <div 
          ref={storyAreaRef}
          className="min-h-[80px] max-h-60 overflow-y-auto text-base leading-relaxed mb-4 text-white whitespace-pre-wrap custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#64748b #1e293b'
          }}
        >
          {/* 显示历史对话 */}
          {conversationHistory.map((msg, index) => (
            <div key={index} className="mb-2">
              {msg.role === 'user' ? (
                <div className="flex justify-end pr-2">
                  <span className="text-blue-300 italic font-medium inline-block max-w-[50%] text-right break-words">{msg.content}</span>
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          ))}
          
          {/* 当前正在显示的内容 - 只在思考状态或正在打字时显示 */}
          {dialogue.isThinking ? (
            <div className="mb-2">
              <span className="text-gray-400">思考中...</span>
            </div>
          ) : isTyping && displayedText ? (
            <div className="mb-2">
              <span>{displayedText}</span>
            </div>
          ) : null}
        </div>
      )}
      
      {/* 其他角色文本内容区域 */}
      {dialogue.role !== Role.CUSTOMER && 
       dialogue.role !== Role.BARTENDER && 
       dialogue.role !== Role.WAITER && 
       dialogue.role !== Role.CLEANER && (
        <div className="min-h-[80px] text-lg leading-relaxed mb-4 font-serif whitespace-pre-wrap">
          {displayedText}
        </div>
      )}

      {/* 输入与交互区域 (Context sensitive) */}
      <div className="flex gap-2 animate-fade-in-up">
           {dialogue.role === Role.POET ? (
             /* 诗人交互：根据对话状态显示不同界面 */
             poetDialogueState === 'choice' ? (
               /* 选择阶段：显示两个选择按钮 */
               <div className="flex gap-2 w-full justify-center">
                 <button 
                     onClick={() => onSendInput("请你听听我的诗")}
                     className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-semibold transition-colors"
                 >
                     请你听听我的诗
                 </button>
                 <button 
                     onClick={() => onSendInput("让我听听你的诗")}
                     className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-semibold transition-colors"
                 >
                     让我听听你的诗
                 </button>
               </div>
             ) : poetDialogueState === 'sharing' ? (
               /* 诗人分享阶段：输入心情关键词 */
               <>
                  <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="输入你的心情关键词..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className={`px-6 py-2 rounded font-semibold transition-colors ${
                        inputText.trim() 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                      发送
                  </button>
                  <button 
                      onClick={() => onSendInput("__POET_GO_BACK__")}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                  >
                      返回
                  </button>
               </>
             ) : poetDialogueState === 'listening' ? (
               /* 等待诗歌创作阶段：显示提示信息 */
               <div className="flex gap-2 w-full justify-center">
                 <div className="text-amber-400 italic">
                   请通过诗歌创作对话框分享你的诗...
                 </div>
               </div>
             ) : (
               /* 初始状态或其他状态：显示提示 */
               <div className="flex gap-2 w-full justify-center">
                 <div className="text-gray-400 italic">
                   {poetDialogueState === 'initial' ? '等待诗人开口...' : '正在处理...'}
                 </div>
               </div>
             )
           ) : dialogue.role === Role.CUSTOMER ? (
             /* 顾客交互：根据故事状态显示不同按钮 */
            <div className="flex gap-2 w-full justify-end">
                {!storyCompleted ? (
                  /* 故事未完成：显示"讲讲你的故事吧"按钮 */
                  <button 
                      onClick={() => {
                        if (storyRequested) return; // 如果已经请求过故事，不响应点击
                        setStoryRequested(true);
                        setCustomerThinkingText(generateCustomerThinkingText());
                        onSendInput("讲讲你的故事吧");
                      }}
                      disabled={storyRequested && !storyCompleted}
                      className={`px-4 py-2 rounded text-sm transition-colors ${
                        storyRequested && !storyCompleted
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                  >
                      {storyRequested && !storyCompleted ? '等我组织一下语言...' : '讲讲你的故事吧'}
                  </button>
                ) : showChatInput ? (
                  /* 聊天模式：显示输入框和发送按钮 */
                  <>
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="说说你想聊什么吧...（200字以内）"
                        maxLength={200}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`px-6 py-2 rounded font-semibold transition-colors ${
                          inputText.trim() 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        发送
                    </button>
                    <button 
                        onClick={() => setShowChatInput(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                        取消
                    </button>
                  </>
                ) : (
                  /* 故事完成：显示三个新按钮 */
                  <>
                    <button 
                        onClick={() => {
                          if (buttonsDisabled) return;
                          setButtonsDisabled(true);
                          setCustomerThinkingText(generateCustomerThinkingText());
                          onSendInput("然后呢？");
                        }}
                        disabled={buttonsDisabled}
                        className={`px-4 py-2 rounded text-sm transition-colors ${
                          buttonsDisabled 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        然后呢？
                    </button>
                    <button 
                        onClick={() => {
                          if (buttonsDisabled) return;
                          setShowChatInput(true);
                        }}
                        disabled={buttonsDisabled}
                        className={`px-4 py-2 rounded text-sm transition-colors ${
                          buttonsDisabled 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                    >
                        我们谈谈...
                    </button>
                    <button 
                        onClick={() => {
                          if (buttonsDisabled) return;
                          onSendInput("让我为你写首诗吧！");
                        }}
                        disabled={buttonsDisabled}
                        className={`px-4 py-2 rounded text-sm transition-colors ${
                          buttonsDisabled 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                    >
                        让我为你写首诗吧！
                    </button>
                  </>
                )}
            </div>
           ) : dialogue.role === Role.SANTA ? (
             /* 圣诞老人交互：显示特殊关闭按钮 */
             <div className="flex gap-2 w-full justify-center">
               <button 
                 onClick={onClose}
                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors"
               >
                 天呐！圣诞老人真的存在！
               </button>
             </div>
           ) : (dialogue.role === Role.BARTENDER || dialogue.role === Role.WAITER || dialogue.role === Role.CLEANER) ? (
             /* 工作人员交互：显示输入框和发送按钮，第二轮后显示写诗按钮 */
             <div className="flex gap-2 w-full">
               {conversationHistory.length >= 2 && (
                 <button 
                   onClick={() => {
                     if (buttonsDisabled) return;
                     onSendInput("让我为你写首诗吧！");
                   }}
                   disabled={buttonsDisabled}
                   className={`px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
                     buttonsDisabled 
                       ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                       : 'bg-purple-600 hover:bg-purple-700 text-white'
                   }`}
                 >
                   让我为你写首诗吧！
                 </button>
               )}
               <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="和我聊聊天吧...（200字以内）"
                 maxLength={200}
                 className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               />
               <button 
                 onClick={handleSend}
                 disabled={!inputText.trim()}
                 className={`px-6 py-2 rounded font-semibold transition-colors ${
                   inputText.trim() 
                     ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                     : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                 }`}
               >
                 发送
               </button>
             </div>
           ) : (
             /* 其他NPC交互：预设按钮 */
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
    </div>
  );
};

export default DialogueBox;