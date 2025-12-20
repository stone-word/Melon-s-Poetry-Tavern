# 玩家-NPC交互系统需求文档

## 简介

本文档定义了梅隆诗歌酒馆游戏中玩家点击NPC时的交互行为：玩家角色必须先移动到NPC附近，然后才弹出对话框。

## 术语表

- **游戏系统 (Game_System)**: 梅隆诗歌酒馆的核心游戏引擎
- **玩家角色 (Player_Character)**: 由用户控制的游戏角色
- **NPC (Non_Player_Character)**: 游戏中的非玩家角色
- **交互距离 (Interaction_Distance)**: 玩家与NPC进行对话所需的最大距离

## 需求

### 需求 1

**用户故事:** 作为玩家，我希望点击NPC时角色先移动到NPC附近再弹出对话框，这样交互更加自然。

#### 验收标准

1. WHEN 玩家点击某个NPC THEN 游戏系统 SHALL 让玩家角色移动到该NPC附近
2. WHEN 玩家角色到达NPC附近 THEN 游戏系统 SHALL 自动弹出对话框
3. WHEN 玩家角色已在NPC附近 THEN 游戏系统 SHALL 立即弹出对话框而不需要移动
4. WHEN 玩家角色无法到达NPC附近 THEN 游戏系统 SHALL 寻找最近的可到达位置
5. WHEN 玩家在移动过程中点击其他地方 THEN 游戏系统 SHALL 取消NPC交互并执行新的移动