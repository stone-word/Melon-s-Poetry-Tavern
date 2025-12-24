/**
 * ==============================================================================
 * 游戏核心画布 (Game Canvas) - 重构版
 * ==============================================================================
 * 轻量级游戏画布组件，主要负责UI交互和游戏引擎协调
 */

import React, { useEffect, useRef, useState } from 'react';
import { Role, TILE_SIZE, COLS, ROWS, Agent, DialogueState, BartenderState, CustomerState, CustomerIdentity, MusicianState } from '../types';
import { generateSprite } from '../utils/pixelArt';
import { generateCustomerIdentity, generateCustomerPalette } from '../utils/identityGenerator';
import { GameEngine } from '../game/GameEngine';
import { MapGenerator } from '../game/MapGenerator';
import { GameState } from '../game/types';
import ChatBubbles from './ChatBubbles';
import metadata from '../metadata.json';
import musicService from '../services/musicService';
import { getStaffIdentity } from '../services/staffIdentities';

interface GameCanvasProps {
  onOpenDialogue: (dialogue: DialogueState) => void;
  dialogueState: DialogueState;
  onCustomerIdentityChange?: (identity: CustomerIdentity | undefined) => void;
  onOpenPoemLibrary?: () => void;
}

export interface GameCanvasRef {
  getGameEngine: () => GameEngine | null;
}

const GameCanvas = React.forwardRef<GameCanvasRef, GameCanvasProps>(({ onOpenDialogue, dialogueState, onCustomerIdentityChange, onOpenPoemLibrary }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const frameIdRef = useRef<number>(0);
  const musicStartedRef = useRef<boolean>(false); // 追踪音乐是否已启动
  
  // 美术资源缓存
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // 初始化游戏
  useEffect(() => {
    // 生成美术资源
    // 检查是否为圣诞主题
    const isChristmas = metadata.season === 'christmas';

    spritesRef.current = {
        [Role.PLAYER]: generateSprite('PLAYER', TILE_SIZE),
        [Role.BARTENDER]: generateSprite(isChristmas ? 'BARTENDER_XMAS' : 'BARTENDER', TILE_SIZE),
        [Role.POET]: generateSprite('POET', TILE_SIZE),
        [Role.CUSTOMER]: generateSprite('CUSTOMER', TILE_SIZE),
        [Role.WAITER]: generateSprite(isChristmas ? 'WAITER_XMAS' : 'WAITER', TILE_SIZE),
        [Role.CLEANER]: generateSprite(isChristmas ? 'WAITER_XMAS' : 'WAITER', TILE_SIZE),
        [Role.MUSICIAN]: generateSprite('MUSICIAN', TILE_SIZE),
        [Role.SANTA]: generateSprite('SANTA', TILE_SIZE),
        [Role.CAT]: generateSprite('CAT', TILE_SIZE),
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
        
        // 钢琴
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
        // 花瓶装饰
        'VASE_A': generateSprite('VASE_A', TILE_SIZE),
        'VASE_B': generateSprite('VASE_B', TILE_SIZE),
        'VASE_C': generateSprite('VASE_C', TILE_SIZE),
        
        // 卫生间相关
        'RESTROOM_DOOR': generateSprite('RESTROOM_DOOR', TILE_SIZE),
        'MALE_SIGN': generateSprite('MALE_SIGN', TILE_SIZE),
        'FEMALE_SIGN': generateSprite('FEMALE_SIGN', TILE_SIZE),

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
        // 圣诞树部件 (3x6)
        'CHRISTMAS_TREE_TL': generateSprite('CHRISTMAS_TREE_TL', TILE_SIZE),
        'CHRISTMAS_TREE_TM': generateSprite('CHRISTMAS_TREE_TM', TILE_SIZE),
        'CHRISTMAS_TREE_TR': generateSprite('CHRISTMAS_TREE_TR', TILE_SIZE),
        'CHRISTMAS_TREE_R2L': generateSprite('CHRISTMAS_TREE_R2L', TILE_SIZE),
        'CHRISTMAS_TREE_R2M': generateSprite('CHRISTMAS_TREE_R2M', TILE_SIZE),
        'CHRISTMAS_TREE_R2R': generateSprite('CHRISTMAS_TREE_R2R', TILE_SIZE),
        'CHRISTMAS_TREE_ML': generateSprite('CHRISTMAS_TREE_ML', TILE_SIZE),
        'CHRISTMAS_TREE_MM': generateSprite('CHRISTMAS_TREE_MM', TILE_SIZE),
        'CHRISTMAS_TREE_MR': generateSprite('CHRISTMAS_TREE_MR', TILE_SIZE),
        'CHRISTMAS_TREE_R4L': generateSprite('CHRISTMAS_TREE_R4L', TILE_SIZE),
        'CHRISTMAS_TREE_R4M': generateSprite('CHRISTMAS_TREE_R4M', TILE_SIZE),
        'CHRISTMAS_TREE_R4R': generateSprite('CHRISTMAS_TREE_R4R', TILE_SIZE),
        'CHRISTMAS_TREE_R5L': generateSprite('CHRISTMAS_TREE_R5L', TILE_SIZE),
        'CHRISTMAS_TREE_R5M': generateSprite('CHRISTMAS_TREE_R5M', TILE_SIZE),
        'CHRISTMAS_TREE_R5R': generateSprite('CHRISTMAS_TREE_R5R', TILE_SIZE),
        'CHRISTMAS_TREE_BL': generateSprite('CHRISTMAS_TREE_BL', TILE_SIZE),
        'CHRISTMAS_TREE_BM': generateSprite('CHRISTMAS_TREE_BM', TILE_SIZE),
        'CHRISTMAS_TREE_BR': generateSprite('CHRISTMAS_TREE_BR', TILE_SIZE),
        'GIFT': generateSprite('GIFT', TILE_SIZE),
        'REINDEER': generateSprite('REINDEER', TILE_SIZE),
        'GIFT_PILE': generateSprite('GIFT_PILE', TILE_SIZE),
        'XMAS_LIGHT': generateSprite('XMAS_LIGHT', TILE_SIZE),
    };
    setAssetsLoaded(true);

    // 生成地图数据
    const mapData = MapGenerator.generateMap();

    // 初始化座位系统
    const seats: {c: number, r: number, occupied: boolean}[] = [];
    
    // 添加吧台高脚凳座位
    const stoolRows = [14, 15, 17, 18];
    stoolRows.forEach(r => {
        seats.push({ c: 42, r, occupied: false });
    });
    
    // 添加散座桌子旁的座位
    const roundTableSets = [
        { c: 8, r: 10 }, { c: 12, r: 9 }, { c: 11, r: 13 },
        { c: 6, r: 14 }, { c: 10, r: 16 }, { c: 13, r: 18 },
        { c: 7, r: 20 }, { c: 11, r: 22 }, { c: 9, r: 25 }
    ];
    roundTableSets.forEach(pos => {
        seats.push({ c: pos.c - 1, r: pos.r, occupied: false });
        seats.push({ c: pos.c + 1, r: pos.r, occupied: false });
    });
    
    // 添加长桌座位
    const longTableSets = [
        { c: 39, r: 9, orient: 'H' }, { c: 33, r: 10, orient: 'H' },
        { c: 36, r: 13, orient: 'V' }, { c: 33, r: 16, orient: 'H' },
        { c: 38, r: 18, orient: 'V' }, { c: 36, r: 23, orient: 'H' }
    ];
    longTableSets.forEach(set => {
        if (set.orient === 'H') {
            seats.push({ c: set.c, r: set.r - 1, occupied: false });
            seats.push({ c: set.c + 1, r: set.r - 1, occupied: false });
            seats.push({ c: set.c, r: set.r + 1, occupied: false });
            seats.push({ c: set.c + 1, r: set.r + 1, occupied: false });
        } else {
            seats.push({ c: set.c - 1, r: set.r, occupied: false });
            seats.push({ c: set.c - 1, r: set.r + 1, occupied: false });
            seats.push({ c: set.c + 1, r: set.r, occupied: false });
            seats.push({ c: set.c + 1, r: set.r + 1, occupied: false });
        }
    });
    
    // 添加沙发座位
    const sofaLoungeSet = [
        { c: 18, r: 5, arrangement: 'L_SHAPE' },
        { c: 32, r: 6, arrangement: 'FACING' },
        { c: 22, r: 26, arrangement: 'FACING' },
        { c: 31, r: 23, arrangement: 'L_SHAPE' }
    ];
    sofaLoungeSet.forEach(set => {
        if (set.arrangement === 'L_SHAPE') {
            seats.push({ c: set.c + 1, r: set.r, occupied: false });
            seats.push({ c: set.c, r: set.r + 1, occupied: false });
        } else {
            seats.push({ c: set.c - 1, r: set.r, occupied: false });
            seats.push({ c: set.c + 1, r: set.r, occupied: false });
        }
    });

    // 添加卡座座位
    const addBoothSeats = (startC: number, startR: number, length: number, orientation: 'H' | 'V') => {
        for (let i = 0; i < length; i++) {
            let sc = startC, sr = startR;
            let cc = startC, cr = startR;
            
            if (orientation === 'H') {
                sc += i; 
                cc += i; cr += (startR < 10 ? 2 : -2); 
            } else {
                sr += i;
                cc += 2; cr += i;
            }

            seats.push({ c: sc, r: sr, occupied: false });
            seats.push({ c: cc, r: cr, occupied: false });
        }
    };

    // 卡座座位
    addBoothSeats(1, 9, 3, 'V');
    addBoothSeats(1, 13, 3, 'V');
    addBoothSeats(1, 18, 3, 'V');
    addBoothSeats(1, 24, 3, 'V');
    addBoothSeats(2, 1, 3, 'H');
    addBoothSeats(7, 1, 2, 'H');
    addBoothSeats(11, 1, 3, 'H');
    addBoothSeats(16, 1, 3, 'H');
    addBoothSeats(21, 1, 2, 'H');
    addBoothSeats(25, 1, 3, 'H');
    addBoothSeats(30, 1, 3, 'H');
    addBoothSeats(35, 1, 2, 'H');

    const bottomSofaRow = ROWS - 2;
    addBoothSeats(2, bottomSofaRow, 3, 'H');
    addBoothSeats(7, bottomSofaRow, 2, 'H');
    addBoothSeats(11, bottomSofaRow, 3, 'H');
    addBoothSeats(16, bottomSofaRow, 3, 'H');
    addBoothSeats(21, bottomSofaRow, 2, 'H');
    addBoothSeats(25, bottomSofaRow, 3, 'H');
    addBoothSeats(30, bottomSofaRow, 3, 'H');
    addBoothSeats(35, bottomSofaRow, 2, 'H');

    // 初始化NPCs
    const bartenders: Agent[] = [
        { 
            c: 45, r: 14, pixelX: 45 * TILE_SIZE, pixelY: 14 * TILE_SIZE, 
            id: 1, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: 45, r: 14, pixelX: 45 * TILE_SIZE, pixelY: 14 * TILE_SIZE },
            staffIdentity: getStaffIdentity(Role.BARTENDER, 0) // Diego Ramos
        },
        { 
            c: 45, r: 16, pixelX: 45 * TILE_SIZE, pixelY: 16 * TILE_SIZE, 
            id: 2, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: 45, r: 16, pixelX: 45 * TILE_SIZE, pixelY: 16 * TILE_SIZE },
            staffIdentity: getStaffIdentity(Role.BARTENDER, 1) // 薇薇
        },
        { 
            c: 45, r: 18, pixelX: 45 * TILE_SIZE, pixelY: 18 * TILE_SIZE, 
            id: 3, role: Role.BARTENDER, color: '#9b59b6', path: [], speed: 1, state: 'IDLE',
            bartenderState: BartenderState.IDLE,
            homePosition: { c: 45, r: 18, pixelX: 45 * TILE_SIZE, pixelY: 18 * TILE_SIZE },
            staffIdentity: getStaffIdentity(Role.BARTENDER, 2) // 二胡
        }
    ];

    const waiters: Agent[] = [
         { c: 20, r: 15, pixelX: 20*TILE_SIZE, pixelY: 15*TILE_SIZE, id: 4, role: Role.WAITER, color: '#f1c40f', path: [], speed: 1.8, state: 'IDLE', staffIdentity: getStaffIdentity(Role.WAITER, 0) }, // 阿辉
         { c: 25, r: 10, pixelX: 25*TILE_SIZE, pixelY: 10*TILE_SIZE, id: 5, role: Role.WAITER, color: '#f1c40f', path: [], speed: 1.8, state: 'IDLE', staffIdentity: getStaffIdentity(Role.WAITER, 1) }, // 小雨
         { c: 30, r: 20, pixelX: 30*TILE_SIZE, pixelY: 20*TILE_SIZE, id: 6, role: Role.WAITER, color: '#f1c40f', path: [], speed: 1.8, state: 'IDLE', staffIdentity: getStaffIdentity(Role.WAITER, 2) }, // 小马哥
         { c: 15, r: 25, pixelX: 15*TILE_SIZE, pixelY: 25*TILE_SIZE, id: 7, role: Role.WAITER, color: '#f1c40f', path: [], speed: 1.8, state: 'IDLE', staffIdentity: getStaffIdentity(Role.WAITER, 3) }  // 真雅
    ];

    const cleaners: Agent[] = [
         { 
           c: 10, r: 8, pixelX: 10*TILE_SIZE, pixelY: 8*TILE_SIZE, 
           id: 8, role: Role.CLEANER, color: '#f1c40f', path: [], speed: 1.2, state: 'IDLE',
           staffIdentity: getStaffIdentity(Role.CLEANER, 0) // 王阿姨
         }
    ];
    
    // 初始化8个顾客，确保有2组人（每组2个人）坐在同一张桌子上
    const customers: Agent[] = [];
    const availableSeats = [...seats];
    let customerIdCounter = 100;
    
    // 定义可以坐2个人的桌子（圆桌和沙发休闲区）
    // 注意：座位位置必须与实际的座位添加逻辑一致
    const twoPersonTables = [
        // 圆桌座位（每个圆桌2个座位，使用实际的座位坐标 pos.c±1）
        { seats: [{ c: 7, r: 10 }, { c: 9, r: 10 }] }, // 圆桌 (8,10): 8-1=7, 8+1=9
        { seats: [{ c: 11, r: 9 }, { c: 13, r: 9 }] }, // 圆桌 (12,9): 12-1=11, 12+1=13
        { seats: [{ c: 10, r: 13 }, { c: 12, r: 13 }] }, // 圆桌 (11,13): 11-1=10, 11+1=12
        { seats: [{ c: 5, r: 14 }, { c: 7, r: 14 }] }, // 圆桌 (6,14): 6-1=5, 6+1=7
        { seats: [{ c: 9, r: 16 }, { c: 11, r: 16 }] }, // 圆桌 (10,16): 10-1=9, 10+1=11
        { seats: [{ c: 12, r: 18 }, { c: 14, r: 18 }] }, // 圆桌 (13,18): 13-1=12, 13+1=14
        { seats: [{ c: 6, r: 20 }, { c: 8, r: 20 }] }, // 圆桌 (7,20): 7-1=6, 7+1=8
        { seats: [{ c: 10, r: 22 }, { c: 12, r: 22 }] }, // 圆桌 (11,22): 11-1=10, 11+1=12
        { seats: [{ c: 8, r: 25 }, { c: 10, r: 25 }] }, // 圆桌 (9,25): 9-1=8, 9+1=10
        // 沙发休闲区座位（使用实际的沙发座位位置）
        { seats: [{ c: 19, r: 5 }, { c: 18, r: 6 }] }, // 沙发区 (18,5) L型
        { seats: [{ c: 31, r: 6 }, { c: 33, r: 6 }] }, // 沙发区 (32,6) 对面
        { seats: [{ c: 21, r: 26 }, { c: 23, r: 26 }] }, // 沙发区 (22,26) 对面
        { seats: [{ c: 32, r: 23 }, { c: 31, r: 24 }] }  // 沙发区 (31,23) L型
    ];
    
    // 过滤出实际可用的桌子（座位都存在且未被占用）
    const availableTables = twoPersonTables.filter(table => 
        table.seats.every(seatPos => 
            availableSeats.some(seat => seat.c === seatPos.c && seat.r === seatPos.r && !seat.occupied)
        )
    );
    
    // 随机选择2张桌子作为2组人的桌子
    const selectedTables = [];
    if (availableTables.length >= 2) {
        // 随机选择第一张桌子
        const firstTableIndex = Math.floor(Math.random() * availableTables.length);
        selectedTables.push(availableTables[firstTableIndex]);
        availableTables.splice(firstTableIndex, 1);
        
        // 随机选择第二张桌子
        const secondTableIndex = Math.floor(Math.random() * availableTables.length);
        selectedTables.push(availableTables[secondTableIndex]);
    }
    
    // 为选中的桌子创建2组顾客（每组2个人）
    selectedTables.forEach((table, groupIndex) => {
        table.seats.forEach((seatPos, seatIndex) => {
            // 找到对应的座位并标记为占用
            const seat = availableSeats.find(s => s.c === seatPos.c && s.r === seatPos.r);
            if (seat) {
                seat.occupied = true;
                const seatInRef = seats.find(s => s.c === seat.c && s.r === seat.r);
                if (seatInRef) seatInRef.occupied = true;
                
                // 生成顾客身份和自定义调色板
                const identity = generateCustomerIdentity();
                const customPalette = generateCustomerPalette(identity.gender);
                const spriteImage = generateSprite('CUSTOMER', 32, customPalette);
                
                customers.push({
                    c: seat.c, r: seat.r, 
                    pixelX: seat.c * TILE_SIZE, pixelY: seat.r * TILE_SIZE,
                    id: customerIdCounter++,
                    role: Role.CUSTOMER, 
                    color: customPalette['G'], 
                    path: [], 
                    speed: 1.2, 
                    state: 'SEATED',
                    customerState: CustomerState.SEATED,
                    stateTimer: Math.floor(Math.random() * 300) + 60,
                    targetSeat: seat,
                    identity: identity,
                    spriteImage: spriteImage
                });
                
                // 从可用座位中移除
                const availableIndex = availableSeats.findIndex(s => s.c === seat.c && s.r === seat.r);
                if (availableIndex !== -1) {
                    availableSeats.splice(availableIndex, 1);
                }
            }
        });
    });
    
    // 为剩余的4个顾客随机分配座位（确保他们不坐在同一张桌子）
    const usedTableKeys = new Set<string>();
    
    // 记录已使用的桌子
    selectedTables.forEach(table => {
        const firstSeat = table.seats[0];
        // 简单的桌子标识：使用第一个座位附近的桌子位置
        const tableKey = `${Math.round((firstSeat.c + table.seats[1].c) / 2)}_${Math.round((firstSeat.r + table.seats[1].r) / 2)}`;
        usedTableKeys.add(tableKey);
    });
    
    // 为剩余4个顾客分配座位，避免坐在同一张桌子
    for(let i = customers.length; i < 8 && availableSeats.length > 0; i++) {
        let attempts = 0;
        let seatFound = false;
        
        while (!seatFound && attempts < 50 && availableSeats.length > 0) {
            const seatIndex = Math.floor(Math.random() * availableSeats.length);
            const seat = availableSeats[seatIndex];
            
            // 检查这个座位是否会让顾客坐在已有2人的桌子上
            const nearbySeats = availableSeats.filter(s => 
                Math.abs(s.c - seat.c) <= 2 && Math.abs(s.r - seat.r) <= 2
            );
            
            // 检查附近是否已经有其他顾客
            const nearbyCustomers = customers.filter(customer => 
                Math.abs(customer.c - seat.c) <= 2 && Math.abs(customer.r - seat.r) <= 2
            );
            
            // 如果附近顾客少于2个，可以使用这个座位
            if (nearbyCustomers.length < 2) {
                seat.occupied = true;
                const seatInRef = seats.find(s => s.c === seat.c && s.r === seat.r);
                if (seatInRef) seatInRef.occupied = true;
                
                // 生成顾客身份和自定义调色板
                const identity = generateCustomerIdentity();
                const customPalette = generateCustomerPalette(identity.gender);
                const spriteImage = generateSprite('CUSTOMER', 32, customPalette);
                
                customers.push({
                    c: seat.c, r: seat.r, 
                    pixelX: seat.c * TILE_SIZE, pixelY: seat.r * TILE_SIZE,
                    id: customerIdCounter++,
                    role: Role.CUSTOMER, 
                    color: customPalette['G'], 
                    path: [], 
                    speed: 1.2, 
                    state: 'SEATED',
                    customerState: CustomerState.SEATED,
                    stateTimer: Math.floor(Math.random() * 300) + 60,
                    targetSeat: seat,
                    identity: identity,
                    spriteImage: spriteImage
                });
                
                availableSeats.splice(seatIndex, 1);
                seatFound = true;
            }
            
            attempts++;
        }
        
        // 如果尝试多次都没找到合适座位，就随机选择一个
        if (!seatFound && availableSeats.length > 0) {
            const seatIndex = Math.floor(Math.random() * availableSeats.length);
            const seat = availableSeats[seatIndex];
            
            seat.occupied = true;
            const seatInRef = seats.find(s => s.c === seat.c && s.r === seat.r);
            if (seatInRef) seatInRef.occupied = true;
            
            // 生成顾客身份和自定义调色板
            const identity = generateCustomerIdentity();
            const customPalette = generateCustomerPalette(identity.gender);
            const spriteImage = generateSprite('CUSTOMER', 32, customPalette);
            
            customers.push({
                c: seat.c, r: seat.r, 
                pixelX: seat.c * TILE_SIZE, pixelY: seat.r * TILE_SIZE,
                id: customerIdCounter++,
                role: Role.CUSTOMER, 
                color: customPalette['G'], 
                path: [], 
                speed: 1.2, 
                state: 'SEATED',
                customerState: CustomerState.SEATED,
                stateTimer: Math.floor(Math.random() * 300) + 60,
                targetSeat: seat,
                identity: identity,
                spriteImage: spriteImage
            });
            
            availableSeats.splice(seatIndex, 1);
        }
    }

    // 初始化诗人
    const poet: Agent = {
        c: 44, r: 27, pixelX: 44*TILE_SIZE, pixelY: 27*TILE_SIZE,
        id: 777, role: Role.POET, color: '#f1c40f', path: [], speed: 0.6, state: 'IDLE'
    };

    // 初始化音乐家（坐在钢琴前）
    const musician: Agent = {
        c: 18, r: 22.7, pixelX: 18 * TILE_SIZE, pixelY: 22.7 * TILE_SIZE,
        id: 888, role: Role.MUSICIAN, color: '#1e3a8a', path: [], speed: 0, state: 'IDLE',
        musicianState: MusicianState.PLAYING,
        swayOffset: 0,
        swayTimer: 0
    };

    // 初始化圣诞老人（在圣诞树附近）- 仅在圣诞主题下显示
    let santa: Agent | null = null;
    if (metadata.season === 'christmas' && metadata.features?.christmas) {
        santa = {
            c: 26.2, r: 25.5, // 圣诞树右侧
            pixelX: 26.2 * TILE_SIZE, 
            pixelY: 25.5 * TILE_SIZE,
            id: 999, 
            role: Role.SANTA, 
            color: '#e74c3c', 
            path: [], 
            speed: 0.8, 
            state: 'IDLE',
            swayOffset: 0,
            swayTimer: 0
        };
    }

    // 初始化三花猫（在酒馆自由行动）
    const cat: Agent = {
        c: 15, r: 15, // 初始位置在酒馆中央区域
        pixelX: 15 * TILE_SIZE, 
        pixelY: 15 * TILE_SIZE,
        id: 1000, 
        role: Role.CAT, 
        color: '#ffffff', 
        path: [], 
        speed: 0.8, 
        state: 'IDLE',
        wanderTimer: 0, // 用于控制随机走动的计时器
        targetPosition: null, // 目标位置
        facingRight: false // 初始朝向左侧
    };

    // 让游戏一开始舞池中有2个顾客在跳舞（如果有足够的顾客），并且有1个顾客在睡觉
    if (customers.length >= 2) {
        let idx1 = Math.floor(Math.random() * customers.length);
        let idx2 = Math.floor(Math.random() * customers.length);
        while (idx2 === idx1 && customers.length > 1) {
            idx2 = Math.floor(Math.random() * customers.length);
        }
        customers[idx1].startDancing = true;
        customers[idx2].startDancing = true;

        // 选一个不与舞者重复的顾客做为初始睡眠者
        let sleepIdx = Math.floor(Math.random() * customers.length);
        let attempts = 0;
        while ((sleepIdx === idx1 || sleepIdx === idx2) && attempts < 10 && customers.length > 2) {
            sleepIdx = Math.floor(Math.random() * customers.length);
            attempts++;
        }
        customers[sleepIdx].startSleeping = true;
    } else if (customers.length === 1) {
        // 如果只有一个顾客，优先把他设置为睡觉
        customers[0].startSleeping = true;
    }

    // 创建初始游戏状态
    const initialGameState: GameState = {
        player: {
            c: 24, r: 8, pixelX: 24 * TILE_SIZE, pixelY: 8 * TILE_SIZE,
            id: 999, role: Role.PLAYER, color: 'blue', path: [], speed: 2.5, state: 'IDLE'
        },
        npcs: [...bartenders, ...waiters, ...cleaners, ...customers, poet, musician, ...(santa ? [santa] : []), cat],
        pendingOrders: [],
        readyDrinks: [],
        barCounterOrders: new Map(),
        cashRegister: new Map(),
        seats,
        dirtyTables: [],
        customerIdCounter,
        musicNotes: [],
        snowflakes: []
    };

    // 创建游戏引擎
    gameEngineRef.current = new GameEngine(initialGameState, mapData, spritesRef.current);
  }, []);

  // 游戏循环
  useEffect(() => {
    if (!assetsLoaded || !gameEngineRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // 更新游戏状态
      gameEngineRef.current!.update();

      // 渲染游戏
      gameEngineRef.current!.render(ctx);

      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [assetsLoaded]);

  // 暴露getGameEngine方法给父组件
  React.useImperativeHandle(ref, () => ({
    getGameEngine: () => gameEngineRef.current
  }));

  // 处理画布点击
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // 首次点击时启动音乐
    if (!musicStartedRef.current) {
      musicService.start();
      musicStartedRef.current = true;
    }
    
    if (!gameEngineRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 包装onOpenDialogue，在对话框打开时获取顾客身份信息
    const wrappedOnOpenDialogue = (dialogue: DialogueState) => {
      onOpenDialogue(dialogue);
      
      // 如果是顾客对话，获取并传递身份信息
      if (dialogue.role === Role.CUSTOMER && onCustomerIdentityChange) {
        const customerIdentity = gameEngineRef.current?.getCurrentCustomerIdentity();
        onCustomerIdentityChange(customerIdentity);
      } else if (onCustomerIdentityChange) {
        onCustomerIdentityChange(undefined);
      }
    };

    gameEngineRef.current.handleClick(x, y, wrappedOnOpenDialogue, onOpenPoemLibrary);
  };

  return (
    <div className="relative shadow-2xl border-4 border-slate-800 bg-black rounded-lg overflow-auto max-h-[80vh] max-w-[95vw] game-scrollbar">
      <div className="relative">
        <canvas 
          ref={canvasRef}
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
          onClick={handleCanvasClick}
          className="cursor-crosshair block bg-black"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* 对话气泡层 */}
        {assetsLoaded && gameEngineRef.current && (
          <ChatBubbles 
            gameEngine={gameEngineRef.current}
            canvasWidth={COLS * TILE_SIZE}
            canvasHeight={ROWS * TILE_SIZE}
          />
        )}
      </div>
    </div>
  );
});

export default GameCanvas;