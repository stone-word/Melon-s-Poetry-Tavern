/**
 * ==============================================================================
 * 音乐服务 (Music Service)
 * ==============================================================================
 * 播放背景音乐（从音频文件）
 */

class MusicService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.3; // 默认音量 30%

  constructor() {
    // 创建音频元素
    this.audio = new Audio('./music/Canon3.mp3');
    this.audio.loop = true; // 循环播放
    this.audio.volume = this.volume;
    
    // 监听加载错误
    this.audio.addEventListener('error', (e) => {
      console.error('🎵 音乐加载失败:', e);
    });
    
    // 监听加载成功
    this.audio.addEventListener('canplay', () => {
      console.log('🎵 音乐已加载完成');
    });
  }

  /**
   * 开始播放背景音乐
   */
  public start() {
    if (this.isPlaying || !this.audio) return;

    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        console.log('🎵 背景音乐已开始播放');
      })
      .catch((error) => {
        console.error('🎵 播放失败:', error);
        // 如果自动播放被阻止，等待用户交互后再播放
        if (error.name === 'NotAllowedError') {
          console.log('🎵 需要用户交互才能播放音乐');
        }
      });
  }

  /**
   * 停止播放背景音乐
   */
  public stop() {
    if (!this.isPlaying || !this.audio) return;
    
    this.audio.pause();
    this.isPlaying = false;
    
    console.log('🎵 背景音乐已停止');
  }

  /**
   * 设置音量
   * @param volume 音量值 (0-1)
   */
  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * 获取当前音量
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * 切换播放/暂停
   */
  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * 获取播放状态
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// 导出单例
export const musicService = new MusicService();
export default musicService;
