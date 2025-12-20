/**
 * ==============================================================================
 * 主应用组件 (Main App Component)
 * ==============================================================================
 * 负责整体布局、状态提升 (State Lifting) 以及核心业务逻辑的协调。
 */

import React, { useState, useEffect } from 'react';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import DialogueBox from './components/DialogueBox';
import PoemCreationDialog from './components/PoemCreationDialog';
import PoemLibrary from './components/PoemLibrary';
import { DialogueState, Role, CustomerIdentity } from './types';
import * as GeminiService from './services/geminiService';
import * as PoemStorage from './services/poemStorage';
import musicService from './services/musicService';
import { preloadCharacterSprites } from './utils/artLoader';
import { isAPIConfigured } from './services/geminiService';

const App: React.FC = () => {
  // === 0. 资源加载状态 ===
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  // 预加载美术资源
  useEffect(() => {
    // 检查API配置状态
    setAiConfigured(isAPIConfigured());
    
    const loadAssets = async () => {
      try {
        await preloadCharacterSprites();
        setAssetsLoaded(true);
        console.log('✅ All assets loaded');
      } catch (error) {
        console.error('❌ Failed to load assets:', error);
        setAssetsLoaded(true); // 即使失败也继续，使用备用字符画
      }
    };
    loadAssets();
  }, []);

  // === 1. 全局 UI 状态 ===
  const [dialogue, setDialogue] = useState<DialogueState>({
    isOpen: false,
    speakerName: '',
    content: '',
    isThinking: false,
    role: null
  });

  // 当前对话的顾客身份信息
  const [currentCustomerIdentity, setCurrentCustomerIdentity] = useState<CustomerIdentity | undefined>(undefined);
  
  // 对话历史记录
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // 诗歌创作对话框状态
  const [showPoemDialog, setShowPoemDialog] = useState(false);
  
  // 当前诗歌记录（用于在对话结束时保存）
  const [currentPoemRecord, setCurrentPoemRecord] = useState<{
    poem: { title: string; author: string; content: string };
    customerReaction: string;
  } | null>(null);
  
  // 诗歌图书馆状态
  const [showPoemLibrary, setShowPoemLibrary] = useState(false);
  
  // 音乐播放状态
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // 诗人对话状态
  const [poetDialogueState, setPoetDialogueState] = useState<'initial' | 'choice' | 'listening' | 'sharing'>('initial');

  // 组件卸载时停止音乐
  useEffect(() => {
    return () => {
      musicService.stop();
    };
  }, []);

  // 切换音乐播放状态
  const toggleMusic = () => {
    musicService.toggle();
    setIsMusicPlaying(!isMusicPlaying);
  };

  // 当前对话的NPC信息（用于距离检测）
  const [currentDialogueNPC, setCurrentDialogueNPC] = useState<{id: number, role: Role} | null>(null);
  
  // GameCanvas引用（用于获取游戏状态）
  const gameCanvasRef = React.useRef<GameCanvasRef>(null);

  // 处理诗人分享诗歌的逻辑
  const handlePoetSharePoem = async (mood: string): Promise<string> => {
    try {
      // 动态导入诗歌数据库
      const poetryDatabase = (await import('./services/poetryDatabase')).default;
      
      // 根据输入字数决定前缀
      const prefix = mood.length <= 4 ?
        `${mood}？这让我想到我的几句诗，我把它们送给你：\n\n` :
        `你看到了复杂的色彩……这让我想到我的几句诗，我把它们送给你：\n\n`;

      console.log(`玩家心情: "${mood}" (${mood.length}字)`);

      // 步骤1：提取关键词
      const keyword = await GeminiService.extractKeywordFromMood(mood);
      console.log(`提取的关键词: "${keyword}"`);

      // 步骤2：搜索诗歌数据库
      const poemResult = await poetryDatabase.getPoemByKeyword(keyword);

      if (poemResult) {
        // 找到相关诗句，添加前缀后输出
        console.log(`从数据库找到诗句（${poemResult.totalMatches}个匹配）`);
        return prefix + poemResult.poem;
      }

      // 步骤3：没找到，尝试近义词搜索
      console.log(`未找到"${keyword}"相关诗句，尝试近义词...`);
      const synonyms = await GeminiService.getSynonyms(keyword);

      for (const synonym of synonyms) {
        const result = await poetryDatabase.getPoemByKeyword(synonym);
        if (result) {
          console.log(`用近义词"${synonym}"找到诗句`);
          return prefix + result.poem;
        }
      }

      // 步骤4：完全没找到，调用AI创作新诗
      console.log(`完全未找到相关诗句，调用AI创作...`);
      const newPoem = await GeminiService.createNewPoemWithAI(mood);
      return prefix + newPoem;

    } catch (error) {
      console.error('诗人对话出错:', error);
      const prefix = mood.length <= 4 ?
        `${mood}？这让我想到我的几句诗，我把它们送给你：\n\n` :
        `你看到了复杂的色彩……这让我想到我的几句诗，我把它们送给你：\n\n`;
      return prefix + "（诗人沉思片刻，却未找到合适的词句）";
    }
  };

  // === 2. 事件处理器 ===
  
  // 关闭对话框
  const handleCloseDialogue = () => {
    // 如果有诗歌记录且有身份信息，保存到数据库
    if (currentPoemRecord && currentCustomerIdentity && (dialogue.role === Role.CUSTOMER || dialogue.role === Role.POET)) {
      try {
        const recordId = PoemStorage.addPoemRecord(
          currentPoemRecord.poem,
          currentCustomerIdentity,
          conversationHistory,
          currentPoemRecord.customerReaction
        );
        console.log('诗歌记录已保存，ID:', recordId);
      } catch (error) {
        console.error('保存诗歌记录失败:', error);
      }
    }
    
    // 如果是圣诞老人对话，检查是否是第一次，并添加圣诞礼物诗歌
    if (dialogue.role === Role.SANTA) {
      const hasMetSanta = localStorage.getItem('mellon_met_santa');
      if (!hasMetSanta) {
        // 标记已经见过圣诞老人
        localStorage.setItem('mellon_met_santa', 'true');
        
        // 创建圣诞老人的身份信息
        const santaIdentity: CustomerIdentity = {
          age: 999,
          gender: '男',
          occupation: '礼物配送员',
          personality: 'ENFJ',
          mood: '愉快',
          isForeigner: true,
          isShanghainess: false,
          motivation: '给你带来圣诞礼物'
        };
        
        // 添加圣诞礼物诗歌到图书馆
        try {
          const giftPoem = {
            title: '给你的圣诞礼物',
            author: '你的圣诞老人',
            content: '等我想想'
          };
          
          const recordId = PoemStorage.addPoemRecord(
            giftPoem,
            santaIdentity,
            [],
            undefined
          );
          console.log('🎁 圣诞礼物诗歌已添加到图书馆，ID:', recordId);
        } catch (error) {
          console.error('添加圣诞礼物诗歌失败:', error);
        }
      }
    }
    
    // 结束NPC对话状态，恢复NPC移动
    if (gameCanvasRef.current) {
      const gameEngine = gameCanvasRef.current.getGameEngine();
      if (gameEngine && currentDialogueNPC) {
        gameEngine.endNPCConversation(currentDialogueNPC.id);
      }
    }
    
    // 清理状态
    setDialogue(prev => ({ ...prev, isOpen: false }));
    setConversationHistory([]);
    setCurrentPoemRecord(null);
    setPoetDialogueState('initial'); // 重置诗人对话状态
    setCurrentDialogueNPC(null); // 清理当前对话NPC信息
  };

  // 处理打字机效果完成
  const handleTypingComplete = (content: string) => {
    if (dialogue.role === Role.CUSTOMER) {
      // 立即将内容添加到历史记录
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: content }
      ]);
      
      // 不在这里清空content，避免触发不必要的重新渲染
    }
  };

  // 处理对话框打开时的初始化
  React.useEffect(() => {
    if (dialogue.isOpen && dialogue.role === Role.POET && dialogue.content === '' && poetDialogueState === 'initial') {
      // 诗人对话初始化 - 自动显示选择界面
      setPoetDialogueState('choice');
      setDialogue(prev => ({
        ...prev,
        content: '你想听听我的诗，还是想让我听听你的诗？'
      }));
    }
  }, [dialogue.isOpen, dialogue.role, dialogue.content, poetDialogueState]);

  // 监控诗人对话状态，用于调试
  React.useEffect(() => {
    if (dialogue.role === Role.POET) {
      console.log('诗人对话状态:', poetDialogueState, '内容:', dialogue.content.substring(0, 30));
    }
  }, [poetDialogueState, dialogue.role, dialogue.content]);

  // 监控玩家与对话NPC的距离，自动关闭对话框
  React.useEffect(() => {
    if (!dialogue.isOpen || !currentDialogueNPC || !gameCanvasRef.current) {
      return;
    }

    const checkDistance = () => {
      try {
        if (!gameCanvasRef.current) return;
        const gameEngine = gameCanvasRef.current.getGameEngine();
        if (!gameEngine) return;

        const gameState = gameEngine.getGameState();
        const player = gameState.player;
        
        // 找到当前对话的NPC
        const targetNPC = gameState.npcs.find((npc: any) => npc.id === currentDialogueNPC.id);
        if (!targetNPC) return;

        // 计算距离
        const dx = player.c - targetNPC.c;
        const dy = player.r - targetNPC.r;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离超过2个格子，自动关闭对话框
        if (distance > 2.0) {
          console.log(`玩家离开对话NPC，距离: ${distance.toFixed(2)}, 自动关闭对话框`);
          handleCloseDialogue();
        }
      } catch (error) {
        console.error('检查对话距离时出错:', error);
      }
    };

    // 每100ms检查一次距离
    const intervalId = setInterval(checkDistance, 100);

    return () => clearInterval(intervalId);
  }, [dialogue.isOpen, currentDialogueNPC, handleCloseDialogue]);

  // 处理诗歌创作对话框关闭
  const handlePoemDialogClose = () => {
    setShowPoemDialog(false);
    
    // 如果是诗人对话且处于 listening 状态，恢复到 choice 状态
    if (dialogue.role === Role.POET && poetDialogueState === 'listening') {
      console.log('诗歌创作对话框取消，恢复诗人对话到 choice 状态');
      setPoetDialogueState('choice');
      setDialogue(prev => ({
        ...prev,
        content: '你想听听我的诗，还是想让我听听你的诗？'
      }));
      // 清除诗人身份信息
      setCurrentCustomerIdentity(undefined);
    }
  };

  // 处理诗歌提交
  const handlePoemSubmit = async (poem: { title: string; author: string; content: string }) => {
    // 格式化诗歌内容（对话框中不显示作者）
    const formattedPoemForDisplay = `《${poem.title}》\n\n${poem.content}`;
    
    // 将诗歌添加到对话历史
    if (dialogue.role === Role.CUSTOMER || dialogue.role === Role.POET) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: formattedPoemForDisplay }
      ]);
    }

    // 进入思考状态
    setDialogue(prev => ({
      ...prev,
      isThinking: true,
      content: prev.content
    }));

    // 生成反应
    let responseText = "";
    if (currentCustomerIdentity) {
      try {
        // 根据角色生成不同的反应
        if (dialogue.role === Role.POET) {
          // 诗人的反应
          responseText = await GeminiService.generatePoemEvaluation(
            `标题：《${poem.title}》\n作者：${poem.author}\n\n${poem.content}`
          );
        } else {
          // 顾客的反应
          responseText = await GeminiService.generatePoemResponse(currentCustomerIdentity, poem, conversationHistory);
        }
      } catch (error) {
        console.error('生成反应失败:', error);
        if (dialogue.role === Role.POET) {
          responseText = "很棒，真的。这首诗我记住了。";
        } else {
          responseText = "哇，这首诗真的很棒！谢谢你为我写的诗，我很感动...";
        }
      }
    } else {
      responseText = "谢谢你的诗，我很喜欢！";
    }

    // 更新对话内容
    setDialogue(prev => ({
      ...prev,
      content: responseText,
      isThinking: false
    }));
    
    // 保存诗歌记录信息（在对话结束时保存）
    setCurrentPoemRecord({
      poem,
      customerReaction: responseText
    });
  };

  // 处理用户在对话框中的输入 (发送给 AI)
  const handleSendInput = async (inputText: string) => {
    // 先将用户输入添加到对话历史（仅对顾客）
    if (dialogue.role === Role.CUSTOMER) {
        setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: inputText }
        ]);
    }

    // 立即反馈：进入思考状态
    setDialogue(prev => ({
        ...prev,
        isThinking: true,
        content: prev.content // 保持旧内容，避免闪烁
    }));

    // 根据角色分发处理逻辑
    let responseText = "";
    
    if (dialogue.role === Role.POET) {
        // 诗人逻辑：根据对话状态处理
        console.log('诗人对话 - 当前状态:', poetDialogueState, '输入:', inputText.substring(0, 20));
        
        // 处理返回按钮
        if (inputText === "__POET_GO_BACK__") {
            console.log('诗人对话 - 返回到选择界面');
            setPoetDialogueState('choice');
            setDialogue(prev => ({
                ...prev,
                content: '你想听听我的诗，还是想让我听听你的诗？',
                isThinking: false
            }));
            return;
        }
        
        if (poetDialogueState === 'initial') {
            // 首次对话，显示选择
            console.log('诗人对话 - 初始化，切换到choice状态');
            setPoetDialogueState('choice');
            responseText = "你想听听我的诗，还是想让我听听你的诗？";
        } else if (inputText === "请你听听我的诗") {
            // 路径A：玩家为诗人写诗
            console.log('诗人对话 - 路径A：玩家为诗人写诗');
            setPoetDialogueState('listening');
            // 创建虚拟诗人身份用于保存诗歌记录
            const poetIdentity: CustomerIdentity = {
                age: 30,
                gender: '男',
                occupation: '诗人',
                personality: '文艺、敏感、富有想象力',
                mood: '专注而期待',
                motivation: '聆听新的诗歌作品',
                isForeigner: false,
                isShanghainess: true
            };
            setCurrentCustomerIdentity(poetIdentity);
            
            // 打开诗歌创作对话框
            setShowPoemDialog(true);
            setDialogue(prev => ({
                ...prev,
                isThinking: false
            }));
            return; // 不继续处理，等待用户完成诗歌创作
        } else if (inputText === "让我听听你的诗") {
            // 路径B：诗人为玩家分享诗
            console.log('诗人对话 - 路径B：诗人为玩家分享诗');
            setPoetDialogueState('sharing');
            responseText = "告诉我，你的今天是什么颜色？我会为你找到合适的诗句。";
        } else if (poetDialogueState === 'sharing') {
            // 处理心情关键词，搜索并返回诗歌
            console.log('诗人对话 - sharing状态，搜索诗歌:', inputText);
            responseText = await handlePoetSharePoem(inputText);
        } else if (poetDialogueState === 'choice') {
            // 在choice状态下收到非预期输入，重新显示选择
            console.log('诗人对话 - choice状态下收到非预期输入，重新显示选择');
            responseText = "你想听听我的诗，还是想让我听听你的诗？";
        } else if (poetDialogueState === 'listening') {
            // listening状态下不应该收到输入（应该打开诗歌创作对话框）
            console.log('诗人对话 - listening状态下收到输入（异常）');
            responseText = "请通过诗歌创作对话框分享你的诗。";
        } else {
            // 其他未预期的状态，使用原有的诗歌评价逻辑
            console.log('诗人对话 - 未预期的状态或输入，使用诗歌评价逻辑');
            responseText = await GeminiService.generatePoemEvaluation(inputText);
        }
    } else if (dialogue.role === Role.CUSTOMER) {
        if (currentCustomerIdentity) {
            if (inputText === "讲讲你的故事吧") {
                // 生成初始故事
                responseText = await GeminiService.generateCustomerStory(currentCustomerIdentity);
            } else if (inputText === "然后呢？") {
                // 生成故事续集
                responseText = await GeminiService.generateStorySequel(currentCustomerIdentity, dialogue.content);
            } else if (inputText === "让我为你写首诗吧！") {
                // 打开诗歌创作对话框，不进入思考状态
                setShowPoemDialog(true);
                // 重置对话状态，取消思考状态
                setDialogue(prev => ({
                    ...prev,
                    isThinking: false
                }));
                return; // 不继续处理，等待用户完成诗歌创作
            } else {
                // 自由聊天 - 传递对话历史
                responseText = await GeminiService.generateChatResponse(currentCustomerIdentity, inputText, conversationHistory);
            }
        } else {
            responseText = "抱歉，我现在不太想说话...";
        }
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

    // 注意：AI响应会通过打字机效果显示，完成后再添加到历史记录
  };

  // === 3. 渲染布局 ===
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* 3.1 固定顶部标题 */}
      <header className="fixed top-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm p-4 shadow-md border-b border-slate-700 z-50">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-500 tracking-wider mb-1">梅隆的诗歌酒馆</h1>
            <p className="text-lg text-amber-400/80 tracking-wide">Mellon's Poetry Tavern</p>
        </div>
      </header>

      {/* 3.2 游戏主区域 (Main) - 添加顶部和底部padding避免被标题栏和状态栏遮挡 */}
      <main className="pt-24 pb-16 h-screen bg-slate-950 overflow-hidden">
        {!assetsLoaded ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <div className="text-amber-400 text-lg">加载美术资源中...</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-start p-4 h-full">
            <GameCanvas 
                ref={gameCanvasRef}
                onOpenDialogue={(dialogueState) => {
                  setDialogue(dialogueState);
                  // 记录当前对话的NPC信息
                  if (dialogueState.isOpen && dialogueState.customerId) {
                    setCurrentDialogueNPC({
                      id: dialogueState.customerId,
                      role: dialogueState.role || Role.CUSTOMER
                    });
                  }
                }}
                dialogueState={dialogue}
                onCustomerIdentityChange={setCurrentCustomerIdentity}
                onOpenPoemLibrary={() => setShowPoemLibrary(true)}
            />
          </div>
        )}
        
        {/* 对话框覆盖层 (Overlay) */}
        <DialogueBox 
            dialogue={dialogue} 
            onClose={handleCloseDialogue}
            onSendInput={handleSendInput}
            customerIdentity={currentCustomerIdentity}
            conversationHistory={conversationHistory}
            onTypingComplete={handleTypingComplete}
            poetDialogueState={poetDialogueState}
        />
        
        {/* 诗歌创作对话框 */}
        <PoemCreationDialog
            isOpen={showPoemDialog}
            onClose={handlePoemDialogClose}
            onSubmit={handlePoemSubmit}
        />
        
        {/* 诗歌图书馆 */}
        <PoemLibrary
            isOpen={showPoemLibrary}
            onClose={() => setShowPoemLibrary(false)}
        />
      </main>

      {/* 3.3 固定底部状态栏 (Footer) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm p-2 text-xs text-slate-500 border-t border-slate-700 z-50 flex items-center justify-center">
        <div className="flex-1"></div>
        
        <div className="text-center">
          点击地面移动 • 点击角色对话 • 探索酒馆故事 • 🎄 圣诞特别版
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* DeepSeek 状态 */}
          <div className="text-xs">
            {aiConfigured ? (
              <span className="text-emerald-400">● DeepSeek Online</span>
            ) : (
              <span className="text-gray-500">● DeepSeek Offline</span>
            )}
          </div>
          
          {/* 诗歌图书馆按钮 */}
          <button
            onClick={() => setShowPoemLibrary(true)}
            className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-400 px-2 py-1 rounded text-xs transition-colors"
          >
            📚 诗歌图书馆
          </button>
          
          {/* 音乐控制按钮 */}
          <button
            onClick={toggleMusic}
            className="text-slate-400 hover:text-white transition-colors duration-200 px-2"
            title={isMusicPlaying ? '暂停音乐' : '播放音乐'}
          >
            {isMusicPlaying ? (
              <span className="text-sm">🔊</span>
            ) : (
              <span className="text-sm">🔇</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;