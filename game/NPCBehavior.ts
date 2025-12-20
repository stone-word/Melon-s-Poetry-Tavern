/**
 * ==============================================================================
 * NPC 行为系统 (NPC Behavior System)
 * ==============================================================================
 * 处理所有NPC的行为逻辑，包括顾客、服务员、调酒师、清洁工和诗�?
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
    Order,
    Position,
    COLS,
    ROWS,
    DOOR_ROW_START,
    DOOR_ROW_END,
    BAR_COL_START,
    BAR_COL_END,
    BAR_ROW_START,
    BAR_ROW_END,
    TILE_SIZE
} from '../types';
import { PathFinding } from './PathFinding';
import { FurnitureItem } from './types';

export class NPCBehavior {
    private pathFinding: PathFinding;
    private furnitureItems: FurnitureItem[];

    // Dance configuration
    private DANCE_PROBABILITY = 0.5; // 50%
    private DANCE_CAPACITY = 8;      // max concurrent dancers

    // Dance duration range (frames @ 60 FPS): 1-30 minutes (configurable above)
    private DANCE_MIN_FRAMES = 60 * 60 * 1;   // 3600 frames (1 minute)
    private DANCE_MAX_FRAMES = 60 * 60 * 30;  // 108000 frames (30 minutes)

    // Dance step timing (frames). Each dancer will step every X frames (randomized per dancer)
    private DANCE_STEP_MIN_FRAMES = 60;   // ~1s (进一步减慢)
    private DANCE_STEP_MAX_FRAMES = 120;   // ~2s (进一步减慢)

    // Visual sway amplitude for dancers (pixels)
    private DANCE_SWAY_AMPLITUDE = 1; // px

    // Sleep configuration
    private SLEEP_PROBABILITY = 0.5; // 50% chance to fall asleep after threshold
    // Sleep duration: 5-15 minutes (frames at 60 FPS)
    private SLEEP_MIN_FRAMES = 5 * 60 * 60;   // 5 minutes
    private SLEEP_MAX_FRAMES = 15 * 60 * 60;  // 15 minutes
    // Threshold to consider sleeping: 15 minutes (frames)
    private SLEEP_THRESHOLD_FRAMES = 15 * 60 * 60; // 15 minutes


    constructor(pathFinding: PathFinding, furnitureItems: FurnitureItem[]) {
        this.pathFinding = pathFinding;
        this.furnitureItems = furnitureItems;
    }

    // 返回一个随机的跳舞时长（以帧为单位）
    public getRandomDanceDuration = (): number => {
        return Math.floor(Math.random() * (this.DANCE_MAX_FRAMES - this.DANCE_MIN_FRAMES + 1)) + this.DANCE_MIN_FRAMES;
    };

    // 初始化舞者的舞位、节拍间隔与初始计时
    public initDanceForCustomer = (customer: Agent, npcs: Agent[], player: Agent): void => {
        // 选取2-4个舞池内可用格子作为舞步环
        const positions = [] as Position[];
        const desired = 2 + Math.floor(Math.random() * 3); // 2-4

        // 尝试获取不同的舞位
        for (let i = 0; i < desired; i++) {
            const pos = this.getDancePosition(npcs.concat(positions.map(p => ({ c: p.c, r: p.r } as any))), player);
            if (pos) positions.push(pos);
        }

        // 如果没有可用格子，使用当前格子作为单一舞位
        if (positions.length === 0) {
            positions.push({ c: Math.round(customer.c), r: Math.round(customer.r), pixelX: Math.round(customer.c) * TILE_SIZE, pixelY: Math.round(customer.r) * TILE_SIZE });
        }

        customer.dancePositions = positions;
        customer.danceIndex = 0;
        customer.danceStepInterval = Math.floor(Math.random() * (this.DANCE_STEP_MAX_FRAMES - this.DANCE_STEP_MIN_FRAMES + 1)) + this.DANCE_STEP_MIN_FRAMES;
        customer.danceStepTimer = customer.danceStepInterval;
        customer.swayTimer = 0;
        customer.swayOffset = 0;
    };

    /**
     * 更新顾客行为
     */
    updateCustomerBehavior = (
        customer: Agent,
        seats: {c: number, r: number, occupied: boolean}[],
        dirtyTables: Position[],
        npcs: Agent[],
        player: Agent
    ): void => {
        if (!customer.stateTimer) customer.stateTimer = 0;
        customer.stateTimer--;

        switch (customer.customerState) {
            case CustomerState.ENTERING:
                // 如果到达座位，开始等�?
                if (customer.path.length === 0 && customer.targetSeat) {
                    const seat = customer.targetSeat;
                    if (Math.abs(customer.c - seat.c) < 0.5 && Math.abs(customer.r - seat.r) < 0.5) {
                        customer.customerState = CustomerState.SEATED;
                        customer.stateTimer = Math.floor(Math.random() * 900) + 300; // 5-20秒等待时�?
                    }
                }
                break;

            case CustomerState.SEATED:
                // 等待时间结束，准备点�?
                if (customer.stateTimer <= 0) {
                    customer.customerState = CustomerState.READY_TO_ORDER;
                    customer.stateTimer = 0;
                }
                break;

            case CustomerState.READY_TO_ORDER:
                // 等待服务员来服务
                customer.customerState = CustomerState.WAITING_FOR_WAITER;
                break;

            case CustomerState.WAITING_FOR_WAITER:
                // 等待服务员，不需要特殊处理，服务员会主动找到这个顾客
                break;

            case CustomerState.ORDERING:
                // 正在点单，等待服务员完成订单处理
                break;

            case CustomerState.WAITING_DRINK:
                // 等待酒水准备完成
                break;

            case CustomerState.DRINKING:
                // 如果已经喝了足够时间（超过阈值）且尚未判断睡眠，50%概率进入睡眠
                if (customer.drinkDuration && !customer.sleepChecked) {
                    const elapsed = customer.drinkDuration - (customer.stateTimer || 0);
                    if (elapsed >= this.SLEEP_THRESHOLD_FRAMES) {
                        customer.sleepChecked = true;
                        if (Math.random() < this.SLEEP_PROBABILITY) {
                            // 进入睡眠状态
                            customer.customerState = CustomerState.SLEEPING;
                            customer.stateTimer = Math.floor(Math.random() * (this.SLEEP_MAX_FRAMES - this.SLEEP_MIN_FRAMES + 1)) + this.SLEEP_MIN_FRAMES;
                            break;
                        }
                    }
                }

                // 饮酒时间结束，可能跳舞或离开
                if (customer.stateTimer <= 0) {
                    customer.stateTimer = 0;

                    // 释放座位并添加清洁任务（立即释放座位）
                    if (customer.targetSeat) {
                        customer.targetSeat.occupied = false;
                        const seatInRef = seats.find(s => s.c === customer.targetSeat!.c && s.r === customer.targetSeat!.r);
                        if (seatInRef) seatInRef.occupied = false;
                        const nearbyTable = this.findNearbyTable(customer.targetSeat.c, customer.targetSeat.r);
                        if (nearbyTable && !dirtyTables.some(table => table.c === nearbyTable.c && table.r === nearbyTable.r)) {
                            dirtyTables.push(nearbyTable);
                        }
                        customer.targetSeat = undefined;
                    }

                    // 50% 概率跳舞，并且舞池未满
                    const currentDancers = npcs.filter(n => n.role === Role.CUSTOMER && n.customerState === CustomerState.DANCING).length;
                    if (Math.random() < this.DANCE_PROBABILITY && currentDancers < this.DANCE_CAPACITY) {
                        // 找到舞池空位置并前往
                        const dancePos = this.getDancePosition(npcs, player);
                        if (dancePos) {
                            customer.customerState = CustomerState.DANCING;
                            const path = this.pathFinding.findPath(customer, dancePos, Role.CUSTOMER, true, npcs, player);
                            if (path && path.length > 0) {
                                customer.path = path;
                                // 设置跳舞时长
                                customer.stateTimer = this.getRandomDanceDuration();
                            } else {
                                // 无法到达舞池，直接离开
                                customer.customerState = CustomerState.LEAVING;
                                const exitFromLeft = customer.c < COLS / 2;
                                const exitC = exitFromLeft ? 0 : COLS - 1;
                                const exitR = DOOR_ROW_START + Math.floor(Math.random() * (DOOR_ROW_END - DOOR_ROW_START + 1));
                                customer.path = this.pathFinding.findPath(customer, {c: exitC, r: exitR, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                            }
                        } else {
                            // 没有舞池空位，直接离开
                            customer.customerState = CustomerState.LEAVING;
                            const exitFromLeft = customer.c < COLS / 2;
                            const exitC = exitFromLeft ? 0 : COLS - 1;
                            const exitR = DOOR_ROW_START + Math.floor(Math.random() * (DOOR_ROW_END - DOOR_ROW_START + 1));
                            customer.path = this.pathFinding.findPath(customer, {c: exitC, r: exitR, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                        }
                    } else {
                        // 直接离开（原逻辑）
                        customer.customerState = CustomerState.LEAVING;
                        const exitFromLeft = customer.c < COLS / 2;
                        const exitC = exitFromLeft ? 0 : COLS - 1;
                        const exitR = DOOR_ROW_START + Math.floor(Math.random() * (DOOR_ROW_END - DOOR_ROW_START + 1));
                        customer.path = this.pathFinding.findPath(customer, {c: exitC, r: exitR, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                    }
                }
                break;

            case CustomerState.DANCING:
                // 正在前往舞池：等待到达
                if (customer.path.length > 0) {
                    // 在移动途中，保持原有 stateTimer（全局舞时长）继续递减
                    // 同时可以累积 swayTimer 以显示移动中的摆动
                    if (!customer.swayTimer) customer.swayTimer = 0;
                    customer.swayTimer++;
                    customer.swayOffset = Math.sin(customer.swayTimer * 0.1) * this.DANCE_SWAY_AMPLITUDE;
                    break;
                }

                // 已到达舞位，确保已初始化舞步数据
                if (!customer.dancePositions || customer.dancePositions.length === 0) {
                    this.initDanceForCustomer(customer, npcs, player);
                }

                // 初始化/递减舞步计时器
                if (typeof customer.danceStepTimer === 'undefined') {
                    customer.danceStepTimer = customer.danceStepInterval || Math.floor(Math.random() * (this.DANCE_STEP_MAX_FRAMES - this.DANCE_STEP_MIN_FRAMES + 1)) + this.DANCE_STEP_MIN_FRAMES;
                }

                if (customer.danceStepTimer! > 0) {
                    customer.danceStepTimer!--;
                }

                // 视觉摆动（在舞池等待或停步时也有节奏感）
                if (!customer.swayTimer) customer.swayTimer = 0;
                customer.swayTimer++;
                customer.swayOffset = Math.sin(customer.swayTimer * 0.12) * this.DANCE_SWAY_AMPLITUDE;

                // 如果舞步计时器到了且舞蹈还没结束，尝试移动到下一个舞位
                if (customer.danceStepTimer! <= 0 && customer.stateTimer! > 0) {
                    const positions = customer.dancePositions || [];
                    if (positions.length > 0) {
                        // 循环选择下一个目标位置
                        const startIndex = (typeof customer.danceIndex === 'number') ? customer.danceIndex : 0;
                        let nextIndex = (startIndex + 1) % positions.length;
                        let attempts = 0;
                        let foundPath: Position[] | null = null;

                        while (attempts < positions.length && !foundPath) {
                            const targetPos = positions[nextIndex];
                            // 请求寻路到目标位置
                            const path = this.pathFinding.findPath(customer, targetPos, Role.CUSTOMER, true, npcs, player);
                            if (path && path.length > 0) {
                                foundPath = path;
                                customer.danceIndex = nextIndex;
                                break;
                            }
                            nextIndex = (nextIndex + 1) % positions.length;
                            attempts++;
                        }

                        if (foundPath) {
                            customer.path = foundPath;
                            customer.danceStepTimer = customer.danceStepInterval || Math.floor(Math.random() * (this.DANCE_STEP_MAX_FRAMES - this.DANCE_STEP_MIN_FRAMES + 1)) + this.DANCE_STEP_MIN_FRAMES;
                        } else {
                            // 无法移动到其他舞位，重置计时器稍后再试
                            customer.danceStepTimer = Math.floor(Math.random() * (this.DANCE_STEP_MAX_FRAMES - this.DANCE_STEP_MIN_FRAMES + 1)) + this.DANCE_STEP_MIN_FRAMES;
                        }
                    }
                }

                // 舞蹈结束处理（与此前逻辑保持一致）
                if (customer.stateTimer! <= 0) {
                    customer.stateTimer = 0;

                    if (customer.danceThenSeat && customer.targetSeat) {
                        const pathToSeat = this.pathFinding.findPath(customer, {c: customer.targetSeat.c, r: customer.targetSeat.r, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                        if (pathToSeat && pathToSeat.length > 0) {
                            customer.path = pathToSeat;
                            customer.customerState = CustomerState.ENTERING; // 使用 ENTERING 复用就座到位检测
                            customer.danceThenSeat = false;
                        } else {
                            customer.customerState = CustomerState.LEAVING;
                            const exitFromLeft = customer.c < COLS / 2;
                            const exitC = exitFromLeft ? 0 : COLS - 1;
                            const exitR = DOOR_ROW_START + Math.floor(Math.random() * (DOOR_ROW_END - DOOR_ROW_START + 1));
                            customer.path = this.pathFinding.findPath(customer, {c: exitC, r: exitR, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                        }

                    } else {
                        customer.customerState = CustomerState.LEAVING;
                        const exitFromLeft = customer.c < COLS / 2;
                        const exitC = exitFromLeft ? 0 : COLS - 1;
                        const exitR = DOOR_ROW_START + Math.floor(Math.random() * (DOOR_ROW_END - DOOR_ROW_START + 1));
                        customer.path = this.pathFinding.findPath(customer, {c: exitC, r: exitR, pixelX: 0, pixelY: 0}, Role.CUSTOMER, true, npcs, player);
                    }
                }
                break;

            case CustomerState.SLEEPING:
                // 睡眠状态结束后按概率决定下一步行为：30%继续饮酒，40%重新点单，30%去跳舞
                if (customer.stateTimer! <= 0) {
                    const r = Math.random();

                    if (r < 0.3) {
                        // 30%：继续饮酒
                        const drinkDuration = Math.floor(Math.random() * 64800) + 7200; // 2-20 minutes
                        customer.customerState = CustomerState.DRINKING;
                        customer.stateTimer = drinkDuration;
                        customer.drinkDuration = drinkDuration;
                        customer.sleepChecked = false;
                    } else if (r < 0.7) {
                        // 40%：回到点单流程
                        customer.customerState = CustomerState.READY_TO_ORDER;
                        customer.stateTimer = 0;
                        customer.sleepChecked = false;
                    } else {
                        // 30%：去跳舞（如果舞池未满）
                        const currentDancers = npcs.filter(n => n.role === Role.CUSTOMER && n.customerState === CustomerState.DANCING).length;
                        if (currentDancers < this.DANCE_CAPACITY) {
                            const dancePos = this.getDancePosition(npcs, player);
                            if (dancePos) {
                                customer.customerState = CustomerState.DANCING;
                                const path = this.pathFinding.findPath(customer, dancePos, Role.CUSTOMER, true, npcs, player);
                                if (path && path.length > 0) {
                                    customer.path = path;
                                    customer.stateTimer = this.getRandomDanceDuration();
                                } else {
                                    // 无法到达舞池，转为点单
                                    customer.customerState = CustomerState.READY_TO_ORDER;
                                    customer.stateTimer = 0;
                                }
                            } else {
                                // 无可用舞位
                                customer.customerState = CustomerState.READY_TO_ORDER;
                                customer.stateTimer = 0;
                            }
                        } else {
                            // 舞池已满 → 返回点单
                            customer.customerState = CustomerState.READY_TO_ORDER;
                            customer.stateTimer = 0;
                        }

                        customer.sleepChecked = false;
                    }
                }
                break;

            case CustomerState.LEAVING:
                // 如果到达门口，标记为删除
                if (customer.path.length === 0) {
                    customer.markedForDeletion = true;
                }
                break;
        }
    };

    /**
     * 更新服务员行�?
     */
    updateWaiterBehavior = (
        waiter: Agent,
        npcs: Agent[],
        player: Agent,
        readyDrinks: Order[],
        pendingOrders: Order[],
        getBarPositionOrders: (c: number, r: number) => Order[],
        getBarPositionMoney: (c: number, r: number) => number,
        setBarPositionMoney: (c: number, r: number, amount: number) => void
    ): void => {
        if (!waiter.waiterState) waiter.waiterState = WaiterState.IDLE;
        if (!waiter.stateTimer) waiter.stateTimer = 0;
        waiter.stateTimer++;

        switch (waiter.waiterState) {
            case WaiterState.IDLE:
                // 优先检查是否有准备好的餐饮需要送达（按时间顺序）
                const availableOrders = readyDrinks.filter(order => {
                    const isBeingHandled = npcs.some(w => 
                        w.role === Role.WAITER && 
                        w.id !== waiter.id &&
                        (w.waiterState === WaiterState.WAITING_FOR_DRINK || w.waiterState === WaiterState.DELIVERING_DRINK) &&
                        w.targetCustomerId === order.customerId
                    );
                    return !isBeingHandled;
                });

                if (availableOrders.length > 0) {
                    // 按订单创建时间排序，优先处理最早的订单
                    const earliestOrder = availableOrders.reduce((earliest, current) => 
                        current.createdAt < earliest.createdAt ? current : earliest
                    );
                    
                    waiter.waiterState = WaiterState.WAITING_FOR_DRINK;
                    waiter.targetCustomerId = earliestOrder.customerId;
                    waiter.stateTimer = 0;
                    
                    // 前往吧台取餐
                    const barPos = this.findAvailableBarPosition();
                    if (barPos) {
                        waiter.targetBarPosition = barPos;
                        const walkablePos = this.pathFinding.findNearestWalkablePosition(barPos.c, barPos.r, npcs, player);
                        if (walkablePos) {
                            waiter.path = this.pathFinding.findPath(waiter, walkablePos, Role.WAITER, true, npcs, player);
                        }
                    }
                } else {
                    // 寻找需要点单的顾客
                    const customerNeedingService = npcs.find(npc => 
                        npc.role === Role.CUSTOMER && 
                        npc.customerState === CustomerState.WAITING_FOR_WAITER &&
                        !npcs.some(w => w.role === Role.WAITER && w.targetCustomerId === npc.id)
                    );

                    if (customerNeedingService) {
                        waiter.waiterState = WaiterState.GOING_TO_CUSTOMER;
                        waiter.targetCustomerId = customerNeedingService.id;
                        waiter.stateTimer = 0;
                        
                        const targetPos = this.pathFinding.findNearestWalkablePosition(customerNeedingService.c, customerNeedingService.r, npcs, player);
                        if (targetPos) {
                            waiter.path = this.pathFinding.findPath(waiter, targetPos, Role.WAITER, true, npcs, player);
                        }
                    } else {
                        // 没有任务时闲�?
                        if (waiter.stateTimer > 300 && waiter.path.length === 0) {
                            const wanderPos = this.getRandomWanderPosition(npcs, player);
                            if (wanderPos) {
                                waiter.path = this.pathFinding.findPath(waiter, wanderPos, Role.WAITER, true, npcs, player);
                                waiter.stateTimer = 0;
                            }
                        }
                    }
                }
                break;

            case WaiterState.GOING_TO_CUSTOMER:
                if (waiter.path.length === 0) {
                    const customer = npcs.find(npc => npc.id === waiter.targetCustomerId);
                    if (customer && customer.customerState === CustomerState.WAITING_FOR_WAITER) {
                        waiter.waiterState = WaiterState.TAKING_ORDER;
                        customer.customerState = CustomerState.ORDERING;
                        waiter.stateTimer = 0;
                    } else {
                        waiter.waiterState = WaiterState.IDLE;
                        waiter.targetCustomerId = undefined;
                    }
                }
                break;

            case WaiterState.TAKING_ORDER:
                if (waiter.stateTimer > 180) { // 3�?
                    const customer = npcs.find(npc => npc.id === waiter.targetCustomerId);
                    if (customer) {
                        const order: Order = {
                            id: Date.now(),
                            customerId: customer.id,
                            waiterId: waiter.id,
                            status: 'PENDING',
                            drinkType: '啤酒',
                            price: 20,
                            createdAt: Date.now()
                        };

                        customer.customerState = CustomerState.WAITING_DRINK;
                        waiter.waiterState = WaiterState.GOING_TO_BAR;
                        waiter.stateTimer = 0;
                        
                        const barPos = this.findAvailableBarPosition();
                        if (barPos) {
                            waiter.targetBarPosition = barPos;
                            const walkablePos = this.pathFinding.findNearestWalkablePosition(barPos.c, barPos.r, npcs, player);
                            if (walkablePos) {
                                waiter.path = this.pathFinding.findPath(waiter, walkablePos, Role.WAITER, true, npcs, player);
                            }
                        }
                        
                        pendingOrders.push(order);
                    }
                }
                break;

            case WaiterState.GOING_TO_BAR:
                if (waiter.path.length === 0 && waiter.targetBarPosition) {
                    const orderIndex = pendingOrders.findIndex(order => order.waiterId === waiter.id);
                    if (orderIndex !== -1) {
                        const order = pendingOrders[orderIndex];
                        
                        const barOrders = getBarPositionOrders(waiter.targetBarPosition.c, waiter.targetBarPosition.r);
                        barOrders.push(order);
                        
                        const currentMoney = getBarPositionMoney(waiter.targetBarPosition.c, waiter.targetBarPosition.r);
                        setBarPositionMoney(waiter.targetBarPosition.c, waiter.targetBarPosition.r, currentMoney + order.price);
                        
                        pendingOrders.splice(orderIndex, 1);
                    }
                    
                    waiter.waiterState = WaiterState.IDLE;
                    waiter.targetCustomerId = undefined;
                    waiter.targetBarPosition = undefined;
                    waiter.stateTimer = 0;
                }
                break;

            case WaiterState.WAITING_FOR_DRINK:
                const readyOrder = readyDrinks.find(order => order.customerId === waiter.targetCustomerId);
                if (readyOrder) {
                    const orderIndex = readyDrinks.indexOf(readyOrder);
                    readyDrinks.splice(orderIndex, 1);
                    
                    waiter.waiterState = WaiterState.DELIVERING_DRINK;
                    waiter.stateTimer = 0;
                    
                    const customer = npcs.find(npc => npc.id === waiter.targetCustomerId);
                    if (customer) {
                        const targetPos = this.pathFinding.findNearestWalkablePosition(customer.c, customer.r, npcs, player);
                        if (targetPos) {
                            waiter.path = this.pathFinding.findPath(waiter, targetPos, Role.WAITER, true, npcs, player);
                        }
                    }
                }
                break;

            case WaiterState.DELIVERING_DRINK:
                if (waiter.path.length === 0) {
                    const customer = npcs.find(npc => npc.id === waiter.targetCustomerId);
                    if (customer) {
                        const drinkDuration = Math.floor(Math.random() * 64800) + 7200; // 2-20 minutes (frames)
                        customer.customerState = CustomerState.DRINKING;
                        customer.stateTimer = drinkDuration;
                        customer.drinkDuration = drinkDuration; // 用于检测是否超过睡眠阈值
                        customer.sleepChecked = false;
                    }
                    
                    waiter.waiterState = WaiterState.IDLE;
                    waiter.targetCustomerId = undefined;
                    waiter.stateTimer = 0;
                }
                break;
        }
    };

    /**
     * 更新清洁工行�?
     */
    updateCleanerBehavior = (
        cleaner: Agent,
        dirtyTables: Position[],
        npcs: Agent[],
        player: Agent
    ): void => {
        if (!cleaner.cleanerState) cleaner.cleanerState = CleanerState.IDLE;
        if (!cleaner.stateTimer) cleaner.stateTimer = 0;
        cleaner.stateTimer++;

        switch (cleaner.cleanerState) {
            case CleanerState.IDLE:
                if (dirtyTables.length > 0) {
                    const dirtyTable = dirtyTables[0];
                    cleaner.targetCleanPosition = dirtyTable;
                    cleaner.cleanerState = CleanerState.GOING_TO_CLEAN;
                    cleaner.stateTimer = 0;
                    
                    const cleanPos = this.pathFinding.findNearestWalkablePosition(dirtyTable.c, dirtyTable.r, npcs, player);
                    if (cleanPos) {
                        cleaner.path = this.pathFinding.findPath(cleaner, cleanPos, Role.CLEANER, true, npcs, player);
                    }
                } else {
                    if (cleaner.stateTimer > 300) {
                        cleaner.cleanerState = CleanerState.WANDERING;
                        cleaner.stateTimer = 0;
                        
                        const wanderPos = this.getRandomWanderPosition(npcs, player);
                        if (wanderPos) {
                            cleaner.path = this.pathFinding.findPath(cleaner, wanderPos, Role.CLEANER, true, npcs, player);
                        }
                    }
                }
                break;

            case CleanerState.GOING_TO_CLEAN:
                if (cleaner.path.length === 0) {
                    cleaner.cleanerState = CleanerState.CLEANING;
                    cleaner.stateTimer = 0;
                }
                break;

            case CleanerState.CLEANING:
                if (cleaner.stateTimer > 180) { // 3�?
                    if (cleaner.targetCleanPosition) {
                        const index = dirtyTables.findIndex(table => 
                            table.c === cleaner.targetCleanPosition!.c && table.r === cleaner.targetCleanPosition!.r
                        );
                        if (index !== -1) {
                            dirtyTables.splice(index, 1);
                        }
                        cleaner.targetCleanPosition = undefined;
                    }
                    
                    cleaner.cleanerState = CleanerState.IDLE;
                    cleaner.stateTimer = 0;
                }
                break;

            case CleanerState.WANDERING:
                if (cleaner.path.length === 0) {
                    if (cleaner.stateTimer > 180) {
                        const wanderPos = this.getRandomWanderPosition(npcs, player);
                        if (wanderPos) {
                            cleaner.path = this.pathFinding.findPath(cleaner, wanderPos, Role.CLEANER, true, npcs, player);
                            cleaner.stateTimer = 0;
                        }
                    }
                }
                
                if (dirtyTables.length > 0) {
                    cleaner.cleanerState = CleanerState.IDLE;
                    cleaner.stateTimer = 0;
                    cleaner.path = [];
                }
                break;
        }
    };

    /**
     * 更新调酒师行为
     */
    updateBartenderBehavior = (
        bartender: Agent,
        npcs: Agent[],
        player: Agent,
        pendingOrders: Order[],
        readyDrinks: Order[]
    ): void => {
        if (!bartender.bartenderState) bartender.bartenderState = BartenderState.IDLE;
        if (!bartender.stateTimer) bartender.stateTimer = 0;
        if (!bartender.homePosition) {
            // 设置调酒师的家位置（吧台区域内的随机位置）
            bartender.homePosition = this.getRandomBarPosition();
        }

        bartender.stateTimer++;

        switch (bartender.bartenderState) {
            case BartenderState.IDLE:
                // 检查是否有待处理的订单
                const availableOrder = this.findAvailableOrderForBartender(pendingOrders, npcs, bartender.id);
                
                if (availableOrder) {
                    // 开始处理订单 - 必须移动到吧台内侧工作位置
                    bartender.currentOrder = availableOrder;
                    availableOrder.bartenderId = bartender.id;
                    availableOrder.status = 'PREPARING';
                    bartender.stateTimer = 0;
                    
                    // 获取吧台内侧的工作位置
                    const workPosition = this.getBarWorkPosition(npcs, player);
                    if (workPosition) {
                        // 检查调酒师是否已经在工作位置
                        const currentC = Math.round(bartender.c);
                        const currentR = Math.round(bartender.r);
                        const isAtWorkPosition = (currentC === workPosition.c && currentR === workPosition.r);
                        
                        if (isAtWorkPosition) {
                            // 已经在工作位置，直接开始制作
                            bartender.bartenderState = BartenderState.PREPARING_DRINK;
                        } else {
                            // 需要移动到工作位置
                            bartender.path = this.pathFinding.findPath(bartender, workPosition, Role.BARTENDER, true, npcs, player);
                            bartender.bartenderState = BartenderState.MOVING;
                        }
                    } else {
                        // 如果没有可用的工作位置，等待下一次检查
                        availableOrder.bartenderId = undefined;
                        availableOrder.status = 'PENDING';
                        bartender.currentOrder = undefined;
                    }
                } else {
                    // 没有订单时的闲置行为：小范围随机移动
                    if (bartender.stateTimer > 180 + Math.random() * 300 && bartender.path.length === 0) { // 3-8秒
                        const wanderPos = this.getBartenderWanderPosition(bartender, npcs, player);
                        if (wanderPos) {
                            bartender.path = this.pathFinding.findPath(bartender, wanderPos, Role.BARTENDER, true, npcs, player);
                            bartender.stateTimer = 0;
                        }
                    }
                }
                break;

            case BartenderState.MOVING:
                // 移动到工作位置后开始制作
                if (bartender.path.length === 0) {
                    bartender.bartenderState = BartenderState.PREPARING_DRINK;
                    bartender.stateTimer = 0;
                }
                break;

            case BartenderState.PREPARING_DRINK:
                // 制作饮品（10-30秒）
                const preparationTime = 600 + Math.random() * 1200; // 10-30秒（假设60fps）
                
                if (bartender.stateTimer > preparationTime) {
                    // 完成制作
                    if (bartender.currentOrder) {
                        bartender.currentOrder.status = 'READY';
                        readyDrinks.push(bartender.currentOrder);
                        
                        // 从待处理订单中移除
                        const orderIndex = pendingOrders.findIndex(order => order.id === bartender.currentOrder!.id);
                        if (orderIndex !== -1) {
                            pendingOrders.splice(orderIndex, 1);
                        }
                        
                        bartender.currentOrder = undefined;
                    }
                    
                    bartender.bartenderState = BartenderState.IDLE;
                    bartender.stateTimer = 0;
                }
                break;
        }
    };

    /**
     * 更新诗人行为
     */
    updatePoetBehavior = (poet: Agent, npcs: Agent[], player: Agent): void => {
        if (!poet.poetState) poet.poetState = PoetState.SITTING_THINKING;
        if (!poet.stateTimer) poet.stateTimer = 0;
        poet.stateTimer++;

        switch (poet.poetState) {
            case PoetState.SITTING_THINKING:
                if (poet.stateTimer > 1800 + Math.random() * 1800) {
                    const nextStates = [PoetState.WRITING, PoetState.WANDERING];
                    poet.poetState = nextStates[Math.floor(Math.random() * nextStates.length)];
                    poet.stateTimer = 0;
                    
                    if (poet.poetState === PoetState.WRITING) {
                        const deskNearPos = this.pathFinding.findNearestWalkablePosition(45, 26, npcs, player);
                        if (deskNearPos) {
                            poet.path = this.pathFinding.findPath(poet, deskNearPos, Role.POET, true, npcs, player);
                        }
                    } else if (poet.poetState === PoetState.WANDERING) {
                        const wanderPos = this.getPoetWanderPosition(npcs, player);
                        if (wanderPos) {
                            poet.path = this.pathFinding.findPath(poet, wanderPos, Role.POET, true, npcs, player);
                        }
                    }
                }
                break;

            case PoetState.WRITING:
                if (poet.stateTimer > 3600 + Math.random() * 3600) {
                    const nextStates = [PoetState.SITTING_THINKING, PoetState.WANDERING];
                    poet.poetState = nextStates[Math.floor(Math.random() * nextStates.length)];
                    poet.stateTimer = 0;
                    
                    if (poet.poetState === PoetState.SITTING_THINKING) {
                        const chairNearPos = this.pathFinding.findNearestWalkablePosition(44, 26, npcs, player);
                        if (chairNearPos) {
                            poet.path = this.pathFinding.findPath(poet, chairNearPos, Role.POET, true, npcs, player);
                        }
                    } else if (poet.poetState === PoetState.WANDERING) {
                        const wanderPos = this.getPoetWanderPosition(npcs, player);
                        if (wanderPos) {
                            poet.path = this.pathFinding.findPath(poet, wanderPos, Role.POET, true, npcs, player);
                        }
                    }
                }
                break;

            case PoetState.WANDERING:
                if (poet.path.length === 0) {
                    if (poet.stateTimer > 1200 + Math.random() * 1200) {
                        const nextStates = [PoetState.SITTING_THINKING, PoetState.WRITING];
                        poet.poetState = nextStates[Math.floor(Math.random() * nextStates.length)];
                        poet.stateTimer = 0;
                        
                        if (poet.poetState === PoetState.SITTING_THINKING) {
                            const chairNearPos = this.pathFinding.findNearestWalkablePosition(44, 26, npcs, player);
                            if (chairNearPos) {
                                poet.path = this.pathFinding.findPath(poet, chairNearPos, Role.POET, true, npcs, player);
                            }
                        } else if (poet.poetState === PoetState.WRITING) {
                            const deskNearPos = this.pathFinding.findNearestWalkablePosition(45, 26, npcs, player);
                            if (deskNearPos) {
                                poet.path = this.pathFinding.findPath(poet, deskNearPos, Role.POET, true, npcs, player);
                            }
                        }
                    } else {
                        const wanderPos = this.getPoetWanderPosition(npcs, player);
                        if (wanderPos) {
                            poet.path = this.pathFinding.findPath(poet, wanderPos, Role.POET, true, npcs, player);
                        }
                    }
                }
                break;
        }
    };

    /**
     * 更新音乐家行为（轻微晃动/弹奏状态）
     */
    updateMusicianBehavior = (musician: Agent): void => {
        if (!musician.musicianState) musician.musicianState = MusicianState.PLAYING;
        if (!musician.swayTimer) musician.swayTimer = 0;
        if (typeof musician.swayOffset !== 'number') musician.swayOffset = 0;

        musician.swayTimer++;

        if (musician.musicianState === MusicianState.PLAYING) {
            // 放慢振幅与频率，使晃动更缓和（周期约1.8s，幅度约1.2px）
            musician.swayOffset = Math.sin(musician.swayTimer * 0.06) * 1.2;

            // 更长时间后偶尔进入休息状态（概率更低）
            if (musician.swayTimer > 180 && Math.random() < 0.008) {
                musician.musicianState = MusicianState.RESTING;
                musician.swayTimer = 0;
            }
        } else {
            // 休息中不晃动
            musician.swayOffset = 0;

            // 休息后稍长时间恢复弹奏（概率稍高）
            if (musician.swayTimer > 120 && Math.random() < 0.08) {
                musician.musicianState = MusicianState.PLAYING;
                musician.swayTimer = 0;
            }
        }
    };

    /**
     * 更新圣诞老人行为：缓慢摇摆
     */
    updateSantaBehavior = (santa: Agent): void => {
        if (!santa.swayTimer) santa.swayTimer = 0;
        if (typeof santa.swayOffset !== 'number') santa.swayOffset = 0;

        santa.swayTimer++;

        // 非常缓慢的左右摇摆（周期约10s，幅度约1.5px）
        santa.swayOffset = Math.sin(santa.swayTimer * 0.01) * 1.5;
    };

    /**
     * 更新三花猫行为：随机四处走动
     */
    updateCatBehavior = (cat: Agent, npcs: Agent[], player: Agent): void => {
        // 更新朝向：检测移动方向
        if (cat.path.length > 0) {
            const target = cat.path[0];
            const dx = target.c - cat.c;
            if (Math.abs(dx) > 0.1) {
                cat.facingRight = dx > 0;
            }
        }
        if (!cat.wanderTimer) cat.wanderTimer = 0;

        // 每隔一段时间（约3-8秒）选择一个新的目标位置
        cat.wanderTimer++;
        
        // 如果没有路径或已经到达目标，且计时器到期，则选择新目标
        if (cat.wanderTimer > 180 + Math.random() * 300) { // 3-8秒
            cat.wanderTimer = 0;
            
            // 随机选择酒馆内的一个位置（猫可以到达家具上）
            const targetPos = this.getRandomWalkablePositionForCat(npcs, player);
            if (targetPos) {
                // 使用寻路系统找到路径
                const startPos: Position = {
                    c: Math.round(cat.c),
                    r: Math.round(cat.r),
                    pixelX: Math.round(cat.c) * TILE_SIZE,
                    pixelY: Math.round(cat.r) * TILE_SIZE
                };
                
                const path = this.pathFinding.findPath(
                    startPos, 
                    targetPos, 
                    Role.CAT,
                    false,
                    npcs,
                    player
                );
                
                if (path && path.length > 0) {
                    cat.path = path;
                }
            }
        }

        // 如果有路径，沿着路径移动
        if (cat.path && cat.path.length > 0) {
            const nextWaypoint = cat.path[0];
            const dx = nextWaypoint.c - cat.c;
            const dy = nextWaypoint.r - cat.r;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                // 到达当前路径点，移除它
                cat.path.shift();
            } else {
                // 朝向下一个路径点移动
                const moveSpeed = cat.speed / 60; // 每帧移动的距离
                cat.c += (dx / distance) * moveSpeed;
                cat.r += (dy / distance) * moveSpeed;
                cat.pixelX = cat.c * TILE_SIZE;
                cat.pixelY = cat.r * TILE_SIZE;
            }
        }
    };

    // 获取一个随机的可行走位置
    private getRandomWalkablePosition = (npcs: Agent[], player: Agent): Position | null => {
        // 在酒馆范围内随机选择位置
        for (let attempts = 0; attempts < 50; attempts++) {
            const c = Math.floor(Math.random() * (COLS - 4)) + 2; // 避免边缘
            const r = Math.floor(Math.random() * (ROWS - 4)) + 2;
            
            if (this.pathFinding.isWalkable(c, r) && 
                !this.pathFinding.isOccupiedByChar(c, r, npcs, player)) {
                return { c, r, pixelX: c * TILE_SIZE, pixelY: r * TILE_SIZE };
            }
        }
        return null;
    };

    // 为猫获取一个随机的可行走位置（可以在家具上，但避开舞池）
    private getRandomWalkablePositionForCat = (npcs: Agent[], player: Agent): Position | null => {
        // 舞池中心和半径
        const centerC = COLS / 2;
        const centerR = ROWS / 2;
        const danceFloorRadius = 6; // 舞池半径（以tile为单位）
        
        // 在酒馆范围内随机选择位置
        for (let attempts = 0; attempts < 50; attempts++) {
            const c = Math.floor(Math.random() * (COLS - 4)) + 2; // 避免边缘
            const r = Math.floor(Math.random() * (ROWS - 4)) + 2;
            
            // 检查是否在舞池范围内
            const distanceToCenter = Math.sqrt(
                Math.pow(c - centerC, 2) + Math.pow(r - centerR, 2)
            );
            const isInDanceFloor = distanceToCenter < danceFloorRadius;
            
            // 使用猫的特殊可行走检查（忽略家具）并且避开舞池
            if (this.pathFinding.isWalkableForCat(c, r) && !isInDanceFloor) {
                return { c, r, pixelX: c * TILE_SIZE, pixelY: r * TILE_SIZE };
            }
        }
        return null;
    };

    // 寻找一个舞池附近的可站位位置
    public getDancePosition = (npcs: Agent[], player: Agent): Position | null => {
        // 舞池中心为地图中心附近，使用比 getPoetWanderPosition 更紧凑的范围
        const centerC = Math.floor(COLS / 2);
        const centerR = Math.floor(ROWS / 2);
        const minC = centerC - 3, maxC = centerC + 3;
        const minR = centerR - 3, maxR = centerR + 3;

        for (let attempts = 0; attempts < 30; attempts++) {
            const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
            const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
            if (this.pathFinding.isWalkable(c, r) && !this.pathFinding.isOccupiedByChar(c, r, npcs, player)) {
                return { c, r, pixelX: c * TILE_SIZE, pixelY: r * TILE_SIZE };
            }
        }
        return null;
    };

    // 辅助方法
    private findNearbyTable = (seatC: number, seatR: number): Position | null => {
        const neighbors = [
            { c: seatC - 1, r: seatR },
            { c: seatC + 1, r: seatR },
            { c: seatC, r: seatR - 1 },
            { c: seatC, r: seatR + 1 },
            { c: seatC - 1, r: seatR - 1 },
            { c: seatC + 1, r: seatR - 1 },
            { c: seatC - 1, r: seatR + 1 },
            { c: seatC + 1, r: seatR + 1 }
        ];

        for (const pos of neighbors) {
            const furniture = this.furnitureItems.find(item => item.c === pos.c && item.r === pos.r);
            if (furniture && (furniture.type.includes('TABLE') || furniture.type === 'ROUND_TABLE')) {
                return { c: pos.c, r: pos.r, pixelX: 0, pixelY: 0 };
            }
        }
        return null;
    };

    private findAvailableBarPosition = (): Position | null => {
        const barPositions = [];
        for (let c = BAR_COL_START; c <= BAR_COL_END; c++) {
            for (let r = BAR_ROW_START; r <= BAR_ROW_END; r++) {
                barPositions.push({ c, r });
            }
        }

        const randomPosition = barPositions[Math.floor(Math.random() * barPositions.length)];
        return { c: randomPosition.c, r: randomPosition.r, pixelX: 0, pixelY: 0 };
    };

    private getRandomWanderPosition = (npcs: Agent[], player: Agent): Position | null => {
        const wanderAreas = [
            { minC: 16, maxC: 31, minR: 9, maxR: 23 },
            { minC: 5, maxC: 14, minR: 8, maxR: 26 },
            { minC: 33, maxC: 41, minR: 8, maxR: 25 },
            { minC: 2, maxC: 40, minR: 3, maxR: 6 },
            { minC: 2, maxC: 40, minR: 27, maxR: 29 }
        ];

        const area = wanderAreas[Math.floor(Math.random() * wanderAreas.length)];
        
        for (let attempts = 0; attempts < 20; attempts++) {
            const c = Math.floor(Math.random() * (area.maxC - area.minC + 1)) + area.minC;
            const r = Math.floor(Math.random() * (area.maxR - area.minR + 1)) + area.minR;
            
            if (this.pathFinding.isWalkable(c, r) && !this.pathFinding.isOccupiedByChar(c, r, npcs, player)) {
                return { c, r, pixelX: 0, pixelY: 0 };
            }
        }
        
        return null;
    };

    private getPoetWanderPosition = (npcs: Agent[], player: Agent): Position | null => {
        const poetArea = { minC: 42, maxC: 46, minR: 25, maxR: 29 };
        
        for (let attempts = 0; attempts < 10; attempts++) {
            const c = Math.floor(Math.random() * (poetArea.maxC - poetArea.minC + 1)) + poetArea.minC;
            const r = Math.floor(Math.random() * (poetArea.maxR - poetArea.minR + 1)) + poetArea.minR;
            
            if (this.pathFinding.isWalkable(c, r) && !this.pathFinding.isOccupiedByChar(c, r, npcs, player)) {
                return { c, r, pixelX: 0, pixelY: 0 };
            }
        }
        
        return null;
    };

    // 调酒师相关辅助方法
    private findAvailableOrderForBartender = (pendingOrders: Order[], npcs: Agent[], bartenderId: number): Order | null => {
        // 找到最早的未被处理的订单
        const availableOrders = pendingOrders.filter(order => 
            order.status === 'PENDING' && 
            !order.bartenderId &&
            !npcs.some(npc => 
                npc.role === Role.BARTENDER && 
                npc.id !== bartenderId && 
                npc.currentOrder?.id === order.id
            )
        );

        if (availableOrders.length === 0) return null;

        // 按创建时间排序，返回最早的订单
        return availableOrders.reduce((earliest, current) => 
            current.createdAt < earliest.createdAt ? current : earliest
        );
    };

    private getRandomBarPosition = (): Position => {
        // 调酒师工作区域：吧台后面到墙壁的12个格子
        const BARTENDER_MIN_C = 44; // 吧台后面开始
        const BARTENDER_MAX_C = 46; // 到右墙
        const BARTENDER_MIN_R = 13; // 吧台顶部
        const BARTENDER_MAX_R = 19; // 吧台底部

        const c = Math.floor(Math.random() * (BARTENDER_MAX_C - BARTENDER_MIN_C + 1)) + BARTENDER_MIN_C;
        const r = Math.floor(Math.random() * (BARTENDER_MAX_R - BARTENDER_MIN_R + 1)) + BARTENDER_MIN_R;

        return { c, r, pixelX: c * TILE_SIZE, pixelY: r * TILE_SIZE };
    };

    private getBarWorkPosition = (npcs: Agent[], player: Agent): Position | null => {
        // 吧台内侧的5个工作位置（制作饮品的专用位置）
        // 吧台内侧：第45列，第14-18行（5个格子）
        const BAR_WORK_POSITIONS = [
            { c: 45, r: 14 },
            { c: 45, r: 15 },
            { c: 45, r: 16 },
            { c: 45, r: 17 },
            { c: 45, r: 18 }
        ];

        // 随机打乱工作位置顺序，然后找到第一个可用的
        const shuffledPositions = [...BAR_WORK_POSITIONS].sort(() => Math.random() - 0.5);
        
        for (const pos of shuffledPositions) {
            if (this.pathFinding.isWalkable(pos.c, pos.r) && 
                !this.pathFinding.isOccupiedByChar(pos.c, pos.r, npcs, player)) {
                return { c: pos.c, r: pos.r, pixelX: pos.c * TILE_SIZE, pixelY: pos.r * TILE_SIZE };
            }
        }
        
        return null; // 如果所有工作位置都被占用
    };

    private getBartenderWanderPosition = (bartender: Agent, npcs: Agent[], player: Agent): Position | null => {
        // 调酒师只在吧台后面的12个格子内移动（吧台与右墙之间）
        // 吧台区域：43-45列，13-19行
        // 调酒师工作区域：44-46列，13-19行（吧台后面到墙壁）
        const BARTENDER_MIN_C = 44; // 吧台后面开始
        const BARTENDER_MAX_C = 46; // 到右墙
        const BARTENDER_MIN_R = 13; // 吧台顶部
        const BARTENDER_MAX_R = 19; // 吧台底部
        
        // 在调酒师工作区域内随机选择位置
        for (let attempts = 0; attempts < 15; attempts++) {
            const targetC = Math.floor(Math.random() * (BARTENDER_MAX_C - BARTENDER_MIN_C + 1)) + BARTENDER_MIN_C;
            const targetR = Math.floor(Math.random() * (BARTENDER_MAX_R - BARTENDER_MIN_R + 1)) + BARTENDER_MIN_R;
            
            // 确保不选择当前位置
            if (targetC === Math.round(bartender.c) && targetR === Math.round(bartender.r)) {
                continue;
            }
            
            if (this.pathFinding.isWalkable(targetC, targetR) && 
                !this.pathFinding.isOccupiedByChar(targetC, targetR, npcs, player)) {
                return { c: targetC, r: targetR, pixelX: targetC * TILE_SIZE, pixelY: targetR * TILE_SIZE };
            }
        }
        
        return null;
    };

    private getDistance = (pos1: Position, pos2: Position): number => {
        const dx = pos1.c - pos2.c;
        const dy = pos1.r - pos2.r;
        return Math.sqrt(dx * dx + dy * dy);
    };
}
