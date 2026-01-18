'use client';

import { useEffect, useState } from 'react';
import type { Memory, SearchResult } from '@emp/core';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MemoryCard } from '@/components/MemoryCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { CreateMemoryModal } from '@/components/CreateMemoryModal';
import { useProject } from '@/context/ProjectContext';
import api from '@/lib/api';
import { Loader2, Plus } from 'lucide-react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export default function MemoriesPage() {
  const { currentProject } = useProject();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    projectId: '',
    type: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 当全局项目切换时，更新本地过滤器（如果未手动指定项目）
  useEffect(() => {
    if (!filters.projectId) {
      loadMemories();
    }
  }, [currentProject]);

  useEffect(() => {
    loadMemories();
  }, [filters]);

  async function loadMemories() {
    try {
      setLoading(true);
      // 优先使用本地过滤器的 projectId，否则使用全局项目
      const projectId = filters.projectId || currentProject || undefined;
      const result: SearchResult = await api.getMemories({
        query: filters.query || '',
        projectId,
        type: filters.type as any,
        limit: 50,
      });
      setMemories(result.memories);
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">记忆管理</h1>
            <p className="text-muted-foreground mt-2">
              查看和管理所有记忆条目
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新增记忆
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={filters.query}
              onChange={(query) => setFilters({ ...filters, query })}
              placeholder="搜索记忆..."
            />
          </div>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无记忆</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {memories.map((memory) => (
              <MemoryCard key={memory.meta.id} memory={memory} />
            ))}
          </div>
        )}
      </div>

      {/* 新增记忆弹窗 */}
      <CreateMemoryModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadMemories}
      />
    </DashboardLayout>
  );
}
