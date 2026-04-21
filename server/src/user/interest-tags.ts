// Predefined interest tags - concrete and specific as per requirement doc
export const INTEREST_TAGS = [
  // 文艺
  '摄影',
  '推理小说',
  '科幻小说',
  '诗歌',
  '日本文学',
  '独立摇滚',
  '周杰伦',
  '古典音乐',
  '民谣',
  '爵士',
  '水彩画',
  '书法',
  '手账',
  // 运动
  '篮球',
  '羽毛球',
  '乒乓球',
  '网球',
  '游泳',
  '跑步',
  '瑜伽',
  '攀岩',
  '骑行',
  '徒步',
  // 生活
  '咖啡',
  '烘焙',
  '烹饪',
  '约饭达人',
  '旅行',
  '露营',
  '天文观测',
  '观星',
  // 影视
  '科幻电影',
  '悬疑剧',
  '动漫',
  '纪录片',
  '综艺',
  // 学术/兴趣
  '心理学',
  '哲学',
  'MBTI分析',
  '辩论',
  '独立游戏',
  '编程',
  '机器人',
  '天文',
  // 艺术
  '吉他',
  '钢琴',
  '尤克里里',
  '乐队',
] as const;

export const MAX_INTEREST_TAGS = 10;

export function validateInterests(interests: string[]): string | null {
  if (interests.length > MAX_INTEREST_TAGS) {
    return `兴趣标签最多选择 ${MAX_INTEREST_TAGS} 个`;
  }
  const validSet = new Set<string>(INTEREST_TAGS);
  for (const tag of interests) {
    if (!validSet.has(tag)) {
      return `无效的标签: ${tag}`;
    }
  }
  return null;
}
