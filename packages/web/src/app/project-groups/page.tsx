'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  Loader2,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';

interface ProjectGroup {
  name: string;
  projects: string[];
}

export default function ProjectGroupsPage() {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑状态
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; projects: string[] }>({ name: '', projects: [] });

  // 新建状态
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState<{ name: string; projects: string[] }>({ name: '', projects: [] });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, projectsData] = await Promise.all([
        api.getProjectGroups(),
        api.getProjects(),
      ]);
      setGroups(groupsData);
      setAllProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  // 开始编辑
  function startEdit(group: ProjectGroup) {
    setEditingGroup(group.name);
    setEditForm({ name: group.name, projects: [...group.projects] });
    setIsCreating(false);
  }

  // 取消编辑
  function cancelEdit() {
    setEditingGroup(null);
    setEditForm({ name: '', projects: [] });
  }

  // 保存编辑
  async function saveEdit() {
    if (!editForm.name.trim()) return;

    try {
      setSaving(true);
      await api.saveProjectGroup(editForm.name, editForm.projects);
      await loadData();
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  // 开始新建
  function startCreate() {
    setIsCreating(true);
    setNewForm({ name: '', projects: [] });
    setEditingGroup(null);
  }

  // 取消新建
  function cancelCreate() {
    setIsCreating(false);
    setNewForm({ name: '', projects: [] });
  }

  // 保存新建
  async function saveCreate() {
    if (!newForm.name.trim()) return;

    try {
      setSaving(true);
      await api.saveProjectGroup(newForm.name, newForm.projects);
      await loadData();
      cancelCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }

  // 删除项目组
  async function deleteGroup(name: string) {
    if (!confirm(`确定要删除项目组 "${name}" 吗？`)) return;

    try {
      setSaving(true);
      await api.deleteProjectGroup(name);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setSaving(false);
    }
  }

  // 切换项目选中状态
  function toggleProject(projects: string[], setProjects: (p: string[]) => void, projectId: string) {
    if (projects.includes(projectId)) {
      setProjects(projects.filter(p => p !== projectId));
    } else {
      setProjects([...projects, projectId]);
    }
  }

  // 渲染项目选择器
  function renderProjectSelector(selectedProjects: string[], setProjects: (p: string[]) => void) {
    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs text-muted-foreground">选择包含的项目：</div>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-background/50 rounded-lg border border-border">
          {allProjects.length === 0 ? (
            <span className="text-sm text-muted-foreground">暂无项目</span>
          ) : (
            allProjects.map((project) => {
              const isSelected = selectedProjects.includes(project);
              return (
                <button
                  key={project}
                  type="button"
                  onClick={() => toggleProject(selectedProjects, setProjects, project)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border hover:bg-foreground/5'
                  }`}
                >
                  {project}
                </button>
              );
            })
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          已选择 {selectedProjects.length} 个项目
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-400/10 border border-emerald-500/20">
                <FolderTree className="w-6 h-6 text-emerald-400" />
              </div>
              项目组管理
            </h1>
            <p className="text-muted-foreground mt-2">
              将相关项目组织成组，实现跨项目的记忆关联和检索
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-card border border-border hover:bg-foreground/5 transition-colors disabled:opacity-50 cursor-pointer"
              title="刷新"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={startCreate}
              disabled={isCreating || saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新建项目组
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        {/* Create Form */}
        {isCreating && (
          <div className="glassCard p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              新建项目组
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">项目组名称</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="例如：前端项目组、后端服务..."
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {renderProjectSelector(newForm.projects, (p) => setNewForm({ ...newForm, projects: p }))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={cancelCreate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={saveCreate}
                  disabled={saving || !newForm.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 && !isCreating ? (
          <div className="glassCard p-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
              <FolderOpen className="relative w-16 h-16 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground mb-2">暂无项目组</p>
            <p className="text-sm text-muted-foreground/70">
              点击「新建项目组」开始组织你的项目
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div key={group.name} className="glassCard p-5">
                {editingGroup === group.name ? (
                  // 编辑模式
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">项目组名称</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    {renderProjectSelector(editForm.projects, (p) => setEditForm({ ...editForm, projects: p }))}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="p-2 rounded-lg border border-border hover:bg-foreground/5 transition-colors cursor-pointer"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving || !editForm.name.trim()}
                        className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                        title="保存"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600/20 to-emerald-400/10 border border-emerald-500/20">
                          <FolderTree className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.projects.length} 个项目
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(group)}
                          disabled={saving}
                          className="p-2 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteGroup(group.name)}
                          disabled={saving}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    {group.projects.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {group.projects.map((project) => (
                          <span
                            key={project}
                            className="px-3 py-1 bg-card border border-border rounded-md text-sm"
                          >
                            {project}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 说明卡片 */}
        <div className="glassCard p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            项目组功能说明
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>将相关项目组织到同一个项目组中，系统会自动在组内项目之间建立记忆关联</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>检索记忆时可以启用跨项目搜索，在整个项目组内查找相关记忆</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>适合将前端/后端、微服务群、相关模块等组织在一起</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
