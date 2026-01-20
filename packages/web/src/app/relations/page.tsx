'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RelationsGraph } from '@/components/RelationsGraph';
import type { RelationNode, Memory } from '@emp/core';
import api from '@/lib/api';
import {
  Loader2,
  Network,
  Search,
  Brain,
  Lightbulb,
  Code,
  Settings,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { getMemoryTypeName } from '@/lib/utils';
import { Select } from '@/components/Select';
import type { LucideProps } from 'lucide-react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 类型图标映射
const typeIcons: Record<string, React.ComponentType<LucideProps>> = {
  decision: Lightbulb,
  solution: Brain,
  config: Settings,
  code: Code,
  error: AlertCircle,
  session: MessageSquare,
};

// 类型颜色映射
const typeColors: Record<string, string> = {
  decision: '#10B981',
  solution: '#F97316',
  config: '#06B6D4',
  code: '#3B82F6',
  error: '#EF4444',
  session: '#6B7280',
};

// 主页面组件，包装 Suspense
export default function RelationsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    }>
      <RelationsContent />
    </Suspense>
  );
}

// 实际内容组件
function RelationsContent() {
  const searchParams = useSearchParams();
  const [memoryId, setMemoryId] = useState('');
  const [relationRoot, setRelationRoot] = useState<RelationNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [memories, setMemories] = useState<Memory[]>([]);

  // 初始化时加载记忆列表
  useEffect(() => {
    loadMemories();
  }, []);

  // 从 URL 参数读取 ID
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl && idFromUrl !== memoryId) {
      setMemoryId(idFromUrl);
      loadRelationsForId(idFromUrl);
    }
  }, [searchParams]);

  async function loadMemories() {
    try {
      setInitialLoading(true);
      const result = await api.getMemories({ limit: 20 });
      setMemories(result.memories);
      // 如果 URL 有 id 参数则使用，否则默认加载第一条
      const idFromUrl = searchParams.get('id');
      if (idFromUrl) {
        setMemoryId(idFromUrl);
        await loadRelationsForId(idFromUrl);
      } else if (result.memories.length > 0) {
        const firstId = result.memories[0].meta.id;
        setMemoryId(firstId);
        await loadRelationsForId(firstId);
      }
    } catch (err) {
      console.error('加载记忆列表失败:', err);
    } finally {
      setInitialLoading(false);
    }
  }

  async function loadRelationsForId(id: string) {
    if (!id.trim()) return;

    try {
      setLoading(true);
      const result = await api.getRelations(id, depth);
      setRelationRoot(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setRelationRoot(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelations() {
    await loadRelationsForId(memoryId);
  }

  // 选择记忆
  function selectMemory(memory: Memory) {
    setMemoryId(memory.meta.id);
    loadRelationsForId(memory.meta.id);
  }

  // 点击关系图节点时切换中心
  function handleNodeClick(nodeId: string) {
    setMemoryId(nodeId);
    loadRelationsForId(nodeId);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-400/10 border border-cyan-500/20">
                <Network className="w-6 h-6 text-cyan-400" />
              </div>
              关系链图
            </h1>
            <p className="text-muted-foreground mt-2">
              探索记忆之间的关联和依赖，点击节点可切换中心
            </p>
          </div>
          <button
            onClick={() => loadRelations()}
            disabled={!memoryId || loading}
            className="p-2 rounded-lg bg-card border border-border hover:bg-foreground/5 transition-colors disabled:opacity-50 cursor-pointer"
            title="刷新"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Memory List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search Input */}
            <div className="glassCard p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={memoryId}
                  onChange={(e) => setMemoryId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadRelations()}
                  placeholder="输入记忆 ID..."
                  className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center gap-2 mt-3">
                <label className="text-xs text-muted-foreground">深度:</label>
                <Select
                  value={String(depth)}
                  onChange={(value) => setDepth(Number(value))}
                  options={[
                    { value: '1', label: '1 层' },
                    { value: '2', label: '2 层' },
                    { value: '3', label: '3 层' },
                  ]}
                  size="sm"
                  className="flex-1"
                />
                <button
                  onClick={loadRelations}
                  disabled={!memoryId.trim() || loading}
                  className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  查询
                </button>
              </div>
            </div>

            {/* Memory List */}
            <div className="glassCard p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">选择记忆</span>
              </div>

              {initialLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无记忆
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {memories.map((memory) => {
                    const Icon = typeIcons[memory.meta.type] || Brain;
                    const color = typeColors[memory.meta.type] || '#6B7280';
                    const isSelected = memory.meta.id === memoryId;
                    return (
                      <button
                        key={memory.meta.id}
                        onClick={() => selectMemory(memory)}
                        className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-background/30 border border-transparent hover:bg-foreground/5 hover:border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="p-1.5 rounded-md shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            <Icon className="w-3 h-3" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {memory.content.summary || '无标题'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {getMemoryTypeName(memory.meta.type)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Graph */}
          <div className="lg:col-span-3 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            {/* Memory Info Card */}
            {relationRoot && (
              <div className="glassCard p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const Icon = typeIcons[relationRoot.memory.meta.type] || Brain;
                      const color = typeColors[relationRoot.memory.meta.type] || '#6B7280';
                      return (
                        <div
                          className="p-3 rounded-xl shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="text-lg font-heading font-semibold">
                        {relationRoot.memory.content.summary || '无标题'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-xs"
                          style={{
                            background: `${typeColors[relationRoot.memory.meta.type]}15`,
                            color: typeColors[relationRoot.memory.meta.type],
                          }}
                        >
                          {getMemoryTypeName(relationRoot.memory.meta.type)}
                        </span>
                        <span>项目: {relationRoot.memory.meta.projectId}</span>
                        {relationRoot.related && relationRoot.related.length > 0 && (
                          <span className="text-cyan-400">
                            {relationRoot.related.length} 个关联节点
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/memories/${relationRoot.memory.meta.id}`}
                    className="p-2 rounded-lg bg-card border border-border hover:bg-foreground/5 transition-colors cursor-pointer shrink-0"
                    title="查看详情"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Graph Container */}
            <div className="glassCard p-6">
              <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                关系网络图
              </h2>

              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">加载关系图...</span>
                  </div>
                </div>
              ) : !relationRoot ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl" />
                      <Network className="relative w-16 h-16 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground mb-2">从左侧选择一条记忆</p>
                    <p className="text-sm text-muted-foreground/70">或输入记忆 ID 查看关系链</p>
                  </div>
                </div>
              ) : !relationRoot.related || relationRoot.related.length === 0 ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl" />
                      <Network className="relative w-16 h-16 text-orange-400/50" />
                    </div>
                    <p className="text-muted-foreground">该记忆暂无关联节点</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      尝试选择其他记忆或增加搜索深度
                    </p>
                  </div>
                </div>
              ) : (
                <RelationsGraph
                  relationRoot={relationRoot}
                  onNodeClick={handleNodeClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
