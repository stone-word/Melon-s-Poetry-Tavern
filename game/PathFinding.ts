/**
 * ==============================================================================
 * 寻路算法 (Pathfinding System)
 * ==============================================================================
 * 处理游戏中所有角色的寻路逻辑，包括A*算法和路径优化
 */

import { Position, Agent, Role, COLS, ROWS } from '../types';

export class PathFinding {
    private staticObstacles: Set<string>;
    private BAR_COL_START = 43;
    private BAR_COL_END = 45;
    private BAR_ROW_START = 13;
    private BAR_ROW_END = 19;

    constructor(staticObstacles: Set<string>) {
        this.staticObstacles = staticObstacles;
    }

    /**
     * 检查位置是否可行走
     */
    isWalkable = (c: number, r: number): boolean => {
        // 边界检查 - 墙体区域不可行走
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        
        // 外墙检查 - 除了门口，外墙都不可行走
        if (c === 0 || c === COLS - 1) {
            // 检查是否是门口位置
            const isDoorway = (
                // 卫生间入口
                (c === 0 && r === 22) ||
                // 左门
                (c === 0 && (r >= 6 && r <= 7)) ||
                // 右门
                (c === COLS - 1 && (r >= 6 && r <= 7)) 
            );
            
            if (!isDoorway) return false;
        }
        
        // 吧台区域检查
        if (c >= this.BAR_COL_START && c <= this.BAR_COL_END && r >= this.BAR_ROW_START && r <= this.BAR_ROW_END) {
            // 只有吧台中间挖空部分可用
            return (c === this.BAR_COL_END && r > this.BAR_ROW_START && r < this.BAR_ROW_END);
        }
        
        // 静态障碍物检查
        if (this.staticObstacles.has(`${c},${r}`)) return false;
        
        return true;
    };

    /**
     * 为猫检查位置是否可行走（只检查墙壁，忽略家具，但避开舞池）
     */
    isWalkableForCat = (c: number, r: number): boolean => {
        // 边界检查 - 墙体区域不可行走
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        
        // 外墙检查 - 除了门口，外墙都不可行走
        if (c === 0 || c === COLS - 1) {
            const isDoorway = (
                (c === 0 && r === 22) ||
                (c === 0 && (r >= 6 && r <= 7)) ||
                (c === COLS - 1 && (r >= 6 && r <= 7)) 
            );
            if (!isDoorway) return false;
        }
        
        // 吧台区域检查（猫也不能穿过吧台）
        if (c >= this.BAR_COL_START && c <= this.BAR_COL_END && r >= this.BAR_ROW_START && r <= this.BAR_ROW_END) {
            return (c === this.BAR_COL_END && r > this.BAR_ROW_START && r < this.BAR_ROW_END);
        }
        
        // 舞池区域检查（猫不喜欢舞池）
        const centerC = COLS / 2;
        const centerR = ROWS / 2;
        const danceFloorRadius = 8; // 舞池半径（以tile为单位）
        const distanceToCenter = Math.sqrt(
            Math.pow(c - centerC, 2) + Math.pow(r - centerR, 2)
        );
        if (distanceToCenter < danceFloorRadius) {
            return false; // 舞池内不可行走
        }
        
        // 猫可以穿过家具，所以不检查 staticObstacles
        return true;
    };

    /**
     * 检查位置是否被其他角色占用
     */
    isOccupiedByChar = (c: number, r: number, npcs: Agent[], player: Agent, ignoreAgent?: Agent): boolean => {
        // 门的位置定义
        const DOOR_ROW_START = 6;
        const DOOR_ROW_END = 7;
        const RESTROOM_DOOR_ROW = 22;
        const COLS = 48;
        
        // 检查是否在门的位置
        const isLeftDoor = c === 0 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
        const isRightDoor = c === COLS - 1 && (r === DOOR_ROW_START || r === DOOR_ROW_END);
        const isRestroomDoor = c === 0 && r === RESTROOM_DOOR_ROW;
        
        // 如果在门的位置，允许多个角色通过（不检测碰撞）
        if (isLeftDoor || isRightDoor || isRestroomDoor) {
            return false;
        }
        
        // 检查玩家位置
        if (ignoreAgent?.id !== player.id) {
            const playerC = Math.round(player.c);
            const playerR = Math.round(player.r);
            if (playerC === c && playerR === r) return true;
        }
        
        // 检查NPC位置
        for (const npc of npcs) {
            if (ignoreAgent?.id !== npc.id) {
                const npcC = Math.round(npc.c);
                const npcR = Math.round(npc.r);
                if (npcC === c && npcR === r) return true;
            }
        }
        
        return false;
    };

    /**
     * 检查两个位置之间是否有直接路径（无障碍物）
     */
    hasDirectPath = (start: Position, end: Position, npcs: Agent[], player: Agent, ignoreAgent?: Agent): boolean => {
        const startC = Math.round(start.c);
        const startR = Math.round(start.r);
        const endC = Math.round(end.c);
        const endR = Math.round(end.r);
        
        const dx = Math.abs(endC - startC);
        const dy = Math.abs(endR - startR);
        const steps = Math.max(dx, dy);
        
        if (steps === 0) return true;
        
        for (let i = 1; i <= steps; i++) {
            const checkC = Math.round(startC + (endC - startC) * i / steps);
            const checkR = Math.round(startR + (endR - startR) * i / steps);
            
            if (!this.isWalkable(checkC, checkR) || 
                this.isOccupiedByChar(checkC, checkR, npcs, player, ignoreAgent)) {
                return false;
            }
        }
        
        return true;
    };

    /**
     * A* 寻路算法
     */
    findPath = (start: Position, end: Position, role: Role, smartMove: boolean, npcs: Agent[] = [], player?: Agent): Position[] => {
        const startC = Math.round(start.c);
        const startR = Math.round(start.r);
        const endC = Math.round(end.c);
        const endR = Math.round(end.r);

        // 为猫使用特殊的可行走检查
        const isCat = role === Role.CAT;
        const walkableCheck = isCat ? this.isWalkableForCat.bind(this) : this.isWalkable.bind(this);

        // 如果起点或终点不可行走，返回空路径
        if (!walkableCheck(startC, startR) || !walkableCheck(endC, endR)) {
            return [];
        }

        // 如果已经在目标位置
        if (startC === endC && startR === endR) {
            return [];
        }

        const openSet: Array<{c: number, r: number, f: number, g: number, h: number, parent?: {c: number, r: number}}> = [];
        const closedSet = new Set<string>();
        
        const heuristic = (c1: number, r1: number, c2: number, r2: number) => {
            // 使用欧几里得距离，更适合8方向移动
            const dx = Math.abs(c1 - c2);
            const dy = Math.abs(r1 - r2);
            return Math.sqrt(dx * dx + dy * dy);
        };

        const startNode = {
            c: startC,
            r: startR,
            f: 0,
            g: 0,
            h: heuristic(startC, startR, endC, endR)
        };
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);

        while (openSet.length > 0) {
            // 找到f值最小的节点
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }

            const current = openSet[currentIndex];
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.c},${current.r}`);

            // 到达目标
            if (current.c === endC && current.r === endR) {
                const path: Position[] = [];
                let node = current;
                while (node.parent) {
                    path.unshift({
                        c: node.c,
                        r: node.r,
                        pixelX: node.c * 32, // TILE_SIZE
                        pixelY: node.r * 32
                    });
                    node = node.parent as any;
                }
                return path;
            }

            // 检查相邻节点 (8方向移动)
            const neighbors = [
                {c: current.c - 1, r: current.r},     // 左
                {c: current.c + 1, r: current.r},     // 右
                {c: current.c, r: current.r - 1},     // 上
                {c: current.c, r: current.r + 1},     // 下
                {c: current.c - 1, r: current.r - 1}, // 左上
                {c: current.c + 1, r: current.r - 1}, // 右上
                {c: current.c - 1, r: current.r + 1}, // 左下
                {c: current.c + 1, r: current.r + 1}  // 右下
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.c},${neighbor.r}`;
                
                if (closedSet.has(key)) continue;
                if (!walkableCheck(neighbor.c, neighbor.r)) continue;
                
                // 猫不检查人物占用，只有其他角色才检查
                if (!isCat && smartMove && player && this.isOccupiedByChar(neighbor.c, neighbor.r, npcs, player)) {
                    continue;
                }

                // 计算移动成本：斜向移动成本更高
                const isDiagonal = neighbor.c !== current.c && neighbor.r !== current.r;
                const moveCost = isDiagonal ? 1.414 : 1; // 斜向移动成本约为√2
                const g = current.g + moveCost;
                const h = heuristic(neighbor.c, neighbor.r, endC, endR);
                const f = g + h;

                const existingIndex = openSet.findIndex(node => node.c === neighbor.c && node.r === neighbor.r);
                
                if (existingIndex === -1) {
                    openSet.push({
                        c: neighbor.c,
                        r: neighbor.r,
                        f, g, h,
                        parent: current
                    });
                } else if (g < openSet[existingIndex].g) {
                    openSet[existingIndex].g = g;
                    openSet[existingIndex].f = f;
                    openSet[existingIndex].parent = current;
                }
            }
        }

        return []; // 没有找到路径
    };

    /**
     * 寻找最近的可行走位置
     */
    findNearestWalkablePosition = (targetC: number, targetR: number, npcs: Agent[], player: Agent): Position | null => {
        // 扩展搜索范围，从1格到3格
        for (let radius = 1; radius <= 3; radius++) {
            const positions = [];
            
            // 生成当前半径的所有位置
            for (let dc = -radius; dc <= radius; dc++) {
                for (let dr = -radius; dr <= radius; dr++) {
                    if (Math.abs(dc) === radius || Math.abs(dr) === radius) {
                        positions.push({ c: targetC + dc, r: targetR + dr });
                    }
                }
            }
            
            // 按距离排序
            positions.sort((a, b) => {
                const distA = Math.sqrt((a.c - targetC) ** 2 + (a.r - targetR) ** 2);
                const distB = Math.sqrt((b.c - targetC) ** 2 + (b.r - targetR) ** 2);
                return distA - distB;
            });
            
            // 检查每个位置
            for (const pos of positions) {
                if (this.isWalkable(pos.c, pos.r) && !this.isOccupiedByChar(pos.c, pos.r, npcs, player)) {
                    return { c: pos.c, r: pos.r, pixelX: 0, pixelY: 0 };
                }
            }
        }
        
        return null;
    };
}