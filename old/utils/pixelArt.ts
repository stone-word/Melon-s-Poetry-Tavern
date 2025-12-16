// 调色板映射
const PALETTE: Record<string, string> = {
    '.': 'rgba(0,0,0,0)', // 透明
    '#': '#0f172a', // 轮廓黑 (Very Dark Slate)
    
    // 环境色
    'V': '#1e3a8a', // 墙壁深蓝 (Dark Blue)
    'v': '#172554', // 墙壁阴影
    'D': '#1e293b', // 地板深灰蓝 (Dark Slate)
    'L': '#334155', // 地板浅灰蓝 (Light Slate)
    
    // 角色通用
    'S': '#fbd38d', // 皮肤 (Skin)
    'h': '#713f12', // 头发 (Brown)
    
    // 衣服颜色
    'B': '#2563eb', // 玩家兜帽蓝 (Blue)
    'W': '#f1f5f9', // 白 (围裙/衬衫)
    'Y': '#eab308', // 服务员黄 (Yellow)
    'G': '#16a34a', // 顾客绿
    'P': '#7c3aed', // 诗人紫/贝雷帽
    'Q': '#fecaca', // 羽毛笔 (Quill - Pinkish White)
    'R': '#dc2626', // 红 (点缀)
};

// 像素图数据 (10x10 网格)
const SPRITES_DATA = {
    // 玩家：蓝色兜帽冒险者
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
    // 调酒师：白色围裙
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
    // 服务员：黄色围裙
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
    // 诗人：贝雷帽，拿羽毛笔
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
    // 顾客：普通村民
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
    // 地板 A (深灰蓝)
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
    // 地板 B (浅灰蓝 - 做棋盘格效果)
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
    // 墙壁 (纯深蓝实心色)
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
    ]
};

// 将字符画转换为 HTMLImageElement
export const generateSprite = (key: keyof typeof SPRITES_DATA, scale: number = 32): HTMLImageElement => {
    const data = SPRITES_DATA[key];
    const height = data.length;
    const width = data[0].length;
    
    const canvas = document.createElement('canvas');
    canvas.width = scale;
    canvas.height = scale;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // 禁用平滑处理以保持像素风格
        ctx.imageSmoothingEnabled = false;
        
        const pixelW = scale / width;
        const pixelH = scale / height;

        data.forEach((row, r) => {
            row.split('').forEach((char, c) => {
                ctx.fillStyle = PALETTE[char] || PALETTE['.'];
                ctx.fillRect(c * pixelW, r * pixelH, pixelW, pixelH);
            });
        });
    }

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
};