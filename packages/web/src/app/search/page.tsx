'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MemoryCard } from '@/components/MemoryCard';
import type { Memory, SearchResult } from '@emp/core';
import api from '@/lib/api';
import {
  Search,
  Loader2,
  Filter,
  Zap,
  FileText,
  Brain,
  X,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchStrategy = 'exact' | 'fulltext' | 'semantic' | 'auto';

const strategyConfig: Record<
  SearchStrategy,
  { label: string; icon: React.ComponentType<{ className?: string }>; desc: string; color: string }
> = {
  exact: { label: '精确匹配', icon: Search, desc: 'ID 或关键词完全匹配', color: '#3B82F6' },
  fulltext: { label: '全文搜索', icon: FileText, desc: '内容全文检索', color: '#10B981' },
  semantic: { label: '语义搜索', icon: Brain, desc: 'AI 语义理解检索', color: '#06B6D4' },
  auto: { label: '混合搜索', icon: Zap, desc: '综合多种策略', color: '#F97316' },
};

const memoryTypes = [
  { value: '', label: '全部类型' },
  { value: 'decision', label: '决策' },
  { value: 'solution', label: '解决方案' },
  { value: 'config', label: '配置' },
  { value: 'code', label: '代码' },
  { value: 'error', label: '错误' },
  { value: 'session', label: '会话' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<SearchStrategy>('auto');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Memory[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    projectId: '',
    type: '',
    tags: '',
    startDate: '',
    endDate: '',
  });

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams: any = {
        query: query.trim(),
        limit: 50,
        strategy,
      };

      if (filters.projectId) searchParams.projectId = filters.projectId;
      if (filters.type) searchParams.type = filters.type;
      if (filters.tags) searchParams.tags = filters.tags.split(',').map((t) => t.trim());

      const result: SearchResult = await api.searchMemories(searchParams);
      setResults(result.memories);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters({
      projectId: '',
      type: '',
      tags: '',
      startDate: '',
      endDate: '',
    });
  }

  const hasActiveFilters =
    filters.projectId || filters.type || filters.tags || filters.startDate || filters.endDate;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-400/10 border border-orange-500/20">
              <Search className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-3xl font-heading font-bold">高级搜索</h1>
          </div>
          <p className="text-muted-foreground">
            多策略检索，精准定位记忆
          </p>
        </div>

        {/* Search Box */}
        <div className="space-y-4">
          {/* 搜索输入 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入搜索关键词..."
                className="inputField pl-12 pr-4"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-3 rounded-lg transition-all duration-300 cursor-pointer',
                showFilters || hasActiveFilters
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'glassDark border border-transparent hover:border-border/50'
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="btnPrimary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  搜索中
                </>
              ) : (
                '搜索'
              )}
            </button>
          </div>

          {/* 策略选择 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">搜索策略:</span>
            <div className="flex gap-2">
              {(Object.keys(strategyConfig) as SearchStrategy[]).map((s) => {
                const config = strategyConfig[s];
                const Icon = config.icon;
                const isActive = strategy === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
                      isActive
                        ? 'text-white'
                        : 'glassDark text-muted-foreground hover:text-foreground'
                    )}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${config.color}, ${config.color}CC)`
                        : undefined,
                      boxShadow: isActive
                        ? `0 4px 14px -2px ${config.color}40`
                        : undefined,
                    }}
                    title={config.desc}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 高级筛选面板 */}
          {showFilters && (
            <div className="glassCard p-6 space-y-6 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-blue-400" />
                  <h3 className="font-heading font-semibold">高级筛选</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    清除筛选
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 项目 ID */}
                <div className="space-y-2">
                  <label className="block text-sm text-muted-foreground">
                    项目 ID
                  </label>
                  <input
                    type="text"
                    value={filters.projectId}
                    onChange={(e) =>
                      setFilters({ ...filters, projectId: e.target.value })
                    }
                    placeholder="输入项目 ID"
                    className="inputField text-sm"
                  />
                </div>

                {/* 类型 */}
                <div className="space-y-2">
                  <label className="block text-sm text-muted-foreground">
                    记忆类型
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="inputField text-sm cursor-pointer"
                  >
                    {memoryTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 标签 */}
                <div className="space-y-2">
                  <label className="block text-sm text-muted-foreground">
                    标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={filters.tags}
                    onChange={(e) =>
                      setFilters({ ...filters, tags: e.target.value })
                    }
                    placeholder="tag1, tag2"
                    className="inputField text-sm"
                  />
                </div>

                {/* 日期范围 */}
                <div className="space-y-2">
                  <label className="block text-sm text-muted-foreground">
                    日期范围
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                      className="inputField text-sm flex-1"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                      className="inputField text-sm flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="relative w-10 h-10 animate-spin text-blue-400" />
              </div>
              <span className="text-muted-foreground">搜索中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="glassCard p-6 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <X className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : !searched ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-2xl" />
              <Search className="relative w-16 h-16 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">输入关键词开始搜索</p>
            <p className="text-sm text-muted-foreground/70">支持精确匹配、全文搜索、语义搜索等多种策略</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl" />
              <Brain className="relative w-16 h-16 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">未找到匹配的记忆</p>
            <p className="text-sm text-muted-foreground/70">尝试调整关键词或筛选条件</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <p className="text-muted-foreground">
                  找到 <span className="font-semibold text-foreground">{results.length}</span> 条记忆
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {results.map((memory) => (
                <MemoryCard key={memory.meta.id} memory={memory} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
