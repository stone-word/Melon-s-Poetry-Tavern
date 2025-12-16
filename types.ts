/**
 * ==============================================================================
 * 类型定义 (Type Definitions)
 * ==============================================================================
 * 定义游戏中所有的接口、枚举和常量配置。
 */

// === 1. 角色枚举 ===
// 定义游戏中所有可能出现的角色类型
export enum Role {
  PLAYER = 'PLAYER',       // 玩家
  BARTENDER = 'BARTENDER', // 调酒师
  WAITER = 'WAITER',       // 服务员
  CLEANER = 'CLEANER',     // 清洁工
  CUSTOMER = 'CUSTOMER',   // 普通顾客
  POET = 'POET'            // 诗人
}

// === 2. 顾客状态枚举 ===
export enum CustomerState {
  ENTERING = 'ENTERING',
  CHATTING = 'CHATTING',
  DANCING = 'DANCING',
  WAITING_ORDER = 'WAITING_ORDER',
  WAITING_DRINK = 'WAITING_DRINK',
  EATING = 'EATING',
  LEAVING = 'LEAVING'
}

// === 3. 服务员状态枚举 ===
export enum WaiterState {
  IDLE = 'IDLE',
  TAKING_ORDER = 'TAKING_ORDER',
  DELIVERING_ORDER = 'DELIVERING_ORDER',
  WAITING_DRINK = 'WAITING_DRINK',
  DELIVERING_DRINK = 'DELIVERING_DRINK'
}

// === 4. 调酒师状态枚举 ===
export enum BartenderState {
  IDLE = 'IDLE',
  PREPARING_DRINK = 'PREPARING_DRINK',
  MOVING = 'MOVING'
}

// === 5. 基础坐标系统 ===
export interface Position {
  c: number;      // Column: 网格列坐标 (Grid X)
  r: number;      // Row: 网格行坐标 (Grid Y)
  pixelX: number; // 实际渲染像素 X
  pixelY: number; // 实际渲染像素 Y
}



// === 6. 订单接口 ===
export interface Order {
  id: number;
  customerId: number;
  waiterId: number;
  bartenderId?: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
  drinkType: string;
  createdAt: number;
}

// === 7. 游戏代理 (Agent) ===
// 游戏中所有活动物体（玩家、NPC）的基础数据结构
export interface Agent extends Position {
  id: number;           // 唯一标识符
  role: Role;           // 角色身份
  color: string;        // 备用颜色 (当没有贴图时显示)
  path: Position[];     // 寻路路径队列
  speed: number;        // 移动速度
  state: string;        // 当前状态 (IDLE, MOVING, 或具体的角色状态)
  identity?: CustomerIdentity; // NPC 的详细身份设定 (可选)
  
  // 顾客相关属性
  customerState?: CustomerState;
  stateTimer?: number;
  
  // 服务员相关属性
  waiterState?: WaiterState;
  targetCustomerId?: number;
  
  // 调酒师相关属性
  bartenderState?: BartenderState;
  homePosition?: Position;
  currentOrder?: Order;
  
  // 通用属性
  stuckCounter?: number;
}

// === 8. NPC 身份详情 ===
// 用于 AI 生成对话时的上下文设定
export interface CustomerIdentity {
  age: number;
  gender: string;
  occupation: string;   // 职业
  personality: string;  // 性格
  motivation: string;   // 来酒馆的动机
  mood: string;         // 当前心情
  isShanghainese: boolean; // 是否说方言
}

// === 9. 对话框状态 ===
// 控制 UI 层对话框的显示与内容
export interface DialogueState {
  isOpen: boolean;      // 对话框是否打开
  speakerName: string;  // 说话者名字
  content: string;      // 对话内容
  isThinking: boolean;  // 是否正在等待 AI 生成
  role: Role | null;    // 当前对话角色的身份
  customerId?: number;  // 对应的 NPC ID
}

// === 10. 全局常量配置 ===
export const TILE_SIZE = 32; // 每个格子的像素大小
export const COLS = 48;      // 地图总列数
export const ROWS = 32;      // 地图总行数

// 门的位置
export const DOOR_ROW_START = 6;
export const DOOR_ROW_END = 7;

// 吧台位置
export const BAR_COL_START = 43;
export const BAR_COL_END = 45;
export const BAR_ROW_START = 13;
export const BAR_ROW_END = 19;

// 游戏配置
export const MAX_CUSTOMERS = 20;