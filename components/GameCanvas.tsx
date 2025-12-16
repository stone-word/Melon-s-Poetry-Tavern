/**
 * ==============================================================================
 * 游戏核心画布 (Game Canvas)
 * ==============================================================================
 * 处理游戏循环、渲染逻辑、寻路算法以及用户点击交互。
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Role, TILE_SIZE, COLS, ROWS, Agent, Position, DialogueState, BartenderState } from '../types';
import * as GeminiService from '../services/geminiService';
import { generateSprite } from '../utils/pixelArt';

interface GameCanvasProps {
  onOpenDialogue: (dialogue: DialogueState) => void;
  dialogueState: DialogueState;
}

// 家具数据接口 (Updated for Seamless Rendering)
interface FurnitureItem {
    type: 'STOOL' | 'SOFA' | 'TABLE' | 'CHAIR' | 'PIANO_TL' | 'PIANO_TR' | 'PIANO_BL' | 'PIANO_BR' | 'BARREL' | 'DRINKS' | 'PLANT' | 'BOOKSHELF' | 'RUG' | 'LAMP' | 'WRITING_DESK' | 'ARMCHAIR' | 'BOOKS_PILE' | 'ROUND_TABLE' | 'WOODEN_STOOL' | 'LONG_TABLE_L' | 'LONG_TABLE_R' | 'LONG_TABLE_T' | 'LONG_TABLE_B' | 'SMALL_SOFA';
    c: number;
    r: number;
    orient?: 'H' | 'V';           // 方向
    variant?: 'START' | 'MID' | 'END' | 'SINGLE'; // 连接部位
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onOpenDialogue, dialogueState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // === 1. 游戏状态 (Refs) ===
  const playerRef = useRef<Agent>({
    c: 5, r: 10, pixelX: 5 * TILE_SIZE, pixelY: 10 * TILE_SIZE,
    id: 999, role: Role.PLAYER, color: 'blue', path: [], speed: 4, state: 'IDLE'
  });
  
  const npcsRef = useRef<Agent[]>([]);
  const ripplesRef = useRef<{x: number, y: number, r: number, a: number}[]>([]); // 点击波纹效果
  const frameIdRef = useRef<number>(0); // 动画帧 ID
  
  // 美术资源缓存
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // === 常量定义：布局参数 ===
  
  // 1. 门的位置 (向上平移)
  const DOOR_ROW_START = 6;
  const DOOR_ROW_END = 7;

  // 2. 吧台位置 (垂直居中，右侧)
  const BAR_COL_START = 43; 
  const BAR_COL_END = 45;              
  const BAR_ROW_START = 13;
  const BAR_ROW_END = 19;

  // === 3. 家具生成逻辑 (Static Map Data) ===
  // 使用 useMemo 仅计算一次家具布局
  const { furnitureItems, staticObstacles } = useMemo(() => {
      const items: FurnitureItem[] = [];
      const obs = new Set<string>(); // 静态障碍物 (墙壁、钢琴、桌子等)

      // A. 吧台高脚凳 (左侧)
      const stoolRows = [14, 15, 17, 18];
      stoolRows.forEach(r => {
          items.push({ type: 'STOOL', c: 42, r });
      });

      // B. 钢琴 (舞池左下角外部 - 2x2 格子)
      // 原位置：10，向右移7格 -> 17
      
      const PIANO_COL = 17; 
      const PIANO_ROW = 22;

      // 顶部 (TL, TR)
      items.push({ type: 'PIANO_TL', c: PIANO_COL, r: PIANO_ROW });
      items.push({ type: 'PIANO_TR', c: PIANO_COL + 1, r: PIANO_ROW });
      obs.add(`${PIANO_COL},${PIANO_ROW}`);
      obs.add(`${PIANO_COL + 1},${PIANO_ROW}`);

      // 底部 (BL, BR) - 键盘在下方
      items.push({ type: 'PIANO_BL', c: PIANO_COL, r: PIANO_ROW + 1 });
      items.push({ type: 'PIANO_BR', c: PIANO_COL + 1, r: PIANO_ROW + 1 });
      obs.add(`${PIANO_COL},${PIANO_ROW + 1}`);
      obs.add(`${PIANO_COL + 1},${PIANO_ROW + 1}`);

      // C. 吧台装饰
      // C.1 后方的酒桶 (Barrels)
      const BARREL_COL = 46;
      items.push({ type: 'BARREL', c: BARREL_COL, r: 13 });
      items.push({ type: 'BARREL', c: BARREL_COL, r: 14 });
      items.push({ type: 'BARREL', c: BARREL_COL, r: 18 });
      items.push({ type: 'BARREL', c: BARREL_COL, r: 19 });
      obs.add(`${BARREL_COL},${13}`);
      obs.add(`${BARREL_COL},${14}`);
      obs.add(`${BARREL_COL},${18}`);
      obs.add(`${BARREL_COL},${19}`);

      // C.2 吧台上的酒水 (Drinks)
      items.push({ type: 'DRINKS', c: 43, r: 14 });
      items.push({ type: 'DRINKS', c: 44, r: 17 });
      // 注意：Drinks 不作为障碍物

      // D. 绿植装饰 (Plants)
      // D.1 房间四角
      const corners = [
          {c: 1, r: 1}, {c: 46, r: 1},
          {c: 1, r: 30}, {c: 46, r: 30}
      ];
      // D.2 舞池周边
      const danceFloorCorners = [
          {c: 15, r: 8}, {c: 32, r: 8},
          {c: 15, r: 24}, {c: 32, r: 24}
      ];
      
      [...corners, ...danceFloorCorners].forEach(pos => {
          items.push({ type: 'PLANT', c: pos.c, r: pos.r });
          obs.add(`${pos.c},${pos.r}`);
      });

      // E. 卡座生成器
      const addBooth = (startC: number, startR: number, length: number, orientation: 'H' | 'V') => {
          for (let i = 0; i < length; i++) {
              let sc = startC, sr = startR;     // Sofa
              let tc = startC, tr = startR;     // Table
              let cc = startC, cr = startR;     // Chair
              
              let variant: 'START' | 'MID' | 'END' | 'SINGLE' = 'SINGLE';
              if (length > 1) {
                  if (i === 0) variant = 'START';
                  else if (i === length - 1) variant = 'END';
                  else variant = 'MID';
              }

              if (orientation === 'H') {
                  sc += i; 
                  tc += i; tr += (startR < 10 ? 1 : -1); 
                  cc += i; cr += (startR < 10 ? 2 : -2); 
              } else {
                  sr += i;
                  tc += 1; tr += i;
                  cc += 2; cr += i;
              }

              items.push({ type: 'SOFA', c: sc, r: sr, orient: orientation, variant: variant });
              items.push({ type: 'TABLE', c: tc, r: tr, orient: orientation, variant: variant });
              items.push({ type: 'CHAIR', c: cc, r: cr });
              
              // 关键更新：桌子永远是障碍物
              obs.add(`${tc},${tr}`);
          }
      };

      // E.1 左墙卡座
      addBooth(1, 9, 3, 'V');
      addBooth(1, 13, 3, 'V');
      addBooth(1, 18, 3, 'V');
      addBooth(1, 24, 3, 'V');

      // E.2 上墙卡座
      addBooth(2, 1, 3, 'H');
      addBooth(7, 1, 2, 'H');
      addBooth(11, 1, 3, 'H');
      addBooth(16, 1, 3, 'H');
      addBooth(21, 1, 2, 'H');
      addBooth(25, 1, 3, 'H');
      addBooth(30, 1, 3, 'H');
      addBooth(35, 1, 2, 'H');

      // E.3 下墙卡座
      const bottomSofaRow = ROWS - 2;
      addBooth(2, bottomSofaRow, 3, 'H');
      addBooth(7, bottomSofaRow, 2, 'H');
      addBooth(11, bottomSofaRow, 3, 'H');
      addBooth(16, bottomSofaRow, 3, 'H');
      addBooth(21, bottomSofaRow, 2, 'H');
      addBooth(25, bottomSofaRow, 3, 'H');
      addBooth(30, bottomSofaRow, 3, 'H');
      addBooth(35, bottomSofaRow, 2, 'H');

      // F. 诗人之角 (Poet's Corner) - 右下角区域 (Bottom Right)
      // 1. 地毯 (Rug)
      for(let r = 26; r <= 29; r++) {
          for(let c = 43; c <= 45; c++) {
              items.push({ type: 'RUG', c, r });
          }
      }
      // 2. 靠墙书架
      const BOOKSHELF_COL = 46;
      [25, 26, 27, 28].forEach(r => {
           items.push({ type: 'BOOKSHELF', c: BOOKSHELF_COL, r });
           obs.add(`${BOOKSHELF_COL},${r}`);
      });
      // 3. 诗人的家具
      items.push({ type: 'WRITING_DESK', c: 45, r: 26 });
      obs.add(`45,26`);
      items.push({ type: 'ARMCHAIR', c: 44, r: 26 });
      obs.add(`44,26`);
      items.push({ type: 'LAMP', c: 46, r: 29 });
      obs.add(`46,29`);
      items.push({ type: 'BOOKS_PILE', c: 43, r: 28 });
      items.push({ type: 'BOOKS_PILE', c: 45, r: 28 });

      // G. 休闲散座区 (Casual Seating)
      // 将所有散座匀称分布在舞池左侧空间
      const roundTableSets = [
          { c: 8, r: 10 },  // 左上区域 1
          { c: 12, r: 9 },  // 左上区域 2
          { c: 11, r: 13 },
          { c: 6, r: 14 },  // 左中区域 1
          { c: 10, r: 16 }, // 左中区域 2
          { c: 13, r: 18 }, // 左中区域 3
          { c: 7, r: 20 },  // 左下区域 1
          { c: 11, r: 22 }, // 左下区域 2
          { c: 9, r: 25 }   // 左下区域 3
      ];

      roundTableSets.forEach(pos => {
          // 桌子
          items.push({ type: 'ROUND_TABLE', c: pos.c, r: pos.r });
          obs.add(`${pos.c},${pos.r}`);

          // 凳子 (每张桌子配2个，稍微错开一点)
          // 左侧或上方凳子
          items.push({ type: 'WOODEN_STOOL', c: pos.c - 1, r: pos.r });
          // 右侧或下方凳子
          items.push({ type: 'WOODEN_STOOL', c: pos.c + 1, r: pos.r });
      });

      // H. 长桌组合区 (Long Table Sets) - 舞池右侧
      // 每组包含1个2格长桌和4个椅子
      const longTableSets = [
          { c: 39, r: 9, orient: 'H' },
          { c: 33, r: 10, orient: 'H' }, // 右上区域 1
          { c: 36, r: 13, orient: 'V' }, // 右上区域 2
          { c: 33, r: 16, orient: 'H' }, // 右中区域
          { c: 38, r: 18, orient: 'V' }, // 右下区域 1
          { c: 36, r: 23, orient: 'H' }  // 右下区域 2
      ];

      longTableSets.forEach(set => {
          if (set.orient === 'H') {
              // 水平长桌 (2格宽) - 使用水平专用纹理
              items.push({ type: 'LONG_TABLE_L', c: set.c, r: set.r });
              items.push({ type: 'LONG_TABLE_R', c: set.c + 1, r: set.r });
              obs.add(`${set.c},${set.r}`);
              obs.add(`${set.c + 1},${set.r}`);
              
              // 4个椅子：上下各2个
              items.push({ type: 'CHAIR', c: set.c, r: set.r - 1 });     // 左上
              items.push({ type: 'CHAIR', c: set.c + 1, r: set.r - 1 }); // 右上
              items.push({ type: 'CHAIR', c: set.c, r: set.r + 1 });     // 左下
              items.push({ type: 'CHAIR', c: set.c + 1, r: set.r + 1 }); // 右下
          } else {
              // 垂直长桌 (2格高) - 使用垂直专用纹理
              items.push({ type: 'LONG_TABLE_T', c: set.c, r: set.r });
              items.push({ type: 'LONG_TABLE_B', c: set.c, r: set.r + 1 });
              obs.add(`${set.c},${set.r}`);
              obs.add(`${set.c},${set.r + 1}`);
              
              // 4个椅子：左右各2个
              items.push({ type: 'CHAIR', c: set.c - 1, r: set.r });     // 左上
              items.push({ type: 'CHAIR', c: set.c - 1, r: set.r + 1 }); // 左下
              items.push({ type: 'CHAIR', c: set.c + 1, r: set.r });     // 右上
              items.push({ type: 'CHAIR', c: set.c + 1, r: set.r + 1 }); // 右下
          }
      });

      // I. 沙发座组合区 (Sofa Lounge Sets) - 舞池上下两侧
      // 每组包含1个小圆桌和2个小沙发，排列有灵活美感
      const sofaLoungeSet = [
          { c: 18, r: 5, arrangement: 'L_SHAPE' },  // 上侧左（保持不变）
          { c: 32, r: 6, arrangement: 'FACING' },   // 上侧右（向右移动，远离舞池）
          { c: 22, r: 26, arrangement: 'FACING' },  // 下侧左（向左移动，远离钢琴）
          { c: 31, r: 23, arrangement: 'L_SHAPE' }  // 下侧右（保持不变）
      ];

      sofaLoungeSet.forEach(set => {
          if (set.arrangement === 'L_SHAPE') {
              // L型排列：桌子在角落，两个沙发成直角
              items.push({ type: 'ROUND_TABLE', c: set.c, r: set.r });
              obs.add(`${set.c},${set.r}`);
              
              // 沙发1：桌子右侧
              items.push({ type: 'SMALL_SOFA', c: set.c + 1, r: set.r });
              // 沙发2：桌子下方
              items.push({ type: 'SMALL_SOFA', c: set.c, r: set.r + 1 });
          } else {
              // 面对面排列：桌子在中间，两个沙发相对
              items.push({ type: 'ROUND_TABLE', c: set.c, r: set.r });
              obs.add(`${set.c},${set.r}`);
              
              // 沙发1：桌子左侧
              items.push({ type: 'SMALL_SOFA', c: set.c - 1, r: set.r });
              // 沙发2：桌子右侧
              items.push({ type: 'SMALL_SOFA', c: set.c + 1, r: set.r });
          }
      });

      return { furnitureItems: items, staticObstacles: obs };
  }, []);

  // 判断某个格子是否是障碍物
  const isObstacle = (c: number, r: number) => {
      // 1. 吧台检查 (硬障碍)
      if (c >= BAR_COL_START && c <= BAR_COL_END && r >= BAR_ROW_START && r <= BAR_ROW_END) {
          // 吧台中间挖空部分不是障碍物
          if (c === BAR_COL_END && r > BAR_ROW_START && r < BAR_ROW_END) return false;
          return true;
      }
      
      // 2. 静态障碍物 (钢琴、桌子、酒桶等)
      if (staticObstacles.has(`${c},${r}`)) {
          return true;
      }

      // 3. 动态障碍物 (NPC)
      // 如果某个格子上有人，视为障碍物，不能穿过（除非是点击交互）
      const isOccupiedByNPC = npcsRef.current.some(npc => Math.round(npc.c) === c && Math.round(npc.r) === r);
      if (isOccupiedByNPC) return true;

      return false;
  };

  // === 2. 初始化逻辑 (Init) ===
  useEffect(() => {
    // 2.1 生成美术资源
    spritesRef.current = {
        [Role.PLAYER]: generateSprite('PLAYER', TILE_SIZE),
        [Role.BARTENDER]: generateSprite('BARTENDER', TILE_SIZE),
        [Role.POET]: generateSprite('POET', TILE_SIZE),
        [Role.CUSTOMER]: generateSprite('CUSTOMER', TILE_SIZE),
        [Role.WAITER]: generateSprite('WAITER', TILE_SIZE),
        [Role.CLEANER]: generateSprite('WAITER', TILE_SIZE), // 清洁工使用与服务员相同的外观
        'FLOOR_A': generateSprite('FLOOR_A', TILE_SIZE),
        'FLOOR_B': generateSprite('FLOOR_B', TILE_SIZE),
        'WALL': generateSprite('WALL', TILE_SIZE),
        
        // 吧台
        'BAR_L_TOP': generateSprite('BAR_L_TOP', TILE_SIZE),
        'BAR_L_MID': generateSprite('BAR_L_MID', TILE_SIZE),
        'BAR_L_BTM': generateSprite('BAR_L_BTM', TILE_SIZE),
        'BAR_M_TOP': generateSprite('BAR_M_TOP', TILE_SIZE),
        'BAR_M_MID': generateSprite('BAR_M_MID', TILE_SIZE),
        'BAR_M_BTM': generateSprite('BAR_M_BTM', TILE_SIZE),

        // 家具
        'STOOL': generateSprite('STOOL', TILE_SIZE),
        'CHAIR': generateSprite('CHAIR', TILE_SIZE),
        
        // 钢琴 (2x2)
        'PIANO_TL': generateSprite('PIANO_TL', TILE_SIZE),
        'PIANO_TR': generateSprite('PIANO_TR', TILE_SIZE),
        'PIANO_BL': generateSprite('PIANO_BL', TILE_SIZE),
        'PIANO_BR': generateSprite('PIANO_BR', TILE_SIZE),

        // 装饰
        'BARREL': generateSprite('BARREL', TILE_SIZE),
        'DRINKS': generateSprite('DRINKS', TILE_SIZE),
        'PLANT': generateSprite('PLANT', TILE_SIZE),
        'BOOKSHELF': generateSprite('BOOKSHELF', TILE_SIZE),
        'RUG': generateSprite('RUG', TILE_SIZE),
        'LAMP': generateSprite('LAMP', TILE_SIZE),
        'WRITING_DESK': generateSprite('WRITING_DESK', TILE_SIZE),
        'ARMCHAIR': generateSprite('ARMCHAIR', TILE_SIZE),
        'BOOKS_PILE': generateSprite('BOOKS_PILE', TILE_SIZE),
        'ROUND_TABLE': generateSprite('ROUND_TABLE', TILE_SIZE),
        'WOODEN_STOOL': generateSprite('WOODEN_STOOL', TILE_SIZE),
        'LONG_TABLE_L': generateSprite('LONG_TABLE_L', TILE_SIZE),
        'LONG_TABLE_R': generateSprite('LONG_TABLE_R', TILE_SIZE),
        'LONG_TABLE_T': generateSprite('LONG_TABLE_T', TILE_SIZE),
        'LONG_TABLE_B': generateSprite('LONG_TABLE_B', TILE_SIZE),
        'SMALL_SOFA': generateSprite('SMALL_SOFA', TILE_SIZE),

        // 家具 - 沙发
        'SOFA_H_L': generateSprite('SOFA_H_L', TILE_SIZE),
        'SOFA_H_M': generateSprite('SOFA_H_M', TILE_SIZE),
        'SOFA_H_R': generateSprite('SOFA_H_R', TILE_SIZE),
        'SOFA_V_T': generateSprite('SOFA_V_T', TILE_SIZE),
        'SOFA_V_M': generateSprite('SOFA_V_M', TILE_SIZE),
        'SOFA_V_B': generateSprite('SOFA_V_B', TILE_SIZE),

        // 家具 - 桌子
        'TABLE_H_L': generateSprite('TABLE_H_L', TILE_SIZE),
        'TABLE_H_M': generateSprite('TABLE_H_M', TILE_SIZE),
        'TABLE_H_R': generateSprite('TABLE_H_R', TILE_SIZE),
        'TABLE_V_T': generateSprite('TABLE_V_T', TILE_SIZE),
        'TABLE_V_M': generateSprite('TABLE_V_M', TILE_SIZE),
        'TABLE_V_B': generateSprite('TABLE_V_B', TILE_SIZE),
    };
    setAssetsLoaded(true);

    // 2.2 初始化 NPCs
    const bartenders: Agent[] = [
        { 
            c: BAR_COL_END, r: 14, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 14 * TILE_SIZE, 
            id: 1, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: BAR_COL_END, r: 14, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 14 * TILE_SIZE },
            stateTimer: 0
        },
        { 
            c: BAR_COL_END, r: 16, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 16 * TILE_SIZE, 
            id: 2, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: BAR_COL_END, r: 16, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 16 * TILE_SIZE },
            stateTimer: 0
        },
        { 
            c: BAR_COL_END, r: 18, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 18 * TILE_SIZE, 
            id: 3, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: BAR_COL_END, r: 18, pixelX: BAR_COL_END * TILE_SIZE, pixelY: 18 * TILE_SIZE },
            stateTimer: 0
        }
    ];

    const waiters: Agent[] = [
         { c: 20, r: 15, pixelX: 20*TILE_SIZE, pixelY: 15*TILE_SIZE, id: 4, role: Role.WAITER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' },
         { c: 25, r: 10, pixelX: 25*TILE_SIZE, pixelY: 10*TILE_SIZE, id: 5, role: Role.WAITER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' },
         { c: 30, r: 20, pixelX: 30*TILE_SIZE, pixelY: 20*TILE_SIZE, id: 6, role: Role.WAITER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' },
         { c: 15, r: 25, pixelX: 15*TILE_SIZE, pixelY: 25*TILE_SIZE, id: 7, role: Role.WAITER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' }
    ];

    const cleaners: Agent[] = [
         { c: 10, r: 8, pixelX: 10*TILE_SIZE, pixelY: 8*TILE_SIZE, id: 8, role: Role.CLEANER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' }
    ];
    
    // 随机生成顾客
    const customers: Agent[] = [];
    for(let i=0; i<8; i++) {
        let r, c, valid = false;
        while (!valid) {
             r = 2 + Math.floor(Math.random() * (ROWS - 4));
             c = 2 + Math.floor(Math.random() * (COLS - 4));
             
             // 必须生成在空地上 (非墙、非门、非静态障碍物)
             if (!isObstacle(c, r) && c < BAR_COL_START && c > 1 && r > 1) valid = true; 
        }
        
        if (r !== undefined && c !== undefined) {
            customers.push({
                c, r, pixelX: c*TILE_SIZE, pixelY: r*TILE_SIZE,
                id: 100 + i, role: Role.CUSTOMER, color: '#2ecc71', path: [], speed: 0, state: 'IDLE',
                identity: {
                    age: 20 + Math.floor(Math.random()*40),
                    gender: Math.random() > 0.5 ? '男' : '女',
                    occupation: '市民',
                    personality: '普通',
                    motivation: '休息',
                    mood: '平静',
                    isShanghainese: Math.random() > 0.3
                }
            });
        }
    }

    // 移动诗人到右下角 "诗人之角" (在书桌和椅子之间)
    const poet: Agent = {
        c: 44, r: 27, pixelX: 44*TILE_SIZE, pixelY: 27*TILE_SIZE,
        id: 777, role: Role.POET, color: '#f1c40f', path: [], speed: 0, state: 'IDLE'
    };

    npcsRef.current = [...bartenders, ...waiters, ...cleaners, ...customers, poet];
  }, []); // 依赖空数组，确保只执行一次

  // === 3. 移动与寻路逻辑 (Pathfinding) ===
  const moveAgent = (agent: Agent) => {
    if (agent.path.length > 0) {
      const target = agent.path[0];
      const tx = target.c * TILE_SIZE;
      const ty = target.r * TILE_SIZE;
      const dx = tx - agent.pixelX;
      const dy = ty - agent.pixelY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < agent.speed) {
        agent.pixelX = tx;
        agent.pixelY = ty;
        agent.c = target.c;
        agent.r = target.r;
        agent.path.shift();
      } else {
        agent.pixelX += (dx/dist) * agent.speed;
        agent.pixelY += (dy/dist) * agent.speed;
      }
    }
  };

  const simplePathfind = (start: Position, end: Position): Position[] => {
      const path: Position[] = [];
      let currC = start.c;
      let currR = start.r;
      // 简单直连，不绕路
      while(currC !== end.c || currR !== end.r) {
          if(currC < end.c) currC++;
          else if(currC > end.c) currC--;
          if(currR < end.r) currR++;
          else if(currR > end.r) currR--;
          path.push({c: currC, r: currR, pixelX: 0, pixelY: 0});
      }
      return path;
  };

  // 调酒师行为更新函数
  const updateBartenderBehavior = (bartender: Agent) => {
    if (!bartender.stateTimer) bartender.stateTimer = 0;
    if (!bartender.homePosition) return;
    
    bartender.stateTimer++;
    
    switch (bartender.bartenderState) {
      case BartenderState.IDLE:
        // 空闲状态：每3-5秒随机决定是否走动
        if (bartender.stateTimer > 180 + Math.random() * 120) { // 3-5秒
          if (Math.random() < 0.3) { // 30%概率开始走动
            bartender.bartenderState = BartenderState.MOVING;
            bartender.stateTimer = 0;
            
            // 在吧台区域内选择一个随机位置
            const possiblePositions = [];
            for (let r = BAR_ROW_START + 1; r < BAR_ROW_END; r++) {
              if (r !== bartender.r) { // 不选择当前位置
                possiblePositions.push({ c: BAR_COL_END, r: r, pixelX: 0, pixelY: 0 });
              }
            }
            
            if (possiblePositions.length > 0) {
              const targetPos = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
              bartender.path = simplePathfind(bartender, targetPos);
            }
          } else {
            bartender.stateTimer = 0; // 重置计时器，继续空闲
          }
        }
        break;
        
      case BartenderState.MOVING:
        // 移动状态：如果到达目标或移动时间过长，返回空闲
        if (bartender.path.length === 0 || bartender.stateTimer > 120) { // 2秒超时
          bartender.bartenderState = BartenderState.IDLE;
          bartender.stateTimer = 0;
          bartender.path = []; // 清空路径
        }
        break;
        
      default:
        bartender.bartenderState = BartenderState.IDLE;
        bartender.stateTimer = 0;
        break;
    }
  };

  // === 4. 交互处理 (Click Handlers) ===
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (dialogueState.isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickC = Math.floor(x / TILE_SIZE);
    const clickR = Math.floor(y / TILE_SIZE);

    // -- 4.1 障碍物检测 --
    const isLeftDoor = clickC === 0 && (clickR === DOOR_ROW_START || clickR === DOOR_ROW_END);
    const isRightDoor = clickC === COLS - 1 && (clickR === DOOR_ROW_START || clickR === DOOR_ROW_END);
    const isWall = clickC <= 0 || clickC >= COLS - 1 || clickR <= 0 || clickR >= ROWS - 1;
    
    const isObs = isObstacle(clickC, clickR);

    // 点击了 NPC
    const clickedNPC = npcsRef.current.find(n => Math.abs(n.c - clickC) <= 1 && Math.abs(n.r - clickR) <= 1);

    // 如果是墙壁且不是门，或者是障碍物且没有点击到NPC (例如点击了钢琴，或者点击了别的玩家占用的位置但没法交互)
    if ((isWall && !isLeftDoor && !isRightDoor) || (isObs && !clickedNPC)) {
        return;
    }

    // 添加波纹
    ripplesRef.current.push({x, y, r: 0, a: 1.0});

    if (clickedNPC) {
        playerRef.current.path = simplePathfind(playerRef.current, {c: clickC, r: clickR, pixelX:0, pixelY:0});
        const dist = Math.abs(playerRef.current.c - clickC) + Math.abs(playerRef.current.r - clickR);
        
        // 如果距离足够近，直接触发对话
        if (dist <= 2) {
             startDialogue(clickedNPC);
        }
    } else {
        // 移动到空地 (包括空椅子)
        playerRef.current.path = simplePathfind(playerRef.current, {c: clickC, r: clickR, pixelX:0, pixelY:0});
    }
  };

  const startDialogue = async (npc: Agent) => {
      let name = "顾客";
      if (npc.role === Role.POET) name = "驻店诗人";
      if (npc.role === Role.BARTENDER) name = "调酒师";
      if (npc.role === Role.WAITER) name = "服务员";
      if (npc.role === Role.CLEANER) name = "清洁工";

      onOpenDialogue({
          isOpen: true,
          speakerName: name,
          content: "...",
          isThinking: true,
          role: npc.role,
          customerId: npc.id
      });

      let text = "";
      if (npc.role === Role.POET) {
          text = "你好，旅人。你想听听我的诗，还是让我听听你的故事？";
      } else if (npc.role === Role.BARTENDER) {
          text = await GeminiService.generateDialogue("你是一个忙碌的上海调酒师，正在吧台后面擦杯子，用上海话跟客人打招呼。");
      } else if (npc.role === Role.WAITER) {
          text = await GeminiService.generateDialogue("你是一个热情的酒馆服务员，询问客人需要什么酒水。");
      } else if (npc.role === Role.CLEANER) {
          text = await GeminiService.generateDialogue("你是一个勤劳的酒馆清洁工，正在打扫卫生，友善地跟客人打招呼。");
      } else if (npc.role === Role.CUSTOMER && npc.identity) {
           const prompt = `你是一个${npc.identity.age}岁的${npc.identity.occupation}，心情${npc.identity.mood}。有人跟你打招呼，请简短回复。`;
           text = await GeminiService.generateDialogue(prompt);
      }

      onOpenDialogue({
          isOpen: true,
          speakerName: name,
          content: text,
          isThinking: false,
          role: npc.role,
          customerId: npc.id
      });
  };

  // === 5. 渲染循环 (Render Loop) ===
  useEffect(() => {
    if (!assetsLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      moveAgent(playerRef.current);
      
      // Update NPCs behavior
      npcsRef.current.forEach(npc => {
        if (npc.role === Role.BARTENDER) {
          updateBartenderBehavior(npc);
        }
        moveAgent(npc);
      });
      
      // Update Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.r += 1.5;
        r.a -= 0.03;
        if (r.a <= 0) ripplesRef.current.splice(i, 1);
      }

      // 5.1 绘制地图 (Map)
      const floorA = spritesRef.current['FLOOR_A'];
      const floorB = spritesRef.current['FLOOR_B'];
      const wall = spritesRef.current['WALL'];
      
      const barLTop = spritesRef.current['BAR_L_TOP'];
      const barLMid = spritesRef.current['BAR_L_MID'];
      const barLBtm = spritesRef.current['BAR_L_BTM'];
      const barMTop = spritesRef.current['BAR_M_TOP'];
      const barMMid = spritesRef.current['BAR_M_MID'];
      const barMBtm = spritesRef.current['BAR_M_BTM'];

      if (floorA && floorB && wall) {
          // A. 基础地砖与墙壁
          for(let r=0; r<ROWS; r++) {
              for(let c=0; c<COLS; c++) {
                 // 逻辑判断
                 const isLeftDoor = c === 0 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                 const isRightDoor = c === COLS - 1 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                 const isEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
                 
                 // 墙壁
                 if (isEdge && !isLeftDoor && !isRightDoor) {
                     ctx.drawImage(wall, c*TILE_SIZE, r*TILE_SIZE);
                     continue;
                 } 
                 
                 // 吧台
                 if (c >= BAR_COL_START && c <= BAR_COL_END && r >= BAR_ROW_START && r <= BAR_ROW_END) {
                     // 关键修改：如果是最右列的中间部分，跳过绘制（显示为地板），实现“挖空”效果
                     if (c === BAR_COL_END && r > BAR_ROW_START && r < BAR_ROW_END) {
                         const isEven = (r + c) % 2 === 0;
                         ctx.drawImage(isEven ? floorA : floorB, c*TILE_SIZE, r*TILE_SIZE);
                         continue;
                     }

                     let spriteToDraw = null;
                     if (c === BAR_COL_START) {
                         if (r === BAR_ROW_START) spriteToDraw = barLTop;
                         else if (r === BAR_ROW_END) spriteToDraw = barLBtm;
                         else spriteToDraw = barLMid;
                     } else {
                         if (r === BAR_ROW_START) spriteToDraw = barMTop;
                         else if (r === BAR_ROW_END) spriteToDraw = barMBtm;
                         else spriteToDraw = barMMid;
                     }
                     if (spriteToDraw) {
                         ctx.drawImage(spriteToDraw, c*TILE_SIZE, r*TILE_SIZE);
                         continue;
                     }
                 }

                 // 普通地板
                 const isEven = (r + c) % 2 === 0;
                 ctx.drawImage(isEven ? floorA : floorB, c*TILE_SIZE, r*TILE_SIZE);
              }
          }

          // B. 绘制圆形舞池 (覆盖在普通地板之上)
          const centerX = (COLS * TILE_SIZE) / 2;
          const centerY = (ROWS * TILE_SIZE) / 2;
          const radiusInner = 7 * TILE_SIZE;      // 白色区域半径
          const radiusOuter = 8 * TILE_SIZE;      // 红色外圈半径

          // 1. 红色外圈 (底色)
          ctx.beginPath();
          ctx.arc(centerX, centerY, radiusOuter, 0, Math.PI * 2);
          ctx.fillStyle = '#700b0bff'; // Updated to specific dark red
          ctx.fill();

          // 2. 白色内芯
          ctx.beginPath();
          ctx.arc(centerX, centerY, radiusInner, 0, Math.PI * 2);
          ctx.fillStyle = '#c2cedaff'; // Updated to specific grey-blue
          ctx.fill();

          // C. 绘制家具 (在第二层循环绘制，确保在地板之上)
          furnitureItems.forEach(item => {
              let sprite = null;
              
              if (item.type === 'STOOL') sprite = spritesRef.current['STOOL'];
              else if (item.type === 'CHAIR') sprite = spritesRef.current['CHAIR'];
              else if (item.type === 'PIANO_TL') sprite = spritesRef.current['PIANO_TL'];
              else if (item.type === 'PIANO_TR') sprite = spritesRef.current['PIANO_TR'];
              else if (item.type === 'PIANO_BL') sprite = spritesRef.current['PIANO_BL'];
              else if (item.type === 'PIANO_BR') sprite = spritesRef.current['PIANO_BR'];
              else if (item.type === 'BARREL') sprite = spritesRef.current['BARREL'];
              else if (item.type === 'DRINKS') sprite = spritesRef.current['DRINKS'];
              else if (item.type === 'PLANT') sprite = spritesRef.current['PLANT'];
              else if (item.type === 'BOOKSHELF') sprite = spritesRef.current['BOOKSHELF'];
              else if (item.type === 'RUG') sprite = spritesRef.current['RUG'];
              else if (item.type === 'LAMP') sprite = spritesRef.current['LAMP'];
              else if (item.type === 'WRITING_DESK') sprite = spritesRef.current['WRITING_DESK'];
              else if (item.type === 'ARMCHAIR') sprite = spritesRef.current['ARMCHAIR'];
              else if (item.type === 'BOOKS_PILE') sprite = spritesRef.current['BOOKS_PILE'];
              else if (item.type === 'ROUND_TABLE') sprite = spritesRef.current['ROUND_TABLE'];
              else if (item.type === 'WOODEN_STOOL') sprite = spritesRef.current['WOODEN_STOOL'];
              else if (item.type === 'LONG_TABLE_L') sprite = spritesRef.current['LONG_TABLE_L'];
              else if (item.type === 'LONG_TABLE_R') sprite = spritesRef.current['LONG_TABLE_R'];
              else if (item.type === 'LONG_TABLE_T') sprite = spritesRef.current['LONG_TABLE_T'];
              else if (item.type === 'LONG_TABLE_B') sprite = spritesRef.current['LONG_TABLE_B'];
              else if (item.type === 'SMALL_SOFA') sprite = spritesRef.current['SMALL_SOFA'];
              else if (item.type === 'SOFA') {
                  const s = spritesRef.current;
                  if (item.orient === 'H') {
                      if (item.variant === 'START') sprite = s['SOFA_H_L'];
                      else if (item.variant === 'END') sprite = s['SOFA_H_R'];
                      else sprite = s['SOFA_H_M'];
                  } else {
                      if (item.variant === 'START') sprite = s['SOFA_V_T'];
                      else if (item.variant === 'END') sprite = s['SOFA_V_B'];
                      else sprite = s['SOFA_V_M'];
                  }
              }
              else if (item.type === 'TABLE') {
                  const s = spritesRef.current;
                  if (item.orient === 'H') {
                      if (item.variant === 'START') sprite = s['TABLE_H_L'];
                      else if (item.variant === 'END') sprite = s['TABLE_H_R'];
                      else sprite = s['TABLE_H_M'];
                  } else {
                      if (item.variant === 'START') sprite = s['TABLE_V_T'];
                      else if (item.variant === 'END') sprite = s['TABLE_V_B'];
                      else sprite = s['TABLE_V_M'];
                  }
              }

              if (sprite) {
                  ctx.drawImage(sprite, item.c * TILE_SIZE, item.r * TILE_SIZE);
              }
          });
      } else {
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 5.2 绘制 NPCs
      npcsRef.current.sort((a,b) => a.r - b.r).forEach(npc => {
          const sprite = spritesRef.current[npc.role] || spritesRef.current[Role.CUSTOMER];
          if (sprite) {
              ctx.drawImage(sprite, npc.pixelX, npc.pixelY);
          } else {
            ctx.fillStyle = npc.color;
            ctx.fillRect(npc.pixelX + 4, npc.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          }
          
          if (npc.role === Role.POET) {
              ctx.fillStyle = '#fbd38d';
              ctx.font = 'bold 10px serif';
              ctx.fillText('诗人', npc.pixelX + 2, npc.pixelY - 4);
          }
      });

      // 5.3 绘制玩家
      const p = playerRef.current;
      const pSprite = spritesRef.current[Role.PLAYER];
      if (pSprite) {
          ctx.drawImage(pSprite, p.pixelX, p.pixelY);
      } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.pixelX + 4, p.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(p.pixelX + TILE_SIZE/2, p.pixelY + TILE_SIZE - 2, 8, 4, 0, 0, Math.PI*2);
      ctx.fill();

      // 5.4 绘制特效
      ripplesRef.current.forEach(r => {
          ctx.strokeStyle = `rgba(255, 255, 255, ${r.a})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.stroke();
      });

      frameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [assetsLoaded, furnitureItems]); // 加入 furnitureItems 依赖

  return (
    <div className="relative overflow-auto max-h-screen max-w-full shadow-2xl border-4 border-slate-800 bg-black">
      <canvas 
        ref={canvasRef}
        width={COLS * TILE_SIZE}
        height={ROWS * TILE_SIZE}
        onClick={handleCanvasClick}
        className="cursor-crosshair block bg-black"
      />
    </div>
  );
};

export default GameCanvas;