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
    'N': '#1e3a8a', // 音乐家深蓝 (Navy Blue)
    
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
    
    // -- 地砖颜色 --
    '4': '#677a99ff', // 地板深灰蓝 (Dark Slate)
    '5': '#8ea1baff', // 地板浅灰蓝 (Light Slate)
    
    // -- 装饰小物颜色 --
    'x': '#b91c1c', // 酒瓶红
    'z': '#15803d', // 酒瓶绿 (也用于深色叶子)
    'u': '#fef08a', // 啤酒黄
    'E': '#86efac', // 嫩绿 (Leaves Light)
    'T': '#92400e', // 陶土色 (Pot)
    
    // -- 花瓶花朵颜色 --
    'F1': '#ec4899', // 粉色花朵
    'F2': '#fbbf24', // 黄色花朵  
    'F3': '#3b82f6', // 蓝色花朵
    'F4': '#ef4444', // 红色花朵
    
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
    // [角色] 玩家：蓝色兜帽冒险者 (16x16)
    PLAYER: [
        "................",
        "................",
        "....BBBBBB......", // 兜帽顶
        "...B......B.....",
        "...B..##..B.....", // 眼睛
        "...B.S..S.B.....", // 脸部
        "...B.SSSS.B.....",
        "....BBBBBB......", // 披肩
        "...BBBBBBBB.....", // 身体
        "..B..BBBB..B....",
        "..B..B..B..B....",
        "..B..B..B..B....",
        "..B..B..B..B....",
        "..#..#..#..#....",
        "..#..#..#..#....",
        "................",
    ],
    // [角色] 调酒师：白色围裙 (16x16)
    BARTENDER: [
        "................",
        "................",
        "......hh........",
        "....hh##hh......",
        "...h..##..h.....", // 头发和眼睛
        "...h.S..S.h.....",
        "...h.SSSS.h.....",
        "....hSSSSSh.....",
        "....WWWWWW......", // 白衬衫
        "...WWWWWWWW.....",
        "...WWBWWBWW.....", // 白围裙蓝裤子
        "...WW.WW.WW.....",
        "...WW.WW.WW.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    // [角色] 服务员：黄色围裙 (16x16)
    WAITER: [
        "................",
        "................",
        "......hh........",
        "....hh##hh......",
        "...h..##..h.....", // 头发和眼睛
        "...h.S..S.h.....",
        "...h.SSSS.h.....",
        "....hSSSSSh.....",
        "....WWWWWW......", // 白衬衫
        "...WWWWWWWW.....",
        "...YYWWWWYY.....", // 黄围裙
        "...YY.YY.YY.....",
        "...YY.YY.YY.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    // [角色] 调酒师（圣诞版）：白色围裙 + 圣诞帽 (16x16)
    BARTENDER_XMAS: [
        "................",
        "......WW........", // 圣诞帽白色绒球
        "......WW........",
        "....xxxxxx......", // 圣诞帽红色尖顶
        "...xxxxxxxx.....", // 圣诞帽红色主体
        "...WWWWWWWW.....", // 圣诞帽白色帽檐
        "....S.##.S......", // 脸部和眼睛
        "....SSSSSS......",
        "....WWWWWW......", // 白衬衫
        "...WWWWWWWW.....",
        "...WWBWWBWW.....", // 白围裙蓝裤子
        "...WW.WW.WW.....",
        "...WW.WW.WW.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    // [角色] 服务员（圣诞版）：黄色围裙 + 圣诞帽 (16x16)
    WAITER_XMAS: [
        "................",
        "......WW........", // 圣诞帽白色绒球
        "......WW........",
        "....xxxxxx......", // 圣诞帽红色尖顶
        "...xxxxxxxx.....", // 圣诞帽红色主体
        "...WWWWWWWW.....", // 圣诞帽白色帽檐
        "....S.##.S......", // 脸部和眼睛
        "....SSSSSS......",
        "....WWWWWW......", // 白衬衫
        "...WWWWWWWW.....",
        "...YYWWWWYY.....", // 黄围裙
        "...YY.YY.YY.....",
        "...YY.YY.YY.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    // [角色] 诗人：贝雷帽，拿羽毛笔 (16x16)
    POET: [
        "................",
        "................",
        "....PPPPPP......", // 贝雷帽
        "...P......P.....",
        "...P..##..P.....", // 贝雷帽和眼睛
        "...P.S..S.P.....",
        "....PSSSSSP.....",
        "....PPPPPP......",
        "....PPPPPP......", // 紫色衣服
        "...PP.PP.PP..QQ.", // 羽毛笔
        "...PP.PP.PP..QQ.",
        "...PP.PP.PP.....",
        "...PP.PP.PP.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    // [角色] 顾客：普通村民 (16x16)
    CUSTOMER: [
        "................",
        "................",
        "......hh........",
        "....hh##hh......",
        "...h..##..h.....", // 头发和眼睛
        "...h.S..S.h.....",
        "...h.SSSS.h.....",
        "....hSSSSSh.....",
        "....GGGGGG......", // 绿色衣服
        "...GGGGGGGG.....",
        "...GG.GG.GG.....",
        "...GG.GG.GG.....",
        "...GG.GG.GG.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    
    // === 新版Q版卡通样本 - 大头短身，对称结构+不对称细节 ===
    
    // [男性样本] Q版男孩 - 头发在头顶，脸部露出
    CUSTOMER_MALE_SAMPLE: [
        "................",
        ".....HHHHH......", // 头顶头发
        "....HHHHHHHH....", // 头发层
        "...HHH###HHH....", // 刘海+边缘（不对称）
        "....SSSSSSS.....", // 额头（肤色）
        "....S.#.#.S.....", // 眼睛（对称）
        ".....SSSSS......", // 脸颊
        "......SSS.......", // 鼻子区域
        ".....S.S.S......", // 嘴巴
        "......SSS.......", // 下巴
        "......###.......", // 脖子
        "....C.CCC.C.....", // 短手臂（对称）
        "....CCCCCCC.....", // 身体
        "....CCCCCCC.....",
        ".....LL.LL......", // 短腿（对称）
        ".....##.##......", // 脚
    ],
    
    // [女性样本] Q版女孩 - 长发+发卡，脸部露出
    CUSTOMER_FEMALE_SAMPLE: [
        "................",
        "....xHHHHH......", // 头顶+红色发卡（不对称）
        "...xHHHHHHHH....", // 头发层
        "..HHH.###.HHH...", // 刘海+长发两侧
        "..H..SSSSS..H...", // 额头（肤色）+长发
        "..H..S.#.#.S.H..", // 眼睛（对称）+长发
        "..H...SSSSS..H..", // 脸颊+长发
        ".....S.SSS.S....", // 鼻子区域
        "......S.S.S.....", // 嘴巴
        "......SSSSS.....", // 下巴
        "......####......", // 脖子
        "....C.CCCC.C....", // 短手臂（对称）
        "....CCCCCCC.....", // 连衣裙
        "...CCCCCCCCC....", // 裙摆
        ".....LL.LL......", // 短腿（对称）
        ".....##.##......", // 脚
    ],

    // [角色] 音乐家：深蓝色燕尾服，戴礼帽 (16x16)
    MUSICIAN: [
        "................",
        "....######......", // 黑色礼帽顶
        "...########.....", // 礼帽主体
        "...#......#.....",
        "...#..##..#.....", // 礼帽和眼睛
        "...#.S..S.#.....",
        "....#SSSS#......",
        "....######......",
        "....NNNNNN......", // 深蓝色燕尾服
        "...NNNNNNNN.....",
        "...NN.NN.NN.....",
        "...NN.NN.NN.....",
        "...NN.NN.NN.....",
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    
    // [角色] 圣诞老人：红色衣服，白色胡须 (16x16)
    SANTA: [
        "................",
        "....xxxxxx......", // 红色帽子顶
        "...xxxxxxxx.....", // 红帽主体
        "...WWWWWWWW.....", // 白色帽沿
        "....S.##.S......", // 眼睛
        "....SSSSSS......", // 脸部
        "....SWWWWS......", // 白色胡须上端
        "...WWWWWWWW.....", // 白胡须
        "....xxxxxx......", // 红色上衣
        "...xxxxxxxx.....", // 红色身体
        "...xx.WW.xx.....", // 白色扣子
        "...xx.WW.xx.....",
        "...##.##.##.....", // 黑色裤子/鞋子
        "...##.##.##.....",
        "...##.##.##.....",
        "................",
    ],
    
    // [装饰] 驯鹿：棕色身体，红色鼻子 (16x16)
    REINDEER: [
        "................",
        "....d..d........", // 鹿角
        "...ddd.ddd......",
        "....dddd........", // 鹿角分支
        "....w.##.w......", // 眼睛和耳朵
        "....wwwww.......", // 头部
        "....wwxww.......", // 红鼻子
        "....wwwww.......",
        "....wwwwww......", // 身体
        "...wwwwwww......",
        "...ww.ww.ww.....", // 腿
        "...ww.ww.ww.....",
        "...ww.ww.ww.....",
        "...##.##.##.....", // 蹄子
        "...##.##.##.....",
        "................",
    ],
    
    // [装饰] 礼物堆：多个礼物堆叠 (16x16)
    GIFT_PILE: [
        "................",
        "................",
        "...F1F1.xx......", // 粉色和红色礼物
        "...F1.F1xx......",
        "...F1F1.xx......",
        "....ss..ss......", // 丝带
        "..xx..F3F3......", // 红色和蓝色礼物
        "..xx..F3F3......",
        "..xx..F3F3......",
        "..ss..ss........", // 丝带
        ".F2F2..xx.......", // 黄色和红色礼物
        ".F2F2..xx.......",
        ".F2F2..xx.......",
        "..ss...ss.......",
        "................",
        "................",
    ],
    
    // [角色] 三花猫：侧视图，白色、橙色、黑色 (16x16画布，实际14x5像素)
    CAT: [
        "................",
        "................",
        "................",
        "................",
        "................",
        ".d.WWWW....kkk..", // 橙耳.更大的白头...黑尾巴
        ".W#WWWddddkk....", // 白头+眼.橙色身体.黑尾
        "..WWWddddd......", // 头+橙色身体斑块
        "...d.W.d.W......", // 橙色前腿.白后腿
        "...d.W.d.W......", // 橙色前腿.白后腿落地
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    
    // [环境] 地砖 A (深色地砖 - 纯色)
    FLOOR_A: [
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
        "4444444444",
    ],
    // [环境] 地砖 B (浅色地砖 - 纯色)
    FLOOR_B: [
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
        "5555555555",
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
        "..........",
        "...RrRr...",
        "...rrrr...",
        "....kk....",
        "....kk....",
        "....kk....",
        "....kk....",
        "..........",
        "..........",
    ],

    // === 节日装饰（大号圣诞树 3x6） ===
    // R1左（行0-9）
    CHRISTMAS_TREE_TL: [
        "..........",  // 行0：星星
        "..........",  // 行1：星星
        "..........",  // 行2：星星
        "..........",  // 行3：星星
        "..........",  // 行4：星星
        "..........",  // 行5：星星
        "..........",  // 行6-8：第1组 2列宽（列14-15，不在左格）
        "..........",
        "..........",
        "..........",  // 行9：第2组 4列宽（列13-16，不在左格）
    ],
    // R1中（行0-9）
    CHRISTMAS_TREE_TM: [
        "..........",  // 行0：星星顶部
        "....ss....",  // 行1：星星 ◇
        "...ssss...",  // 行2：星星
        "..ssssss..",  // 行3：星星
        "...ssss...",  // 行4：星星
        "....ss....",  // 行5：星星
        "....zz....",  // 行6-8：第1组 2列宽（列14-15）
        "....zz....",
        "....zz....",
        "...zzzz...",  // 行9：第2组 4列宽（列13-16）
    ],
    // R1右（行0-9）
    CHRISTMAS_TREE_TR: [
        "..........",  // 行0：星星
        "..........",  // 行1：星星
        "..........",  // 行2：星星
        "..........",  // 行3：星星
        "..........",  // 行4：星星
        "..........",  // 行5：星星
        "..........",  // 行6-8：第1组
        "..........",
        "..........",
        "..........",  // 行9：第2组
    ],
    // R2左（行10-19 = sprite行0-9）
    CHRISTMAS_TREE_R2L: [
        "..........",  // 行0-1：第2组 4列宽（列13-16）
        "..........",
        "..........",  // 行2-4：第3组 6列宽（列12-17）
        "..........",
        "..........",
        "..........",  // 行5-7：第4组 8列宽（列11-18）
        "..........",
        "..........",
        "..........",  // 行8-9：第5组 10列宽（列10-19）
        "..........",
    ],
    // R2中（行10-19 = sprite行0-9）
    CHRISTMAS_TREE_R2M: [
        "...zzzz...",  // 行0-1：第2组 4列宽（列13-16）
        "...zzzz...",
        "..zzzzzz..",  // 行2-4：第3组 6列宽（列12-17）
        "..zzrzzz..",  // 添加1个红色彩球
        "..zzzzzz..",
        ".zzzzzzzz.",  // 行5-7：第4组 8列宽（列11-18）
        ".zzzzzzzz.",
        ".zzzzzszz.",  // 添加1个金色彩球
        "zzzzzzzzzz",  // 行8-9：第5组 10列宽（列10-19）
        "zzzzzzzzzz",
    ],
    // R2右（行10-19 = sprite行0-9）
    CHRISTMAS_TREE_R2R: [
        "..........",  // 行0-1：第2组
        "..........",
        "..........",  // 行2-4：第3组
        "..........",
        "..........",
        "..........",  // 行5-7：第4组
        "..........",
        "..........",
        "..........",  // 行8-9：第5组
        "..........",
    ],
    // R3左（行20-29 = sprite行0-9）
    CHRISTMAS_TREE_ML: [
        "..........",  // 行0：第5组 10列宽（列10-19）
        ".........z",  // 行1-3：第6组 12列宽（列9-20）
        ".........z",
        ".........z",
        "........zz",  // 行4-6：第7组 14列宽（列8-21）
        "........zz",
        "........zz",
        ".......zzz",  // 行7-9：第8组 16列宽（列7-22）
        ".......zzz",
        ".......zzz",
    ],
    // R3中（行20-29 = sprite行0-9）
    CHRISTMAS_TREE_MM: [
        "zzzzzzzzzz",  // 行0：第5组 10列宽（列10-19）
        "zzzzzzzzzz",  // 行1-3：第6组 12列宽（列9-20）
        "zzzrzzzzzz",  // 添加1个红色彩球
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行4-6：第7组 14列宽（列8-21）
        "zzzzzzzzzz",
        "zzzzzszzzz",  // 添加1个金色彩球
        "zzzzzzzzzz",  // 行7-9：第8组 16列宽（列7-22）
        "zzzzzzzzzz",
        "zzzzzzzzzz",
    ],
    // R3右（行20-29 = sprite行0-9）
    CHRISTMAS_TREE_MR: [
        "..........",  // 行0：第5组
        "z.........",  // 行1-3：第6组 12列宽（列9-20）
        "z.........",
        "z.........",
        "zz........",  // 行4-6：第7组 14列宽（列8-21）
        "zz........",
        "zz........",
        "zzz.......",  // 行7-9：第8组 16列宽（列7-22）
        "zzz.......",
        "zzz.......",
    ],
    // R4左（行30-39 = sprite行0-9）
    CHRISTMAS_TREE_R4L: [
        "......zzzz",  // 行0-2：第9组 18列宽（列6-23）
        "......zzzz",
        "......zzzz",
        ".....zzzzz",  // 行3-5：第10组 20列宽（列5-24）
        ".....zzzzz",
        ".....zzzzz",
        "....zzzzzz",  // 行6-8：第11组 22列宽（列4-25）
        "....zzzzzz",
        "....zzzzzz",
        "...zzzzzzz",  // 行9：第12组 24列宽（列3-26）
    ],
    // R4中（行30-39 = sprite行0-9）
    CHRISTMAS_TREE_R4M: [
        "zzzzzzzzzz",  // 行0-2：第9组 18列宽（列6-23）
        "zzzrzzzzzz",  // 添加1个红色彩球
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行3-5：第10组 20列宽（列5-24）
        "zzzzzzzzzz",
        "zzzzzszzzz",  // 添加1个金色彩球
        "zzzzzzzzzz",  // 行6-8：第11组 22列宽（列4-25）
        "zzzzzzzzzz",
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行9：第12组 24列宽（列3-26）
    ],
    // R4右（行30-39 = sprite行0-9）
    CHRISTMAS_TREE_R4R: [
        "zzzz......",  // 行0-2：第9组 18列宽（列6-23）
        "zzzz......",
        "zzzz......",
        "zzzzz.....",  // 行3-5：第10组 20列宽（列5-24）
        "zzzzz.....",
        "zzzzz.....",
        "zzzzzz....",  // 行6-8：第11组 22列宽（列4-25）
        "zzzzzz....",
        "zzzzzz....",
        "zzzzzzz...",  // 行9：第12组 24列宽（列3-26）
    ],
    // R5左（行40-49 = sprite行0-9）
    CHRISTMAS_TREE_R5L: [
        "...zzzzzzz",  // 行0-1：第12组 24列宽（列3-26）
        "...zzzzzzz",
        "..zzzzzzzz",  // 行2-4：第13组 26列宽（列2-27）
        "..zzzzzzzz",
        "..zzzzzzzz",
        ".zzzzzzzzz",  // 行5-7：第14组 28列宽（列1-28）
        ".zzzzzzzzz",
        ".zzzzzzzzz",
        "zzzzzzzzzz",  // 行8-9：第15组 30列宽（列0-29）
        "zzzzzzzzzz",
    ],
    // R5中（行40-49 = sprite行0-9）
    CHRISTMAS_TREE_R5M: [
        "zzzzzzzzzz",  // 行0-1：第12组 24列宽（列3-26）
        "zzzzzzzzzz",
        "zzzrzzzzzz",  // 行2-4：第13组 26列宽（列2-27）添加彩球
        "zzzzzzzzzz",
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行5-7：第14组 28列宽（列1-28）
        "zzzzzszzzz",  // 添加1个金色彩球
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行8-9：第15组 30列宽（列0-29）
        "zzzzzzzzzz",
    ],
    // R5右（行40-49 = sprite行0-9）
    CHRISTMAS_TREE_R5R: [
        "zzzzzzz...",  // 行0-1：第12组 24列宽（列3-26）
        "zzzzzzz...",
        "zzzzzzzz..",  // 行2-4：第13组 26列宽（列2-27）
        "zzzzzzzz..",
        "zzzzzzzz..",
        "zzzzzzzzz.",  // 行5-7：第14组 28列宽（列1-28）
        "zzzzzzzzz.",
        "zzzzzzzzz.",
        "zzzzzzzzzz",  // 行8-9：第15组 30列宽（列0-29）
        "zzzzzzzzzz",
    ],
    // R6左（行50-59 = sprite行0-9）
    CHRISTMAS_TREE_BL: [
        "zzzzzzzzzz",  // 行0：第15组 30列宽（列0-29）
        "zzzzzzzzzz",  // 行1-3：第16组 30列宽
        "zzzzzzzzzz",
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行4-6：第17组 30列宽
        "..........",
        "..........",
        "..........",  // 行7-9：树干 6列宽（列12-17）
        "..........",
        "..........",
    ],
    // R6中（行50-59 = sprite行0-9）
    CHRISTMAS_TREE_BM: [
        "zzzzzzzzzz",  // 行0：第15组 30列宽
        "zzzzzzzzzz",  // 行1-3：第16组 30列宽
        "zzzzzzzzzz",
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行4-6：第17组 30列宽
        "..TTTTTT..",
        "..TTTTTT..",
        "..TTTTTT..",  // 行7-9：树干 6列宽（列12-17）
        "..TTTTTT..",
        "..TTTTTT..",
    ],
    // R6右（行50-59 = sprite行0-9）
    CHRISTMAS_TREE_BR: [
        "zzzzzzzzzz",  // 行0：第15组 30列宽
        "zzzzzzzzzz",  // 行1-3：第16组 30列宽
        "zzzzzzzzzz",
        "zzzzzzzzzz",
        "zzzzzzzzzz",  // 行4-6：第17组 30列宽
        "..........",
        "..........",
        "..........",  // 行7-9：树干
        "..........",
        "..........",
    ],
    GIFT: [
        "..........",
        "..rrRR....",
        "..r#rR....",
        "..rrRR....",
        "....kk....",
        "....kk....",
        "..........",
        "..........",
        "..........",
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
    // [圣诞彩灯] 墙壁装饰彩灯串
    XMAS_LIGHT: [
        "..........",
        "....#.....", // 电线
        "...#.#....",
        "..x.s.u...", // 彩色灯泡：红、金、黄
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
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

    // === 花瓶装饰 ===
    // [花瓶A] - 粉色花朵，小巧设计
    VASE_A: [
        "..........",
        "..........",
        "..........",
        "....F1....",
        "...F1E....",
        "....TT....",
        "....TT....",
        "...TTT....",
        "..........",
        "..........",
    ],

    // [花瓶B] - 黄色花朵，圆形花瓶
    VASE_B: [
        "..........",
        "..........",
        "..........",
        "...F2F2...",
        "....E.....",
        "...TTT....",
        "..TTTTT...",
        "...TTT....",
        "..........",
        "..........",
    ],

    // [花瓶C] - 蓝色和红色花朵，方形花瓶
    VASE_C: [
        "..........",
        "..........",
        "..........",
        "..F3.F4...",
        "...EEE....",
        "..TTTTT...",
        "..TTTTT...",
        "..TTTTT...",
        "..........",
        "..........",
    ],

    // === 卫生间相关 ===
    // [卫生间门] - 简单的门框
    RESTROOM_DOOR: [
        "VVVVVVVVVV",
        "V........V",
        "V........V",
        "V........V",
        "V........V",
        "V........V",
        "V........V",
        "V........V",
        "V........V",
        "VVVVVVVVVV",
    ],

    // [男性标识] - 简化的男性图标（蓝色）
    MALE_SIGN: [
        "VVVVVVVVVV",
        "V....B...V",
        "V...BBB..V",
        "V....B...V",
        "V....B...V",
        "V...B.B..V",
        "V..B...B.V",
        "V..B...B.V",
        "V........V",
        "VVVVVVVVVV",
    ],

    // [女性标识] - 简化的女性图标（粉色）
    FEMALE_SIGN: [
        "VVVVVVVVVV",
        "V....F1..V",
        "V...F1F1.V",
        "V....F1..V",
        "V..F1F1F1V",
        "V..F1.F1.V",
        "V....F1..V",
        "V....F1..V",
        "V........V",
        "VVVVVVVVVV",
    ],
};

// === 3. 生成函数 (Generator Logic) ===
/**
 * 根据 Key 将字符矩阵转换为 HTMLImageElement
 * @param key SPRITES_DATA 的键名
 * @param scale 输出图片的像素尺寸 (默认 32px)
 * @param customPalette 自定义调色板（可选），用于覆盖默认PALETTE中的颜色
 */
export const generateSprite = (
    key: keyof typeof SPRITES_DATA, 
    scale: number = 32,
    customPalette?: Record<string, string>
): HTMLImageElement => {
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

        // 合并默认调色板和自定义调色板
        const palette = customPalette ? { ...PALETTE, ...customPalette } : PALETTE;

        // 逐个像素绘制 - 确保没有间隙
        data.forEach((row, r) => {
            row.split('').forEach((char, c) => {
                const color = palette[char] || palette['.'];
                if (color !== 'rgba(0,0,0,0)') { // 只绘制非透明像素
                    ctx.fillStyle = color;
                    // 使用Math.floor确保像素对齐，并稍微扩大以避免间隙
                    const x = Math.floor(c * pixelW);
                    const y = Math.floor(r * pixelH);
                    const w = Math.ceil(pixelW) + 1;
                    const h = Math.ceil(pixelH) + 1;
                    ctx.fillRect(x, y, w, h);
                }
            });
        });
    }

    // 转换为 Image 对象供游戏引擎使用
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
};