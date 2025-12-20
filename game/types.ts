/**
 * ==============================================================================
 * 游戏引擎类型定义 (Game Engine Types)
 * ==============================================================================
 * 游戏引擎内部使用的类型定义，与主types.ts分离以避免循环依赖
 */

import { Agent, Position, Order, MusicNote, Snowflake } from '../types';

// 家具数据接口
export interface FurnitureItem {
    type: 'STOOL' | 'SOFA' | 'TABLE' | 'CHAIR' | 'PIANO_TL' | 'PIANO_TR' | 'PIANO_BL' | 'PIANO_BR' | 'BARREL' | 'DRINKS' | 'PLANT' | 'BOOKSHELF' | 'RUG' | 'LAMP' | 'WRITING_DESK' | 'ARMCHAIR' | 'BOOKS_PILE' | 'ROUND_TABLE' | 'WOODEN_STOOL' | 'LONG_TABLE_L' | 'LONG_TABLE_R' | 'LONG_TABLE_T' | 'LONG_TABLE_B' | 'SMALL_SOFA' | 'VASE_A' | 'VASE_B' | 'VASE_C' | 'RESTROOM_DOOR' | 'MALE_SIGN' | 'FEMALE_SIGN' | 'CHRISTMAS_TREE_TL' | 'CHRISTMAS_TREE_TM' | 'CHRISTMAS_TREE_TR' | 'CHRISTMAS_TREE_R2L' | 'CHRISTMAS_TREE_R2M' | 'CHRISTMAS_TREE_R2R' | 'CHRISTMAS_TREE_ML' | 'CHRISTMAS_TREE_MM' | 'CHRISTMAS_TREE_MR' | 'CHRISTMAS_TREE_R4L' | 'CHRISTMAS_TREE_R4M' | 'CHRISTMAS_TREE_R4R' | 'CHRISTMAS_TREE_R5L' | 'CHRISTMAS_TREE_R5M' | 'CHRISTMAS_TREE_R5R' | 'CHRISTMAS_TREE_BL' | 'CHRISTMAS_TREE_BM' | 'CHRISTMAS_TREE_BR' | 'GIFT' | 'XMAS_LIGHT' | 'REINDEER' | 'GIFT_PILE';
    c: number;
    r: number;
    orient?: 'H' | 'V';           // 方向
    variant?: 'START' | 'MID' | 'END' | 'SINGLE'; // 连接部位
}

// 游戏状态接口
export interface GameState {
    player: Agent;
    npcs: Agent[];
    pendingOrders: Order[];
    readyDrinks: Order[];
    barCounterOrders: Map<string, Order[]>;
    cashRegister: Map<string, number>;
    seats: {c: number, r: number, occupied: boolean}[];
    dirtyTables: Position[];
    customerIdCounter: number;
    musicNotes: MusicNote[];      // 音符特效数组
    snowflakes: Snowflake[];      // 雪花粒子数组
}

// 渲染特效
export interface RippleEffect {
    x: number;
    y: number;
    r: number;
    a: number;
}

// 地图数据
export interface MapData {
    furnitureItems: FurnitureItem[];
    staticObstacles: Set<string>;
}