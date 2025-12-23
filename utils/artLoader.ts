/**
 * ==============================================================================
 * 美术资源加载器 (Art Asset Loader)
 * ==============================================================================
 * 负责加载外部PNG图片资源，并提供随机分配功能
 */

// 男性角色图片路径
const MALE_SPRITES = [
    '/art/man-a.png',
    '/art/man-b.png',
    '/art/man-c.png',
];

// 女性角色图片路径
const FEMALE_SPRITES = [
    '/art/woman-a.png',
    '/art/woman-b.png',
    '/art/woman-c.png',
];

// 图片缓存
const imageCache: Record<string, HTMLImageElement> = {};

/**
 * 加载单个图片
 * @param path 图片路径
 * @returns Promise<HTMLImageElement>
 */
export const loadImage = (path: string): Promise<HTMLImageElement> => {
    // 如果已缓存，直接返回
    if (imageCache[path]) {
        return Promise.resolve(imageCache[path]);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache[path] = img;
            resolve(img);
        };
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${path}`));
        };
        img.src = path;
    });
};

/**
 * 预加载所有角色图片
 * @returns Promise<void>
 */
export const preloadCharacterSprites = async (): Promise<void> => {
    // 暂时禁用外部图片加载，使用默认像素画
    console.log('✅ 使用默认像素画（未加载外部图片）');
    return Promise.resolve();
    
    /* 如需启用外部图片，取消下面代码的注释：
    const allPaths = [...MALE_SPRITES, ...FEMALE_SPRITES];
    const promises = allPaths.map(path => 
        loadImage(path).catch(err => {
            console.warn(`⚠️ 图片加载失败（将使用默认像素画）: ${path}`);
            return null;
        })
    );
    
    try {
        await Promise.all(promises);
        console.log('✅ Character sprites loading completed');
    } catch (error) {
        console.error('❌ Error loading character sprites:', error);
    }
    */
};

/**
 * 根据性别随机获取角色精灵图
 * @param gender '男' 或 '女'
 * @returns HTMLImageElement
 */
export const getRandomCharacterSprite = (gender: '男' | '女'): HTMLImageElement | null => {
    const sprites = gender === '男' ? MALE_SPRITES : FEMALE_SPRITES;
    const randomPath = sprites[Math.floor(Math.random() * sprites.length)];
    return imageCache[randomPath] || null;
};

/**
 * 获取指定索引的角色精灵图（用于固定造型）
 * @param gender '男' 或 '女'
 * @param index 0-2
 * @returns HTMLImageElement
 */
export const getCharacterSprite = (gender: '男' | '女', index: number): HTMLImageElement | null => {
    const sprites = gender === '男' ? MALE_SPRITES : FEMALE_SPRITES;
    const path = sprites[index % sprites.length];
    return imageCache[path] || null;
};

/**
 * 创建颜色替换版本的精灵图（可选功能）
 * 用于动态改变衣服/头发颜色
 * @param originalImage 原始图片
 * @param colorMap 颜色映射 { 原色: 新色 }
 * @returns HTMLImageElement
 */
export const recolorSprite = (
    originalImage: HTMLImageElement,
    colorMap: Record<string, string>
): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return originalImage;
    }

    // 绘制原图
    ctx.drawImage(originalImage, 0, 0);

    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 转换颜色映射为RGB格式
    const rgbColorMap: Record<string, { r: number; g: number; b: number }> = {};
    Object.entries(colorMap).forEach(([oldColor, newColor]) => {
        rgbColorMap[oldColor] = hexToRgb(newColor);
    });

    // 遍历每个像素进行颜色替换
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hexColor = rgbToHex(r, g, b);

        if (rgbColorMap[hexColor]) {
            const newColor = rgbColorMap[hexColor];
            data[i] = newColor.r;
            data[i + 1] = newColor.g;
            data[i + 2] = newColor.b;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // 转换为Image对象
    const newImage = new Image();
    newImage.src = canvas.toDataURL();
    return newImage;
};

// 辅助函数：Hex转RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
};

// 辅助函数：RGB转Hex
const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};
