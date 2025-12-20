/**
 * ==============================================================================
 * 诗歌图书馆组件 (Poem Library)
 * ==============================================================================
 * 显示玩家创作的所有诗歌记录，按诗人分组的树形结构
 */

import React, { useState, useEffect } from 'react';
import * as PoemStorage from '../services/poemStorage';

interface PoemLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

// 诗人分组数据结构
interface PoetGroup {
  authorName: string;
  poems: PoemStorage.PoemRecord[];
  isExpanded: boolean;
}

const PoemLibrary: React.FC<PoemLibraryProps> = ({ isOpen, onClose }) => {
  const [allPoems, setAllPoems] = useState<PoemStorage.PoemRecord[]>([]);
  const [poetGroups, setPoetGroups] = useState<PoetGroup[]>([]);
  const [selectedPoem, setSelectedPoem] = useState<PoemStorage.PoemRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);

  // 加载诗歌数据
  useEffect(() => {
    if (isOpen) {
      loadPoems();
      loadStats();
    }
  }, [isOpen]);

  const loadPoems = () => {
    const poems = PoemStorage.getAllPoemRecords();
    setAllPoems(poems);
    groupPoemsByAuthor(poems);
  };

  const loadStats = () => {
    const statistics = PoemStorage.getPoemStatistics();
    setStats(statistics);
  };

  // 按作者分组诗歌
  const groupPoemsByAuthor = (poems: PoemStorage.PoemRecord[]) => {
    const groups: { [key: string]: PoemStorage.PoemRecord[] } = {};
    
    poems.forEach(poem => {
      const author = poem.poem.author;
      if (!groups[author]) {
        groups[author] = [];
      }
      groups[author].push(poem);
    });

    const poetGroups: PoetGroup[] = Object.entries(groups).map(([authorName, poems]) => ({
      authorName,
      poems: poems.sort((a, b) => b.timestamp - a.timestamp), // 按时间倒序
      isExpanded: false // 默认折叠
    }));

    // 按诗歌数量排序，诗歌多的诗人排在前面
    poetGroups.sort((a, b) => b.poems.length - a.poems.length);
    
    setPoetGroups(poetGroups);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = PoemStorage.searchPoemRecords(searchQuery);
      groupPoemsByAuthor(results);
    } else {
      groupPoemsByAuthor(allPoems);
    }
  };

  // 切换诗人分组的展开/折叠状态
  const togglePoetGroup = (authorName: string) => {
    setPoetGroups(prev => prev.map(group => 
      group.authorName === authorName 
        ? { ...group, isExpanded: !group.isExpanded }
        : group
    ));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatCustomerInfo = (customer: any) => {
    const nationality = customer.isForeigner ? '外国人' : '中国人';
    const location = customer.isShanghainess ? '，上海本地人' : '';
    return `${customer.age}岁${customer.gender}性${customer.occupation}，${nationality}${location}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 自定义滚动条样式 */}
      <style>{`
        .poem-library-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .poem-library-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 4px;
        }
        .poem-library-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.5);
          border-radius: 4px;
        }
        .poem-library-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.7);
        }
        .poem-library-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 158, 11, 0.5) rgba(30, 41, 59, 0.3);
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
        <div 
          className="bg-slate-900/95 border-2 border-amber-500 rounded-lg w-11/12 max-w-6xl h-5/6 shadow-2xl backdrop-blur-sm flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 左侧：诗人目录树 */}
          <div className="w-1/3 border-r border-slate-600 flex flex-col">
            {/* 标题和搜索 */}
            <div className="p-4 border-b border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-amber-400">诗歌图书馆</h2>
                <button 
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
              
              {/* 统计信息 */}
              {stats && (
                <div className="text-sm text-slate-400 mb-3">
                  共收录 {stats.totalPoems} 首诗歌，{poetGroups.length} 位诗人
                </div>
              )}
              
              {/* 搜索框 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索诗歌标题、内容或诗人..."
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 诗人目录树 */}
            <div className="flex-1 overflow-y-auto p-2 poem-library-scrollbar">
              {poetGroups.length === 0 ? (
                <div className="text-center text-slate-400 mt-8">
                  {searchQuery ? '没有找到匹配的诗歌' : '还没有创作任何诗歌'}
                </div>
              ) : (
                poetGroups.map((group) => (
                  <div key={group.authorName} className="mb-2">
                    {/* 1级目录：诗人名字 */}
                    <div
                      onClick={() => togglePoetGroup(group.authorName)}
                      className="flex items-center p-2 rounded cursor-pointer transition-colors bg-slate-800 hover:bg-slate-700 border border-slate-600"
                    >
                      <span className="text-amber-300 mr-2">
                        {group.isExpanded ? '📖' : '📚'}
                      </span>
                      <span className="font-medium text-amber-300 flex-1">
                        {group.authorName}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                        {group.poems.length}首
                      </span>
                      <span className="text-slate-400 ml-2">
                        {group.isExpanded ? '▼' : '▶'}
                      </span>
                    </div>

                    {/* 2级目录：诗歌标题 */}
                    {group.isExpanded && (
                      <div className="ml-4 mt-1">
                        {group.poems.map((poem) => (
                          <div
                            key={poem.id}
                            onClick={() => setSelectedPoem(poem)}
                            className={`p-2 mb-1 rounded cursor-pointer transition-colors border-l-2 ${
                              selectedPoem?.id === poem.id
                                ? 'bg-amber-600/20 border-amber-500 border-l-amber-500'
                                : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 border-l-slate-500'
                            }`}
                          >
                            <div className="font-medium text-slate-200 mb-1 text-sm">
                              《{poem.poem.title}》
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatDate(poem.timestamp)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              赠予：{poem.customer.occupation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右侧：诗歌详情 */}
          <div className="flex-1 flex flex-col">
            {selectedPoem ? (
              <>
                {/* 诗歌标题 */}
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-2xl font-bold text-amber-400 mb-2">《{selectedPoem.poem.title}》</h3>
                  <div className="text-sm text-slate-400">
                    作者：{selectedPoem.poem.author} | {formatDate(selectedPoem.timestamp)}
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-4 poem-library-scrollbar">
                  {/* 诗歌内容 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                      <span className="text-amber-400 mr-2">📜</span>
                      诗歌内容
                    </h4>
                    <div className="bg-slate-800 rounded-lg p-4 whitespace-pre-wrap text-slate-100 leading-relaxed border border-slate-700">
                      {selectedPoem.poem.content}
                    </div>
                  </div>

                  {/* 顾客信息 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                      <span className="text-amber-400 mr-2">👤</span>
                      赠予对象
                    </h4>
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="text-slate-100 mb-2 font-medium">
                        {formatCustomerInfo(selectedPoem.customer)}
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="text-slate-400">
                          <span className="text-slate-300">性格：</span>{selectedPoem.customer.personality}
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-300">心情：</span>{selectedPoem.customer.mood}
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-300">来店动机：</span>{selectedPoem.customer.motivation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 顾客反应 */}
                  {selectedPoem.customerReaction && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                        <span className="text-amber-400 mr-2">💭</span>
                        顾客反应
                      </h4>
                      <div className="bg-slate-800 rounded-lg p-4 text-slate-100 leading-relaxed border border-slate-700">
                        {selectedPoem.customerReaction}
                      </div>
                    </div>
                  )}

                  {/* 对话历史 */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                      <span className="text-amber-400 mr-2">💬</span>
                      对话记录
                    </h4>
                    <div className="bg-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto poem-library-scrollbar border border-slate-700">
                      {selectedPoem.conversationHistory.map((msg, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          {msg.role === 'user' ? (
                            <div className="text-blue-300 italic font-medium">
                              <span className="text-blue-400">玩家：</span>{msg.content}
                            </div>
                          ) : (
                            <div className="text-slate-100">
                              <span className="text-slate-300 font-medium">顾客：</span>{msg.content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4">📚</div>
                <div className="text-lg">请从左侧选择一首诗歌查看详情</div>
                <div className="text-sm mt-2 text-slate-500">点击诗人名字展开诗歌列表</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PoemLibrary;