'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TimelineChart } from '@/components/TimelineChart';
import { FilterPanel } from '@/components/FilterPanel';
import type { TimelineResult } from '@emp/core';
import api from '@/lib/api';
import { Loader2, Calendar } from 'lucide-react';
import { cn, getMemoryTypeName, getMemoryTypeColor } from '@/lib/utils';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    projectId: '',
    type: '',
  });

  useEffect(() => {
    if (filters.projectId) {
      loadTimeline();
    }
  }, [filters]);

  async function loadTimeline() {
    try {
      setLoading(true);
      const result = await api.getTimeline(filters.projectId, {
        type: filters.type,
        limit: 100,
      });
      setTimeline(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">项目时间线</h1>
          <p className="text-muted-foreground mt-2">
            可视化展示项目发展历程
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
            placeholder="输入项目 ID"
            className="flex-1 max-w-sm px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <FilterPanel
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* Content */}
        {!filters.projectId ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>请输入项目 ID 查看时间线</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : !timeline || timeline.entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无时间线数据</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{timeline.total}</div>
                <div className="text-sm text-muted-foreground">总计</div>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-green-500">
                  {timeline.entries.filter((e) => e.memory.meta.type === 'decision').length}
                </div>
                <div className="text-sm text-muted-foreground">决策</div>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-orange-500">
                  {timeline.entries.filter((e) => e.memory.meta.type === 'solution').length}
                </div>
                <div className="text-sm text-muted-foreground">解决方案</div>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-blue-500">
                  {timeline.entries.filter((e) => e.memory.meta.type === 'code').length}
                </div>
                <div className="text-sm text-muted-foreground">代码</div>
              </div>
            </div>

            {/* 图表 */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-heading font-semibold mb-6">时间趋势</h2>
              <TimelineChart data={timeline.entries} />
            </div>

            {/* 时间线列表 */}
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold">详细时间线</h2>
              {timeline.entries.map((entry) => (
                <Link
                  key={entry.memory.meta.id}
                  href={`/memories/${entry.memory.meta.id}`}
                  className="flex gap-4 pl-4 border-l-2 border-border hover:border-primary transition-colors group cursor-pointer"
                >
                  <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                    {new Date(entry.memory.meta.timestamp).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          getMemoryTypeColor(entry.memory.meta.type)
                        )}
                      />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {entry.memory.content.summary || '无标题'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getMemoryTypeName(entry.memory.meta.type)}
                      {entry.memory.meta.tags?.length ? (
                        <span className="ml-2">· {entry.memory.meta.tags.join(', ')}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
