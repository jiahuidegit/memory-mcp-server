'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RelationsGraph } from '@/components/RelationsGraph';
import type { RelationNode } from '@emp/core';
import api from '@/lib/api';
import { Loader2, Network, Search } from 'lucide-react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export default function RelationsPage() {
  const [memoryId, setMemoryId] = useState('');
  const [relationRoot, setRelationRoot] = useState<RelationNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);

  async function loadRelations() {
    if (!memoryId.trim()) return;

    try {
      setLoading(true);
      const result = await api.getRelations(memoryId, depth);
      setRelationRoot(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setRelationRoot(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">关系链图</h1>
          <p className="text-muted-foreground mt-2">
            探索记忆之间的关联和依赖
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={memoryId}
              onChange={(e) => setMemoryId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRelations()}
              placeholder="输入记忆 ID"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            <option value={1}>深度 1</option>
            <option value={2}>深度 2</option>
            <option value={3}>深度 3</option>
          </select>

          <button
            onClick={loadRelations}
            disabled={!memoryId.trim() || loading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? '加载中...' : '查询'}
          </button>
        </div>

        {/* Content */}
        {!relationRoot ? (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>请输入记忆 ID 查看关系链</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : relationRoot ? (
          <div className="space-y-6">
            {/* Memory Info */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-heading font-semibold mb-2">
                {relationRoot.memory.content.summary}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>类型: {relationRoot.memory.meta.type}</span>
                <span>·</span>
                <span>项目: {relationRoot.memory.meta.projectId}</span>
                {relationRoot.related && relationRoot.related.length > 0 && (
                  <>
                    <span>·</span>
                    <span>关联节点: {relationRoot.related.length}</span>
                  </>
                )}
              </div>
            </div>

            {/* Graph */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-heading font-semibold mb-6">关系网络图</h2>
              {!relationRoot.related || relationRoot.related.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <p>该记忆暂无关联节点</p>
                </div>
              ) : (
                <RelationsGraph relationRoot={relationRoot} />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
