/**
 * ==============================================================================
 * 工作人员身份配置 (Staff Identity Configuration)
 * ==============================================================================
 * 定义酒馆工作人员的固定身份信息，包括调酒师、服务员和清洁工
 */

import { StaffIdentity, Role } from '../types';

// === 1. 调酒师身份配置 ===
export const BARTENDER_IDENTITIES: StaffIdentity[] = [
  {
    name: 'Diego Ramos',
    gender: '男',
    age: 28,
    mbti: 'ESFP',
    hometown: '西班牙巴塞罗那',
    hobbies: '与酒有关的一切、中国文化',
    backstory: '迪亚哥来自巴塞罗那的调酒世家，祖父经营着一家百年酒吧。在上海大学交换学习期间，他爱上了这座城市的活力，决定留下来。他能将西班牙的热情融入创意调酒，擅长用金酒和雪莉酒创作令人惊艳的鸡尾酒，招牌是"巴塞罗那日落"（自制番茄风味金酒+桑格利亚泡沫）。下班后常骑着复古摩托车探索上海的小巷。',
    role: Role.BARTENDER
  },
  {
    name: '薇薇',
    gender: '女',
    age: 26,
    mbti: 'INTJ',
    hometown: '台湾台北',
    hobbies: '化学实验',
    backstory: '化学系毕业的Vivian原本在实验室工作，却因为对分子料理和风味科学的痴迷转行调酒。她将实验器材带入吧台，擅长制作视觉惊艳的"科学调酒"，如用液氮瞬间凝固的"氤氲台北"（乌龙茶威士忌+柚子雾）。表面冷静理性，实则默默关注每位常客的偏好，会为失意的客人特调一杯"隐藏菜单"。',
    role: Role.BARTENDER
  },
  {
    name: '二胡',
    gender: '男',
    age: 32,
    mbti: 'ISTP',
    hometown: '四川成都',
    hobbies: '摇滚乐、摩托骑行',
    backstory: '曾在五星级酒店从业十年的技术派调酒师，因厌倦标准化流程而来到这家独立酒馆。他是古典鸡尾酒的大师，能用最精准的手法还原20世纪初的经典配方，同时巧妙融入川式元素（如花椒浸渍金酒）。寡言少语，但手中的摇酒壶如同乐器般富有节奏。私下是摩托车维修高手，酒馆的设备故障都由他搞定。',
    role: Role.BARTENDER
  }
];

// === 2. 服务员身份配置 ===
export const WAITER_IDENTITIES: StaffIdentity[] = [
  {
    name: '阿辉',
    gender: '男',
    age: 24,
    mbti: 'ENFJ',
    hometown: '新加坡',
    hobbies: '写作',
    backstory: '第三代新加坡华人，为学习普通话和体验"真正的四季"来到上海。白天是复旦大学留学生，晚上在酒馆打工。他能用英语、普通话、闽南话和简单沪语与客人交流，天生的"社交纽带"，总能让不同桌的客人意外结识。偷偷记录着客人们的故事，梦想写一部《酒馆人间观察笔记》。',
    role: Role.WAITER
  },
  {
    name: '小雨',
    gender: '女',
    age: 22,
    mbti: 'ISFP',
    hometown: '上海本地（长宁区）',
    hobbies: '绘画、雕刻',
    backstory: '土生土长的上海姑娘，美术专业大三学生，在酒馆兼职赚取旅行基金。她手绘的每日特色菜单是酒馆一景，细腻的插画让每款酒都有了故事。熟知上海的隐秘角落，常给游客客人手绘"非主流探索地图"。看似文静，实则曾在音乐节做过志愿者，能淡定处理各种突发状况。',
    role: Role.WAITER
  },
  {
    name: '小马哥',
    gender: '男',
    age: 27,
    mbti: 'ESTJ',
    hometown: '陕西西安',
    hobbies: '极限运动',
    backstory: '前健身房教练，体格健壮却心思细腻，是酒馆的"定海神针"。他记性好到能记住三个月前某位客人点过的酒，并提醒"这次试试半糖？"。将西安人的实在带入服务，从不刻意推销贵价酒，反而常推荐"性价比之王"。私下正在备考餐饮管理证书，梦想开一家融合西安风味的小酒馆。',
    role: Role.WAITER
  },
  {
    name: '真雅',
    gender: '女',
    age: 25,
    mbti: 'INFP',
    hometown: '韩国釜山',
    hobbies: '摄影',
    backstory: '在韩国公司派驻上海期间，因迷恋酒馆氛围而辞职转行。她自带温柔的治愈气场，总能在客人微醺时递上恰到好处的温水或热毛巾。偷偷学习调酒师技艺，偶尔在淡季尝试创作韩式融合调酒（如姜枣茶波本）。她随身携带拍立得，为愿意的客人记录酒馆时刻，照片墙已成为酒馆的情感记忆库。',
    role: Role.WAITER
  }
];

// === 3. 清洁工身份配置 ===
export const CLEANER_IDENTITIES: StaffIdentity[] = [
  {
    name: '王阿姨',
    gender: '女',
    age: 53,
    mbti: 'ISFJ',
    hometown: '江苏盐城',
    hobbies: '广场舞',
    backstory: '王阿姨跟随女儿来到上海，原本只是帮忙带孩子，孩子上学后便想找点事做。她是酒馆的"隐形守护者"，不仅让环境一尘不染，还默默照顾着这群"上海的孩子"——冰箱里总有她准备的醒酒蜂蜜水，雨季会有她悄悄烘干的备用袜子。会说一口盐城味的上海话，常给年轻员工讲老上海的故事。她丈夫是退休厨师，偶尔送来自制小菜给员工加餐。',
    role: Role.CLEANER
  }
];

// === 4. 酒馆背景信息 ===
export const TAVERN_INFO = {
  name: '梅隆诗歌酒馆',
  location: '上海某条梧桐树掩映的老街',
  established: '2018年',
  style: '独立文艺酒馆',
  atmosphere: '温暖、包容、充满故事感',
  specialties: [
    '创意鸡尾酒',
    '经典调酒',
    '诗歌朗诵',
    '深夜对话'
  ],
  signature_drinks: [
    '巴塞罗那日落（Diego特调）',
    '氤氲台北（薇薇特调）',
    '花椒金汤力（二胡特调）'
  ],
  description: '这是一家藏在上海老街深处的独立酒馆，梧桐树影斑驳间，总有音乐和诗歌流淌。这里不追求网红打卡，却吸引着形形色色寻找片刻安宁的灵魂。调酒师们来自不同的地方，带着各自的故事和技艺；服务员们年轻而温暖，用真诚连接着每一位客人；就连清洁工王阿姨，也是这个温暖空间不可或缺的一部分。'
};

/**
 * 根据NPC ID和角色类型获取工作人员身份
 */
export const getStaffIdentity = (role: Role, index: number): StaffIdentity | undefined => {
  switch (role) {
    case Role.BARTENDER:
      return BARTENDER_IDENTITIES[index % BARTENDER_IDENTITIES.length];
    case Role.WAITER:
      return WAITER_IDENTITIES[index % WAITER_IDENTITIES.length];
    case Role.CLEANER:
      return CLEANER_IDENTITIES[index % CLEANER_IDENTITIES.length];
    default:
      return undefined;
  }
};
