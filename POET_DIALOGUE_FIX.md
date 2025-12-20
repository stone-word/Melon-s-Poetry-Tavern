# 诗人对话逻辑修复说明

## 发现的问题

### 1. 状态转换逻辑不完整
**位置**: `App.tsx` - `handleSendInput` 函数

**问题描述**:
- 当 `poetDialogueState` 为 'choice' 时，如果收到非预期的输入，没有合适的分支处理
- 当 `poetDialogueState` 为 'listening' 时，不应该接收文本输入（应该通过诗歌创作对话框）

**修复方案**:
添加了以下处理分支：
```typescript
else if (poetDialogueState === 'choice') {
    // 在choice状态下收到非预期输入，重新显示选择
    responseText = "你想听听我的诗，还是想让我听听你的诗？";
} else if (poetDialogueState === 'listening') {
    // listening状态下不应该收到输入
    responseText = "请通过诗歌创作对话框分享你的诗。";
}
```

### 2. UI 显示状态不匹配
**位置**: `DialogueBox.tsx` - 诗人交互区域

**问题描述**:
- 当 `poetDialogueState` 为 'listening' 时，UI 显示默认输入框，但实际应该显示等待消息
- 当 `poetDialogueState` 为 'initial' 时，UI 显示默认输入框，但应该显示等待消息

**修复方案**:
改进了 UI 条件渲染逻辑：
```tsx
{poetDialogueState === 'choice' ? (
  // 显示两个选择按钮
) : poetDialogueState === 'sharing' ? (
  // 显示心情关键词输入框（禁用空输入）
) : poetDialogueState === 'listening' ? (
  // 显示等待提示
) : (
  // 初始状态或其他状态的提示
)}
```

### 3. 缺少调试日志
**位置**: `App.tsx`

**问题描述**:
- 诗人对话状态转换时缺少日志，难以追踪问题

**修复方案**:
添加了详细的调试日志：
- 在每次状态转换时输出当前状态和输入
- 添加了 useEffect 监控诗人对话状态变化
- 在关键分支添加日志标记

## 诗人对话状态机

```
initial (打开对话)
   ↓
choice (显示两个选择按钮)
   ↓                    ↓
listening          sharing
(玩家写诗)        (诗人分享诗)
   ↓                    ↓
等待诗歌创作      输入心情关键词
   ↓                    ↓
显示诗人评价      显示匹配的诗
```

## 测试步骤

1. **测试路径A - 玩家为诗人写诗**:
   - 点击诗人 → 看到两个选择按钮 ✓
   - 点击"请你听听我的诗" → 打开诗歌创作对话框 ✓
   - 提交诗歌 → 诗人给出评价 ✓

2. **测试路径B - 诗人为玩家分享诗**:
   - 点击诗人 → 看到两个选择按钮 ✓
   - 点击"让我听听你的诗" → 看到心情关键词输入框 ✓
   - 输入关键词（如"孤独"）→ 诗人分享相关诗句 ✓

3. **测试边缘情况**:
   - 在 choice 状态下尝试直接输入 → 应该重新显示选择 ✓
   - 在 listening 状态下对话框应该显示等待提示 ✓
   - 关闭对话后重新打开 → 状态应该重置为 initial ✓

## 改进建议

1. **状态持久化**: 考虑在诗人对话中保存对话历史
2. **错误恢复**: 添加超时机制，如果AI响应超时，自动恢复到安全状态
3. **用户反馈**: 在状态转换时添加视觉反馈（如加载动画）

## 修改文件清单

- ✅ `App.tsx` - 修复 handleSendInput 中的诗人对话逻辑
- ✅ `App.tsx` - 添加调试日志和状态监控
- ✅ `DialogueBox.tsx` - 改进 UI 条件渲染逻辑
