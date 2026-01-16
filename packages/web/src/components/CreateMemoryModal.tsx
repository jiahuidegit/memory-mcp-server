'use client';

import { useState, useEffect } from 'react';
import { MemoryType } from '@emp/core';
import api from '@/lib/api';
import { X, Loader2, Save } from 'lucide-react';
import { cn, getMemoryTypeName, getMemoryTypeColor } from '@/lib/utils';

// 记忆类型选项
const memoryTypes: MemoryType[] = [
  MemoryType.DECISION,
  MemoryType.SOLUTION,
  MemoryType.CONFIG,
  MemoryType.CODE,
  MemoryType.ERROR,
  MemoryType.SESSION,
];

interface CreateMemoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateMemoryModal({ open, onClose, onSuccess }: CreateMemoryModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<string[]>([]);

  // 表单字段
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<MemoryType>(MemoryType.DECISION);
  const [summary, setSummary] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [dataStr, setDataStr] = useState('{}');

  // 加载项目列表
  useEffect(() => {
    if (open) {
      api.getProjects().then(setProjects).catch(console.error);
    }
  }, [open]);

  // 重置表单
  function resetForm() {
    setProjectId('');
    setType(MemoryType.DECISION);
    setSummary('');
    setTagsStr('');
    setDataStr('{}');
    setError(null);
  }

  // 关闭弹窗
  function handleClose() {
    resetForm();
    onClose();
  }

  // 提交表单
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 验证必填字段
    if (!projectId.trim()) {
      setError('请输入项目 ID');
      return;
    }
    if (!summary.trim()) {
      setError('请输入摘要');
      return;
    }

    // 解析 JSON
    let parsedData: Record<string, unknown> = {};
    if (dataStr.trim()) {
      try {
        parsedData = JSON.parse(dataStr);
      } catch {
        setError('内容数据必须是合法 JSON');
        return;
      }
    }

    // 解析标签
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      setError(null);

      await api.createMemory({
        meta: {
          projectId: projectId.trim(),
          type,
          tags,
        } as any,
        content: {
          summary: summary.trim(),
          data: parsedData,
        } as any,
      });

      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-background rounded-lg border border-border shadow-xl mx-4">
        {/* 头部 */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-background border-b border-border">
          <h2 className="text-xl font-heading font-semibold">新增记忆</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 错误提示 */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 项目 ID */}
          <div>
            <label className="block text-sm font-medium mb-1.5">项目 ID *</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="输入项目 ID"
              list="projectList"
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {/* 项目建议列表 */}
            {projects.length > 0 && (
              <datalist id="projectList">
                {projects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </div>

          {/* 记忆类型 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">记忆类型 *</label>
            <div className="flex flex-wrap gap-2">
              {memoryTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer border',
                    type === t
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  )}
                >
                  <span
                    className={cn('w-2.5 h-2.5 rounded-full', getMemoryTypeColor(t))}
                  />
                  {getMemoryTypeName(t)}
                </button>
              ))}
            </div>
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">摘要 *</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="简要描述这条记忆"
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">标签</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="多个标签用逗号分隔，如: api, auth, bugfix"
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 内容数据 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">内容数据 (JSON)</label>
            <textarea
              value={dataStr}
              onChange={(e) => setDataStr(e.target.value)}
              rows={8}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 font-mono text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              存储与记忆相关的结构化数据，如代码片段、配置等
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-card border border-border rounded-md text-sm hover:border-primary/50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm flex items-center gap-2 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              创建记忆
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
