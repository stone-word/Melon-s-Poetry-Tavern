/**
 * ==============================================================================
 * 地图生成器 (Map Generator)
 * ==============================================================================
 * 负责生成游戏地图的家具布局和障碍物
 */

import { ROWS, COLS } from '../types';
import { FurnitureItem, MapData } from './types';
import metadata from '../metadata.json';



export class MapGenerator {
    /**
     * 生成完整的地图数据
     */
    static generateMap(): MapData {
        const items: FurnitureItem[] = [];
        const obs = new Set<string>(); // 静态障碍物

        // 吧台位置常量
        const BAR_COL_START = 43; 
        const BAR_COL_END = 45;              
        const BAR_ROW_START = 13;
        const BAR_ROW_END = 19;

        // A. 吧台高脚凳
        const stoolRows = [14, 15, 17, 18];
        stoolRows.forEach(r => {
            items.push({ type: 'STOOL', c: 42, r });
        });

        // B. 钢琴 (2x2 格子)
        const PIANO_COL = 17.5; 
        const PIANO_ROW = 21.5;

        items.push({ type: 'PIANO_TL', c: PIANO_COL, r: PIANO_ROW });
        items.push({ type: 'PIANO_TR', c: PIANO_COL + 1, r: PIANO_ROW });
        obs.add(`${PIANO_COL},${PIANO_ROW}`);
        obs.add(`${PIANO_COL + 1},${PIANO_ROW}`);

        items.push({ type: 'PIANO_BL', c: PIANO_COL, r: PIANO_ROW + 1 });
        items.push({ type: 'PIANO_BR', c: PIANO_COL + 1, r: PIANO_ROW + 1 });
        obs.add(`${PIANO_COL},${PIANO_ROW + 1}`);
        obs.add(`${PIANO_COL + 1},${PIANO_ROW + 1}`);

        // C. 吧台装饰
        const BARREL_COL = 46;
        items.push({ type: 'BARREL', c: BARREL_COL, r: 13 });
        items.push({ type: 'BARREL', c: BARREL_COL, r: 14 });
        items.push({ type: 'BARREL', c: BARREL_COL, r: 18 });
        items.push({ type: 'BARREL', c: BARREL_COL, r: 19 });

        items.push({ type: 'DRINKS', c: 43, r: 14 });
        items.push({ type: 'DRINKS', c: 44, r: 17 });

        // D. 绿植装饰
        const corners = [
            {c: 1, r: 1}, {c: 46, r: 1},
            {c: 1, r: 30}, {c: 46, r: 30}
        ];
        const danceFloorCorners = [
            {c: 15, r: 8}, {c: 32, r: 8},
            {c: 15, r: 24}, {c: 32, r: 24}
        ];
        
        [...corners, ...danceFloorCorners].forEach(pos => {
            items.push({ type: 'PLANT', c: pos.c, r: pos.r });
            obs.add(`${pos.c},${pos.r}`);
        });

        // E. 卡座生成
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
                
                obs.add(`${tc},${tr}`);
            }
        };

        // 左墙卡座
        addBooth(1, 9, 3, 'V');
        addBooth(1, 13, 3, 'V');
        addBooth(1, 18, 3, 'V');
        addBooth(1, 24, 3, 'V');

        // 上墙卡座
        addBooth(2, 1, 3, 'H');
        addBooth(7, 1, 2, 'H');
        addBooth(11, 1, 3, 'H');
        addBooth(16, 1, 3, 'H');
        addBooth(21, 1, 2, 'H');
        addBooth(25, 1, 3, 'H');
        addBooth(30, 1, 3, 'H');
        addBooth(35, 1, 2, 'H');

        // 下墙卡座
        const bottomSofaRow = ROWS - 2;
        addBooth(2, bottomSofaRow, 3, 'H');
        addBooth(7, bottomSofaRow, 2, 'H');
        addBooth(11, bottomSofaRow, 3, 'H');
        addBooth(16, bottomSofaRow, 3, 'H');
        addBooth(21, bottomSofaRow, 2, 'H');
        addBooth(25, bottomSofaRow, 3, 'H');
        addBooth(30, bottomSofaRow, 3, 'H');
        addBooth(35, bottomSofaRow, 2, 'H');

        // F. 诗人之角
        for(let r = 26; r <= 29; r++) {
            for(let c = 43; c <= 45; c++) {
                items.push({ type: 'RUG', c, r });
            }
        }
        
        const BOOKSHELF_COL = 46;
        [25, 26, 27, 28].forEach(r => {
             items.push({ type: 'BOOKSHELF', c: BOOKSHELF_COL, r });
             obs.add(`${BOOKSHELF_COL},${r}`);
        });
        
        items.push({ type: 'WRITING_DESK', c: 45, r: 26 });
        obs.add(`45,26`);
        items.push({ type: 'ARMCHAIR', c: 44, r: 26 });
        obs.add(`44,26`);
        items.push({ type: 'LAMP', c: 46, r: 29 });
        obs.add(`46,29`);
        items.push({ type: 'BOOKS_PILE', c: 43, r: 28 });
        items.push({ type: 'BOOKS_PILE', c: 45, r: 28 });

        // G. 休闲散座区
        const roundTableSets = [
            { c: 8, r: 10 }, { c: 12, r: 9 }, { c: 11, r: 13 },
            { c: 6, r: 14 }, { c: 10, r: 16 }, { c: 13, r: 18 },
            { c: 7, r: 20 }, { c: 11, r: 22 }, { c: 9, r: 25 }
        ];

        roundTableSets.forEach(pos => {
            items.push({ type: 'ROUND_TABLE', c: pos.c, r: pos.r });
            obs.add(`${pos.c},${pos.r}`);
            items.push({ type: 'WOODEN_STOOL', c: pos.c - 1, r: pos.r });
            items.push({ type: 'WOODEN_STOOL', c: pos.c + 1, r: pos.r });
        });

        // H. 长桌组合区
        const longTableSets = [
            { c: 39, r: 9, orient: 'H' }, { c: 33, r: 10, orient: 'H' },
            { c: 36, r: 13, orient: 'V' }, { c: 33, r: 16, orient: 'H' },
            { c: 38, r: 18, orient: 'V' }, { c: 36, r: 23, orient: 'H' }
        ];

        longTableSets.forEach(set => {
            if (set.orient === 'H') {
                items.push({ type: 'LONG_TABLE_L', c: set.c, r: set.r });
                items.push({ type: 'LONG_TABLE_R', c: set.c + 1, r: set.r });
                obs.add(`${set.c},${set.r}`);
                obs.add(`${set.c + 1},${set.r}`);
                
                items.push({ type: 'CHAIR', c: set.c, r: set.r - 1 });
                items.push({ type: 'CHAIR', c: set.c + 1, r: set.r - 1 });
                items.push({ type: 'CHAIR', c: set.c, r: set.r + 1 });
                items.push({ type: 'CHAIR', c: set.c + 1, r: set.r + 1 });
            } else {
                items.push({ type: 'LONG_TABLE_T', c: set.c, r: set.r });
                items.push({ type: 'LONG_TABLE_B', c: set.c, r: set.r + 1 });
                obs.add(`${set.c},${set.r}`);
                obs.add(`${set.c},${set.r + 1}`);
                
                items.push({ type: 'CHAIR', c: set.c - 1, r: set.r });
                items.push({ type: 'CHAIR', c: set.c - 1, r: set.r + 1 });
                items.push({ type: 'CHAIR', c: set.c + 1, r: set.r });
                items.push({ type: 'CHAIR', c: set.c + 1, r: set.r + 1 });
            }
        });

        // I. 沙发座组合区
        const sofaLoungeSet = [
            { c: 18, r: 5, arrangement: 'L_SHAPE' },
            { c: 32, r: 6, arrangement: 'FACING' },
            { c: 22, r: 26, arrangement: 'FACING' },
            { c: 31, r: 23, arrangement: 'L_SHAPE' }
        ];

        sofaLoungeSet.forEach(set => {
            if (set.arrangement === 'L_SHAPE') {
                items.push({ type: 'ROUND_TABLE', c: set.c, r: set.r });
                obs.add(`${set.c},${set.r}`);
                items.push({ type: 'SMALL_SOFA', c: set.c + 1, r: set.r });
                items.push({ type: 'SMALL_SOFA', c: set.c, r: set.r + 1 });
            } else {
                items.push({ type: 'ROUND_TABLE', c: set.c, r: set.r });
                obs.add(`${set.c},${set.r}`);
                items.push({ type: 'SMALL_SOFA', c: set.c - 1, r: set.r });
                items.push({ type: 'SMALL_SOFA', c: set.c + 1, r: set.r });
            }
        });

        // J. 花瓶装饰
        const allTables = items.filter(item => 
            item.type === 'ROUND_TABLE' || 
            item.type.includes('TABLE') || 
            item.type === 'TABLE'
        );
        
        const usedTablePositions = new Set<string>();
        allTables.forEach(table => {
            const posKey = `${table.c},${table.r}`;
            if (!usedTablePositions.has(posKey) && Math.random() < 0.3) {
                const vaseTypes = ['VASE_A', 'VASE_B', 'VASE_C'] as const;
                const randomVase = vaseTypes[Math.floor(Math.random() * vaseTypes.length)];
                items.push({ type: randomVase, c: table.c, r: table.r });
                usedTablePositions.add(posKey);
            }
        });

        // 节日：圣诞装饰（由 metadata 控制）
        if (metadata && metadata.features && metadata.features.christmas) {
            // 放置大号圣诞树（占 3 列 x 6 行 = 18 格）在舞池右下方空地
            const baseC = 26, baseR = 19; // top-left of 3x6 tree
            // R1
            items.push({ type: 'CHRISTMAS_TREE_TL', c: baseC, r: baseR });
            items.push({ type: 'CHRISTMAS_TREE_TM', c: baseC + 1, r: baseR });
            items.push({ type: 'CHRISTMAS_TREE_TR', c: baseC + 2, r: baseR });
            // R2
            items.push({ type: 'CHRISTMAS_TREE_R2L', c: baseC, r: baseR + 1 });
            items.push({ type: 'CHRISTMAS_TREE_R2M', c: baseC + 1, r: baseR + 1 });
            items.push({ type: 'CHRISTMAS_TREE_R2R', c: baseC + 2, r: baseR + 1 });
            // R3 (ML/MM/MR)
            items.push({ type: 'CHRISTMAS_TREE_ML', c: baseC, r: baseR + 2 });
            items.push({ type: 'CHRISTMAS_TREE_MM', c: baseC + 1, r: baseR + 2 });
            items.push({ type: 'CHRISTMAS_TREE_MR', c: baseC + 2, r: baseR + 2 });
            // R4
            items.push({ type: 'CHRISTMAS_TREE_R4L', c: baseC, r: baseR + 3 });
            items.push({ type: 'CHRISTMAS_TREE_R4M', c: baseC + 1, r: baseR + 3 });
            items.push({ type: 'CHRISTMAS_TREE_R4R', c: baseC + 2, r: baseR + 3 });
            // R5
            items.push({ type: 'CHRISTMAS_TREE_R5L', c: baseC, r: baseR + 4 });
            items.push({ type: 'CHRISTMAS_TREE_R5M', c: baseC + 1, r: baseR + 4 });
            items.push({ type: 'CHRISTMAS_TREE_R5R', c: baseC + 2, r: baseR + 4 });
            // R6 (BL/BM/BR)
            items.push({ type: 'CHRISTMAS_TREE_BL', c: baseC, r: baseR + 5 });
            items.push({ type: 'CHRISTMAS_TREE_BM', c: baseC + 1, r: baseR + 5 });
            items.push({ type: 'CHRISTMAS_TREE_BR', c: baseC + 2, r: baseR + 5 });
            // 只将树干底部（BM位置）标记为障碍物，树冠可以穿过
            obs.add(`${baseC + 1},${baseR + 5}`);

            // 在树旁放几份礼物（不一定全部阻挡）
            const gifts = [ {c: baseC - 0.8, r: baseR + 5.2}, {c: baseC + 3, r: baseR + 5}, {c: baseC + 1.8, r: baseR + 5.8} ];
            gifts.forEach(g => {
                items.push({ type: 'GIFT', c: g.c, r: g.r });
                obs.add(`${g.c},${g.r}`);
            });
            
            // 在圣诞树右侧添加驯鹿和礼物堆
            items.push({ type: 'REINDEER', c: baseC + 1.2, r: baseR + 6.5 });
            obs.add(`${baseC + 1.2},${baseR + 6.5}`);
            
            items.push({ type: 'GIFT_PILE', c: baseC + 2, r: baseR + 6.5 });
            obs.add(`${baseC + 2},${baseR + 6.5}`);
        }

        // J. 圣诞彩灯串（沿墙壁装饰）
        if (metadata.season === 'christmas' && metadata.features?.christmasLights) {
            // 上墙 - 每隔2格放一个彩灯
            for (let c = 4; c < COLS - 4; c += 3) {
                items.push({ type: 'XMAS_LIGHT', c, r: 1 });
            }
            // 下墙 - 每隔2格放一个彩灯
            for (let c = 4; c < COLS - 4; c += 3) {
                items.push({ type: 'XMAS_LIGHT', c, r: ROWS - 2 });
            }
            // 左墙 - 每隔2格放一个彩灯（避开门）
            for (let r = 4; r < ROWS - 4; r += 3) {
                if (r < 6 || r > 8) { // 避开门的位置
                    items.push({ type: 'XMAS_LIGHT', c: 1, r });
                }
            }
            // 右墙 - 每隔2格放一个彩灯（避开门）
            for (let r = 4; r < ROWS - 4; r += 3) {
                if (r < 6 || r > 8) { // 避开门的位置
                    items.push({ type: 'XMAS_LIGHT', c: COLS - 2, r });
                }
            }
        }

        // K. 卫生间入口 (开放式门口，无门和标识)

        // L. 添加墙体作为静态障碍物
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const isEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
                
                // 门的位置定义（与Renderer保持一致）
                const DOOR_ROW_START = 6;
                const DOOR_ROW_END = 7;
                const isLeftDoor = c === 0 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                const isRightDoor = c === COLS - 1 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                const isRestroomDoor = c === 0 && r === 22;
                
                // 墙体位置添加到静态障碍物
                if (isEdge && !isLeftDoor && !isRightDoor && !isRestroomDoor) {
                    obs.add(`${c},${r}`);
                }
            }
        }

        // M. 添加吧台区域作为静态障碍物
        for (let r = BAR_ROW_START; r <= BAR_ROW_END; r++) {
            for (let c = BAR_COL_START; c <= BAR_COL_END; c++) {
                // 吧台最右列的中间部分不是障碍物（服务员可以进入）
                if (c === BAR_COL_END && r > BAR_ROW_START && r < BAR_ROW_END) {
                    continue;
                }
                obs.add(`${c},${r}`);
            }
        }

        return { furnitureItems: items, staticObstacles: obs };
    }
}