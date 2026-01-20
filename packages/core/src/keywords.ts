/**
 * 关键词提取模块
 * 用于从记忆内容中提取关键词，支持中英文混合文本
 */

// 中文停用词
const CHINESE_STOP_WORDS = new Set([
  '的', '是', '在', '了', '和', '与', '或', '有', '这', '那', '我', '你', '他', '她', '它',
  '们', '不', '也', '就', '都', '为', '被', '着', '让', '把', '给', '从', '到', '对', '于',
  '但', '而', '及', '还', '以', '所', '如', '则', '等', '该', '这个', '那个', '一个', '什么',
  '怎么', '如何', '可以', '需要', '使用', '进行', '通过', '已经', '然后', '因为', '所以',
  '如果', '虽然', '但是', '而且', '或者', '以及', '关于', '其中', '之后', '之前', '目前',
]);

// 英文停用词
const ENGLISH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'also', 'now', 'here', 'there', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
]);

// 合并停用词
const STOP_WORDS = new Set([...CHINESE_STOP_WORDS, ...ENGLISH_STOP_WORDS]);

/**
 * 特殊模式提取器：提取 API 路径、驼峰命名、版本号等
 */
const SPECIAL_PATTERNS = [
  // API 路径: /api/users, /v1/auth/login
  /\/[a-z][a-z0-9\-_\/]*/gi,
  // HTTP 方法 + 路径: GET /api/users
  /\b(GET|POST|PUT|DELETE|PATCH)\s+\/[a-z][a-z0-9\-_\/]*/gi,
  // 驼峰命名: getUserById, handleSubmit
  /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g,
  // 帕斯卡命名: UserService, AuthController
  /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
  // 常量命名: MAX_RETRY, API_KEY
  /\b[A-Z][A-Z0-9_]{2,}\b/g,
  // 版本号: 1.0.0, v2.3.1
  /\bv?\d+\.\d+(?:\.\d+)?(?:-[a-z]+(?:\.\d+)?)?\b/gi,
  // 端口号: :3000, :8080
  /:\d{2,5}\b/g,
  // 文件扩展名: .ts, .tsx, .vue
  /\.[a-z]{2,4}\b/gi,
  // 数据库/技术名词: PostgreSQL, MongoDB, Redis
  /\b(?:PostgreSQL|MySQL|MongoDB|Redis|SQLite|Prisma|Docker|Kubernetes|K8s|Node\.js|React|Vue|Angular|Next\.js|Express|NestJS|GraphQL|REST|JWT|OAuth|WebSocket|CORS|HTTPS?|API|SDK|CLI|CI\/CD|AWS|GCP|Azure)\b/gi,
];

/**
 * 判断是否为停用词
 */
function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * 基础分词：处理中英文混合文本
 */
function basicTokenize(text: string): string[] {
  const tokens: string[] = [];

  // 分割标点和空白
  const words = text.split(/[\s\n\r\t,，。.;；:：!！?？(（)）\[\]{}""''`<>《》【】、\-=+*\/\\|~@#$%^&]+/);

  for (const word of words) {
    if (word.length < 2) continue;

    // 检查是否包含中文
    if (/[\u4e00-\u9fa5]/.test(word)) {
      // 中文分词：简单按字符拆分（2-4字组合）
      const chineseChars = word.match(/[\u4e00-\u9fa5]+/g) || [];
      for (const chars of chineseChars) {
        // 添加整个词
        if (chars.length >= 2 && chars.length <= 8) {
          tokens.push(chars);
        }
        // 添加二字组合
        if (chars.length > 2) {
          for (let i = 0; i < chars.length - 1; i++) {
            tokens.push(chars.substring(i, i + 2));
          }
        }
      }
      // 同时提取英文部分
      const englishParts = word.match(/[a-zA-Z0-9_]+/g) || [];
      tokens.push(...englishParts.filter(p => p.length >= 2));
    } else {
      // 纯英文/数字
      tokens.push(word);
    }
  }

  return tokens;
}

/**
 * 提取特殊模式关键词
 */
function extractSpecialPatterns(text: string): string[] {
  const keywords: string[] = [];

  for (const pattern of SPECIAL_PATTERNS) {
    const matches = text.match(pattern) || [];
    keywords.push(...matches);
  }

  return keywords;
}

/**
 * 从 JSON 对象中提取文本
 */
function extractTextFromObject(obj: unknown, depth = 0): string {
  if (depth > 5) return ''; // 防止过深递归

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromObject(item, depth + 1)).join(' ');
  }

  if (obj && typeof obj === 'object') {
    const texts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      // 跳过一些不需要的字段
      if (['id', 'createdAt', 'updatedAt', 'timestamp', 'version'].includes(key)) {
        continue;
      }
      // key 也可能包含信息
      if (typeof key === 'string' && key.length > 2) {
        texts.push(key);
      }
      texts.push(extractTextFromObject(value, depth + 1));
    }
    return texts.join(' ');
  }

  return '';
}

/**
 * 计算词频并返回高频词
 */
function getTopKeywords(words: string[], limit = 30): string[] {
  const frequency = new Map<string, number>();

  for (const word of words) {
    const normalized = word.toLowerCase();
    if (isStopWord(normalized)) continue;
    if (normalized.length < 2) continue;

    frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
  }

  // 按频率排序，取前 N 个
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * 主函数：从内容中提取关键词
 * @param content 摘要/主要内容
 * @param rawContext 原始上下文对象
 * @returns 关键词数组（去重、排序后）
 */
export function extractKeywords(
  content: string,
  rawContext?: Record<string, unknown>
): string[] {
  const allKeywords: string[] = [];

  // 1. 从 content 提取
  const contentText = content || '';
  allKeywords.push(...basicTokenize(contentText));
  allKeywords.push(...extractSpecialPatterns(contentText));

  // 2. 从 rawContext 提取
  if (rawContext) {
    const contextText = extractTextFromObject(rawContext);
    allKeywords.push(...basicTokenize(contextText));
    allKeywords.push(...extractSpecialPatterns(contextText));
  }

  // 3. 去重 + 过滤停用词 + 取高频词
  const topKeywords = getTopKeywords(allKeywords, 30);

  // 4. 保留原始大小写的特殊模式（API路径、技术名词等）
  const specialKeywords = extractSpecialPatterns(contentText + ' ' + extractTextFromObject(rawContext));
  const uniqueSpecial = [...new Set(specialKeywords)].slice(0, 10);

  // 5. 合并结果
  const result = [...new Set([...uniqueSpecial, ...topKeywords])];

  return result.slice(0, 40); // 最多返回40个关键词
}

/**
 * 计算两组关键词的 Jaccard 相似度
 * @param keywords1 第一组关键词
 * @param keywords2 第二组关键词
 * @returns 相似度 0-1
 */
export function jaccardSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 && keywords2.length === 0) return 0;

  const set1 = new Set(keywords1.map(k => k.toLowerCase()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * 获取两组关键词的交集
 */
export function getKeywordIntersection(keywords1: string[], keywords2: string[]): string[] {
  const set1 = new Set(keywords1.map(k => k.toLowerCase()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase()));

  return [...set1].filter(x => set2.has(x));
}
