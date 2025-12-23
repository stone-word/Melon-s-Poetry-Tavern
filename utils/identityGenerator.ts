/**
 * ==============================================================================
 * 身份生成器 (Identity Generator)
 * ==============================================================================
 * 为顾客生成基础身份信息：性别、年龄和职业
 */

import { CustomerIdentity, AGE_DISTRIBUTION, OCCUPATION_DISTRIBUTION, MBTI_TYPES, MOOD_TYPES } from '../types';

// 中文姓氏列表（常见100个姓氏）
const CHINESE_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗',
  '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
  '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡',
  '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈',
  '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金',
  '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟',
  '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯',
  '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵',
  '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'
];

/**
 * 生成随机顾客身份
 */
export function generateCustomerIdentity(): CustomerIdentity {
  // 1. 生成性别 - 男女概率相同 (50% vs 50%)
  const gender = Math.random() < 0.5 ? '男' : '女';
  
  // 2. 生成年龄 - 按照指定的概率分布
  const age = generateAge();
  
  // 3. 生成姓氏 - 从姓氏列表中随机选择
  const surname = CHINESE_SURNAMES[Math.floor(Math.random() * CHINESE_SURNAMES.length)];
  
  // 4. 生成职业 - 按照三级分类概率分布
  const occupation = generateOccupation();
  
  // 5. 生成性格 - 等概率随机选择
  const personality = generatePersonality();
  
  // 6. 生成情绪 - 等概率随机选择
  const mood = generateMood();

  // 7. 判断是否外国人 - 基于职业
  const isForeigner = isOccupationForeign(occupation);
  
  // 8. 判断是否上海人 - 中国人中20%概率
  const isShanghainess = !isForeigner && Math.random() < 0.2;

  return {
    age,
    gender,
    surname,
    occupation,
    personality,
    mood,
    isForeigner,
    isShanghainess,
    motivation: undefined // 初始为空，首次对话时AI生成
  };
}

/**
 * 生成年龄 - 按照指定的概率分布
 * 18-21岁: 25%
 * 22-30岁: 35%
 * 31-40岁: 25%
 * 41-50岁: 10%
 * 51-60岁: 4%
 * 61-99岁: 1%
 */
function generateAge(): number {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const group of AGE_DISTRIBUTION.groups) {
    cumulativeProbability += group.probability;
    if (random <= cumulativeProbability) {
      return randomBetween(group.min, group.max);
    }
  }
  
  // 备用方案（理论上不应该到达这里）
  return randomBetween(18, 99);
}

/**
 * 生成指定范围内的随机整数
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成职业 - 按照三级分类概率分布
 */
function generateOccupation(): string {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  // 第一级：选择主要分类
  for (const primaryCategory of OCCUPATION_DISTRIBUTION.primaryCategories) {
    cumulativeProbability += primaryCategory.probability;
    if (random <= cumulativeProbability) {
      // 第二级：在选中的主分类中选择子分类
      const secondaryRandom = Math.random();
      let secondaryCumulative = 0;
      
      for (const secondaryCategory of primaryCategory.secondaryCategories) {
        secondaryCumulative += secondaryCategory.probability;
        if (secondaryRandom <= secondaryCumulative) {
          // 第三级：在选中的子分类中等概率选择具体职业
          const occupations = secondaryCategory.occupations;
          const occupationIndex = Math.floor(Math.random() * occupations.length);
          return occupations[occupationIndex];
        }
      }
    }
  }
  
  // 备用方案（理论上不应该到达这里）
  return '自由职业者';
}

/**
 * 生成MBTI人格类型 - 等概率随机选择16种类型之一
 */
function generatePersonality(): string {
  const randomIndex = Math.floor(Math.random() * MBTI_TYPES.length);
  const mbtiType = MBTI_TYPES[randomIndex];
  return `${mbtiType.code} (${mbtiType.name})`;
}

/**
 * 生成情绪 - 等概率随机选择30种情绪之一
 */
function generateMood(): string {
  const randomIndex = Math.floor(Math.random() * MOOD_TYPES.length);
  return MOOD_TYPES[randomIndex];
}

/**
 * 判断职业是否为外籍职业
 */
function isOccupationForeign(occupation: string): boolean {
  const foreignOccupations = ['外籍留学生', '外籍游客', '外籍员工', '外籍员工家属'];
  return foreignOccupations.includes(occupation);
}

/**
 * 格式化身份信息为显示文本
 * 格式：顾客，年龄性别，职业，MBTI类型
 */
export function formatIdentityDisplay(identity: CustomerIdentity): string {
  // 提取MBTI代码（去掉括号中的中文名称）
  const mbtiCode = identity.personality.split(' ')[0]; // 例如从"INTJ (建筑师)"中提取"INTJ"
  return `顾客，${identity.age}岁${identity.gender}，${identity.occupation}，${mbtiCode}`;
}

/**
 * 生成来店动机的AI提示词
 */
export function generateMotivationPrompt(identity: CustomerIdentity): string {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  return `请为这位顾客生成一句简短的来店动机（15-25字）：
身份：${identity.age}岁${identity.gender}性${identity.occupation}，${nationalityInfo}${locationInfo}
性格：${identity.personality}
情绪：${identity.mood}

要求：
1. 符合身份特征和当前情绪
2. 真实自然，不要过于戏剧化
3. 15-25字，简洁明了
4. 只返回动机内容，不要其他解释
5. 以接近口语的内心独白方式表达

示例格式：工作好累，找个地方放松一下吧……`;
}

/**
 * 生成用于AI对话的身份描述（包含性格信息）
 */
export function generateIdentityPrompt(identity: CustomerIdentity): string {
  const nationalityInfo = identity.isForeigner ? '外国人' : '中国人';
  const locationInfo = identity.isShanghainess ? '，是上海本地人' : '';
  
  return `你是${identity.age}岁的${identity.occupation}，性别${identity.gender}，${nationalityInfo}${locationInfo}。
十六型人格为：${identity.personality}
${identity.motivation ? `来店动机：${identity.motivation}` : ''}
请根据你的年龄、职业、国籍、地域身份和性格特点来回应对话，语气要符合你的身份特征。`;
}

/**
 * 生成随机HSL颜色
 */
function randomHSL(hueRange?: [number, number], satRange?: [number, number], lightRange?: [number, number]): string {
  const hue = hueRange ? hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]) : Math.random() * 360;
  const sat = satRange ? satRange[0] + Math.random() * (satRange[1] - satRange[0]) : 40 + Math.random() * 40;
  const light = lightRange ? lightRange[0] + Math.random() * (lightRange[1] - lightRange[0]) : 35 + Math.random() * 30;
  return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`;
}

/**
 * 为顾客生成自定义调色板（用于sprite着色）
 * 只适当考虑性别差异，其他完全随机
 * 
 * 字符映射：
 * h = 头发颜色
 * G = 上衣颜色  
 * 腿部目前在sprite中也用G，后续可扩展
 */
export function generateCustomerPalette(gender: string): Record<string, string> {
  // 头发颜色 - 自然发色系
  const hairColors = [
    'hsl(30, 25%, 20%)',   // 深棕
    'hsl(20, 30%, 15%)',   // 黑褐
    'hsl(0, 0%, 10%)',     // 黑色
    'hsl(35, 35%, 30%)',   // 棕色
    'hsl(40, 40%, 40%)',   // 浅棕
    'hsl(45, 50%, 50%)',   // 金棕
  ];
  const hair = hairColors[Math.floor(Math.random() * hairColors.length)];

  // 上衣/身体颜色 - 女性偏向明亮鲜艳，男性偏向深沉稳重
  let clothes: string;
  if (gender === '女') {
    // 女性：更鲜艳明亮的颜色
    clothes = randomHSL([0, 360], [50, 80], [45, 65]);
  } else {
    // 男性：更深沉稳重的颜色
    clothes = randomHSL([0, 360], [30, 60], [30, 50]);
  }

  // 返回自定义调色板（会覆盖默认PALETTE中的h和G）
  return {
    'h': hair,      // 头发
    'G': clothes,   // 衣服
  };
}