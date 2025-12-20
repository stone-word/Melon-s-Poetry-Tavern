/**
 * ==============================================================================
 * 诗歌数据库服务 (Poetry Database Service)
 * ==============================================================================
 * 负责从poems.txt加载诗歌数据，并提供搜索功能
 */

// 诗歌搜索结果接口
export interface PoemSearchResult {
  keyword: string;
  coreLine: number;
  totalMatches: number;
  poem: string;
}

class PoetryDatabase {
  private poemsData: string[] = [];
  private isLoaded: boolean = false;

  /**
   * 加载诗歌数据库
   */
  async loadDatabase(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('正在加载诗歌数据库...');
      const response = await fetch('/poems.txt');
      
      if (!response.ok) {
        console.warn('未找到 poems.txt 文件，将使用空数据库');
        this.poemsData = [];
        return;
      }
      
      const text = await response.text();
      
      // 按换行分割，过滤空行
      this.poemsData = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
      console.log(`诗歌数据库加载完成，共 ${this.poemsData.length} 行诗句`);
      this.isLoaded = true;
      
    } catch (error) {
      console.error('加载诗歌数据库失败:', error);
      this.poemsData = [];
    }
  }

  /**
   * 搜索包含关键词的诗句行
   */
  private searchPoems(keyword: string): Array<{ lineNumber: number; content: string }> {
    if (!this.isLoaded || this.poemsData.length === 0) {
      console.log('诗歌数据库未加载或为空');
      return [];
    }
    
    console.log(`搜索关键词: "${keyword}"`);
    
    const matchingLines: Array<{ lineNumber: number; content: string }> = [];
    
    for (let i = 0; i < this.poemsData.length; i++) {
      if (this.poemsData[i].includes(keyword)) {
        matchingLines.push({
          lineNumber: i,
          content: this.poemsData[i]
        });
      }
    }
    
    console.log(`找到 ${matchingLines.length} 个匹配行`);
    return matchingLines;
  }

  /**
   * 获取某行及其上下文的诗句
   */
  private getPoemWithContext(lineNumber: number): string[] {
    if (lineNumber < 0 || lineNumber >= this.poemsData.length) {
      return [];
    }
    
    // 计算输出范围：当前行前后各1-2行
    const startLine = Math.max(0, lineNumber - 2);
    const endLine = Math.min(this.poemsData.length - 1, lineNumber + 2);
    
    // 收集范围内的所有行
    const result: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      result.push(this.poemsData[i]);
    }
    
    return result;
  }

  /**
   * 根据关键词获取诗句
   */
  async getPoemByKeyword(keyword: string): Promise<PoemSearchResult | null> {
    // 确保数据库已加载
    await this.loadDatabase();
    
    // 搜索关键词
    const matchingLines = this.searchPoems(keyword);
    
    if (matchingLines.length === 0) {
      console.log(`未找到包含"${keyword}"的诗句`);
      return null;
    }
    
    // 随机选择一个匹配行
    const randomIndex = Math.floor(Math.random() * matchingLines.length);
    const selectedLine = matchingLines[randomIndex];
    
    console.log(`随机选择第 ${selectedLine.lineNumber + 1} 行`);
    
    // 获取上下文
    const poemLines = this.getPoemWithContext(selectedLine.lineNumber);
    
    return {
      keyword: keyword,
      coreLine: selectedLine.lineNumber,
      totalMatches: matchingLines.length,
      poem: poemLines.join('\n')
    };
  }

  /**
   * 获取诗人名字
   */
  getPoetName(): string {
    return "王子瓜"; // 根据poems.txt的内容，这是诗人的名字
  }
}

// 创建单例实例
const poetryDatabase = new PoetryDatabase();

export default poetryDatabase;