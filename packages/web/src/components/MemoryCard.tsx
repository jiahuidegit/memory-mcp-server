'use client';

import Link from 'next/link';
import type { Memory } from '@emp/core';
import { formatRelativeTime, getMemoryTypeName } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';
import {
  ArrowRight,
  Brain,
  Code,
  Lightbulb,
  Settings,
  AlertCircle,
  MessageSquare,
  Calendar,
  Tag,
} from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
}

// 类型颜色 - 科技感配色
const typeColors: Record<string, string> = {
  decision: '#10B981',  // 绿色
  solution: '#F97316',  // 橙色
  config: '#06B6D4',    // 青色
  code: '#3B82F6',      // 蓝色
  error: '#EF4444',     // 红色
  session: '#6B7280',   // 灰色
};

// 类型图标
const typeIcons: Record<string, React.ComponentType<LucideProps>> = {
  decision: Lightbulb,
  solution: Brain,
  config: Settings,
  code: Code,
  error: AlertCircle,
  session: MessageSquare,
};

export function MemoryCard({ memory }: MemoryCardProps) {
  const { meta, content } = memory;
  const Icon = typeIcons[meta.type] || Brain;
  const color = typeColors[meta.type] || '#6B7280';

  return (
    <Link
      href={`/memories/${meta.id}`}
      className="block group"
    >
      <div className="glassCard p-6 hoverLift cursor-pointer transition-all duration-300">
        <div className="flex items-start gap-4">
          {/* 类型图标 */}
          <div
            className="p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${color}25, ${color}10)`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>

          {/* 内容区 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 类型和项目标签 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: `${color}20`, color }}
              >
                {getMemoryTypeName(meta.type)}
              </span>
              {meta.projectId && (
                <span className="px-2.5 py-1 rounded-lg text-xs bg-foreground/5 text-muted-foreground">
                  {meta.projectId}
                </span>
              )}
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-heading font-semibold group-hover:textGradientBlue transition-colors duration-300 line-clamp-2">
              {content.summary || '无标题'}
            </h3>

            {/* 标签 */}
            {meta.tags && meta.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                {meta.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-xs bg-foreground/5 text-muted-foreground hover:bg-foreground/10 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
                {meta.tags.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{meta.tags.length - 4}</span>
                )}
              </div>
            )}

            {/* 底部信息 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeTime(meta.timestamp)}
              </span>
              {meta.sessionId && (
                <span className="truncate max-w-[200px]">
                  会话: {meta.sessionId}
                </span>
              )}
            </div>
          </div>

          {/* 箭头指示 */}
          <div className="self-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
