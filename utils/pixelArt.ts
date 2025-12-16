/**
 * ==============================================================================
 * 像素美术生成器 (Pixel Art Generator)
 * ==============================================================================
 * 负责定义字符画数据，并在运行时将其转换为 Canvas 图像资源。
 * 这种方式避免了引入外部图片文件，方便快速迭代美术风格。
 */

// === 1. 调色板映射 (Palette) ===
// 将字符映射为具体的 CSS 颜色值
const PALETTE: Record<string, string> = {
    '.': 'rgba(0,0,0,0)', // 透明背景
    '#': '#0f172a',       // 轮廓黑 (Very Dark Slate)
    
    // -- 环境材质颜色 --
    'V': '#284054ff', // 墙壁深蓝 (Dark Blue)
    'v': '#717da1ff', // 墙壁阴影
    'D': '#677a99ff', // 地板深灰蓝 (Dark Slate)
    'L': '#8ea1baff', // 地板浅灰蓝 (Light Slate)
    'F': '#4f46e5',   // 舞池深色 (Indigo)
    'f': '#818cf8',   // 舞池浅色 (Indigo Light)
    
    // -- 角色通用颜色 --
    'S': '#fbd38d', // 皮肤 (Skin)
    'h': '#713f12', // 头发 (Brown)
    
    // -- 服装与道具颜色 --
    'B': '#2563eb', // 玩家兜帽蓝 (Blue)
    'W': '#f1f5f9', // 白 (围裙/衬衫)
    'Y': '#eab308', // 服务员黄 (Yellow)
    'G': '#16a34a', // 顾客绿
    'P': '#7c3aed', // 诗人紫/贝雷帽
    'Q': '#fecaca', // 羽毛笔 (Quill - Pinkish White)
    
    // -- 家具颜色 --
    'O': '#854d0e', // 橡木色 (Oak - 吧台主体)
    'o': '#ca8a04', // 浅橡木色 (高光/桌面)
    'd': '#451a03', // 深橡木色 (阴影)
    's': '#fcd34d', // 极亮高光 (金色/亮木色)
    'r': '#7f1d1d', // 暗红色 (沙发)
    'R': '#991b1b', // 亮一点的红 (沙发高光)
    'w': '#b45309', // 木色 (桌椅)
    'k': '#171717', // 黑色 (支脚/钢琴黑)
    'K': '#0a0a0a', // 钢琴本体黑 (Piano Black)
    'g': '#404040', // 钢琴高光灰 (Piano Highlight)
    'I': '#fffff0', // 象牙白 (琴键)
    
    // -- 装饰小物颜色 --
    'x': '#b91c1c', // 酒瓶红
    'z': '#15803d', // 酒瓶绿 (也用于深色叶子)
    'u': '#fef08a', // 啤酒黄
    'E': '#86efac', // 嫩绿 (Leaves Light)
    'T': '#92400e', // 陶土色 (Pot)
    
    // -- 诗人之角专属 --
    'M': '#7f1d1d', // 地毯深红 (Maroon)
    'm': '#991b1b', // 地毯亮红
    'A': '#fef3c7', // 灯罩光色 (Amber Light)
    '1': '#1e3a8a', // 书脊蓝
    '2': '#065f46', // 书脊绿
    '3': '#881337', // 书脊红
};

// === 2. 像素图数据定义 (Sprites Data) ===
// 使用 10x10 的字符网格定义图标
const SPRITES_DATA = {
    // [角色] 玩家：蓝色兜帽冒险者
    PLAYER: [
        "..........",
        "...BBBB...", // 兜帽顶
        "..B.B.BB..", 
        "..B.S.SB..", // 脸露出来
        "..BSSSSB..",
        "...BBBB...", // 脖子/披肩
        "..BBBBBB..", // 身体
        "..B.B.B...",
        "..B.B.B...",
        "..#.#.#...",
    ],
    // [角色] 调酒师：白色围裙
    BARTENDER: [
        "..........",
        "....h.....",
        "...h#h....",
        "..hShSh...",
        "..SSSSS...",
        "...WWW....", // 白衬衫
        "..WBWBW...", // 白围裙，蓝裤子
        "..W.W.W...",
        "..W.W.W...",
        "..#.#.#...",
    ],
    // [角色] 服务员：黄色围裙
    WAITER: [
        "..........",
        "....h.....",
        "...h#h....",
        "..hShSh...",
        "..SSSSS...",
        "...WWW....",
        "..YWYWY...", // 黄围裙
        "..Y.Y.Y...",
        "..Y.Y.Y...",
        "..#.#.#...",
    ],
    // [角色] 诗人：贝雷帽，拿羽毛笔
    POET: [
        "..........",
        "...PPP....", // 贝雷帽
        "..P...P...",
        "..S#S#S...",
        "..SSSSS...",
        "...P.P....", // 紫色衣服
        "..P.P.P.Q.", // 右手拿着羽毛笔 (Q)
        "..P.P.P.Q.",
        "..P.P.P...",
        "..#.#.#...",
    ],
    // [角色] 顾客：普通村民
    CUSTOMER: [
        "..........",
        "....h.....",
        "...h#h....",
        "..h###h...",
        "..SSSSS...",
        "...GGG....", // 绿色衣服
        "..G.G.G...",
        "..G.G.G...",
        "..G.G.G...",
        "..#.#.#...",
    ],
    // [环境] 地板 A (深灰蓝)
    FLOOR_A: [
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
        "DDDDDDDDDD",
    ],
    // [环境] 地板 B (浅灰蓝 - 做棋盘格效果)
    FLOOR_B: [
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
        "LLLLLLLLLL",
    ],
    // [环境] 舞池地板 (紫色系)
    FLOOR_DANCE: [
        "FFFFFFFFFF",
        "FFFFFFFFFF",
        "FFffffffFF",
        "FFffffffFF",
        "FFffffffFF",
        "FFffffffFF",
        "FFffffffFF",
        "FFffffffFF",
        "FFFFFFFFFF",
        "FFFFFFFFFF",
    ],
    // [环境] 墙壁 (纯深蓝实心色)
    WALL: [
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
        "VVVVVVVVVV",
    ],
    
    // === 吧台组件 (Bar Components) ===
    BAR_L_TOP: [
        "ssssssssss",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
    ],
    BAR_L_MID: [
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
    ],
    BAR_L_BTM: [
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "oooooooooo",
        "dddddddddd",
    ],
    BAR_M_TOP: [
        "oooooooooo", 
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
    ],
    BAR_M_MID: [
        "OOOOOOOOOO", 
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
    ],
    BAR_M_BTM: [
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "dddddddddd", 
    ],

    // === 家具组件 (Seamless Furniture) ===
    
    // [高脚凳] (吧台用)
    STOOL: [
        "..........",
        "....RR....",
        "...RrRr...",
        "...rrrr...",
        "....kk....",
        "....kk....",
        "....kk....",
        "...k..k...",
        "...k..k...",
        "..........",
    ],

    // [水平沙发]
    SOFA_H_L: [
        "..........",
        ".RRRRRRRRR",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        ".rrrrrrrrr",
        "..........",
    ],
    SOFA_H_M: [
        "..........",
        "RRRRRRRRRR",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "rrrrrrrrrr",
        "..........",
    ],
    SOFA_H_R: [
        "..........",
        "RRRRRRRRR.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "rrrrrrrrr.",
        "..........",
    ],

    // [垂直沙发]
    SOFA_V_T: [
        "..........",
        ".RRRRRRRR.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.", 
    ],
    SOFA_V_M: [
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
    ],
    SOFA_V_B: [
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        ".rrrrrrrr.",
        "..........",
    ],

    // [水平长桌]
    TABLE_H_L: [
        "..........",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        ".OOOOOOOOO",
        "..........",
        "..........",
    ],
    TABLE_H_M: [
        "..........",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "OOOOOOOOOO",
        "..........",
        "..........",
    ],
    TABLE_H_R: [
        "..........",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "OOOOOOOOO.",
        "..........",
        "..........",
    ],
    
    // [垂直长桌]
    TABLE_V_T: [
        "..........",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
    ],
    TABLE_V_M: [
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
    ],
    TABLE_V_B: [
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        ".OOOOOOOO.",
        "..........",
        "..........",
    ],

    // [椅子] (配长桌)
    CHAIR: [
        "..........",
        "..........",
        "...dddd...", 
        "...dddd...",
        "...dddd...",
        "..dddddd..", 
        "..dddddd..",
        "..d....d..", 
        "..d....d..",
        "..........",
    ],

    // === 新增休闲家具 ===
    // [小圆桌] - 俯视图（桌面圆形，中心略暗，边缘有高光）
    ROUND_TABLE: [
        "..........",
        "...ooooo..",
        "..ooooooo.",
        ".ooooOOOO.",
        ".ooOOOOOO.",
        ".ooOOOOOO.",
        ".ooooOOOO.",
        "..ooooooo.",
        "...ooooo..",
        "..........",
    ],
    // [四人方桌] - 俯视图（方形桌面，中心深色，四周可放椅子）
    FOUR_TABLE: [
        "..........",
        "..oooooo..",
        ".ooooOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooooOOoo.",
        "..oooooo..",
        "..........",
        "..........",
    ],
    // [四人椅子] - 俯视图（椅子顶部小方块，面向桌子）
    FOUR_CHAIR: [
        "..........",
        "..........",
        "...kk.....",
        "..kkkk....",
        "..kkkk....",
        "...kk.....",
        "..........",
        "..........",
        "..........",
        "..........",
    ],
    // [木板凳] - 俯视图（小方形座面）
    WOODEN_STOOL: [
        "..........",
        "..........",
        "..........",
        "....ooo...",
        "...oooo...",
        "....ooo...",
        "..........",
        "..........",
        "..........",
        "..........",
    ],

    // === 钢琴 (2x2 Grand Piano) - 垂直版 (Keys at Bottom) ===
    PIANO_TL: [
        "..........",
        ".ggggggg..", // 顶部高光
        ".gKKKKKKKK", 
        ".KKKKKKKKK",
        ".KKKKKKKKK",
        ".KKKKKKKKK",
        ".KKKKKKKKK",
        ".KKKKKKKKK",
        ".KKKKKKKKK",
        ".KKKKKKKKK", // 下接 BL 的黑色部分
    ],
    PIANO_TR: [
        "..........",
        "KKKKKK....", // 曲线开始收缩
        "KKKKKK....",
        "KKKKK.....",
        "KKKKK.....",
        "KKKKK.....",
        "KKKKKK....",
        "KKKKKKK...",
        "KKKKKKKK..",
        "KKKKKKKKK.", // 下接 BR
    ],
    PIANO_BL: [
        ".KKKKKKKKK", // 连接上部
        ".KKKKKKKKK",
        ".IIIIIIIII", // 白键顶部
        ".IIKIIKIII", // 黑键
        ".IIKIIKIII", 
        ".IIIIIIIII", // 白键延伸 (长琴键)
        ".IIIIIIIII", 
        "..kk...kk.", // 腿
        "..........",
        "..........",
    ],
    PIANO_BR: [
        "KKKKKKKKK.", // 连接上部
        "KKKKKKKKK.",
        "IIIIIIIII.", // 白键顶部
        "KIIKIIKII.", // 黑键
        "KIIKIIKII.",
        "IIIIIIIII.", // 白键延伸 (长琴键)
        "IIIIIIIII.",
        "..kk...kk.", // 腿
        "..........",
        "..........",
    ],

    // === 装饰物 ===
    // [酒桶] 竖条纹木桶
    BARREL: [
        "..........",
        "..OOOOOO..", // 桶盖
        ".OddddddO.",
        ".OdOODOOO.", // 桶身带箍
        ".OdOODOOO.",
        ".OdOODOOO.",
        ".OdOODOOO.",
        ".OddddddO.",
        "..OOOOOO..",
        "..........",
    ],
    // [吧台酒水] 随机的瓶瓶罐罐
    DRINKS: [
        "..........",
        "..........",
        "....z.....", // 绿瓶
        "...z.x....", // 红瓶
        "...z.x.u..", // 啤酒杯
        "..z..x.u..", 
        "..........",
        "..........",
        "..........",
        "..........",
    ],
    // [盆栽] 阔叶绿植
    PLANT: [
        "..........",
        "....Ez....", // Leaves (Light Green E, Dark Green z)
        "...EzEz...",
        "..EzEzEz..",
        "..zEzEzE..",
        "...zEzE...",
        "....TT....", // Pot neck (Terra Cotta T)
        "...TTTT...", // Pot body
        "...TTTT...",
        "..........",
    ],
    
    // === 诗人之角 (Poet's Corner) ===
    // [书架] 摆满彩色书籍
    BOOKSHELF: [
        "OOOOOOOOOO",
        "O11332211O",
        "O11332211O",
        "OOOOOOOOOO",
        "O22113322O",
        "O22113322O",
        "OOOOOOOOOO",
        "O33221133O",
        "O33221133O",
        "OOOOOOOOOO",
    ],
    // [地毯] 波斯红地毯
    RUG: [
        "MMMMMMMMMM",
        "MmmmmmmmmM",
        "MmMMMMmMmM",
        "MmMMMMmMmM",
        "MmMMMMmMmM",
        "MmMMMMmMmM",
        "MmMMMMmMmM",
        "MmMMMMmMmM",
        "MmmmmmmmmM",
        "MMMMMMMMMM",
    ],
    // [落地灯] 复古阅读灯
    LAMP: [
        "..........",
        "...AAAA...", // 灯罩
        "..AAAAAA..",
        "..AAAAAA..",
        "...AAAA...",
        "....kk....", // 灯杆
        "....kk....",
        "....kk....",
        "....kk....",
        "...kkkk...", // 底座
    ],
    // [书桌] 带有纸笔的桌子
    WRITING_DESK: [
        "..........",
        ".ooooooo..",
        ".oWWQQoo..", // Paper and Quill
        ".oWW..oo..",
        ".ooooooo..",
        ".d.....d..",
        ".d.....d..",
        ".d.....d..",
        ".d.....d..",
        "..........",
    ],
    // [书堆] 地上的书
    BOOKS_PILE: [
        "..........",
        "..........",
        "....111...",
        "...2222...",
        "...2222...",
        "..333333..",
        "..333333..",
        ".11111111.",
        ".11111111.",
        "..........",
    ],
    // [舒适扶手椅]
    ARMCHAIR: [
        "..........",
        "..RRRRR...",
        ".RRRRRRR..",
        ".Rr...rR..", // Arms
        ".Rr...rR..",
        ".RrRRRrR..", // Seat
        ".RrRRRrR..",
        ".RrrrrrR..",
        "..k...k...",
        "..........",
    ],

    // [水平长桌左半部分] - 横向摆放时的左半部分
    LONG_TABLE_L: [
        "..........",
        "..oooooooo",
        ".ooooOOOOO",
        ".ooOOOOOOO",
        ".ooOOOOOOO",
        ".ooOOOOOOO",
        ".ooOOOOOOO",
        ".ooooOOOOO",
        "..oooooooo",
        "..........",
    ],

    // [水平长桌右半部分] - 横向摆放时的右半部分
    LONG_TABLE_R: [
        "..........",
        "oooooooo..",
        "OOOOOoooo.",
        "OOOOOOOoo.",
        "OOOOOOOoo.",
        "OOOOOOOoo.",
        "OOOOOOOoo.",
        "OOOOOoooo.",
        "oooooooo..",
        "..........",
    ],

    // [垂直长桌上半部分] - 纵向摆放时的上半部分
    LONG_TABLE_T: [
        "..........",
        "..oooooo..",
        ".ooooOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
    ],

    // [垂直长桌下半部分] - 纵向摆放时的下半部分
    LONG_TABLE_B: [
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooOOOOoo.",
        ".ooooOOoo.",
        "..oooooo..",
        "..........",
        "..........",
    ],

    // [小沙发] - 单人沙发，比大沙发更紧凑
    SMALL_SOFA: [
        "..........",
        "..RRRRRr..",
        ".RrRRRrR..",
        ".RrRRRrR..",
        ".RrRRRrR..",
        ".RrRRRrR..",
        ".RrrrrrR..",
        "..k...k...",
        "..........",
        "..........",
    ],
};

// === 3. 生成函数 (Generator Logic) ===
/**
 * 根据 Key 将字符矩阵转换为 HTMLImageElement
 * @param key SPRITES_DATA 的键名
 * @param scale 输出图片的像素尺寸 (默认 32px)
 */
export const generateSprite = (key: keyof typeof SPRITES_DATA, scale: number = 32): HTMLImageElement => {
    const data = SPRITES_DATA[key];
    const height = data.length;
    const width = data[0].length;
    
    // 创建离屏 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = scale;
    canvas.height = scale;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // 关键：禁用平滑处理，保持像素风格的锯齿感
        ctx.imageSmoothingEnabled = false;
        
        const pixelW = scale / width;
        const pixelH = scale / height;

        // 逐个像素绘制
        data.forEach((row, r) => {
            row.split('').forEach((char, c) => {
                ctx.fillStyle = PALETTE[char] || PALETTE['.'];
                ctx.fillRect(c * pixelW, r * pixelH, pixelW, pixelH);
            });
        });
    }

    // 转换为 Image 对象供游戏引擎使用
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
};