import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn/ui 工具函数 - 合并 Tailwind 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(d);
  }
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 获取记忆类型的显示名称
 */
export function getMemoryTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    decision: '架构决策',
    solution: '解决方案',
    config: '配置',
    code: '代码',
    error: '错误',
    session: '会话',
  };
  return typeMap[type] || type;
}

/**
 * 获取记忆类型的颜色 - 科技感配色
 */
export function getMemoryTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    decision: 'bg-green-500',   // 决策 - 绿色
    solution: 'bg-orange-500',  // 解决方案 - 橙色
    config: 'bg-cyan-500',      // 配置 - 青色
    code: 'bg-blue-500',        // 代码 - 蓝色
    error: 'bg-red-500',        // 错误 - 红色
    session: 'bg-gray-500',     // 会话 - 灰色
  };
  return colorMap[type] || 'bg-gray-500';
}
