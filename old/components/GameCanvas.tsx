import React, { useEffect, useRef, useState } from 'react';
import { Role, TILE_SIZE, COLS, ROWS, Agent, Position, DialogueState } from '../types';
import * as GeminiService from '../services/geminiService';
import { generateSprite } from '../utils/pixelArt';

interface GameCanvasProps {
  onOpenDialogue: (dialogue: DialogueState) => void;
  dialogueState: DialogueState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onOpenDialogue, dialogueState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playerRef = useRef<Agent>({
    c: 5, r: 10, pixelX: 5 * TILE_SIZE, pixelY: 10 * TILE_SIZE,
    id: 999, role: Role.PLAYER, color: 'blue', path: [], speed: 4, state: 'IDLE'
  });
  
  const npcsRef = useRef<Agent[]>([]);
  const ripplesRef = useRef<{x: number, y: number, r: number, a: number}[]>([]);
  const frameIdRef = useRef<number>(0);
  
  // 存储生成的图片资源
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Initialize Game World & Assets
  useEffect(() => {
    // 1. 生成美术资源
    spritesRef.current = {
        [Role.PLAYER]: generateSprite('PLAYER', TILE_SIZE),
        [Role.BARTENDER]: generateSprite('BARTENDER', TILE_SIZE),
        [Role.POET]: generateSprite('POET', TILE_SIZE),
        [Role.CUSTOMER]: generateSprite('CUSTOMER', TILE_SIZE),
        [Role.WAITER]: generateSprite('WAITER', TILE_SIZE),
        'FLOOR_A': generateSprite('FLOOR_A', TILE_SIZE),
        'FLOOR_B': generateSprite('FLOOR_B', TILE_SIZE),
        'WALL': generateSprite('WALL', TILE_SIZE),
    };
    setAssetsLoaded(true);

    // 2. Init NPCs
    const bartenders: Agent[] = [
        { c: COLS - 4, r: 4, pixelX: (COLS-4)*TILE_SIZE, pixelY: 4*TILE_SIZE, id: 1, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 0, state: 'IDLE' }
    ];

    const waiters: Agent[] = [
         { c: 10, r: 15, pixelX: 10*TILE_SIZE, pixelY: 15*TILE_SIZE, id: 2, role: Role.WAITER, color: '#f1c40f', path: [], speed: 0, state: 'IDLE' }
    ];
    
    const customers: Agent[] = [];
    for(let i=0; i<8; i++) {
        // 避开墙壁生成 (避免生成在门口或墙里)
        const r = 2 + Math.floor(Math.random() * (ROWS - 4));
        const c = 2 + Math.floor(Math.random() * (COLS - 4));
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

    const poet: Agent = {
        c: 4, r: ROWS - 4, pixelX: 4*TILE_SIZE, pixelY: (ROWS - 4)*TILE_SIZE,
        id: 777, role: Role.POET, color: '#f1c40f', path: [], speed: 0, state: 'IDLE'
    };

    npcsRef.current = [...bartenders, ...waiters, ...customers, poet];
  }, []);

  // Simple Pathfinding
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
      while(currC !== end.c || currR !== end.r) {
          if(currC < end.c) currC++;
          else if(currC > end.c) currC--;
          if(currR < end.r) currR++;
          else if(currR > end.r) currR--;
          path.push({c: currC, r: currR, pixelX: 0, pixelY: 0});
      }
      return path;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (dialogueState.isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickC = Math.floor(x / TILE_SIZE);
    const clickR = Math.floor(y / TILE_SIZE);

    // 墙壁碰撞检测
    // 定义门的位置：左右两侧墙壁的中间位置 (Row 15, 16)
    const isLeftDoor = clickC === 0 && (clickR === 15 || clickR === 16);
    const isRightDoor = clickC === COLS - 1 && (clickR === 15 || clickR === 16);
    const isWall = clickC <= 0 || clickC >= COLS - 1 || clickR <= 0 || clickR >= ROWS - 1;

    // 如果是墙壁且不是门，则禁止通行
    if (isWall && !isLeftDoor && !isRightDoor) return;

    ripplesRef.current.push({x, y, r: 0, a: 1.0});

    const clickedNPC = npcsRef.current.find(n => Math.abs(n.c - clickC) <= 1 && Math.abs(n.r - clickR) <= 1);
    
    if (clickedNPC) {
        playerRef.current.path = simplePathfind(playerRef.current, {c: clickC, r: clickR, pixelX:0, pixelY:0});
        const dist = Math.abs(playerRef.current.c - clickC) + Math.abs(playerRef.current.r - clickR);
        if (dist <= 2) {
             startDialogue(clickedNPC);
        }
    } else {
        playerRef.current.path = simplePathfind(playerRef.current, {c: clickC, r: clickR, pixelX:0, pixelY:0});
    }
  };

  const startDialogue = async (npc: Agent) => {
      let name = "顾客";
      if (npc.role === Role.POET) name = "驻店诗人";
      if (npc.role === Role.BARTENDER) name = "调酒师";
      if (npc.role === Role.WAITER) name = "服务员";

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
          text = await GeminiService.generateDialogue("你是一个忙碌的上海调酒师，用上海话跟客人打招呼。");
      } else if (npc.role === Role.WAITER) {
          text = await GeminiService.generateDialogue("你是一个热情的酒馆服务员，询问客人需要什么酒水。");
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

  // Render Loop
  useEffect(() => {
    if (!assetsLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 禁用图片平滑，保证像素清晰
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      moveAgent(playerRef.current);
      
      // Update Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.r += 1.5;
        r.a -= 0.03;
        if (r.a <= 0) ripplesRef.current.splice(i, 1);
      }

      // 1. Draw Map (Floor & Walls)
      const floorA = spritesRef.current['FLOOR_A'];
      const floorB = spritesRef.current['FLOOR_B'];
      const wall = spritesRef.current['WALL'];

      if (floorA && floorB && wall) {
          for(let r=0; r<ROWS; r++) {
              for(let c=0; c<COLS; c++) {
                 // Determine Logic
                 const isLeftDoor = c === 0 && (r === 15 || r === 16);
                 const isRightDoor = c === COLS - 1 && (r === 15 || r === 16);
                 const isEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;

                 if (isEdge && !isLeftDoor && !isRightDoor) {
                     // Draw Wall
                     ctx.drawImage(wall, c*TILE_SIZE, r*TILE_SIZE);
                 } else {
                     // Draw Checkered Floor (even in door gaps)
                     const isEven = (r + c) % 2 === 0;
                     ctx.drawImage(isEven ? floorA : floorB, c*TILE_SIZE, r*TILE_SIZE);
                 }
              }
          }
      } else {
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Draw NPCs
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

      // 3. Draw Player
      const p = playerRef.current;
      const pSprite = spritesRef.current[Role.PLAYER];
      if (pSprite) {
          ctx.drawImage(pSprite, p.pixelX, p.pixelY);
      } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.pixelX + 4, p.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
      
      // Indicator for player
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(p.pixelX + TILE_SIZE/2, p.pixelY + TILE_SIZE - 2, 8, 4, 0, 0, Math.PI*2);
      ctx.fill();

      // 4. Draw Ripples
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
  }, [assetsLoaded]);

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