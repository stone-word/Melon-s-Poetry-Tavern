/**
 * ==============================================================================
 * 对话气泡组件 (Chat Bubbles Component)
 * ==============================================================================
 * 管理NPC间的自动对话气泡动画，当两个或更多顾客坐在同一张桌子时显示
 */

import React, { useEffect, useState, useRef } from 'react';
import { Agent, TILE_SIZE, CustomerState, Role } from '../types';

interface ChatBubblesProps {
  gameEngine: any; // GameEngine instance
  canvasWidth: number;
  canvasHeight: number;
}

interface ChatBubble {
  id: string;
  npcId: number;
  x: number;
  y: number;
  startTime: number;
  duration: number; // 3-10秒
  isVisible: boolean;
}

interface TableGroup {
  tableKey: string;
  customers: Agent[];
  lastBubbleTime: number;
}

const ChatBubbles: React.FC<ChatBubblesProps> = ({ gameEngine, canvasWidth, canvasHeight }) => {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [tableGroups, setTableGroups] = useState<Map<string, TableGroup>>(new Map());
  

  const animationFrameRef = useRef<number>(0);
  const bubbleIdCounter = useRef(0);



  // 更新桌子分组 - 使用 ref 来避免频繁的状态更新
  const updateTableGroups = () => {
    if (!gameEngine) return;
    
    const engineTableGroups = gameEngine.getTableGroups();
    
    // 只在桌子数量变化时才更新状态
    if (engineTableGroups.size !== tableGroups.size) {
      const newTableGroups = new Map<string, TableGroup>();

      engineTableGroups.forEach((customers: Agent[], tableKey: string) => {
        newTableGroups.set(tableKey, {
          tableKey,
          customers,
          lastBubbleTime: tableGroups.get(tableKey)?.lastBubbleTime || 0
        });
      });

      setTableGroups(newTableGroups);
    } else {
      // 更新 ref 中的顾客位置信息，但不触发重新渲染
      engineTableGroups.forEach((customers: Agent[], tableKey: string) => {
        const existingGroup = tableGroupsRef.current.get(tableKey);
        if (existingGroup) {
          existingGroup.customers = customers;
        }
      });
    }
  };

  // 创建新的对话气泡
  const createBubble = (customer: Agent): ChatBubble => {
    const bubbleId = `bubble_${bubbleIdCounter.current++}`;
    const duration = 3000 + Math.random() * 7000; // 3-10秒
    
    // 计算气泡位置（顾客右上方）
    const bubbleX = customer.pixelX + TILE_SIZE * 0.8;
    const bubbleY = customer.pixelY - TILE_SIZE * 0.3;

    return {
      id: bubbleId,
      npcId: customer.id,
      x: bubbleX,
      y: bubbleY,
      startTime: Date.now(),
      duration,
      isVisible: true
    };
  };

  // 管理气泡生成 - 使用 useRef 来访问最新状态
  const tableGroupsRef = useRef(tableGroups);
  tableGroupsRef.current = tableGroups;

    const manageBubbles = React.useCallback(() => {
      const currentTime = Date.now();
      const currentTableGroups = tableGroupsRef.current;

      // 清理过期的气泡
      setBubbles(prevBubbles => 
        prevBubbles.filter(bubble => 
          currentTime - bubble.startTime < bubble.duration
        )
      );

      // 为符合条件的桌子生成新气泡（仍然保留原有逻辑）
      currentTableGroups.forEach((group) => {
        const timeSinceLastBubble = currentTime - group.lastBubbleTime;
        
        // 每3秒有50%概率生成气泡
        if (timeSinceLastBubble >= 3000 && Math.random() < 0.5) {
          // 检查该桌子是否已经有活跃的气泡（同桌互斥）
          setBubbles(prevBubbles => {
            const tableHasActiveBubble = prevBubbles.some(bubble => {
              const bubbleCustomer = group.customers.find(c => c.id === bubble.npcId);
              return bubbleCustomer && currentTime - bubble.startTime < bubble.duration;
            });

            // 如果同桌已有气泡，跳过
            if (tableHasActiveBubble) {
              return prevBubbles;
            }

            // 随机选择一个顾客显示气泡
            const randomCustomer = group.customers[Math.floor(Math.random() * group.customers.length)];
            const newBubble = createBubble(randomCustomer);
            
            // 更新该桌子的最后气泡时间
            group.lastBubbleTime = currentTime;
            
            return [...prevBubbles, newBubble];
          });
        }
      });

      // 新增：如果有单个睡觉的顾客（甚至不在 >=2 的桌上），也要显示 zzz 气泡，便于启动时可见
      const sleepingCustomers: Agent[] = gameEngine.getGameState().npcs.filter((n: Agent) => n.role === Role.CUSTOMER && n.customerState === CustomerState.SLEEPING);



      if (sleepingCustomers.length > 0) {
        setBubbles(prevBubbles => {
          const nextBubbles = [...prevBubbles];

          sleepingCustomers.forEach(customer => {
            const hasActiveBubble = prevBubbles.some(b => b.npcId === customer.id && currentTime - b.startTime < b.duration);
            if (!hasActiveBubble) {
              // 创建一个稍长一些的气泡，增强在启动时的可见性
              const newBubble = createBubble(customer);
              newBubble.duration = 8000 + Math.random() * 4000; // 8-12s
              nextBubbles.push(newBubble);
            }
          });

          return nextBubbles;
        });
      }
    }, []); // 空依赖数组，因为我们使用 ref 来访问最新状态

  // 主更新循环
  useEffect(() => {
    const update = () => {
      updateTableGroups();
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameEngine]);

  // 独立的气泡管理循环 - 只在组件挂载时设置一次
  useEffect(() => {
    const bubbleInterval = setInterval(() => {
      manageBubbles();
    }, 3000); // 每3秒检查一次

    return () => {
      clearInterval(bubbleInterval);
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次



  // 渲染气泡
  const renderBubble = (bubble: ChatBubble) => {
    const currentTime = Date.now();
    const elapsed = currentTime - bubble.startTime;
    const progress = elapsed / bubble.duration;
    
    // 淡入淡出效果
    let opacity = 1;
    if (progress < 0.1) {
      opacity = progress / 0.1; // 淡入
    } else if (progress > 0.9) {
      opacity = (1 - progress) / 0.1; // 淡出
    }

    // 浓淡交替的"···"动画
    const dotOpacity1 = 0.3 + 0.7 * Math.sin(elapsed * 0.003);
    const dotOpacity2 = 0.3 + 0.7 * Math.sin(elapsed * 0.003 + Math.PI / 3);
    const dotOpacity3 = 0.3 + 0.7 * Math.sin(elapsed * 0.003 + (2 * Math.PI) / 3);

    return (
      <div
        key={bubble.id}
        className="absolute pointer-events-none"
        style={{
          left: bubble.x,
          top: bubble.y,
          opacity: opacity,
          transform: 'translate(-50%, -100%)'
        }}
      >
        {/* 气泡背景 */}
        <div className="relative">
          <div 
            className="bg-white rounded-lg px-1 py-1 shadow-lg border border-gray-200"
            style={{
              minWidth: `${TILE_SIZE / 4}px`,
              minHeight: `${TILE_SIZE / 4}px`,
              fontSize: '8px'
            }}
          >
            {/* 显示内容 - 如果顾客在睡觉则显示 zzz，否则显示动态点 */}
            {(() => {
              const npc = gameEngine.getGameState().npcs.find((n: Agent) => n.id === bubble.npcId);
              if (npc && npc.customerState === CustomerState.SLEEPING) {
                const zOpacity = 0.6 + 0.4 * Math.sin((Date.now() - bubble.startTime) * 0.002);
                return (
                  <div className="flex justify-center items-center text-gray-700 font-bold" style={{ fontSize: '10px', lineHeight: '1', letterSpacing: '1px' }}>
                    <span style={{ opacity: zOpacity }}>zzz</span>
                  </div>
                );
              }

              return (
                <div className="flex justify-center items-center text-gray-700 font-bold" style={{ fontSize: '10px', lineHeight: '1', letterSpacing: '1px' }}>
                  <span style={{ opacity: dotOpacity1 }}>•</span>
                  <span style={{ opacity: dotOpacity2 }}>•</span>
                  <span style={{ opacity: dotOpacity3 }}>•</span>
                </div>
              );
            })()}
          </div>
          
          {/* 气泡尾巴 - 左下方 */}
          <div 
            className="absolute left-1 top-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: '3px solid white',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          />
        </div>
      </div>
    );
  };



  return (
    <div 
      className="absolute top-0 left-0 pointer-events-none"
      style={{ 
        width: canvasWidth, 
        height: canvasHeight,
        zIndex: 40 // Ensure bubbles render beneath DialogueBox (z-50) and PoemLibrary (z-60)
      }}
    >

      {bubbles.map(renderBubble)}

    </div>
  );
};

export default ChatBubbles;