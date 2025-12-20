# 增强交互系统设计文档

## 概述

本设计文档描述了梅隆诗歌酒馆增强交互系统的技术架构，重点解决当前代码结构问题并实现新的交互功能。系统将采用模块化架构，分离关注点，提供可扩展的对话、用户管理和数据存储能力。

## 架构

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Service Layer  │    │  Data Layer     │
│                 │    │                 │    │                 │
│ - DialogueBox   │◄──►│ - DialogueService│◄──►│ - UserStore     │
│ - ChatBubbles   │    │ - UserService   │    │ - DialogueStore │
│ - UserPanel     │    │ - AIService     │    │ - NPCMemoryStore│
│ - GameCanvas    │    │ - NPCService    │    │ - CloudStorage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 分层职责

1. **UI Layer**: 用户界面组件，处理用户交互和视觉呈现
2. **Service Layer**: 业务逻辑服务，协调数据流和业务规则
3. **Data Layer**: 数据管理和持久化，包括本地存储和云端同步

## 组件和接口

### 核心服务接口

```typescript
// 对话服务接口
interface IDialogueService {
  startDialogue(playerId: string, npcId: string): Promise<DialogueSession>
  sendMessage(sessionId: string, message: string): Promise<AIResponse>
  getDialogueHistory(playerId: string, npcId: string): Promise<DialogueHistory>
  endDialogue(sessionId: string): Promise<void>
}

// 用户服务接口
interface IUserService {
  register(username: string, password: string): Promise<User>
  login(username: string, password: string): Promise<AuthToken>
  logout(userId: string): Promise<void>
  getUserProfile(userId: string): Promise<UserProfile>
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>
}

// NPC服务接口
interface INPCService {
  updateNPCMemory(npcId: string, playerId: string, interaction: Interaction): Promise<void>
  getNPCMemory(npcId: string, playerId: string): Promise<NPCMemory>
  generateNPCResponse(npcId: string, context: DialogueContext): Promise<string>
}

// 云端存储接口
interface ICloudStorage {
  saveUserData(userId: string, data: UserData): Promise<void>
  loadUserData(userId: string): Promise<UserData>
  syncDialogueHistory(userId: string, history: DialogueHistory[]): Promise<void>
  deleteUserData(userId: string): Promise<void>
}
```

### 新增组件结构

```
src/
├── components/
│   ├── GameCanvas.tsx (重构后，只负责渲染)
│   ├── DialogueBox.tsx (增强版)
│   ├── ChatBubbles.tsx (新增)
│   ├── UserPanel.tsx (新增)
│   └── ui/ (通用UI组件)
├── services/
│   ├── DialogueService.ts (新增)
│   ├── UserService.ts (新增)
│   ├── NPCService.ts (新增)
│   ├── AIService.ts (重构geminiService)
│   └── CloudStorageService.ts (新增)
├── stores/
│   ├── UserStore.ts (新增)
│   ├── DialogueStore.ts (新增)
│   ├── NPCMemoryStore.ts (新增)
│   └── GameStore.ts (新增)
├── game/
│   ├── NPCBehavior.ts (从GameCanvas提取)
│   ├── PathFinding.ts (从GameCanvas提取)
│   ├── GameLoop.ts (从GameCanvas提取)
│   └── InteractionManager.ts (新增)
├── types/
│   ├── dialogue.ts (新增)
│   ├── user.ts (新增)
│   └── npc.ts (扩展现有types.ts)
└── utils/
    ├── auth.ts (新增)
    ├── storage.ts (新增)
    └── validation.ts (新增)
```

## 数据模型

### 用户数据模型

```typescript
interface User {
  id: string
  username: string
  email?: string
  createdAt: Date
  lastLoginAt: Date
  preferences: UserPreferences
}

interface UserPreferences {
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  autoSave: boolean
  chatBubbleEnabled: boolean
}

interface UserData {
  profile: UserProfile
  dialogueHistory: DialogueHistory[]
  npcRelationships: NPCRelationship[]
  gameProgress: GameProgress
}
```

### 对话数据模型

```typescript
interface DialogueSession {
  id: string
  playerId: string
  npcId: string
  startTime: Date
  endTime?: Date
  messages: DialogueMessage[]
  context: DialogueContext
}

interface DialogueMessage {
  id: string
  senderId: string
  senderType: 'player' | 'npc'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

interface DialogueContext {
  npcState: NPCState
  playerMood: string
  location: string
  previousInteractions: number
  relationshipLevel: number
}
```

### NPC记忆数据模型

```typescript
interface NPCMemory {
  npcId: string
  playerId: string
  interactions: Interaction[]
  personality: NPCPersonality
  relationshipData: RelationshipData
  lastUpdated: Date
}

interface Interaction {
  id: string
  timestamp: Date
  type: 'dialogue' | 'action' | 'gift'
  content: string
  playerMood: string
  npcResponse: string
  impact: number // -100 to 100
}

interface RelationshipData {
  level: number // 0-100
  trust: number // 0-100
  familiarity: number // 0-100
  lastInteractionDate: Date
  totalInteractions: number
}
```

## 正确性属性

*属性是应该在系统所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 对话会话完整性
*对于任何*对话会话，开始对话后必须能够发送消息，并且会话结束后不能再发送消息
**验证: 需求 4.1, 4.2**

### 属性 2: 用户数据一致性  
*对于任何*用户操作，本地存储和云端存储的数据在同步完成后必须保持一致
**验证: 需求 3.1, 3.3**

### 属性 3: NPC记忆持久性
*对于任何*NPC交互，交互数据必须被正确存储，并且在后续对话中可以被检索和使用
**验证: 需求 4.2, 4.3**

### 属性 4: 对话气泡时序正确性
*对于任何*桌子上的顾客组合，对话气泡的显示和隐藏必须遵循3秒间隔和3-10秒持续时间的规则
**验证: 需求 1.1, 1.3**

### 属性 5: 用户认证安全性
*对于任何*用户认证操作，无效凭据必须被拒绝，有效凭据必须生成安全的会话令牌
**验证: 需求 2.3, 2.4**

### 属性 6: 文本输入验证
*对于任何*用户文本输入，空白内容必须被拒绝，有效内容必须被正确格式化和存储
**验证: 需求 5.3, 5.5**

### 属性 7: 数据导出完整性
*对于任何*用户数据导出请求，导出的文件必须包含该用户的所有存储数据且格式正确
**验证: 需求 6.2**

### 属性 8: 并发会话隔离
*对于任何*多用户场景，每个用户的会话状态必须保持独立，不会相互干扰
**验证: 需求 7.1, 7.4**

## 错误处理

### 网络错误处理
- 连接超时: 自动重试3次，失败后使用本地缓存
- 服务器错误: 显示用户友好的错误信息，记录详细日志
- 数据同步失败: 标记为待同步，在连接恢复后重试

### 数据完整性保护
- 输入验证: 客户端和服务端双重验证
- 事务处理: 关键操作使用事务确保原子性
- 备份机制: 定期备份用户数据，支持数据恢复

### 用户体验优化
- 加载状态: 所有异步操作显示加载指示器
- 离线模式: 网络断开时提供基本功能
- 错误恢复: 提供明确的错误信息和恢复建议

## 测试策略

### 单元测试
- 服务层函数测试: 验证业务逻辑正确性
- 数据模型测试: 验证数据结构和验证规则
- 工具函数测试: 验证辅助函数的边界条件

### 集成测试
- API集成测试: 验证前后端接口协议
- 数据库集成测试: 验证数据持久化操作
- 第三方服务测试: 验证AI服务和云存储集成

### 属性基础测试
使用 **fast-check** 库进行属性基础测试，每个测试运行最少100次迭代：

- 对话会话管理属性测试
- 用户数据同步属性测试  
- NPC记忆系统属性测试
- 并发用户会话属性测试

每个属性基础测试必须标注对应的设计文档属性编号，格式为：
`**Feature: enhanced-interaction-system, Property X: [属性描述]**`

### 端到端测试
- 用户注册登录流程测试
- 完整对话交互测试
- 数据导出导入测试
- 多用户并发场景测试

## 性能考虑

### 前端优化
- 组件懒加载: 按需加载大型组件
- 状态管理优化: 使用 Zustand 进行轻量级状态管理
- 渲染优化: 使用 React.memo 和 useMemo 减少不必要的重渲染

### 后端优化
- 数据库索引: 为常用查询字段建立索引
- 缓存策略: 使用 Redis 缓存热点数据
- API限流: 防止恶意请求和系统过载

### 存储优化
- 数据压缩: 对大型文本数据进行压缩存储
- 分页加载: 大量历史数据分页获取
- 清理策略: 定期清理过期的临时数据

## 安全考虑

### 用户认证
- 密码加密: 使用 bcrypt 进行密码哈希
- JWT令牌: 使用短期令牌和刷新令牌机制
- 会话管理: 实现安全的会话超时和注销

### 数据保护
- 输入过滤: 防止XSS和SQL注入攻击
- 数据加密: 敏感数据传输和存储加密
- 访问控制: 实现基于角色的访问控制

### 隐私保护
- 数据最小化: 只收集必要的用户数据
- 用户控制: 提供数据查看、修改、删除功能
- 合规性: 遵循数据保护法规要求