# 梅隆诗歌酒馆 - 项目架构文档

## 📋 项目概述

**梅隆诗歌酒馆**是一个基于Web的2D像素风格互动游戏，玩家可以在虚拟酒馆中与AI驱动的NPC角色进行对话，创作和分享诗歌。项目使用React + TypeScript开发，集成了Google Gemini AI来生成智能对话和诗歌内容。

### 🎯 核心功能
- **2D像素游戏世界**：玩家可以在酒馆中自由移动
- **智能NPC对话**：与各种角色进行AI驱动的对话
- **诗歌创作系统**：为NPC创作个性化诗歌
- **诗歌图书馆**：保存和浏览历史诗歌作品
- **动态角色系统**：NPC具有独特的身份、性格和行为模式

---

## 🏗️ 项目架构总览

```
梅隆诗歌酒馆/
├── 📱 用户界面层 (UI Layer)
│   ├── App.tsx - 主应用组件
│   └── components/ - UI组件
├── 🎮 游戏引擎层 (Game Engine Layer)
│   └── game/ - 游戏核心逻辑
├── 🤖 服务层 (Service Layer)
│   └── services/ - AI服务和数据管理
├── 🛠️ 工具层 (Utility Layer)
│   └── utils/ - 辅助工具函数
└── 📝 类型定义 (Type Definitions)
    └── types.ts - 全局类型定义
```

---

## 📁 详细目录结构

### 🎨 用户界面层 (`components/`)

这一层负责所有用户能看到和交互的界面元素。

```
components/
├── GameCanvas.tsx      # 🎮 游戏画布 - 显示游戏世界
├── DialogueBox.tsx     # 💬 对话框 - 处理角色对话
├── ChatBubbles.tsx     # 💭 聊天气泡 - NPC间的对话气泡
├── PoemCreationDialog.tsx # ✍️ 诗歌创作对话框
└── PoemLibrary.tsx     # 📚 诗歌图书馆
```

**各组件职责：**

- **GameCanvas.tsx**: 游戏的"舞台"，显示酒馆场景、角色移动、处理点击交互
- **DialogueBox.tsx**: 玩家与NPC对话的界面，支持多种对话模式（故事、聊天、诗歌）
- **ChatBubbles.tsx**: 显示NPC之间的自动对话气泡，增加游戏氛围
- **PoemCreationDialog.tsx**: 诗歌创作的专用界面，包含标题、作者、内容输入
- **PoemLibrary.tsx**: 展示历史诗歌作品的图书馆界面

### 🎮 游戏引擎层 (`game/`)

这一层是游戏的"大脑"，处理所有游戏逻辑。

```
game/
├── GameEngine.ts       # 🧠 游戏引擎 - 协调所有游戏系统
├── NPCBehavior.ts      # 🤖 NPC行为系统 - 控制角色AI行为
├── PathFinding.ts      # 🗺️ 寻路系统 - A*算法实现角色移动
├── Renderer.ts         # 🎨 渲染器 - 绘制游戏画面
├── MapGenerator.ts     # 🏗️ 地图生成器 - 创建酒馆布局
└── types.ts           # 📝 游戏专用类型定义
```

**各模块职责：**

- **GameEngine.ts**: 游戏的总指挥，管理游戏状态、更新循环、处理交互
- **NPCBehavior.ts**: 让NPC"活起来"，包括顾客点餐、服务员服务、清洁工清洁等行为
- **PathFinding.ts**: 让角色能够智能地绕过障碍物移动到目标位置
- **Renderer.ts**: 把游戏世界"画"到屏幕上，包括地图、角色、特效
- **MapGenerator.ts**: 创建酒馆的布局，包括桌椅、吧台、装饰品的位置

### 🤖 服务层 (`services/`)

这一层处理AI交互和数据管理。

```
services/
├── geminiService.ts    # 🧠 AI服务 - 与Google Gemini AI交互
├── poetryDatabase.ts   # 📖 诗歌数据库 - 管理诗歌内容
├── poemStorage.ts      # 💾 诗歌存储 - 本地+云端双重存储管理
├── staffIdentities.ts  # 🧾 工作人员身份 - 固定工作人员配置
├── supabaseClient.ts   # ☁️ Supabase客户端 - 云数据库连接配置
└── musicService.ts     # 🎵 音乐服务 - 背景音乐播放控制
```

**各服务职责：**

- **geminiService.ts**: 与AI对话的"翻译官"，发送请求给Gemini AI并处理响应
- **poetryDatabase.ts**: 诗歌的"图书馆管理员"，搜索和管理诗歌数据库
- **poemStorage.ts**: 诗歌存储的"双重档案员"，管理本地存储（localStorage）和云端存储（Supabase）
- **supabaseClient.ts**: Supabase云数据库的"连接器"，配置和初始化云端数据库客户端
- **musicService.ts**: 背景音乐的"音响师"，控制游戏背景音乐的播放、暂停和音量
- **staffIdentities.ts**: 工作人员的固定身份配置，定义调酒师、服务员、清洁工等固定角色信息，供 `GameCanvas.tsx` 分配与 `geminiService.ts` 在生成工作人员回复时使用

### 🛠️ 工具层 (`utils/`)

这一层提供各种辅助功能。

```
utils/
├── identityGenerator.ts # 👤 身份生成器 - 创建NPC角色身份
├── pixelArt.ts         # 🎨 像素艺术生成器 - 生成角色和物品贴图
└── artLoader.ts        # 🖼️ 美术资源加载器 - 加载外部PNG角色图片
```

**各工具职责：**

- **identityGenerator.ts**: NPC的"身份证办理处"，随机生成角色的年龄、职业、性格等  - 包含100个常见中文姓氏列表（王、李、张、刘等）
  - 为每位顾客随机分配一个姓氏
  - 生成格式化的身份显示信息- **pixelArt.ts**: 游戏的"美术师"，程序化生成像素风格的角色和物品图像
- **artLoader.ts**: 美术资源的"图书管理员"，负责加载和缓存外部PNG格式的角色精灵图

---

## 🔄 系统工作流程

### 1. 游戏启动流程

```
用户打开网页
    ↓
App.tsx 初始化
    ↓
GameCanvas.tsx 创建游戏画布
    ↓
GameEngine.ts 初始化游戏世界
    ↓
生成地图、NPC、玩家
    ↓
开始游戏循环
```

### 2. 玩家与NPC对话流程

```
玩家点击NPC
    ↓
GameEngine 检测交互距离
    ↓
如果距离太远 → 玩家自动移动到NPC附近
    ↓
如果距离合适 → 打开对话框
    ↓
DialogueBox 显示对话界面
    ↓
用户输入 → geminiService 调用AI
    ↓
AI响应 → 显示在对话框中
    ↓
玩家离开 → 自动关闭对话框
```

### 3. 诗歌创作流程

```
对话中选择"写诗"
    ↓
PoemCreationDialog 打开
    ↓
用户填写标题、作者、内容
    ↓
提交诗歌（点击"赠送诗歌"按钮）
    ↓
geminiService 生成AI反馈
    ↓
poemStorage 同时保存到云端（Supabase）
    ↓
显示AI反馈给用户
    ↓
PoemLibrary 可查看所有本地+云端诗歌
```

**特殊逻辑**：
- 普通诗歌：只保存到云端数据库（Supabase）
- 圣诞老人的礼物诗：只保存到本地存储（localStorage）
- 图书馆显示：自动合并本地和云端诗歌，去重展示

---

## 🎭 角色系统详解

### 角色类型 (Role)

游戏中有6种角色类型：

1. **PLAYER** - 玩家角色
2. **CUSTOMER** - 普通顾客（主要对话对象）
3. **POET** - 诗人（特殊对话模式）
4. **BARTENDER** - 调酒师
5. **WAITER** - 服务员
6. **CLEANER** - 清洁工

### 顾客身份系统

每个顾客NPC都有详细的身份设定：

```typescript
CustomerIdentity {
  age: number;           // 年龄（18-99）
  gender: '男' | '女';    // 性别
  surname: string;       // 姓氏（随机分配，100个常见中文姓氏）
  occupation: string;    // 职业（从复杂的职业分类中随机选择）
  personality: string;   // MBTI人格类型
  mood: string;         // 当前情绪
  isForeigner: boolean; // 是否外国人
  isShanghainess: boolean; // 是否上海人
  motivation?: string;  // 来店动机（AI生成）
}
```

这个系统让每个NPC都有独特的背景故事，AI可以根据这些信息生成个性化的对话。

### 工作人员固定身份系统

项目新增了一个“工作人员固定身份”模块，用于为酒馆内的员工（调酒师、服务员、清洁工）分配固定的身份信息。主要实现点：

- 身份配置文件：`services/staffIdentities.ts`，包含已配置的调酒师、服务员与清洁工条目（如 Diego Ramos、薇薇、二胡、阿辉、小雨、小马哥、真雅、王阿姨）。
- 类型扩展：在 `types.ts` 中添加了 `StaffIdentity` 类型，并在 `Agent` / `DialogueState` 等类型中加入 `staffIdentity` 字段以便传递上下文。
- 分配与显示：`GameCanvas.tsx` 在创建或渲染工作人员时分配这些固定身份，`DialogueBox.tsx` 支持工作人员专用的 UI 显示（姓名、职务、简介）。
- AI 配合：`geminiService.ts` 增加了 `generateStaffResponse()`（或类似名称）以基于工作人员身份和历史对话生成个性化回复。

该系统让与工作人员的对话更具人物感与延续性，并支持后续为工作人员添加记忆、关系和特殊场景对话。

**姓名显示系统**：

- 对话框标题显示：**顾客X先生** / **顾客X女士**（根据性别自动选择称呼）
- 详细信息显示：28岁，软件工程师，INTJ（不再单独显示性别）
- 诗歌图书馆中显示：赠予：X先生/X女士

---

## 🤖 AI集成详解

### Gemini AI服务功能

`geminiService.ts` 提供了多种AI功能：

1. **generateCustomerMotivation()** - 生成顾客来店动机
2. **generateCustomerStory()** - 生成顾客背景故事
3. **generateChatResponse()** - 生成自由聊天回复
4. **generatePoemResponse()** - 生成对诗歌的反馈
5. **generatePoemEvaluation()** - 诗人对诗歌的评价
6. **extractKeywordFromMood()** - 从心情中提取关键词
7. **createNewPoemWithAI()** - AI创作新诗歌
8. **generateStaffResponse()** - 基于 `StaffIdentity` 生成工作人员的个性化对话与回复

### AI提示词设计原则

- **角色一致性**：AI回复要符合NPC的身份设定
- **情境感知**：考虑对话历史和当前情境
- **情感表达**：根据NPC的情绪状态调整回复风格
- **文化背景**：考虑NPC的地域和文化背景

---

## 💾 数据管理

### 存储架构：本地+云端双重存储

项目采用**混合存储策略**，确保数据的可靠性和共享性：

#### 本地存储（localStorage）

用于存储圣诞老人礼物诗等特殊内容：

```
localStorage
├── mellon_poem_database - 诗歌数据库
│   ├── poems[] - 诗歌记录数组
│   │   ├── id - 唯一标识
│   │   ├── poem - 诗歌内容（标题、作者、正文）
│   │   ├── customer - 对象NPC身份
│   │   ├── conversationHistory - 对话历史
│   │   ├── customerReaction - NPC反馈
│   │   └── timestamp - 创建时间
│   ├── totalCount - 诗歌总数
│   └── lastUpdated - 最后更新时间
```

#### 云端存储（Supabase PostgreSQL）

用于存储和分享玩家创作的诗歌：

**数据库表结构**：`poems`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键，自动生成 |
| created_at | timestamp | 创建时间 |
| title | text | 诗歌标题 |
| author | text | 作者名 |
| content | text | 诗歌内容 |
| customer_info | jsonb | 顾客身份信息 |
| conversation_history | jsonb | 对话历史记录 |

**环境配置**：
- `VITE_SUPABASE_URL` - Supabase项目URL
- `VITE_SUPABASE_ANON_KEY` - Supabase匿名访问密钥

**云存储优势**：
- ✅ 数据持久化：不受浏览器清理影响
- ✅ 跨设备访问：可在任何设备查看
- ✅ 全球诗歌库：所有玩家的诗歌汇聚一处
- ✅ 免费额度充足：500MB可存储约100万首诗

**存储策略**：
```typescript
// 普通诗歌：保存到云端
await addPoemRecord(poem, customer, history, reaction, true);

// 特殊诗歌（如圣诞礼物）：仅保存到本地
await addPoemRecord(poem, customer, history, reaction, false);
```

### 诗歌数据库

`poetryDatabase.ts` 管理内置的诗歌数据库：

- 支持关键词搜索
- 提供近义词匹配
- 返回相关诗句和匹配度

---

## 🎨 视觉系统

### 像素艺术生成

`pixelArt.ts` 使用程序化生成创建游戏美术资源：

- **角色贴图**：不同角色类型有不同的颜色和样式
- **环境贴图**：地板、墙壁、家具等
- **装饰元素**：花瓶、书架、钢琴等

### 渲染系统

`Renderer.ts` 负责绘制游戏画面：

1. **地图渲染**：绘制地板、墙壁、家具
2. **角色渲染**：绘制玩家和NPC
3. **特效渲染**：点击波纹、对话气泡等
4. **UI渲染**：游戏内的界面元素

### 美术资源系统

`artLoader.ts` 负责加载外部美术资源：

- **图片预加载**：在游戏启动时预加载所有角色精灵图
- **图片缓存**：缓存已加载的图片，避免重复加载
- **随机分配**：根据NPC性别随机选择角色外观
- **颜色替换**：支持动态改变角色的衣服/头发颜色（可选功能）

**角色资源**：
- 男性角色：3种外观变体 (man-a.png, man-b.png, man-c.png)
- 女性角色：3种外观变体 (woman-a.png, woman-b.png, woman-c.png)

**注意**：当前版本已禁用外部图片加载以避免加载错误，使用程序化生成的像素图像。

---

## 🎵 音乐系统

### 背景音乐服务

`musicService.ts` 提供完整的背景音乐播放控制：

**核心功能：**

1. **start()** - 开始播放背景音乐
2. **stop()** - 停止播放
3. **toggle()** - 切换播放/暂停状态
4. **setVolume(volume)** - 设置音量 (0-1)
5. **getVolume()** - 获取当前音量
6. **getIsPlaying()** - 获取播放状态

**技术特性：**

- **单例模式**：整个应用共享一个音乐服务实例
- **循环播放**：背景音乐自动循环
- **默认音量**：30%（0.3），避免音乐过于突兀
- **错误处理**：监听加载错误和自动播放限制
- **用户交互要求**：浏览器可能需要用户交互后才能播放音乐

**音乐资源**：

项目包含多个背景音乐文件（位于 `/music/` 目录）：
- Canon.mp3
- Canon2.mp3
- Canon3.mp3（默认使用）

**使用示例**：

```typescript
import musicService from './services/musicService';

// 开始播放
musicService.start();

// 切换播放状态
musicService.toggle();

// 调整音量到50%
musicService.setVolume(0.5);
```

---

## 🔧 开发和维护指南

### 环境配置

1. **Node.js** - JavaScript运行环境
2. **npm** - 包管理器
3. **Vite** - 开发服务器和构建工具
4. **TypeScript** - 类型安全的JavaScript
5. **React** - UI框架
6. **Tailwind CSS** - 样式框架
7. **Supabase** - 云端数据库和后端服务

### 启动项目

```bash
# 安装依赖
npm install

# 配置环境变量（在.env文件中）
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 常见维护任务

#### 1. 添加新的NPC角色类型

1. 在 `types.ts` 中的 `Role` 枚举添加新角色
2. 在 `NPCBehavior.ts` 中添加新角色的行为逻辑
3. 在 `pixelArt.ts` 中添加新角色的视觉样式
4. 在 `GameEngine.ts` 中添加新角色的初始化逻辑

#### 2. 修改对话逻辑

1. 编辑 `geminiService.ts` 中的相关函数
2. 调整AI提示词以改变对话风格
3. 在 `DialogueBox.tsx` 中修改UI交互逻辑

#### 3. 添加新的诗歌内容

1. 编辑 `poems.txt` 文件添加新诗歌
2. 或在 `poetryDatabase.ts` 中添加程序化的诗歌数据

#### 4. 调整游戏平衡

1. 修改 `types.ts` 中的常量配置
2. 调整 `NPCBehavior.ts` 中的行为参数
3. 修改 `GameEngine.ts` 中的游戏规则

### 调试技巧

1. **浏览器开发者工具**：查看控制台日志和网络请求
2. **React DevTools**：检查组件状态和props
3. **localStorage检查**：查看本地存储的数据
4. **AI响应调试**：在geminiService中添加console.log

---

## 🚀 扩展建议

### 短期改进

1. ✅ **音乐系统**：已实现背景音乐播放功能
2. ✅ **角色精灵图**：已支持外部PNG格式的角色图片
3. **音效系统**：添加交互音效（点击、对话等）
4. **动画系统**：角色移动和交互动画
5. **存档系统**：支持多个存档槽位
6. **设置界面**：音量、画质等设置选项

### 长期扩展

1. **多人模式**：支持多个玩家同时在线
2. **任务系统**：给玩家设定目标和奖励
3. **经济系统**：虚拟货币和商店功能
4. **社交功能**：分享诗歌到社交媒体

---

## 📞 技术支持

### 常见问题

**Q: AI不响应怎么办？**
A: 检查.env文件中的VITE_DEEPSEEK_API_KEY是否正确配置

**Q: 游戏卡顿怎么办？**
A: 可能是浏览器性能问题，尝试关闭其他标签页或降低游戏画质

**Q: 诗歌保存失败？**
A: 检查网络连接和Supabase配置是否正确，或查看浏览器控制台错误信息

**Q: 如何清除本地诗歌数据？**
A: 在浏览器控制台执行 `localStorage.removeItem('mellon_poem_database')` 或在开发者工具 Application → Local Storage 中手动删除

**Q: 云端诗歌没有显示？**
A: 确认.env文件中的Supabase配置正确，检查网络连接，查看浏览器控制台是否有错误

### 联系方式

如需技术支持，请查看项目的GitHub仓库或联系开发团队。

---

## 📄 许可证

本项目遵循相应的开源许可证，具体请查看项目根目录的LICENSE文件。

---

## 📅 更新日志

### 2025年12月23日 - 云存储功能上线

**新增功能：**
- ☁️ **Supabase云数据库集成**：实现诗歌的云端存储和同步
- 🌍 **全球诗歌图书馆**：所有玩家的诗歌汇聚在云端，可在图书馆中浏览
- 🎅 **圣诞老人礼物系统**：特殊诗歌仅保存到本地，不上传云端

**技术改进：**
- 新增 `services/supabaseClient.ts` - Supabase客户端配置
- 重构 `services/poemStorage.ts` - 支持本地+云端双重存储
- 优化 `components/PoemLibrary.tsx` - 自动合并和去重本地与云端诗歌
- 改进 `App.tsx` - 诗歌提交时立即保存到云端

**Bug修复：**
- 🐛 修复诗歌重复保存问题（普通诗歌现在只保存到云端）
- 🐛 禁用外部图片加载，避免加载失败警告
- 🐛 清理调试代码，移除控制台日志

**数据库配置：**
- 免费层级额度：500MB数据库 + 5GB流量/月
- 可存储约100万首诗歌
- PostgreSQL + RESTful API自动生成

---

### 2025年12月24日 - 工作人员固定身份系统上线

**新增功能：**
- 🧑‍🍳 **工作人员固定身份系统**：调酒师、服务员、清洁工等NPC拥有独特的姓名、性格、MBTI、家乡、背景故事等固定身份，提升角色真实感和代入感
- 🗣️ **AI个性化对话**：与工作人员（调酒师/服务员/清洁工）对话时，AI会根据其身份、性格和故事生成专属回复，支持多轮交流
- 🪪 **身份详情展示**：对话框中显示工作人员的年龄、MBTI等详细信息
- 📝 **身份配置文件**：新增 `services/staffIdentities.ts`，集中管理所有工作人员身份信息

**技术改进：**
- 扩展 `types.ts`，新增 `StaffIdentity` 接口，`Agent` 和 `DialogueState` 增加 `staffIdentity` 字段
- `GameCanvas.tsx` 为所有工作人员分配固定身份
- `GameEngine.ts` 对话触发时传递身份信息，显示真实姓名
- `geminiService.ts` 新增 `generateStaffResponse`，AI根据身份生成个性化回复
- `App.tsx` 支持工作人员多轮对话和诗歌创作流程
- `DialogueBox.tsx` 增强UI，专门适配工作人员身份与对话历史

**NPC行为优化：**
- 工作人员与玩家对话时会暂停移动，提升交互体验
- 清洁工、调酒师、猫等NPC增加“随机停留”行为，行动更自然
- 玩家初始位置调整，更便于体验
- 玩家脚下新增脉动波纹与光晕特效，提升视觉表现

**环境配置：**
- `.env.example` 提供DeepSeek API Key示例，便于本地AI测试

**文档补充：**
- 新增《STAFF_IDENTITY_IMPLEMENTATION.md》详细说明工作人员身份系统的设计与用法

---

*最后更新：2025年12月24日*