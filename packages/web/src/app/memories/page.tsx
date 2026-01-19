'use client';

import { useEffect, useState } from 'react';
import type { Memory, MemoryType } from '@emp/core';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MemoryCard } from '@/components/MemoryCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { CreateMemoryModal } from '@/components/CreateMemoryModal';
import { useProject } from '@/context/ProjectContext';
import api from '@/lib/api';
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default function MemoriesPage() {
  const { currentProject } = useProject();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    query: '',
    projectId: '',
    type: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 当全局项目切换时，重置页码并重新加载
  useEffect(() => {
    if (!filters.projectId) {
      setPage(1);
      loadMemories(1);
    }
  }, [currentProject]);

  // 过滤条件变化时，重置页码
  useEffect(() => {
    setPage(1);
    loadMemories(1);
  }, [filters]);

  async function loadMemories(pageNum: number = page) {
    try {
      setLoading(true);
      // 优先使用本地过滤器的 projectId，否则使用全局项目
      const projectId = filters.projectId || currentProject || undefined;
      const offset = (pageNum - 1) * PAGE_SIZE;
      const result = await api.getMemories({
        query: filters.query || '',
        projectId,
        type: (filters.type || undefined) as MemoryType | undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setMemories(result.memories);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  // 分页处理
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadMemories(newPage);
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
              查看和管理所有记忆条目 {total > 0 && `(共 ${total} 条)`}
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
          <>
            <div className="grid grid-cols-1 gap-4">
              {memories.map((memory) => (
                <MemoryCard key={memory.meta.id} memory={memory} />
              ))}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新增记忆弹窗 */}
      <CreateMemoryModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadMemories(page)}
      />
    </DashboardLayout>
  );
}
