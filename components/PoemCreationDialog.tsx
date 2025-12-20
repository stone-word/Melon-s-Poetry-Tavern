/**
 * ==============================================================================
 * 诗歌创作对话框组件 (Poem Creation Dialog)
 * ==============================================================================
 * 供玩家输入诗歌标题、作者名称和诗歌内容的专用对话框
 */

import React, { useState, useEffect } from 'react';

interface PoemCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poem: { title: string; author: string; content: string }) => void;
}

const PoemCreationDialog: React.FC<PoemCreationDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  // 重置表单当对话框关闭时
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setAuthor('');
      setContent('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (title.trim() && author.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        author: author.trim(),
        content: content.trim()
      });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div 
        className="bg-slate-900/95 border-2 border-amber-500 rounded-lg p-6 w-11/12 max-w-lg shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">为顾客创作诗歌</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* 表单内容 */}
        <div className="space-y-4">
          {/* 诗歌标题 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              诗歌标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入诗歌标题..."
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              maxLength={50}
            />
          </div>

          {/* 作者名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              作者名称
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入您的名字..."
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              maxLength={30}
            />
          </div>

          {/* 诗歌内容 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              诗歌内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入您的诗歌内容...&#10;&#10;可以是原创诗歌，也可以是您喜欢的诗句"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
              rows={8}
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {content.length}/500
            </div>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !author.trim() || !content.trim()}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              title.trim() && author.trim() && content.trim()
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            赠送诗歌
          </button>
        </div>

        {/* 提示文本 */}
        <div className="mt-4 text-xs text-slate-400 text-center">
          按 ESC 键可快速关闭对话框
        </div>
      </div>
    </div>
  );
};

export default PoemCreationDialog;