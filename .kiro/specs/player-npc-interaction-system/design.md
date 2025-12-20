# 玩家-NPC交互系统设计文档

## 概述

本设计文档描述了如何实现玩家点击NPC时先移动到NPC附近再弹出对话框的功能。该系统将修改现有的GameEngine中的handleClick方法，添加移动-对话的两阶段交互流程。

## 架构

### 交互流程图

```
玩家点击NPC
    ↓
检查距离
    ↓
距离足够？ ——是——→ 立即弹出对话框
    ↓否
计算移动路径
    ↓
开始移动
    ↓
到达目标？ ——否——→ 继续移动
    ↓是
弹出对话框
```

## 组件和接口

### 核心接口修改

```typescript
// 在GameEngine中添加新的状态管理
interface PendingInteraction {
  targetNPC: Agent;
  onDialogueOpen: (dialogue: any) => void;
}

// GameEngine类添加新属性
class GameEngine {
  private pendingInteraction: PendingInteraction | null = null;
  
  // 修改现有方法
  handleClick(x: number, y: number, onOpenDialogue: (dialogue: any) => void): void;
  
  // 新增方法
  private checkInteractionDistance(player: Agent, npc: Agent): boolean;
  private findInteractionPosition(npc: Agent): Position | null;
  private startInteractionMovement(npc: Agent, onOpenDialogue: (dialogue: any) => void): void;
  private checkPendingInteraction(): void;
}
```

### 交互距离计算

```typescript
// 交互距离定义
const INTERACTION_DISTANCE = 1.5; // 1.5个格子的距离

// 距离计算函数
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.c - pos2.c;
  const dy = pos1.r - pos2.r;
  return Math.sqrt(dx * dx + dy * dy);
}
```

## 数据模型

### 待处理交互状态

```typescript
interface PendingInteraction {
  targetNPC: Agent;           // 目标NPC
  onDialogueOpen: (dialogue: any) => void; // 对话回调函数
  startTime: number;          // 开始时间（用于超时处理）
}
```

## 正确性属性

*属性是应该在系统所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: NPC点击触发移动
*对于任何*玩家位置和NPC位置，当玩家点击NPC且不在交互距离内时，玩家应该开始移动到NPC附近
**验证: 需求 1.1**

### 属性 2: 到达后触发对话
*对于任何*移动到NPC的交互，当玩家到达交互距离内时，对话框应该自动弹出
**验证: 需求 1.2**

### 属性 3: 距离内立即对话
*对于任何*玩家和NPC的位置组合，当距离已在交互范围内时，点击NPC应该立即弹出对话框而不移动
**验证: 需求 1.3**

### 属性 4: 路径阻挡处理
*对于任何*无法直接到达NPC的情况，系统应该寻找最近的可到达位置作为交互点
**验证: 需求 1.4**

### 属性 5: 交互取消一致性
*对于任何*正在进行的NPC交互移动，当玩家点击其他位置时，待处理的交互应该被取消并执行新的移动
**验证: 需求 1.5**

## 错误处理

### 路径查找失败
- 如果无法找到到达NPC的路径，寻找最近的可到达位置
- 如果完全无法到达，显示提示信息并取消交互

### 移动超时
- 如果移动时间超过10秒，自动取消交互
- 清理待处理的交互状态

### NPC移动处理
- 如果NPC在玩家移动过程中改变位置，更新目标位置
- 重新计算交互位置和移动路径

## 测试策略

### 单元测试
- 距离计算函数测试
- 交互位置查找测试
- 状态管理测试

### 属性基础测试
使用 **fast-check** 库进行属性基础测试，每个测试运行最少100次迭代：

- 距离检查属性测试
- 移动-对话序列属性测试
- 交互取消属性测试

每个属性基础测试必须标注对应的设计文档属性编号，格式为：
`**Feature: player-npc-interaction-system, Property X: [属性描述]**`

### 集成测试
- 完整的点击-移动-对话流程测试
- 不同NPC类型的交互测试
- 边界情况和异常处理测试

## 实现细节

### 修改GameEngine.handleClick方法

```typescript
handleClick = (x: number, y: number, onOpenDialogue: (dialogue: any) => void): void => {
  const clickC = Math.floor(x / TILE_SIZE);
  const clickR = Math.floor(y / TILE_SIZE);

  // 添加点击波纹效果
  this.addRipple(x, y);

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
```

### 在update循环中检查待处理交互

```typescript
update = (): void => {
  // 现有的更新逻辑...
  
  // 检查待处理的交互
  this.checkPendingInteraction();
  
  // 其他更新逻辑...
};
```

## 性能考虑

### 距离计算优化
- 使用平方距离比较避免开方运算
- 缓存频繁计算的距离值

### 状态管理
- 使用简单的状态标记避免复杂的状态机
- 及时清理不需要的状态数据

## 兼容性

### 现有功能保持
- 保持现有的移动和对话功能不变
- 确保其他交互（如点击空地移动）正常工作
- 维持现有的NPC行为和对话系统