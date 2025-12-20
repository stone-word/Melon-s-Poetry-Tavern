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
  POET = 'POET',           // 诗人
  MUSICIAN = 'MUSICIAN',   // 音乐家
  SANTA = 'SANTA',         // 圣诞老人
  CAT = 'CAT'              // 三花猫
}

// === 2. 顾客状态枚举 ===
export enum CustomerState {
  ENTERING = 'ENTERING',
  SEATED = 'SEATED',           // 新增：刚坐下，等待点单
  READY_TO_ORDER = 'READY_TO_ORDER', // 新增：准备点单
  WAITING_FOR_WAITER = 'WAITING_FOR_WAITER', // 新增：等待服务员
  ORDERING = 'ORDERING',       // 新增：正在点单
  WAITING_DRINK = 'WAITING_DRINK',
  DRINKING = 'DRINKING',
  CHATTING = 'CHATTING',
  DANCING = 'DANCING',
  SLEEPING = 'SLEEPING',
  LEAVING = 'LEAVING'
}

// === 3. 服务员状态枚举 ===
export enum WaiterState {
  IDLE = 'IDLE',
  GOING_TO_CUSTOMER = 'GOING_TO_CUSTOMER', // 新增：前往顾客
  TAKING_ORDER = 'TAKING_ORDER',
  GOING_TO_BAR = 'GOING_TO_BAR',          // 新增：前往吧台
  WAITING_FOR_DRINK = 'WAITING_FOR_DRINK',
  DELIVERING_DRINK = 'DELIVERING_DRINK'
}

// === 4. 调酒师状态枚举 ===
export enum BartenderState {
  IDLE = 'IDLE',
  PREPARING_DRINK = 'PREPARING_DRINK',
  MOVING = 'MOVING'
}

// === 5. 清洁工状态枚举 ===
export enum CleanerState {
  IDLE = 'IDLE',
  WANDERING = 'WANDERING',
  GOING_TO_CLEAN = 'GOING_TO_CLEAN',
  CLEANING = 'CLEANING'
}

// === 6. 诗人状态枚举 ===
export enum PoetState {
  WANDERING = 'WANDERING',      // 缓慢闲逛
  SITTING_THINKING = 'SITTING_THINKING',  // 坐在扶手椅上沉思
  WRITING = 'WRITING'           // 坐在书桌前写作
}

// === 7. 音乐家状态枚举 ===
export enum MusicianState {
  PLAYING = 'PLAYING',          // 正在弹奏
  RESTING = 'RESTING'           // 休息中
}

// === 5. 基础坐标系统 ===
export interface Position {
  c: number;      // Column: 网格列坐标 (Grid X)
  r: number;      // Row: 网格行坐标 (Grid Y)
  pixelX: number; // 实际渲染像素 X
  pixelY: number; // 实际渲染像素 Y
}



// === 6. 订单接口 (预留未来扩展) ===
export interface Order {
  id: number;
  customerId: number;
  waiterId?: number;
  bartenderId?: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
  drinkType: string;
  price: number;        // 新增：价格预留
  createdAt: number;
}

// === 6.1 钱款接口 (预留未来扩展) ===
export interface Payment {
  orderId: number;
  customerId: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: number;
}

// === 7. 游戏代理 (Agent) ===
// 游戏中所有活动物体（玩家、NPC）的基础数据结构
export interface Agent extends Position {
  id: number;           // 唯一标识符
  role: Role;           // 角色身份
  color: string;        // 备用颜色 (当没有贴图时显示)
  colorParts?: {        // 多部分配色（用于更丰富的视觉效果）
    hair: string;       // 头发颜色
    top: string;        // 上衣颜色
    bottom: string;     // 下装颜色
    shoes: string;      // 鞋子颜色
  };
  path: Position[];     // 寻路路径队列
  speed: number;        // 移动速度
  state: string;        // 当前状态 (IDLE, MOVING, 或具体的角色状态)
  identity?: CustomerIdentity; // NPC 的详细身份设定 (可选)
  spriteImage?: HTMLImageElement; // 自定义精灵图（用于外部PNG图片）
  
  // 顾客相关属性
  customerState?: CustomerState;
  stateTimer?: number;
  targetSeat?: {c: number, r: number, occupied: boolean};
  markedForDeletion?: boolean;
  
  // 服务员相关属性
  waiterState?: WaiterState;
  targetCustomerId?: number;
  targetBarPosition?: Position;
  
  // 调酒师相关属性
  bartenderState?: BartenderState;
  homePosition?: Position;
  currentOrder?: Order;
  
  // 清洁工相关属性
  cleanerState?: CleanerState;
  targetCleanPosition?: Position;
  
  // 诗人相关属性
  poetState?: PoetState;
  
  // 音乐家相关属性
  musicianState?: MusicianState;
  swayOffset?: number;          // 晃动偏移量
  swayTimer?: number;           // 晃动计时器

  // 猫相关属性
  wanderTimer?: number;         // 漫游计时器
  targetPosition?: Position | null; // 目标位置
  facingRight?: boolean;        // 朝向（true=右，false=左）

  // 对话相关属性
  isInConversation?: boolean;   // 是否正在与玩家对话

  // 初始/舞池相关属性
  startDancing?: boolean;       // 在游戏开始立即跳舞
  danceThenSeat?: boolean;      // 先跳舞再去座位
  dancePositions?: Position[];  // 可用的舞池站位集合（格子坐标）
  danceStepTimer?: number;      // 跳舞节拍计时器（帧）
  danceStepInterval?: number;   // 每步之间的帧间隔
  danceIndex?: number;          // 当前舞步索引

  // 饮酒/睡眠相关（以帧为单位）
  drinkDuration?: number;       // 初始饮酒持续帧数（用于检测是否超过阈值)
  sleepChecked?: boolean;       // 是否已经判断过进入睡眠的概率（避免重复判断）
  startSleeping?: boolean;      // 游戏开始时立即进入睡眠

  // 通用属性
  stuckCounter?: number;
}

// === 8. 音符特效接口 ===
export interface MusicNote {
  x: number;                    // X坐标（像素）
  y: number;                    // Y坐标（像素）
  color: string;                // 颜色
  life: number;                 // 当前生命值
  maxLife: number;              // 最大生命值
  velocity: {                   // 速度向量
    x: number;
    y: number;
  };
}

// === 8.5 雪花粒子接口 ===
export interface Snowflake {
  x: number;                    // X坐标（像素）
  y: number;                    // Y坐标（像素）
  speed: number;                // 下落速度
  size: number;                 // 雪花大小
  opacity: number;              // 透明度
  drift: number;                // 横向漂移速度
}

// === 9. NPC 身份详情 ===
// 用于 AI 生成对话时的上下文设定
export interface CustomerIdentity {
  age: number;
  gender: '男' | '女';
  occupation: string; // 职业（第三级分类的具体职业名称）
  personality: string; // MBTI十六型人格（显示给玩家）
  mood: string; // 当前情绪（显示给玩家）
  isForeigner: boolean; // 是否外国人
  isShanghainess: boolean; // 是否上海人
  motivation?: string; // 来店动机（初始为空，首次对话时AI生成）
}

// === 8.1 年龄分布配置 ===
export const AGE_DISTRIBUTION = {
  // 年龄段: [最小年龄, 最大年龄, 概率]
  groups: [
    { min: 18, max: 21, probability: 0.25 }, // 25%
    { min: 22, max: 30, probability: 0.35 }, // 35%
    { min: 31, max: 40, probability: 0.25 }, // 25%
    { min: 41, max: 50, probability: 0.10 }, // 10%
    { min: 51, max: 60, probability: 0.04 }, // 4%
    { min: 61, max: 99, probability: 0.01 }  // 1%
  ]
};

// === 8.2 职业分类配置 ===
export const OCCUPATION_DISTRIBUTION = {
  // 第一级分类
  primaryCategories: [
    {
      name: '第四产业：信息、技术与知识产业',
      probability: 0.15,
      secondaryCategories: [
        {
          name: '互联网科技',
          probability: 0.70,
          occupations: [
            '软件工程师', '数据科学家', '算法工程师', '人工智能训练师',
            '网络与信息安全工程师', '产品经理', '游戏策划', '游戏运营'
          ]
        },
        {
          name: '新媒体与内容创作',
          probability: 0.25,
          occupations: [
            '短视频博主', '新媒体运营', '用户体验设计师'
          ]
        },
        {
          name: '其他技术专家',
          probability: 0.05,
          occupations: [
            '互联网公司技术顾问', '架构师', '互联网公司首席科学家'
          ]
        }
      ]
    },
    {
      name: '灵活就业与创意阶层',
      probability: 0.25,
      secondaryCategories: [
        {
          name: '自由职业者与数字游民',
          probability: 0.15,
          occupations: ['自由职业者']
        },
        {
          name: '艺术与文化创作者',
          probability: 0.80,
          occupations: [
            '独立音乐人', '插画师', '舞者', '话剧演员', '脱口秀演员',
            '策展人', '动画师', '建模师', '娱乐记者', '编剧',
            '独立摄影师', '小说家', '诗人', '平面设计师', '杂志编辑'
          ]
        },
        {
          name: '微型创业者与个体户',
          probability: 0.05,
          occupations: ['小型品牌主理人', '独立咖啡馆店主']
        }
      ]
    },
    {
      name: '第三产业：商业、金融与专业服务',
      probability: 0.30,
      secondaryCategories: [
        {
          name: '金融与专业服务',
          probability: 0.10,
          occupations: ['金融分析师', '咨询师', '注册会计师']
        },
        {
          name: '商业与贸易',
          probability: 0.40,
          occupations: [
            '生意人', '市场营销经理', '人力资源管理员', '采购员', '收银员',
            '保险经纪人', '银行柜员', '客户经理', '卡车司机', '货车司机',
            '快递员', '外卖员', '公交司机', '出租车司机', '仓库管理员',
            '物流规划师', '保安', '酒店前台', '服务员'
          ]
        },
        {
          name: '高端生活服务',
          probability: 0.50,
          occupations: [
            '健身教练', '精品店买手', '私立教育顾问', '厨师', '糕点师',
            '理发师', '美容师', '家政服务员', '保洁员', '导游',
            '演员', '歌手', '电竞选手', '宠物美容师', '兽医',
            '营养师', '空乘人员'
          ]
        }
      ]
    },
    {
      name: '非本地与临时性身份',
      probability: 0.10,
      secondaryCategories: [
        {
          name: '游客',
          probability: 0.70,
          occupations: ['中国游客', '外籍游客']
        },
        {
          name: '短期商务客',
          probability: 0.15,
          occupations: ['短期出差高管', '项目驻场专家', '展会参展商', '飞行员']
        },
        {
          name: '外籍与海归人士',
          probability: 0.15,
          occupations: ['外籍员工家属', '外籍员工', '海归待业人员', '外籍留学生']
        }
      ]
    },
    {
      name: '公共管理、教育、科研与第二产业管理/技术层',
      probability: 0.15,
      secondaryCategories: [
        {
          name: '教育科研与医疗',
          probability: 0.75,
          occupations: [
            '大学教师', '中小学教师', '医生', '护士', '研究员',
            '警察', '消防员', '社会工作者', '图书管理员',
            '心理咨询师', '调查记者'
          ]
        },
        {
          name: '第二产业管理层',
          probability: 0.10,
          occupations: ['制造业经理', '建筑公司项目经理', '土木工程师', '机械工程师']
        },
        {
          name: '公共管理',
          probability: 0.10,
          occupations: ['公务员', '事业单位行政人员', '律师']
        },
        {
          name: '高级公共管理',
          probability: 0.05,
          occupations: ['法官', '外交官', '城市规划师']
        }
      ]
    },
    {
      name: '第一产业及第二产业一线劳动者',
      probability: 0.05,
      secondaryCategories: [
        {
          name: '第二产业一线',
          probability: 0.80,
          occupations: [
            '建筑工人', '农民工', '高级焊工', '模具师傅', '管道工',
            '电工', '数控机床操作员', '纺织工', '质量检测员',
            '防损员', '手工艺人'
          ]
        },
        {
          name: '第一产业相关',
          probability: 0.20,
          occupations: [
            '农产品贸易商', '农场经营者', '休假的护林员',
            '休假的渔民', '休假的矿工', '地质勘探员'
          ]
        }
      ]
    }
  ]
};

// === 8.3 MBTI十六型人格配置 ===
export const MBTI_TYPES = [
  // 分析家 (NT)
  { code: 'INTJ', name: '建筑师', description: '富有想象力和战略性的思想家' },
  { code: 'INTP', name: '逻辑学家', description: '具有创造性的发明家' },
  { code: 'ENTJ', name: '指挥官', description: '大胆、富有想象力、意志强烈的领导者' },
  { code: 'ENTP', name: '辩论家', description: '聪明好奇的思想家' },
  
  // 外交家 (NF)
  { code: 'INFJ', name: '提倡者', description: '安静而神秘的理想主义者' },
  { code: 'INFP', name: '调停者', description: '诗意、善良的利他主义者' },
  { code: 'ENFJ', name: '主人公', description: '富有魅力、鼓舞人心的领导者' },
  { code: 'ENFP', name: '竞选者', description: '热情、有创造力的自由精神' },
  
  // 守护者 (SJ)
  { code: 'ISTJ', name: '物流师', description: '实用主义的事实导向者' },
  { code: 'ISFJ', name: '守护者', description: '非常专注、温暖的守护者' },
  { code: 'ESTJ', name: '总经理', description: '出色的管理者' },
  { code: 'ESFJ', name: '执政官', description: '非常关心他人的合作者' },
  
  // 探险家 (SP)
  { code: 'ISTP', name: '鉴赏家', description: '大胆而实际的实验者' },
  { code: 'ISFP', name: '探险家', description: '灵活、有魅力的艺术家' },
  { code: 'ESTP', name: '企业家', description: '聪明、精力充沛的感知者' },
  { code: 'ESFP', name: '娱乐家', description: '自发的、精力充沛的娱乐者' }
];

// === 8.4 情绪配置 ===
export const MOOD_TYPES = [
  // 积极情绪 (10种)
  '开心', '兴奋', '满足', '自信', '乐观',
  '放松', '感激', '充满希望', '平静', '愉悦',
  
  // 中性情绪 (10种)
  '平常', '专注', '思考', '好奇', '期待',
  '淡定', '观察', '沉思', '冷静', '理性',
  
  // 消极情绪 (10种)
  '疲惫', '焦虑', '沮丧', '烦躁', '失望',
  '孤独', '困惑', '紧张', '忧虑', '无聊'
];

// === 9. 对话框状态 ===
// 控制 UI 层对话框的显示与内容
export interface DialogueState {
  isOpen: boolean;      // 对话框是否打开
  speakerName: string;  // 说话者名字
  content: string;      // 对话内容
  isThinking: boolean;  // 是否正在等待 AI 生成
  role: Role | null;    // 当前对话角色的身份
  customerId?: number;  // 对应的 NPC ID
  // 当打开的是处于睡眠状态的顾客时，设置为 true，用于在 UI 中直接显示静默的 "zzz..." 内容并禁用交互
  isSleeping?: boolean;
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
export const MAX_CUSTOMERS = 30;