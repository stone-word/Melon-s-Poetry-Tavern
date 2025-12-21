/**
 * ==============================================================================
 * 游戏引擎 (Game Engine)
 * ==============================================================================
 * 游戏的核心引擎，协调所有游戏系统的运行
 */

import { 
    Agent, 
    Role, 
    Order, 
    Position, 
    CustomerState,
    CustomerIdentity,
    TILE_SIZE, 
    COLS, 
    ROWS,
    MAX_CUSTOMERS,
    MusicianState,
    MusicNote,
    Snowflake
} from '../types';
import { generateCustomerIdentity, formatIdentityDisplay, generateCustomerPalette } from '../utils/identityGenerator';
import { getRandomCharacterSprite } from '../utils/artLoader';
import { generateSprite } from '../utils/pixelArt';
import { GameState, FurnitureItem, MapData, RippleEffect } from './types';
import { PathFinding } from './PathFinding';
import { NPCBehavior } from './NPCBehavior';
import { Renderer } from './Renderer';
import metadata from '../metadata.json';

export class GameEngine {
    private gameState: GameState;
    private pathFinding: PathFinding;
    private npcBehavior: NPCBehavior;
    private renderer: Renderer;
    private mapData: MapData;
    private ripples: RippleEffect[] = [];
    private pendingInteraction: { 
        type: 'npc' | 'bookshelf';
        targetNPC?: Agent; 
        onDialogueOpen?: (dialogue: any) => void;
        onOpenPoemLibrary?: () => void;
    } | null = null;
    private currentDialogueCustomer: Agent | null = null; // 当前对话的顾客
    // 音符特效计时器
    private musicNoteTimer: number = 0;
    private musicNoteInterval: number = 120 + Math.floor(Math.random() * 60); // 2-3秒（以60fps计）
    private musicNoteColors: string[] = ['#ff4444', '#ff8844', '#ffff44', '#44ff44', '#4444ff', '#ff44ff'];

    // 启动时已处理初始舞者标记（仅运行一次）
    private startupDancersHandled: boolean = false;

    constructor(
        initialGameState: GameState,
        mapData: MapData,
        sprites: Record<string, HTMLImageElement>
    ) {
        this.gameState = initialGameState;
        this.mapData = mapData;
        this.pathFinding = new PathFinding(mapData.staticObstacles);
        this.npcBehavior = new NPCBehavior(this.pathFinding, mapData.furnitureItems);
        this.renderer = new Renderer(sprites, mapData.furnitureItems, mapData.staticObstacles);
    }

    /**
     * 更新游戏状态
     */
    update = (): void => {
        // 更新玩家移动
        this.updatePlayerMovement();

        // 首次处理：如果有标记的初始舞者，把他们送到舞池
        if (!this.startupDancersHandled) {
            this.handleStartupDancers();
            this.startupDancersHandled = true;
        }

        // 更新所有NPC
        this.updateAllNPCs();



        // 检查待处理的交互
        this.checkPendingInteraction();

        // 管理顾客数量
        this.manageCustomers();

        // 清理已删除的NPC
        this.cleanupNPCs();

        // 音符生成与更新（定时）
        this.musicNoteTimer++;
        if (this.musicNoteTimer >= this.musicNoteInterval) {
            this.musicNoteTimer = 0;
            this.musicNoteInterval = 120 + Math.floor(Math.random() * 60);
            this.generateMusicNotes();
        }
        this.updateMusicNotes();

        // 更新雪花（如果启用圣诞主题）
        this.updateSnowflakes();

        // 更新特效
        this.updateEffects();
    };

    // 处理游戏启动时被标记为 startDancing 的顾客（只运行一次）
    private handleStartupDancers = (): void => {
        const starterCustomers = this.gameState.npcs.filter(n => n.role === Role.CUSTOMER && ((n as any).startDancing || (n as any).startSleeping));
        starterCustomers.forEach(customer => {
            // 释放座位（如果有）
            if (customer.targetSeat) {
                customer.targetSeat.occupied = false;
                const seatInRef = this.gameState.seats.find(s => s.c === customer.targetSeat!.c && s.r === customer.targetSeat!.r);
                if (seatInRef) seatInRef.occupied = false;
                customer.targetSeat = undefined;
            }

            // 如果被标记为 startSleeping，直接进入睡眠
            if ((customer as any).startSleeping) {
                customer.customerState = CustomerState.SLEEPING;
                customer.stateTimer = Math.floor(Math.random() * (this.npcBehavior['SLEEP_MAX_FRAMES'] - this.npcBehavior['SLEEP_MIN_FRAMES'] + 1)) + this.npcBehavior['SLEEP_MIN_FRAMES'];
                (customer as any).sleepChecked = true;
                (customer as any).startSleeping = false;
                return;
            }

            // 否则处理 startDancing
            if ((customer as any).startDancing) {
                const dancePos = (this.npcBehavior as any).getDancePosition(this.gameState.npcs, this.gameState.player);
                if (dancePos) {
                    customer.customerState = CustomerState.DANCING;
                    const path = this.pathFinding.findPath(customer, dancePos, Role.CUSTOMER, true, this.gameState.npcs, this.gameState.player);
                    if (path && path.length > 0) {
                        customer.path = path;
                        customer.stateTimer = this.npcBehavior.getRandomDanceDuration();
                    } else {
                        (customer as any).startDancing = false;
                    }
                } else {
                    (customer as any).startDancing = false;
                }

                (customer as any).startDancing = false;
            }
        });
    };

    /**
     * 渲染游戏
     */
    render = (ctx: CanvasRenderingContext2D): void => {
        // 禁用抗锯齿和平滑处理
        ctx.imageSmoothingEnabled = false;
        
        // 清空画布
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

        // 渲染地图
        this.renderer.renderMap(ctx, Date.now());

        // 渲染NPCs和玩家（混合深度排序）
        this.renderer.renderNPCs(ctx, this.gameState.npcs, this.gameState.player);

        // 渲染音符特效（来自音乐家）
        if (this.gameState.musicNotes && this.gameState.musicNotes.length > 0) {
            this.renderer.renderMusicNotes(ctx, this.gameState.musicNotes);
        }

        // 渲染雪花（如果启用圣诞主题）
        if (this.gameState.snowflakes && this.gameState.snowflakes.length > 0) {
            this.renderer.renderSnowflakes(ctx, this.gameState.snowflakes);
        }

        // 渲染其他特效
        this.renderer.renderEffects(ctx, this.ripples);
    };

    /**
     * 处理玩家点击
     */
    handleClick = (x: number, y: number, onOpenDialogue: (dialogue: any) => void, onOpenPoemLibrary?: () => void): void => {
        const clickC = Math.floor(x / TILE_SIZE);
        const clickR = Math.floor(y / TILE_SIZE);

        // 添加点击波纹效果
        this.addRipple(x, y);

        // 检查是否点击了书柜（诗人之角的书柜）
        if (clickC === 46 && clickR >= 25 && clickR <= 28) {
            // 取消任何待处理的交互
            this.pendingInteraction = null;
            
            // 检查玩家是否在书柜附近
            const bookshelfPos = { c: 46, r: 26, pixelX: 46 * TILE_SIZE, pixelY: 26 * TILE_SIZE };
            if (this.checkInteractionDistance(this.gameState.player, bookshelfPos as Agent)) {
                // 立即打开诗歌图书馆
                if (onOpenPoemLibrary) {
                    onOpenPoemLibrary();
                }
            } else {
                // 开始移动到书柜附近
                this.startBookshelfInteraction(onOpenPoemLibrary);
            }
            return;
        }

        // 检查是否点击了NPC
        const clickedNPC = this.gameState.npcs.find(npc => {
            const npcC = Math.round(npc.c);
            const npcR = Math.round(npc.r);
            return npcC === clickC && npcR === clickR;
        });

        if (clickedNPC) {
            // 取消任何待处理的交互
            this.pendingInteraction = null;
            
            // 检查是否已在交互距离内
            if (this.checkInteractionDistance(this.gameState.player, clickedNPC)) {
                // 立即触发对话
                this.handleNPCClick(clickedNPC, onOpenDialogue);
            } else {
                // 开始移动到NPC附近
                this.startInteractionMovement(clickedNPC, onOpenDialogue);
            }
        } else {
            // 取消待处理的交互并移动玩家
            this.pendingInteraction = null;
            this.movePlayerTo(clickC, clickR);
        }
    };

    /**
     * 获取游戏状态
     */
    getGameState = (): GameState => {
        return this.gameState;
    };

    /**
     * 获取当前对话顾客的身份信息
     */
    getCurrentCustomerIdentity = (): CustomerIdentity | undefined => {
        return this.currentDialogueCustomer?.identity;
    };

    /**
     * 结束与NPC的对话
     */
    endNPCConversation = (npcId?: number): void => {
        if (npcId !== undefined) {
            // 结束特定NPC的对话
            const npc = this.gameState.npcs.find(n => n.id === npcId);
            if (npc) {
                npc.isInConversation = false;
            }
        } else if (this.currentDialogueCustomer) {
            // 结束当前对话顾客的对话
            this.currentDialogueCustomer.isInConversation = false;
        }
        
        this.currentDialogueCustomer = null;
    };

    /**
     * 获取路径查找器
     */
    getPathFinding = (): PathFinding => {
        return this.pathFinding;
    };

    /**
     * 获取桌子分组信息（用于对话气泡系统）
     */
    getTableGroups = (): Map<string, Agent[]> => {
        const tableGroups = new Map<string, Agent[]>();
        const customers = this.gameState.npcs.filter(npc => npc.role === Role.CUSTOMER);

        // 简化调试信息
        customers.forEach(customer => {
            const tableKey = this.getTableKeyForPosition(Math.round(customer.c), Math.round(customer.r));
            
            if (tableKey) {
                if (!tableGroups.has(tableKey)) {
                    tableGroups.set(tableKey, []);
                }
                tableGroups.get(tableKey)!.push(customer);
            }
        });

        // 只返回有2个或更多顾客的桌子
        const filteredGroups = new Map<string, Agent[]>();
        tableGroups.forEach((customers, key) => {
            if (customers.length >= 2) {
                filteredGroups.set(key, customers);
            }
        });



        return filteredGroups;
    };

    /**
     * 根据位置获取桌子标识符
     */
    private getTableKeyForPosition = (c: number, r: number): string | null => {

        // 圆桌位置
        const roundTables = [
            { c: 8, r: 10 }, { c: 12, r: 9 }, { c: 11, r: 13 },
            { c: 6, r: 14 }, { c: 10, r: 16 }, { c: 13, r: 18 },
            { c: 7, r: 20 }, { c: 11, r: 22 }, { c: 9, r: 25 }
        ];

        // 长桌位置
        const longTables = [
            { c: 39, r: 9, type: 'H' }, { c: 33, r: 10, type: 'H' },
            { c: 36, r: 13, type: 'V' }, { c: 33, r: 16, type: 'H' },
            { c: 38, r: 18, type: 'V' }, { c: 36, r: 23, type: 'H' }
        ];

        // 沙发休闲区桌子
        const sofaLounges = [
            { c: 18, r: 5 }, { c: 32, r: 6 }, { c: 22, r: 26 }, { c: 31, r: 23 }
        ];

        // 检查圆桌
        for (const table of roundTables) {
            const distance = Math.abs(c - table.c) + Math.abs(r - table.r);
            if (distance <= 1) {
                return `round_${table.c}_${table.r}`;
            }
        }

        // 检查长桌
        for (const table of longTables) {
            if (table.type === 'H') {
                if (Math.abs(r - table.r) <= 1 && c >= table.c && c <= table.c + 1) {
                    return `long_h_${table.c}_${table.r}`;
                }
            } else {
                if (Math.abs(c - table.c) <= 1 && r >= table.r && r <= table.r + 1) {
                    return `long_v_${table.c}_${table.r}`;
                }
            }
        }

        // 检查沙发休闲区
        for (const table of sofaLounges) {
            const distance = Math.abs(c - table.c) + Math.abs(r - table.r);
            if (distance <= 1) {
                return `sofa_${table.c}_${table.r}`;
            }
        }

        return null;
    };

    // 私有方法
    private updatePlayerMovement = (): void => {
        const player = this.gameState.player;
        if (player.path.length > 0) {
            const target = player.path[0];
            const dx = target.c - player.c;
            const dy = target.r - player.r;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                // 检查目标位置是否被占用
                const targetC = Math.round(target.c);
                const targetR = Math.round(target.r);
                
                if (!this.pathFinding.isOccupiedByChar(targetC, targetR, this.gameState.npcs, player, player)) {
                    player.c = target.c;
                    player.r = target.r;
                    player.pixelX = target.pixelX;
                    player.pixelY = target.pixelY;
                    player.path.shift();
                    player.stuckCounter = 0; // 重置卡住计数器
                } else {
                    // 目标位置被占用，重新计算路径
                    if (player.path.length > 1) {
                        const finalTarget = player.path[player.path.length - 1];
                        const newPath = this.pathFinding.findPath(
                            player,
                            finalTarget,
                            Role.PLAYER,
                            true,
                            this.gameState.npcs,
                            player
                        );
                        player.path = newPath;
                    } else {
                        // 如果只有一个目标且被占用，添加卡住处理
                        if (!player.stuckCounter) player.stuckCounter = 0;
                        player.stuckCounter++;
                        
                        if (player.stuckCounter > 60) { // 1秒后清空路径
                            player.path = [];
                            player.stuckCounter = 0;
                        }
                    }
                }
            } else {
                // 计算下一个位置
                const moveDistance = player.speed * 0.016; // 假设60fps
                const nextC = player.c + (dx / distance) * moveDistance;
                const nextR = player.r + (dy / distance) * moveDistance;
                const nextCRounded = Math.round(nextC);
                const nextRRounded = Math.round(nextR);
                
                // 检查下一个位置是否被占用
                if (!this.pathFinding.isOccupiedByChar(nextCRounded, nextRRounded, this.gameState.npcs, player, player)) {
                    player.c = nextC;
                    player.r = nextR;
                    player.pixelX = player.c * TILE_SIZE;
                    player.pixelY = player.r * TILE_SIZE;
                    player.stuckCounter = 0; // 重置卡住计数器
                } else {
                    // 路径被阻挡，重新计算路径
                    if (player.path.length > 0) {
                        const finalTarget = player.path[player.path.length - 1];
                        const newPath = this.pathFinding.findPath(
                            player,
                            finalTarget,
                            Role.PLAYER,
                            true,
                            this.gameState.npcs,
                            player
                        );
                        player.path = newPath;
                    }
                }
            }
        }
    };

    private updateAllNPCs = (): void => {
        this.gameState.npcs.forEach(npc => {
            // 更新NPC移动
            this.updateNPCMovement(npc);

            // 更新NPC行为
            switch (npc.role) {
                case Role.CUSTOMER:
                    this.npcBehavior.updateCustomerBehavior(
                        npc, 
                        this.gameState.seats, 
                        this.gameState.dirtyTables,
                        this.gameState.npcs,
                        this.gameState.player
                    );
                    break;
                case Role.WAITER:
                    this.npcBehavior.updateWaiterBehavior(
                        npc,
                        this.gameState.npcs,
                        this.gameState.player,
                        this.gameState.readyDrinks,
                        this.gameState.pendingOrders,
                        this.getBarPositionOrders,
                        this.getBarPositionMoney,
                        this.setBarPositionMoney
                    );
                    break;
                case Role.CLEANER:
                    this.npcBehavior.updateCleanerBehavior(
                        npc,
                        this.gameState.dirtyTables,
                        this.gameState.npcs,
                        this.gameState.player
                    );
                    break;
                case Role.BARTENDER:
                    this.npcBehavior.updateBartenderBehavior(
                        npc,
                        this.gameState.npcs,
                        this.gameState.player,
                        this.gameState.pendingOrders,
                        this.gameState.readyDrinks
                    );
                    break;
                case Role.POET:
                    this.npcBehavior.updatePoetBehavior(
                        npc,
                        this.gameState.npcs,
                        this.gameState.player
                    );
                    break;
                case Role.MUSICIAN:
                    // 更新音乐家（晃动/状态切换）
                    this.npcBehavior.updateMusicianBehavior(npc);
                    break;
                case Role.SANTA:
                    // 更新圣诞老人（缓慢晃动）
                    this.npcBehavior.updateSantaBehavior(npc);
                    break;
                case Role.CAT:
                    // 更新三花猫（随机走动）
                    this.npcBehavior.updateCatBehavior(npc, this.gameState.npcs, this.gameState.player);
                    break;
            }
        });
    };

    private updateNPCMovement = (npc: Agent): void => {
        // 如果NPC正在对话中，不更新移动
        if (npc.isInConversation) {
            return;
        }
        
        if (npc.path.length > 0) {
            const target = npc.path[0];
            const dx = target.c - npc.c;
            const dy = target.r - npc.r;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                // 检查目标位置是否被占用
                const targetC = Math.round(target.c);
                const targetR = Math.round(target.r);
                
                if (!this.pathFinding.isOccupiedByChar(targetC, targetR, this.gameState.npcs, this.gameState.player, npc)) {
                    npc.c = target.c;
                    npc.r = target.r;
                    npc.pixelX = target.pixelX;
                    npc.pixelY = target.pixelY;
                    npc.path.shift();
                    npc.stuckCounter = 0; // 重置卡住计数器
                } else {
                    // 目标位置被占用，添加卡住计数器
                    if (!npc.stuckCounter) npc.stuckCounter = 0;
                    npc.stuckCounter++;
                    
                    // 如果卡住时间过长，强制重新寻路
                    if (npc.stuckCounter > 60) { // 1秒后重新寻路
                        if (npc.path.length > 1) {
                            const finalTarget = npc.path[npc.path.length - 1];
                            const newPath = this.pathFinding.findPath(
                                npc,
                                finalTarget,
                                npc.role,
                                true,
                                this.gameState.npcs,
                                this.gameState.player
                            );
                            npc.path = newPath;
                        } else {
                            // 如果只有一个目标且被占用，尝试寻找附近的替代位置
                            const nearestPos = this.pathFinding.findNearestWalkablePosition(
                                target.c, target.r, this.gameState.npcs, this.gameState.player
                            );
                            if (nearestPos) {
                                npc.path = [nearestPos];
                            } else {
                                // 如果找不到替代位置，清空路径
                                npc.path = [];
                            }
                        }
                        npc.stuckCounter = 0;
                    }
                }
            } else {
                // 计算下一个位置
                const moveDistance = npc.speed * 0.016;
                const nextC = npc.c + (dx / distance) * moveDistance;
                const nextR = npc.r + (dy / distance) * moveDistance;
                const nextCRounded = Math.round(nextC);
                const nextRRounded = Math.round(nextR);
                
                // 检查下一个位置是否被占用
                if (!this.pathFinding.isOccupiedByChar(nextCRounded, nextRRounded, this.gameState.npcs, this.gameState.player, npc)) {
                    npc.c = nextC;
                    npc.r = nextR;
                    npc.pixelX = npc.c * TILE_SIZE;
                    npc.pixelY = npc.r * TILE_SIZE;
                    npc.stuckCounter = 0; // 重置卡住计数器
                } else {
                    // 路径被阻挡，添加卡住计数器
                    if (!npc.stuckCounter) npc.stuckCounter = 0;
                    npc.stuckCounter++;
                    
                    // 如果卡住时间过长，强制重新寻路
                    if (npc.stuckCounter > 30) { // 0.5秒后重新寻路
                        if (npc.path.length > 0) {
                            const finalTarget = npc.path[npc.path.length - 1];
                            const newPath = this.pathFinding.findPath(
                                npc,
                                finalTarget,
                                npc.role,
                                true,
                                this.gameState.npcs,
                                this.gameState.player
                            );
                            npc.path = newPath;
                        }
                        npc.stuckCounter = 0;
                    }
                }
            }
        }
    };



    private manageCustomers = (): void => {
        const currentCustomers = this.gameState.npcs.filter(npc => npc.role === Role.CUSTOMER).length;
        
        if (currentCustomers < MAX_CUSTOMERS && Math.random() < 0.001) { // 低概率生成新顾客
            // 决定生成顾客的数量和类型
            const rand = Math.random();
            let groupSize = 1;
            let requireMaleFemale = false;
            
            if (rand < 0.3) {
                // 30% 概率：2个顾客（1男1女）
                groupSize = 2;
                requireMaleFemale = true;
            } else if (rand < 0.5) {
                // 20% 概率：3个顾客
                groupSize = 3;
            } else if (rand < 0.8) {
                // 30% 概率：4个顾客
                groupSize = 4;
            }
            // 剩余20%概率：1个顾客（默认）
            
            const newCustomers = this.createCustomerGroup(groupSize, requireMaleFemale);
            if (newCustomers && newCustomers.length > 0) {
                newCustomers.forEach(customer => {
                    this.gameState.npcs.push(customer);
                });
            }
        }
    };

    private createCustomerGroup = (groupSize: number, requireMaleFemale: boolean = false): Agent[] | null => {
        const availableSeats = this.gameState.seats.filter(seat => !seat.occupied);
        
        // 找到能容纳指定数量顾客的桌子
        const suitableTable = this.findSuitableTable(groupSize, availableSeats);
        if (!suitableTable) return null;

        const customers: Agent[] = [];
        const enterFromLeft = Math.random() > 0.5;
        
        // 为每个座位创建顾客
        for (let i = 0; i < suitableTable.seats.length && i < groupSize; i++) {
            const seat = suitableTable.seats[i];
            seat.occupied = true;

            // 计算入口位置（稍微错开，避免重叠）
            let entryC = enterFromLeft ? 0 : COLS - 1;
            let entryR = 6 + Math.floor(Math.random() * 2) + (i * 0.5); // 稍微错开入口位置
            entryR = Math.max(6, Math.min(7, Math.round(entryR))); // 确保在门的范围内

            // 检查入口位置是否被占用
            if (this.pathFinding.isOccupiedByChar(entryC, entryR, this.gameState.npcs, this.gameState.player)) {
                const nearestPos = this.pathFinding.findNearestWalkablePosition(entryC, entryR, this.gameState.npcs, this.gameState.player);
                if (nearestPos) {
                    entryC = nearestPos.c;
                    entryR = nearestPos.r;
                }
            }

            // 生成顾客身份
            let identity = generateCustomerIdentity();
            
            // 如果需要1男1女，确保性别分配
            if (requireMaleFemale && groupSize === 2) {
                if (i === 0) {
                    identity.gender = '男';
                } else {
                    identity.gender = '女';
                }
            }

            // 生成基于性别的自定义调色板
            const customPalette = generateCustomerPalette(identity.gender);
            
            // 使用自定义调色板生成彩色sprite
            const spriteImage = generateSprite('CUSTOMER', 32, customPalette);

            const defaultPath = this.pathFinding.findPath(
                {c: entryC, r: entryR, pixelX: 0, pixelY: 0}, 
                {c: seat.c, r: seat.r, pixelX: 0, pixelY: 0}, 
                Role.CUSTOMER, 
                true,
                this.gameState.npcs,
                this.gameState.player
            );
            
            const newCustomer: Agent = {
                c: entryC, r: entryR,
                pixelX: entryC * TILE_SIZE, pixelY: entryR * TILE_SIZE,
                id: this.gameState.customerIdCounter++,
                role: Role.CUSTOMER,
                color: customPalette['G'], // 备用颜色使用衣服色
                path: defaultPath,
                speed: 1.2,
                state: 'ENTERING',
                customerState: CustomerState.ENTERING,
                stateTimer: Math.floor(Math.random() * 60), // 稍微错开到达时间
                targetSeat: seat,
                identity: identity,
                spriteImage: spriteImage
            };

            // 20% 概率：新到顾客先去舞池跳一段舞，然后再回到座位点单
            if (Math.random() < 0.2) {
                const dancePos = this.npcBehavior.getDancePosition(this.gameState.npcs, this.gameState.player);
                if (dancePos) {
                    const dancePath = this.pathFinding.findPath(
                        {c: entryC, r: entryR, pixelX: 0, pixelY: 0},
                        dancePos,
                        Role.CUSTOMER,
                        true,
                        this.gameState.npcs,
                        this.gameState.player
                    );

                    if (dancePath && dancePath.length > 0) {
                        newCustomer.path = dancePath;
                        newCustomer.customerState = CustomerState.DANCING;
                        newCustomer.stateTimer = this.npcBehavior.getRandomDanceDuration();
                        newCustomer.danceThenSeat = true;
                        // 保留 targetSeat，以便跳舞结束后回到座位
                    }
                }
            }

            customers.push(newCustomer);
        }

        return customers;
    };

    private findSuitableTable = (groupSize: number, availableSeats: any[]): { seats: any[] } | null => {
        // 定义各种桌子类型及其座位
        const tableTypes = [
            // 圆桌（2人桌）
            ...this.getRoundTableSeats(availableSeats),
            // 长桌（4人桌）
            ...this.getLongTableSeats(availableSeats),
            // 沙发休闲区（2人桌）
            ...this.getSofaTableSeats(availableSeats),
            // 卡座（2人桌）
            ...this.getBoothSeats(availableSeats)
        ];

        // 过滤出能容纳指定数量顾客的桌子
        const suitableTables = tableTypes.filter(table => table.seats.length >= groupSize);
        
        if (suitableTables.length === 0) return null;

        // 随机选择一张桌子
        const selectedTable = suitableTables[Math.floor(Math.random() * suitableTables.length)];
        
        // 只返回需要的座位数量
        return {
            seats: selectedTable.seats.slice(0, groupSize)
        };
    };

    private getRoundTableSeats = (availableSeats: any[]) => {
        const roundTableSets = [
            { c: 8, r: 10 }, { c: 12, r: 9 }, { c: 11, r: 13 },
            { c: 6, r: 14 }, { c: 10, r: 16 }, { c: 13, r: 18 },
            { c: 7, r: 20 }, { c: 11, r: 22 }, { c: 9, r: 25 }
        ];

        return roundTableSets.map(pos => ({
            seats: availableSeats.filter(seat => 
                (seat.c === pos.c - 1 && seat.r === pos.r) ||
                (seat.c === pos.c + 1 && seat.r === pos.r)
            )
        })).filter(table => table.seats.length >= 2);
    };

    private getLongTableSeats = (availableSeats: any[]) => {
        const longTableSets = [
            { c: 39, r: 9, orient: 'H' }, { c: 33, r: 10, orient: 'H' },
            { c: 36, r: 13, orient: 'V' }, { c: 33, r: 16, orient: 'H' },
            { c: 38, r: 18, orient: 'V' }, { c: 36, r: 23, orient: 'H' }
        ];

        return longTableSets.map(set => {
            let expectedSeats: {c: number, r: number}[] = [];
            
            if (set.orient === 'H') {
                expectedSeats = [
                    { c: set.c, r: set.r - 1 },
                    { c: set.c + 1, r: set.r - 1 },
                    { c: set.c, r: set.r + 1 },
                    { c: set.c + 1, r: set.r + 1 }
                ];
            } else {
                expectedSeats = [
                    { c: set.c - 1, r: set.r },
                    { c: set.c - 1, r: set.r + 1 },
                    { c: set.c + 1, r: set.r },
                    { c: set.c + 1, r: set.r + 1 }
                ];
            }

            return {
                seats: availableSeats.filter(seat => 
                    expectedSeats.some(expected => expected.c === seat.c && expected.r === seat.r)
                )
            };
        }).filter(table => table.seats.length >= 2);
    };

    private getSofaTableSeats = (availableSeats: any[]) => {
        const sofaLoungeSet = [
            { c: 18, r: 5, arrangement: 'L_SHAPE' },
            { c: 32, r: 6, arrangement: 'FACING' },
            { c: 22, r: 26, arrangement: 'FACING' },
            { c: 31, r: 23, arrangement: 'L_SHAPE' }
        ];

        return sofaLoungeSet.map(set => {
            let expectedSeats: {c: number, r: number}[] = [];
            
            if (set.arrangement === 'L_SHAPE') {
                expectedSeats = [
                    { c: set.c + 1, r: set.r },
                    { c: set.c, r: set.r + 1 }
                ];
            } else {
                expectedSeats = [
                    { c: set.c - 1, r: set.r },
                    { c: set.c + 1, r: set.r }
                ];
            }

            return {
                seats: availableSeats.filter(seat => 
                    expectedSeats.some(expected => expected.c === seat.c && expected.r === seat.r)
                )
            };
        }).filter(table => table.seats.length >= 2);
    };

    private getBoothSeats = (availableSeats: any[]) => {
        // 简化的卡座检测 - 寻找相邻的座位对
        const boothTables: { seats: any[] }[] = [];
        const processedSeats = new Set<string>();

        availableSeats.forEach(seat => {
            const seatKey = `${seat.c}_${seat.r}`;
            if (processedSeats.has(seatKey)) return;

            // 寻找相邻的座位
            const adjacentSeat = availableSeats.find(other => 
                other !== seat &&
                ((Math.abs(other.c - seat.c) === 2 && other.r === seat.r) ||
                 (Math.abs(other.r - seat.r) === 2 && other.c === seat.c))
            );

            if (adjacentSeat) {
                const adjacentKey = `${adjacentSeat.c}_${adjacentSeat.r}`;
                if (!processedSeats.has(adjacentKey)) {
                    boothTables.push({ seats: [seat, adjacentSeat] });
                    processedSeats.add(seatKey);
                    processedSeats.add(adjacentKey);
                }
            }
        });

        return boothTables;
    };

    private cleanupNPCs = (): void => {
        this.gameState.npcs = this.gameState.npcs.filter(npc => !npc.markedForDeletion);
    };

    private updateEffects = (): void => {
        this.ripples = this.ripples.filter(ripple => {
            ripple.r += 2;
            ripple.a -= 0.02;
            return ripple.a > 0;
        });
    };

    /**
     * 更新音符特效位置与生命周期
     */
    private updateMusicNotes = (): void => {
        const notes = this.gameState.musicNotes;
        for (let i = notes.length - 1; i >= 0; i--) {
            const n = notes[i];
            n.x += n.velocity.x;
            n.y += n.velocity.y;
            // 轻微左右摆动
            n.x += Math.sin((n.maxLife - n.life) * 0.1) * 0.2;
            n.life--;

            if (n.life <= 0 || n.y < -10) {
                notes.splice(i, 1);
            }
        }
    };

    /**
     * 生成新的音符
     */
    private generateMusicNotes = (): void => {
        const musician = this.gameState.npcs.find(n => n.role === Role.MUSICIAN && n.musicianState === MusicianState.PLAYING);
        if (!musician) return;
        if (this.gameState.musicNotes.length >= 20) return;

        const spawnCount = Math.floor(Math.random() * 3) + 1; // 1-3 个
        for (let i = 0; i < spawnCount; i++) {
            if (this.gameState.musicNotes.length >= 20) break;

            const tileC = 17 + Math.floor(Math.random() * 3); // 16..18
            const tileR = 20.5 + Math.floor(Math.random() * 3); // 21..23
            const px = tileC * TILE_SIZE + Math.random() * TILE_SIZE;
            const py = tileR * TILE_SIZE + Math.random() * TILE_SIZE;
            const maxLife = Math.floor(Math.random() * 180) + 180; // 3-6秒

            const note: MusicNote = {
                x: px,
                y: py,
                color: this.musicNoteColors[Math.floor(Math.random() * this.musicNoteColors.length)],
                life: maxLife,
                maxLife: maxLife,
                velocity: { x: (Math.random() - 0.5) * 0.6, y: -(0.3 + Math.random() * 0.5) }
            };

            this.gameState.musicNotes.push(note);
        }
    };

    /**
     * 更新雪花特效
     */
    private updateSnowflakes = (): void => {
        // 检查metadata.json中的season字段
        if (metadata.season !== 'christmas') return;

        const snowflakes = this.gameState.snowflakes;
        const canvasHeight = ROWS * TILE_SIZE;
        const canvasWidth = COLS * TILE_SIZE;

        // 生成新雪花（保持30-50个雪花）
        if (snowflakes.length < 30 && Math.random() < 0.3) {
            const newSnowflake: Snowflake = {
                x: Math.random() * canvasWidth,
                y: -10,
                speed: 0.5 + Math.random() * 1.5,  // 下落速度 0.5-2.0
                size: 1.5 + Math.random() * 2,     // 大小 1.5-3.5
                opacity: 0.3 + Math.random() * 0.5, // 透明度 0.3-0.8
                drift: (Math.random() - 0.5) * 0.8  // 横向漂移 -0.4 到 0.4
            };
            snowflakes.push(newSnowflake);
        }

        // 更新雪花位置
        for (let i = snowflakes.length - 1; i >= 0; i--) {
            const snow = snowflakes[i];
            snow.y += snow.speed;
            snow.x += snow.drift;

            // 轻微摆动
            snow.x += Math.sin(snow.y * 0.01) * 0.2;

            // 移除超出屏幕的雪花
            if (snow.y > canvasHeight + 10) {
                snowflakes.splice(i, 1);
            }
        }
    };

    private addRipple = (x: number, y: number): void => {
        this.ripples.push({ x, y, r: 0, a: 1 });
    };

    private movePlayerTo = (targetC: number, targetR: number): void => {
        if (this.pathFinding.isWalkable(targetC, targetR)) {
            // 检查目标位置是否被其他角色占用
            if (this.pathFinding.isOccupiedByChar(targetC, targetR, this.gameState.npcs, this.gameState.player)) {
                // 如果目标位置被占用，寻找最近的可行走位置
                const nearestPos = this.pathFinding.findNearestWalkablePosition(targetC, targetR, this.gameState.npcs, this.gameState.player);
                if (nearestPos) {
                    targetC = nearestPos.c;
                    targetR = nearestPos.r;
                } else {
                    // 如果找不到可行走位置，不移动
                    return;
                }
            }
            
            const path = this.pathFinding.findPath(
                this.gameState.player,
                { c: targetC, r: targetR, pixelX: targetC * TILE_SIZE, pixelY: targetR * TILE_SIZE },
                Role.PLAYER,
                true,
                this.gameState.npcs,
                this.gameState.player
            );
            this.gameState.player.path = path;
        }
    };

    private handleNPCClick = async (npc: Agent, onOpenDialogue: (dialogue: any) => void): Promise<void> => {
        let speakerName = '';
        let role = npc.role;

        // 设置当前对话的顾客
        this.currentDialogueCustomer = npc.role === Role.CUSTOMER ? npc : null;
        
        // 标记NPC正在对话，并暂停移动
        npc.isInConversation = true;
        npc.path = []; // 清空当前路径，立即停止移动

        switch (npc.role) {
            case Role.CUSTOMER:
                // 如果顾客处于睡眠状态，立即打开特殊静默对话（无论是否有 identity）
                if (npc.customerState === CustomerState.SLEEPING) {
                    speakerName = npc.identity ? formatIdentityDisplay(npc.identity) : `顾客 #${npc.id}`;
                    onOpenDialogue({
                        isOpen: true,
                        speakerName,
                        content: 'zzz...',
                        isThinking: false,
                        role,
                        customerId: npc.id,
                        isSleeping: true
                    });
                    return;
                }

                if (npc.identity) {
                    speakerName = formatIdentityDisplay(npc.identity);
                    
                    // 如果是顾客且没有来店动机，先生成动机
                    if (!npc.identity.motivation) {
                        // 先显示对话框，显示思考状态
                        onOpenDialogue({
                            isOpen: true,
                            speakerName,
                            content: '',
                            isThinking: true,
                            role,
                            customerId: npc.id
                        });

                        try {
                            // 动态导入AI服务
                            const { generateCustomerMotivation } = await import('../services/geminiService');
                            const motivation = await generateCustomerMotivation(npc.identity);
                            
                            // 将生成的动机保存到顾客身份中
                            npc.identity.motivation = motivation.trim();
                            
                            // 更新对话框，显示生成的动机
                            onOpenDialogue({
                                isOpen: true,
                                speakerName,
                                content: '',
                                isThinking: false,
                                role,
                                customerId: npc.id
                            });
                        } catch (error) {
                            console.error('生成来店动机失败:', error);
                            // 如果生成失败，设置默认动机
                            npc.identity.motivation = '想找个地方坐坐';
                            
                            onOpenDialogue({
                                isOpen: true,
                                speakerName,
                                content: '',
                                isThinking: false,
                                role,
                                customerId: npc.id
                            });
                        }
                    } else {
                        // 已有动机，直接显示对话框
                        onOpenDialogue({
                            isOpen: true,
                            speakerName,
                            content: '',
                            isThinking: false,
                            role,
                            customerId: npc.id
                        });
                    }
                } else {
                    speakerName = `顾客 #${npc.id}`;
                    onOpenDialogue({
                        isOpen: true,
                        speakerName,
                        content: '',
                        isThinking: false,
                        role,
                        customerId: npc.id
                    });
                }
                break;
            case Role.BARTENDER:
                speakerName = '调酒师';
                onOpenDialogue({
                    isOpen: true,
                    speakerName,
                    content: '你好！有什么可以帮助你的吗？',
                    isThinking: false,
                    role,
                    customerId: npc.id
                });
                break;
            case Role.WAITER:
                speakerName = '服务员';
                onOpenDialogue({
                    isOpen: true,
                    speakerName,
                    content: '你好！有什么可以帮助你的吗？',
                    isThinking: false,
                    role,
                    customerId: npc.id
                });
                break;
            case Role.CLEANER:
                speakerName = '清洁工';
                onOpenDialogue({
                    isOpen: true,
                    speakerName,
                    content: '你好！有什么可以帮助你的吗？',
                    isThinking: false,
                    role,
                    customerId: npc.id
                });
                break;
            case Role.POET:
                speakerName = '诗人 王子瓜';
                onOpenDialogue({
                    isOpen: true,
                    speakerName,
                    content: '', // 空内容，让App.tsx处理初始对话
                    isThinking: false,
                    role,
                    customerId: npc.id
                });
                break;
            case Role.SANTA:
                speakerName = '圣诞老人';
                onOpenDialogue({
                    isOpen: true,
                    speakerName,
                    content: '嘿，我带了礼物给你，我把它放在诗人之角的书架上了。',
                    isThinking: false,
                    role,
                    customerId: npc.id
                });
                break;
        }
    };

    // 吧台管理方法
    private getBarPositionOrders = (c: number, r: number): Order[] => {
        const key = `${c},${r}`;
        if (!this.gameState.barCounterOrders.has(key)) {
            this.gameState.barCounterOrders.set(key, []);
        }
        return this.gameState.barCounterOrders.get(key)!;
    };

    private getBarPositionMoney = (c: number, r: number): number => {
        const key = `${c},${r}`;
        return this.gameState.cashRegister.get(key) || 0;
    };

    private setBarPositionMoney = (c: number, r: number, amount: number): void => {
        const key = `${c},${r}`;
        this.gameState.cashRegister.set(key, amount);
    };

    /**
     * 检查玩家是否在NPC的交互距离内
     */
    private checkInteractionDistance = (player: Agent, npc: Agent): boolean => {
        const dx = player.c - npc.c;
        const dy = player.r - npc.r;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 1.5; // 1.5个格子的交互距离
    };

    /**
     * 寻找NPC附近的交互位置
     */
    private findInteractionPosition = (npc: Agent): Position | null => {
        const npcC = Math.round(npc.c);
        const npcR = Math.round(npc.r);
        
        // 检查NPC周围的8个位置
        const positions = [
            { c: npcC - 1, r: npcR - 1 }, { c: npcC, r: npcR - 1 }, { c: npcC + 1, r: npcR - 1 },
            { c: npcC - 1, r: npcR },                                { c: npcC + 1, r: npcR },
            { c: npcC - 1, r: npcR + 1 }, { c: npcC, r: npcR + 1 }, { c: npcC + 1, r: npcR + 1 }
        ];

        // 寻找最近的可行走位置
        for (const pos of positions) {
            if (this.pathFinding.isWalkable(pos.c, pos.r) && 
                !this.pathFinding.isOccupiedByChar(pos.c, pos.r, this.gameState.npcs, this.gameState.player)) {
                return { c: pos.c, r: pos.r, pixelX: pos.c * TILE_SIZE, pixelY: pos.r * TILE_SIZE };
            }
        }

        // 如果周围都被占用，寻找最近的可到达位置
        return this.pathFinding.findNearestWalkablePosition(npcC, npcR, this.gameState.npcs, this.gameState.player);
    };

    /**
     * 开始移动到NPC进行交互
     */
    private startInteractionMovement = (npc: Agent, onOpenDialogue: (dialogue: any) => void): void => {
        const interactionPos = this.findInteractionPosition(npc);
        if (interactionPos) {
            // 设置待处理的交互
            this.pendingInteraction = { 
                type: 'npc',
                targetNPC: npc, 
                onDialogueOpen: onOpenDialogue 
            };
            
            // 移动玩家到交互位置
            const path = this.pathFinding.findPath(
                this.gameState.player,
                interactionPos,
                Role.PLAYER,
                true,
                this.gameState.npcs,
                this.gameState.player
            );
            this.gameState.player.path = path;
        }
    };

    /**
     * 开始移动到书柜进行交互
     */
    private startBookshelfInteraction = (onOpenPoemLibrary?: () => void): void => {
        // 书柜位置在 (46, 25-28)，寻找附近的交互位置
        const bookshelfPos = { c: 46, r: 26 };
        const interactionPos = this.findBookshelfInteractionPosition(bookshelfPos);
        
        if (interactionPos) {
            // 设置待处理的交互
            this.pendingInteraction = { 
                type: 'bookshelf',
                onOpenPoemLibrary 
            };
            
            // 移动玩家到交互位置
            const path = this.pathFinding.findPath(
                this.gameState.player,
                interactionPos,
                Role.PLAYER,
                true,
                this.gameState.npcs,
                this.gameState.player
            );
            this.gameState.player.path = path;
        }
    };

    /**
     * 寻找书柜附近的交互位置
     */
    private findBookshelfInteractionPosition = (bookshelfPos: { c: number; r: number }): Position | null => {
        // 检查书柜左侧的位置（书柜在右墙边，所以主要检查左侧）
        const positions = [
            { c: bookshelfPos.c - 1, r: bookshelfPos.r },     // 正左
            { c: bookshelfPos.c - 1, r: bookshelfPos.r - 1 }, // 左上
            { c: bookshelfPos.c - 1, r: bookshelfPos.r + 1 }, // 左下
            { c: bookshelfPos.c, r: bookshelfPos.r - 1 },     // 正上
            { c: bookshelfPos.c, r: bookshelfPos.r + 1 },     // 正下
        ];

        // 寻找最近的可行走位置
        for (const pos of positions) {
            if (this.pathFinding.isWalkable(pos.c, pos.r) && 
                !this.pathFinding.isOccupiedByChar(pos.c, pos.r, this.gameState.npcs, this.gameState.player)) {
                return { c: pos.c, r: pos.r, pixelX: pos.c * TILE_SIZE, pixelY: pos.r * TILE_SIZE };
            }
        }

        // 如果周围都被占用，寻找最近的可到达位置
        return this.pathFinding.findNearestWalkablePosition(bookshelfPos.c, bookshelfPos.r, this.gameState.npcs, this.gameState.player);
    };

    /**
     * 检查待处理的交互
     */
    private checkPendingInteraction = (): void => {
        if (this.pendingInteraction && this.gameState.player.path.length === 0) {
            // 玩家已停止移动
            if (this.pendingInteraction.type === 'npc' && this.pendingInteraction.targetNPC && this.pendingInteraction.onDialogueOpen) {
                // 检查是否在NPC交互距离内
                if (this.checkInteractionDistance(this.gameState.player, this.pendingInteraction.targetNPC)) {
                    // 触发对话
                    this.handleNPCClick(this.pendingInteraction.targetNPC, this.pendingInteraction.onDialogueOpen);
                    this.pendingInteraction = null;
                }
            } else if (this.pendingInteraction.type === 'bookshelf' && this.pendingInteraction.onOpenPoemLibrary) {
                // 检查是否在书柜交互距离内
                const bookshelfPos = { c: 46, r: 26, pixelX: 46 * TILE_SIZE, pixelY: 26 * TILE_SIZE };
                if (this.checkInteractionDistance(this.gameState.player, bookshelfPos as Agent)) {
                    // 触发诗歌图书馆
                    this.pendingInteraction.onOpenPoemLibrary();
                    this.pendingInteraction = null;
                }
            }
        }
    };
}