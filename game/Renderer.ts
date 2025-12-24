/**
 * ==============================================================================
 * 渲染引擎 (Rendering Engine)
 * ==============================================================================
 * 处理游戏的所有渲染逻辑，包括地图、角色、UI和特效
 */

import { 
    Agent, 
    Role, 
    CustomerState, 
    WaiterState, 
    BartenderState, 
    CleanerState, 
    PoetState,
    MusicianState,
    TILE_SIZE, 
    COLS, 
    ROWS,
    BAR_COL_START,
    BAR_COL_END,
    BAR_ROW_START,
    BAR_ROW_END
} from '../types';
import { FurnitureItem, RippleEffect } from './types';

export class Renderer {
    private sprites: Record<string, HTMLImageElement>;
    private furnitureItems: FurnitureItem[];
    private staticObstacles: Set<string>;

    constructor(
        sprites: Record<string, HTMLImageElement>, 
        furnitureItems: FurnitureItem[], 
        staticObstacles: Set<string>
    ) {
        this.sprites = sprites;
        this.furnitureItems = furnitureItems;
        this.staticObstacles = staticObstacles;
    }

    /**
     * 渲染地图和家具
     */
    renderMap = (ctx: CanvasRenderingContext2D, currentTime?: number): void => {
        // A. 绘制地板和墙壁
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                // 门的位置定义
                const DOOR_ROW_START = 6;
                const DOOR_ROW_END = 7;
                const isLeftDoor = c === 0 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                const isRightDoor = c === COLS - 1 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
                const isRestroomDoor = c === 0 && r === 22;
                const isEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;

                // 墙壁渲染 - 最外圈是墙，但留出门的空间
                if (isEdge && !isLeftDoor && !isRightDoor && !isRestroomDoor) {
                    const wallSprite = this.sprites['WALL'];
                    if (wallSprite) {
                        ctx.drawImage(wallSprite, x, y);
                    }
                    continue;
                }

                // 吧台区域特殊处理
                if (c >= BAR_COL_START && c <= BAR_COL_END && r >= BAR_ROW_START && r <= BAR_ROW_END) {
                    // 吧台最右列的中间部分挖空，显示为地板
                    if (c === BAR_COL_END && r > BAR_ROW_START && r < BAR_ROW_END) {
                        const floorType = (c + r) % 2 === 0 ? 'FLOOR_A' : 'FLOOR_B';
                        const floorSprite = this.sprites[floorType];
                        if (floorSprite) {
                            ctx.drawImage(floorSprite, x, y);
                        }
                        continue;
                    }

                    let sprite = null;
                    if (c === BAR_COL_START) {
                        if (r === BAR_ROW_START) sprite = this.sprites['BAR_L_TOP'];
                        else if (r === BAR_ROW_END) sprite = this.sprites['BAR_L_BTM'];
                        else sprite = this.sprites['BAR_L_MID'];
                    } else {
                        if (r === BAR_ROW_START) sprite = this.sprites['BAR_M_TOP'];
                        else if (r === BAR_ROW_END) sprite = this.sprites['BAR_M_BTM'];
                        else sprite = this.sprites['BAR_M_MID'];
                    }
                    
                    if (sprite) {
                        ctx.drawImage(sprite, x, y);
                    }
                } else {
                    // 普通地板 - 使用棋盘格地砖效果
                    const floorType = (c + r) % 2 === 0 ? 'FLOOR_A' : 'FLOOR_B';
                    const floorSprite = this.sprites[floorType];
                    if (floorSprite) {
                        ctx.drawImage(floorSprite, x, y);
                    }
                }
            }
        }

        // B. 绘制圆形舞池
        const centerX = (COLS * TILE_SIZE) / 2;
        const centerY = (ROWS * TILE_SIZE) / 2;
        const radiusInner = 5.5 * TILE_SIZE;
        const radiusOuter = 7 * TILE_SIZE;

        // 红色外圈
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusOuter, 0, Math.PI * 2);
        ctx.fillStyle = '#700b0bff';
        ctx.fill();

        // 白色内芯
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusInner, 0, Math.PI * 2);
        ctx.fillStyle = '#c2cedaff';
        ctx.fill();

        // C. 绘制家具
        this.furnitureItems.forEach(item => {
            let sprite = null;
            
            if (item.type === 'STOOL') sprite = this.sprites['STOOL'];
            else if (item.type === 'CHAIR') sprite = this.sprites['CHAIR'];
            else if (item.type === 'PIANO_TL') sprite = this.sprites['PIANO_TL'];
            else if (item.type === 'PIANO_TR') sprite = this.sprites['PIANO_TR'];
            else if (item.type === 'PIANO_BL') sprite = this.sprites['PIANO_BL'];
            else if (item.type === 'PIANO_BR') sprite = this.sprites['PIANO_BR'];
            else if (item.type === 'BARREL') sprite = this.sprites['BARREL'];
            else if (item.type === 'DRINKS') sprite = this.sprites['DRINKS'];
            else if (item.type === 'PLANT') sprite = this.sprites['PLANT'];
            else if (item.type === 'BOOKSHELF') sprite = this.sprites['BOOKSHELF'];
            else if (item.type === 'RUG') sprite = this.sprites['RUG'];
            else if (item.type === 'LAMP') sprite = this.sprites['LAMP'];
            else if (item.type === 'WRITING_DESK') sprite = this.sprites['WRITING_DESK'];
            else if (item.type === 'ARMCHAIR') sprite = this.sprites['ARMCHAIR'];
            else if (item.type === 'BOOKS_PILE') sprite = this.sprites['BOOKS_PILE'];
            else if (item.type === 'ROUND_TABLE') sprite = this.sprites['ROUND_TABLE'];
            else if (item.type === 'WOODEN_STOOL') sprite = this.sprites['WOODEN_STOOL'];
            else if (item.type === 'LONG_TABLE_L') sprite = this.sprites['LONG_TABLE_L'];
            else if (item.type === 'CHRISTMAS_TREE_TL') sprite = this.sprites['CHRISTMAS_TREE_TL'];
            else if (item.type === 'CHRISTMAS_TREE_TM') sprite = this.sprites['CHRISTMAS_TREE_TM'];
            else if (item.type === 'CHRISTMAS_TREE_TR') sprite = this.sprites['CHRISTMAS_TREE_TR'];
            else if (item.type === 'CHRISTMAS_TREE_R2L') sprite = this.sprites['CHRISTMAS_TREE_R2L'];
            else if (item.type === 'CHRISTMAS_TREE_R2M') sprite = this.sprites['CHRISTMAS_TREE_R2M'];
            else if (item.type === 'CHRISTMAS_TREE_R2R') sprite = this.sprites['CHRISTMAS_TREE_R2R'];
            else if (item.type === 'CHRISTMAS_TREE_ML') sprite = this.sprites['CHRISTMAS_TREE_ML'];
            else if (item.type === 'CHRISTMAS_TREE_MM') sprite = this.sprites['CHRISTMAS_TREE_MM'];
            else if (item.type === 'CHRISTMAS_TREE_MR') sprite = this.sprites['CHRISTMAS_TREE_MR'];
            else if (item.type === 'CHRISTMAS_TREE_R4L') sprite = this.sprites['CHRISTMAS_TREE_R4L'];
            else if (item.type === 'CHRISTMAS_TREE_R4M') sprite = this.sprites['CHRISTMAS_TREE_R4M'];
            else if (item.type === 'CHRISTMAS_TREE_R4R') sprite = this.sprites['CHRISTMAS_TREE_R4R'];
            else if (item.type === 'CHRISTMAS_TREE_R5L') sprite = this.sprites['CHRISTMAS_TREE_R5L'];
            else if (item.type === 'CHRISTMAS_TREE_R5M') sprite = this.sprites['CHRISTMAS_TREE_R5M'];
            else if (item.type === 'CHRISTMAS_TREE_R5R') sprite = this.sprites['CHRISTMAS_TREE_R5R'];
            else if (item.type === 'CHRISTMAS_TREE_BL') sprite = this.sprites['CHRISTMAS_TREE_BL'];
            else if (item.type === 'CHRISTMAS_TREE_BM') sprite = this.sprites['CHRISTMAS_TREE_BM'];
            else if (item.type === 'CHRISTMAS_TREE_BR') sprite = this.sprites['CHRISTMAS_TREE_BR'];
            else if (item.type === 'GIFT') sprite = this.sprites['GIFT'];
            else if (item.type === 'REINDEER') sprite = this.sprites['REINDEER'];
            else if (item.type === 'GIFT_PILE') sprite = this.sprites['GIFT_PILE'];
            else if (item.type === 'XMAS_LIGHT') sprite = this.sprites['XMAS_LIGHT'];
            else if (item.type === 'LONG_TABLE_R') sprite = this.sprites['LONG_TABLE_R'];
            else if (item.type === 'LONG_TABLE_T') sprite = this.sprites['LONG_TABLE_T'];
            else if (item.type === 'LONG_TABLE_B') sprite = this.sprites['LONG_TABLE_B'];
            else if (item.type === 'SMALL_SOFA') sprite = this.sprites['SMALL_SOFA'];
            else if (item.type === 'VASE_A') sprite = this.sprites['VASE_A'];
            else if (item.type === 'VASE_B') sprite = this.sprites['VASE_B'];
            else if (item.type === 'VASE_C') sprite = this.sprites['VASE_C'];
            else if (item.type === 'RESTROOM_DOOR') sprite = this.sprites['RESTROOM_DOOR'];
            else if (item.type === 'MALE_SIGN') sprite = this.sprites['MALE_SIGN'];
            else if (item.type === 'FEMALE_SIGN') sprite = this.sprites['FEMALE_SIGN'];
            else if (item.type === 'SOFA') {
                const s = this.sprites;
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
                const s = this.sprites;
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
                // 只渲染非圣诞树部件（圣诞树在renderNPCs中渲染以实现深度遮挡）
                const treeParts = ['CHRISTMAS_TREE_TL','CHRISTMAS_TREE_TM','CHRISTMAS_TREE_TR','CHRISTMAS_TREE_R2L','CHRISTMAS_TREE_R2M','CHRISTMAS_TREE_R2R','CHRISTMAS_TREE_ML','CHRISTMAS_TREE_MM','CHRISTMAS_TREE_MR','CHRISTMAS_TREE_R4L','CHRISTMAS_TREE_R4M','CHRISTMAS_TREE_R4R','CHRISTMAS_TREE_R5L','CHRISTMAS_TREE_R5M','CHRISTMAS_TREE_R5R','CHRISTMAS_TREE_BL','CHRISTMAS_TREE_BM','CHRISTMAS_TREE_BR'];
                const isTreePart = (treeParts as string[]).includes(item.type as string);
                
                if (!isTreePart) {
                    let drawX = item.c * TILE_SIZE;
                    let drawY = item.r * TILE_SIZE;
                    
                    // 彩灯闪烁效果
                    if (item.type === 'XMAS_LIGHT' && currentTime !== undefined) {
                        const time = currentTime || 0;
                        // 缓慢闪烁：每2秒一个周期，使用正弦波
                        const opacity = 0.5 + 0.5 * Math.sin(time / 2000 * Math.PI * 2);
                        ctx.globalAlpha = opacity;
                    }
                    
                    // 驯鹿缓慢晃动（与圣诞老人一致）
                    if (item.type === 'REINDEER' && currentTime !== undefined) {
                        const time = currentTime || 0;
                        // 非常缓慢的左右摇摆（周期约20s，幅度约1.5px）
                        const swayOffset = Math.sin(time * 0.005) * 1.5;
                        drawX += swayOffset;
                    }
                    
                    ctx.drawImage(sprite, drawX, drawY);
                    ctx.globalAlpha = 1; // 重置alpha
                }
            }
        });
    };

    /**
     * 渲染NPCs、玩家和圣诞树（混合深度排序）
     */
    renderNPCs = (ctx: CanvasRenderingContext2D, npcs: Agent[], player?: Agent): void => {
        // 提取圣诞树部件
        const treeParts = ['CHRISTMAS_TREE_TL','CHRISTMAS_TREE_TM','CHRISTMAS_TREE_TR','CHRISTMAS_TREE_R2L','CHRISTMAS_TREE_R2M','CHRISTMAS_TREE_R2R','CHRISTMAS_TREE_ML','CHRISTMAS_TREE_MM','CHRISTMAS_TREE_MR','CHRISTMAS_TREE_R4L','CHRISTMAS_TREE_R4M','CHRISTMAS_TREE_R4R','CHRISTMAS_TREE_R5L','CHRISTMAS_TREE_R5M','CHRISTMAS_TREE_R5R','CHRISTMAS_TREE_BL','CHRISTMAS_TREE_BM','CHRISTMAS_TREE_BR'];
        const treeItems = this.furnitureItems.filter(item => (treeParts as string[]).includes(item.type as string));
        
        // 找到树的最大r值（底部），用于整体排序
        const treeMaxR = treeItems.length > 0 ? Math.max(...treeItems.map(item => item.r)) : 0;
        
        // 创建混合渲染数组：NPC、玩家和树部件
        type RenderObject = {type: 'npc', npc: Agent} | {type: 'player', player: Agent} | {type: 'tree', item: FurnitureItem};
        const renderList: RenderObject[] = [
            ...npcs.map(npc => ({type: 'npc' as const, npc})),
            ...treeItems.map(item => ({type: 'tree' as const, item}))
        ];
        
        // 如果有玩家，加入渲染列表
        if (player) {
            renderList.push({type: 'player' as const, player});
        }
        
        // 按行号排序（实现深度遮挡）
        // 注意：树的所有部件使用统一的底部r值，确保树作为整体渲染
        renderList.sort((a, b) => {
            let rA: number, rB: number;
            if (a.type === 'npc') rA = a.npc.r;
            else if (a.type === 'player') rA = a.player.r;
            else rA = treeMaxR; // 树部件使用统一的底部r值
            
            if (b.type === 'npc') rB = b.npc.r;
            else if (b.type === 'player') rB = b.player.r;
            else rB = treeMaxR; // 树部件使用统一的底部r值
            
            return rA - rB;
        });
        
        // 统一渲染
        renderList.forEach(obj => {
            if (obj.type === 'npc' || obj.type === 'player') {
                const agent = obj.type === 'npc' ? obj.npc : obj.player;
                const isPlayer = obj.type === 'player';
                
                // 优先使用自定义精灵图，否则使用字符画精灵图
                let sprite: HTMLImageElement | null = null;
                if (agent.spriteImage) {
                    sprite = agent.spriteImage;
                } else {
                    // 对于顾客，如果有多部分配色，则不使用sprite，改用配色渲染
                    if (agent.role === Role.CUSTOMER && agent.colorParts) {
                        sprite = null;
                    } else {
                        sprite = this.sprites[agent.role] || this.sprites[Role.CUSTOMER];
                    }
                }
                
                if (sprite) {
                    // 音乐家有轻微晃动偏移；舞者在舞池中有上下摆动效果
                    let drawX = agent.pixelX;
                    let drawY = agent.pixelY;

                    if (agent.role === Role.MUSICIAN && typeof agent.swayOffset === 'number') {
                        drawX = agent.pixelX + agent.swayOffset;
                    }

                    if (agent.role === Role.SANTA && typeof agent.swayOffset === 'number') {
                        drawX = agent.pixelX + agent.swayOffset;
                    }

                    if (agent.role === Role.CUSTOMER && agent.customerState === CustomerState.DANCING && typeof agent.swayOffset === 'number') {
                        // 垂直摆动效果（像素）
                        drawY = agent.pixelY + agent.swayOffset;
                    }

                    // 猫的水平翻转（朝右时翻转，因为默认图是朝左的）
                    if (agent.role === Role.CAT && agent.facingRight) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(sprite, -drawX - TILE_SIZE, drawY);
                        ctx.restore();
                    } else {
                        ctx.drawImage(sprite, drawX, drawY);
                    }
                    
                    // 玩家增强阴影和波纹效果（在角色下方）
                    if (isPlayer) {
                        const time = Date.now();
                        const centerX = agent.pixelX + TILE_SIZE/2;
                        const centerY = agent.pixelY + TILE_SIZE - 2;
                        
                        // 节奏性脉动（更快更明显）
                        const rawPulse = Math.sin(time / 400); // 0.4秒一个周期
                        const pulse = (rawPulse + 1) / 2; // 转换到0-1区间，避免负值
                        
                        // 检测是否处于上升阶段（只在上升时显示波纹）
                        const lastPulse = ((Math.sin((time - 16.67) / 400) + 1) / 2); // 上一帧的pulse
                        const isRising = pulse > lastPulse && pulse > 0.85; // 上升且高于0.85
                        
                        // 第一圈椭圆波纹效果（单向扩散，只在上升时显示）
                        if (isRising) {
                            const rippleProgress = (pulse - 0.85) / 0.15; // 0-1
                            const rippleRadiusX = 30 + rippleProgress * 35; // 横向：30-65像素
                            const rippleRadiusY = 15 + rippleProgress * 20; // 纵向：15-35像素
                            const rippleAlpha = 0.5 * (1 - rippleProgress); // 渐隐
                            
                            ctx.strokeStyle = `rgba(255, 230, 150, ${rippleAlpha})`;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.ellipse(centerX, centerY, rippleRadiusX, rippleRadiusY, 0, 0, Math.PI * 2);
                            ctx.stroke();
                            
                            // 第二圈波纹（在第一圈接近最大值时出现）
                            if (rippleProgress > 0.5) { // 第一圈扩散到一半时，第二圈开始出现
                                const ripple2Progress = (rippleProgress - 0.5) / 0.5; // 0-1
                                const ripple2RadiusX = 30 + ripple2Progress * 35;
                                const ripple2RadiusY = 15 + ripple2Progress * 20;
                                const ripple2Alpha = 0.4 * (1 - ripple2Progress);
                                
                                ctx.strokeStyle = `rgba(255, 230, 150, ${ripple2Alpha})`;
                                ctx.lineWidth = 1.5;
                                ctx.beginPath();
                                ctx.ellipse(centerX, centerY, ripple2RadiusX, ripple2RadiusY, 0, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                        }
                        
                        // 主阴影（更明显的颜色和脉动）
                        const shadowSize = 16 + pulse * 4; // 16-20像素
                        const shadowAlpha = 0.3 + pulse * 0.25; // 0.3-0.55
                        
                        // 外圈柔和光晕
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, shadowSize
                        );
                        gradient.addColorStop(0, `rgba(255, 230, 150, ${shadowAlpha})`);
                        gradient.addColorStop(0.6, `rgba(255, 230, 150, ${shadowAlpha * 0.5})`);
                        gradient.addColorStop(1, `rgba(255, 230, 150, 0)`);
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, shadowSize, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 核心阴影椭圆
                        ctx.fillStyle = `rgba(255, 240, 180, ${0.4 + pulse * 0.3})`;
                        ctx.beginPath();
                        ctx.ellipse(centerX, centerY, shadowSize * 0.75, shadowSize * 0.4, 0, 0, Math.PI*2);
                        ctx.fill();
                    }
                } else {
                    // 如果有多部分配色，渲染分层人物
                    if (agent.colorParts) {
                        const x = agent.pixelX + 4;
                        const y = agent.pixelY + 4;
                        const size = TILE_SIZE - 8;
                        
                        // 头发（顶部 20%）
                        ctx.fillStyle = agent.colorParts.hair;
                        ctx.fillRect(x, y, size, size * 0.2);
                        
                        // 上衣（中上部 35%）
                        ctx.fillStyle = agent.colorParts.top;
                        ctx.fillRect(x, y + size * 0.2, size, size * 0.35);
                        
                        // 下装（中下部 35%）
                        ctx.fillStyle = agent.colorParts.bottom;
                        ctx.fillRect(x, y + size * 0.55, size, size * 0.35);
                        
                        // 鞋子（底部 10%）
                        ctx.fillStyle = agent.colorParts.shoes;
                        ctx.fillRect(x, y + size * 0.9, size, size * 0.1);
                    } else {
                        // 备用单色渲染
                        ctx.fillStyle = agent.color;
                        ctx.fillRect(agent.pixelX + 4, agent.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    }
                }
            } else if (obj.type === 'tree') {
                // 渲染圣诞树部件
                const item = obj.item;
                const sprite = this.sprites[item.type as string];
                if (sprite) {
                    ctx.drawImage(sprite, item.c * TILE_SIZE, item.r * TILE_SIZE);
                    
                    // 绘制闪烁小灯
                    const colors = ['#ff3b3b', '#fff34d', '#34ff78', '#7c3aed'];
                    const t = Math.floor(Date.now() / 800);
                    let lights: {dx: number, dy: number}[] = [];
                    
                    if (item.type === 'CHRISTMAS_TREE_TM') {
                        lights = [{dx: 15, dy: 23}, {dx: 18, dy: 28}];
                    } else if (item.type === 'CHRISTMAS_TREE_R2M') {
                        lights = [{dx: 13, dy: 4}, {dx: 17, dy: 8}];
                    } else if (item.type === 'CHRISTMAS_TREE_R2L') {
                        lights = [{dx: 28, dy: 18}];
                    } else if (item.type === 'CHRISTMAS_TREE_R2R') {
                        lights = [{dx: 2, dy: 18}];
                    } else if (item.type === 'CHRISTMAS_TREE_MM') {
                        lights = [{dx: 10, dy: 2}, {dx: 20, dy: 7}];
                    } else if (item.type === 'CHRISTMAS_TREE_ML') {
                        lights = [{dx: 25, dy: 5}, {dx: 28, dy: 25}];
                    } else if (item.type === 'CHRISTMAS_TREE_MR') {
                        lights = [{dx: 5, dy: 5}, {dx: 2, dy: 25}];
                    } else if (item.type === 'CHRISTMAS_TREE_R4M') {
                        lights = [{dx: 8, dy: 3}, {dx: 22, dy: 8}];
                    } else if (item.type === 'CHRISTMAS_TREE_R4L') {
                        lights = [{dx: 18, dy: 2}, {dx: 28, dy: 15}, {dx: 25, dy: 28}];
                    } else if (item.type === 'CHRISTMAS_TREE_R4R') {
                        lights = [{dx: 12, dy: 2}, {dx: 2, dy: 15}, {dx: 5, dy: 28}];
                    } else if (item.type === 'CHRISTMAS_TREE_R5M') {
                        lights = [{dx: 5, dy: 5}, {dx: 25, dy: 8}];
                    } else if (item.type === 'CHRISTMAS_TREE_R5L') {
                        lights = [{dx: 15, dy: 3}, {dx: 22, dy: 18}, {dx: 28, dy: 28}];
                    } else if (item.type === 'CHRISTMAS_TREE_R5R') {
                        lights = [{dx: 15, dy: 3}, {dx: 8, dy: 18}, {dx: 2, dy: 28}];
                    } else if (item.type === 'CHRISTMAS_TREE_BM') {
                        lights = [{dx: 2, dy: 2}, {dx: 28, dy: 5}];
                    } else if (item.type === 'CHRISTMAS_TREE_BL') {
                        lights = [{dx: 22, dy: 8}, {dx: 28, dy: 22}];
                    } else if (item.type === 'CHRISTMAS_TREE_BR') {
                        lights = [{dx: 8, dy: 8}, {dx: 2, dy: 22}];
                    }
                    
                    ctx.save();
                    lights.forEach((l, idx) => {
                        const on = ((t + item.c + item.r + idx) % 4) < 2;
                        if (on) {
                            ctx.fillStyle = colors[(item.c + item.r + idx) % colors.length];
                            ctx.beginPath();
                            ctx.globalAlpha = 0.85;
                            ctx.arc(item.c * TILE_SIZE + l.dx, item.r * TILE_SIZE + l.dy, 2.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                    ctx.restore();
                }
            }
            
            // 渲染状态指示器（仅NPC有）
            if (obj.type === 'npc') {
                this.renderNPCStatusIndicator(ctx, obj.npc);
            }
        });
    };

    /**
     * 渲染玩家
     */
    renderPlayer = (ctx: CanvasRenderingContext2D, player: Agent): void => {
        const time = Date.now();
        const centerX = player.pixelX + TILE_SIZE/2;
        const centerY = player.pixelY + TILE_SIZE - 2;
        
        // 节奏性脉动（更快更明显）
        const rawPulse = Math.sin(time / 400); // 0.4秒一个周期
        const pulse = (rawPulse + 1) / 2; // 转换到0-1区间，避免负值
        
        // 检测是否处于上升阶段（只在上升时显示波纹）
        const lastPulse = ((Math.sin((time - 16.67) / 400) + 1) / 2); // 上一帧的pulse
        const isRising = pulse > lastPulse && pulse > 0.85; // 上升且高于0.85
        
        // 第一圈椭圆波纹效果（单向扩散，只在上升时显示）
        if (isRising) {
            const rippleProgress = (pulse - 0.85) / 0.15; // 0-1
            const rippleRadiusX = 30 + rippleProgress * 35; // 横向：30-65像素
            const rippleRadiusY = 15 + rippleProgress * 20; // 纵向：15-35像素
            const rippleAlpha = 0.5 * (1 - rippleProgress); // 渐隐
            
            ctx.strokeStyle = `rgba(255, 230, 150, ${rippleAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, rippleRadiusX, rippleRadiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // 第二圈波纹（在第一圈接近最大值时出现）
            if (rippleProgress > 0.5) { // 第一圈扩散到一半时，第二圈开始出现
                const ripple2Progress = (rippleProgress - 0.5) / 0.5; // 0-1
                const ripple2RadiusX = 30 + ripple2Progress * 35;
                const ripple2RadiusY = 15 + ripple2Progress * 20;
                const ripple2Alpha = 0.4 * (1 - ripple2Progress);
                
                ctx.strokeStyle = `rgba(255, 230, 150, ${ripple2Alpha})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, ripple2RadiusX, ripple2RadiusY, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // 主阴影（更明显的颜色和脉动）
        const shadowSize = 16 + pulse * 4; // 16-20像素
        const shadowAlpha = 0.3 + pulse * 0.25; // 0.3-0.55
        
        // 外圈柔和光晕
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, shadowSize
        );
        gradient.addColorStop(0, `rgba(255, 230, 150, ${shadowAlpha})`);
        gradient.addColorStop(0.6, `rgba(255, 230, 150, ${shadowAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 230, 150, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shadowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心阴影椭圆
        ctx.fillStyle = `rgba(255, 240, 180, ${0.4 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, shadowSize * 0.75, shadowSize * 0.4, 0, 0, Math.PI*2);
        ctx.fill();
        
        // 渲染角色本体（在阴影之上）
        const sprite = this.sprites[Role.PLAYER];
        if (sprite) {
            ctx.drawImage(sprite, player.pixelX, player.pixelY);
        } else {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.pixelX + 4, player.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
    };

    /**
     * 渲染特效
     */
    renderEffects = (ctx: CanvasRenderingContext2D, ripples: RippleEffect[]): void => {
        ripples.forEach(r => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${r.a})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.stroke();
        });
    };

    /**
     * 渲染音乐音符特效
     */
    renderMusicNotes = (ctx: CanvasRenderingContext2D, notes: { x: number; y: number; color: string; life: number; maxLife: number }[]): void => {
        notes.forEach(note => {
            const alpha = Math.max(0, Math.min(1, note.life / note.maxLife));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = note.color;
            ctx.beginPath();
            ctx.arc(note.x, note.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    };

    /**
     * 渲染飘雪特效
     */
    renderSnowflakes = (ctx: CanvasRenderingContext2D, snowflakes: { x: number; y: number; size: number; opacity: number }[]): void => {
        snowflakes.forEach(snow => {
            ctx.globalAlpha = snow.opacity;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    };

    /**
     * 渲染NPC状态指示器
     */
    private renderNPCStatusIndicator = (ctx: CanvasRenderingContext2D, npc: Agent): void => {
        // 不为音乐家、猫和圣诞老人绘制状态指示器
        if (npc.role === Role.MUSICIAN || npc.role === Role.CAT || npc.role === Role.SANTA) return;

        const indicatorX = npc.pixelX + TILE_SIZE - 8;
        const indicatorY = npc.pixelY - 2;
        const radius = 4;

        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
        
        let color = 'white';

        if (npc.role === Role.CUSTOMER && npc.customerState) {
            switch (npc.customerState) {
                case CustomerState.SEATED:
                    color = 'gray';
                    break;
                case CustomerState.READY_TO_ORDER:
                case CustomerState.WAITING_FOR_WAITER:
                    color = 'yellow';
                    break;
                case CustomerState.ORDERING:
                case CustomerState.WAITING_DRINK:
                    color = 'orange';
                    break;
                case CustomerState.DRINKING:
                    color = 'green';
                    break;
                case CustomerState.DANCING:
                    color = 'magenta';
                    break;
                case CustomerState.SLEEPING:
                    // 睡眠使用淡蓝色以便快速识别
                    color = 'deepskyblue';
                    break;
                default:
                    color = 'white';
                    break;
            }
        } else if (npc.role === Role.WAITER && npc.waiterState) {
            switch (npc.waiterState) {
                case WaiterState.IDLE:
                    color = 'lightgray';
                    break;
                case WaiterState.GOING_TO_CUSTOMER:
                case WaiterState.TAKING_ORDER:
                case WaiterState.GOING_TO_BAR:
                    color = 'orange';
                    break;
                case WaiterState.WAITING_FOR_DRINK:
                case WaiterState.DELIVERING_DRINK:
                    color = 'lime';
                    break;
                default:
                    color = 'white';
                    break;
            }
        } else if (npc.role === Role.BARTENDER && npc.bartenderState) {
            switch (npc.bartenderState) {
                case BartenderState.IDLE:
                    color = 'lightgray';
                    break;
                case BartenderState.PREPARING_DRINK:
                    color = 'blue';
                    break;
                case BartenderState.MOVING:
                    color = 'lightgray';
                    break;
                default:
                    color = 'lightgray';
                    break;
            }
        } else if (npc.role === Role.CLEANER && npc.cleanerState) {
            switch (npc.cleanerState) {
                case CleanerState.IDLE:
                case CleanerState.WANDERING:
                    color = 'lightgray';
                    break;
                case CleanerState.GOING_TO_CLEAN:
                case CleanerState.CLEANING:
                    color = 'darkgreen';
                    break;
                default:
                    color = 'white';
                    break;
            }
        } else if (npc.role === Role.POET && npc.poetState) {
            switch (npc.poetState) {
                case PoetState.WANDERING:
                    color = 'gold';
                    break;
                case PoetState.SITTING_THINKING:
                    color = 'purple';
                    break;
                case PoetState.WRITING:
                    color = 'darkblue';
                    break;
                default:
                    color = 'white';
                    break;
            }
        }

        ctx.fillStyle = color;
        ctx.fill();
    };
}