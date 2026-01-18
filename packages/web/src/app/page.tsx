'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Clock,
  Network,
  Search,
  Code,
  Lightbulb,
  Settings,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Loader2,
  ArrowRight,
  Sparkles,
  Database,
  Activity,
  FolderOpen,
  CalendarDays,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Memory } from '@emp/core';
import api from '@/lib/api';
import { formatRelativeTime, getMemoryTypeName } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { useProject } from '@/context/ProjectContext';

import type { LucideProps } from 'lucide-react';

export const dynamic = 'force-dynamic';

// 类型颜色映射 - 科技感配色
const typeColors: Record<string, string> = {
  decision: '#10B981',  // 绿色 - 决策
  solution: '#F97316',  // 橙色 - 解决方案
  config: '#06B6D4',    // 青色 - 配置
  code: '#3B82F6',      // 蓝色 - 代码
  error: '#EF4444',     // 红色 - 错误
  session: '#6B7280',   // 灰色 - 会话
};

// 类型图标映射
const typeIcons: Record<string, React.ComponentType<LucideProps>> = {
  decision: Lightbulb,
  solution: Brain,
  config: Settings,
  code: Code,
  error: AlertCircle,
  session: MessageSquare,
};

export default function HomePage() {
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    byType: Record<string, number>;
    recent: Memory[];
    recentCount: number;
    projectCount: number;
  }>({ total: 0, byType: {}, recent: [], recentCount: 0, projectCount: 0 });

  useEffect(() => {
    loadStats();
  }, [currentProject]);

  async function loadStats() {
    try {
      setLoading(true);

      // 并行请求统计数据和最近记忆（根据当前选中项目筛选）
      const [statsData, recentResult] = await Promise.all([
        api.getStats(currentProject || undefined),
        api.getMemories({ query: '', projectId: currentProject || undefined, limit: 5 }),
      ]);

      setStats({
        total: statsData.total,
        byType: statsData.byType,
        recent: recentResult.memories,
        recentCount: statsData.recentCount,
        projectCount: Object.keys(statsData.byProject).length,
      });
    } catch (err) {
      console.error('加载统计失败:', err);
    } finally {
      setLoading(false);
    }
  }

  // 饼图数据
  const pieData = Object.entries(stats.byType).map(([type, count]) => ({
    name: getMemoryTypeName(type),
    value: count,
    color: typeColors[type] || '#6B7280',
  }));

  // 快捷入口配置
  const quickActions = [
    {
      name: '记忆管理',
      desc: '查看和管理所有记忆',
      href: '/memories',
      icon: Brain,
      gradient: 'from-blue-600 to-blue-400',
      shadowColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      name: '时间线',
      desc: '项目发展历程',
      href: '/timeline',
      icon: Clock,
      gradient: 'from-emerald-600 to-emerald-400',
      shadowColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      name: '关系链',
      desc: '探索记忆关联',
      href: '/relations',
      icon: Network,
      gradient: 'from-cyan-600 to-cyan-400',
      shadowColor: 'rgba(6, 182, 212, 0.3)',
    },
    {
      name: '高级搜索',
      desc: '多策略检索',
      href: '/search',
      icon: Search,
      gradient: 'from-orange-600 to-orange-400',
      shadowColor: 'rgba(249, 115, 22, 0.3)',
    },
  ];

  return (
    <div className="min-h-screen bg-background bgDots">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6">
        {/* 背景装饰 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-hero-pattern opacity-30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* 标题区域 */}
          <div className="text-center space-y-6 mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassDark border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">AI 驱动的上下文记忆</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-heading font-bold">
              <span className="textGradient">Context Memory</span>
              <br />
              <span className="text-foreground">System</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              精准、结构化的 AI 上下文记忆系统
              <br />
              <span className="text-foreground/70">完整保留决策路径，多级检索精准定位</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href="/memories"
                className="btnPrimary flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                浏览记忆
              </Link>
              <Link
                href="/search"
                className="btnSecondary flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                开始搜索
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-slide-up">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group relative glassCard p-6 hoverLift cursor-pointer"
                  style={{
                    '--hover-shadow': action.shadowColor,
                  } as React.CSSProperties}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </Link>
              );
            })}
          </div>

          {/* Statistics Dashboard */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="relative w-10 h-10 animate-spin text-blue-400" />
                </div>
                <span className="text-muted-foreground">加载数据中...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Stats & Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Total Count */}
                  <div className="glassCard p-6 glowBorder">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold font-heading textGradientBlue">
                          {stats.total}
                        </div>
                        <div className="text-sm text-muted-foreground">记忆总数</div>
                      </div>
                    </div>
                  </div>

                  {/* Project Count */}
                  <div className="glassCard p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/20">
                        <FolderOpen className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold font-heading text-purple-400">
                          {stats.projectCount}
                        </div>
                        <div className="text-sm text-muted-foreground">项目数</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent 7 Days */}
                  <div className="glassCard p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-400/10 border border-emerald-500/20">
                        <CalendarDays className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold font-heading text-emerald-400">
                          {stats.recentCount}
                        </div>
                        <div className="text-sm text-muted-foreground">近 7 天</div>
                      </div>
                    </div>
                  </div>

                  {/* Types Count */}
                  <div className="glassCard p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600/20 to-orange-400/10 border border-orange-500/20">
                        <Database className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold font-heading text-orange-400">
                          {Object.keys(stats.byType).length}
                        </div>
                        <div className="text-sm text-muted-foreground">类型数</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type Stats Row */}
                {Object.keys(stats.byType).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(stats.byType).map(([type, count]) => {
                      const Icon = typeIcons[type] || Brain;
                      const color = typeColors[type] || '#6B7280';
                      return (
                        <div key={type} className="glassCard p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{
                                background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                                border: `1px solid ${color}30`,
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <div>
                              <div className="text-xl font-bold font-heading">{count}</div>
                              <div className="text-xs text-muted-foreground">
                                {getMemoryTypeName(type)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recent Activity */}
                <div className="glassCard p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-heading font-semibold">最近活动</h2>
                    </div>
                    <Link
                      href="/memories"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      查看全部
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {stats.recent.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl" />
                        <Brain className="relative w-16 h-16 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground mb-2">暂无记忆数据</p>
                      <p className="text-sm text-muted-foreground/70">通过 MCP Server 或 CLI 存储第一条记忆</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recent.map((memory, index) => {
                        const Icon = typeIcons[memory.meta.type] || Brain;
                        const color = typeColors[memory.meta.type] || '#6B7280';
                        return (
                          <Link
                            key={memory.meta.id}
                            href={`/memories/${memory.meta.id}`}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-foreground/5 transition-all duration-300 cursor-pointer group"
                            style={{
                              animationDelay: `${index * 100}ms`,
                            }}
                          >
                            <div
                              className="p-2.5 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110"
                              style={{
                                background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                                border: `1px solid ${color}30`,
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate group-hover:text-blue-400 transition-colors">
                                {memory.content.summary || '无标题'}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: `${color}15`, color }}>
                                  {getMemoryTypeName(memory.meta.type)}
                                </span>
                                <span>·</span>
                                <span>{formatRelativeTime(memory.meta.timestamp)}</span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Chart */}
              <div className="glassCard p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h2 className="text-lg font-heading font-semibold">类型分布</h2>
                </div>

                {pieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground">暂无数据</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                            itemStyle={{ color: '#F1F5F9' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: entry.color,
                              boxShadow: `0 0 8px ${entry.color}60`,
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {entry.name}
                          </span>
                          <span className="text-sm font-medium ml-auto">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border/30">
            <p className="flex items-center justify-center gap-2">
              <span>使用</span>
              <span className="px-2 py-1 rounded-md bg-foreground/5 text-xs">Next.js 15</span>
              <span className="px-2 py-1 rounded-md bg-foreground/5 text-xs">Tailwind CSS</span>
              <span className="px-2 py-1 rounded-md bg-foreground/5 text-xs">Recharts</span>
              <span>构建</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
