'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Memory } from '@emp/core';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Pencil,
  Trash2,
  Save,
  X,
  Brain,
  Code,
  Lightbulb,
  Settings,
  AlertCircle,
  MessageSquare,
  Tag,
  Hash,
  Clock,
  FileJson,
  FileCode,
  Network,
  Search,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { getMemoryTypeName, formatDate } from '@/lib/utils';

import type { LucideProps } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summary, setSummary] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [dataStr, setDataStr] = useState('');
  const [copied, setCopied] = useState(false);

  // 复制 ID 到剪贴板
  async function copyId() {
    if (!memory) return;
    try {
      await navigator.clipboard.writeText(memory.meta.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }

  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) loadMemory(id);
  }, [params?.id]);

  async function loadMemory(id: string) {
    try {
      setLoading(true);
      const data = await api.getMemory(id);
      setMemory(data);
      setError(null);
      setSummary(data.content.summary || '');
      setTagsStr((data.meta.tags || []).join(', '));
      try {
        setDataStr(JSON.stringify(data.content.data ?? {}, null, 2));
      } catch {
        setDataStr('{}');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!memory) return;
    try {
      setSaving(true);
      setError(null);

      let parsed: Record<string, unknown> = {};
      if (dataStr.trim()) {
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          setError('内容数据必须是合法 JSON');
          setSaving(false);
          return;
        }
      }

      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.updateMemory(memory.meta.id, {
        content: { summary, data: parsed } as any,
        meta: { tags } as any,
      });

      setEditing(false);
      await loadMemory(memory.meta.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!memory) return;
    if (!confirm('确认删除该记忆？此操作不可恢复')) return;
    try {
      setDeleting(true);
      await api.deleteMemory(memory.meta.id);
      router.push('/memories');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="relative w-10 h-10 animate-spin text-blue-400" />
            </div>
            <span className="text-muted-foreground">加载记忆中...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !memory) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="glassCard p-6 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error || '记忆不存在'}</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { meta, content } = memory;
  const Icon = typeIcons[meta.type] || Brain;
  const color = typeColors[meta.type] || '#6B7280';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4 min-w-0 flex-1">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>

            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${color}25, ${color}10)`,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: `${color}20`, color }}
              >
                {getMemoryTypeName(meta.type)}
              </span>
            </div>

            <h1 className="text-3xl font-heading font-bold">
              {content.summary || '无标题'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(meta.timestamp)}
              </span>
              <span>·</span>
              <span>项目: {meta.projectId || '-'}</span>
              {meta.tags?.length ? (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    {meta.tags.join(', ')}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="btnSecondary flex items-center gap-2 text-sm py-2.5 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" /> 编辑
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 text-sm"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  删除
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btnPrimary flex items-center gap-2 text-sm py-2.5 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setSummary(content.summary || '');
                    setTagsStr((meta.tags || []).join(', '));
                    try {
                      setDataStr(JSON.stringify(content.data ?? {}, null, 2));
                    } catch {
                      setDataStr('{}');
                    }
                  }}
                  className="btnSecondary flex items-center gap-2 text-sm py-2.5 cursor-pointer"
                >
                  <X className="w-4 h-4" /> 取消
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glassCard p-4 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <div className="glassCard p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/20">
                  <FileJson className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-lg font-heading font-semibold">基本信息</h2>
              </div>

              {!editing ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">摘要</div>
                    <div className="text-foreground">{content.summary || '-'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">创建时间</div>
                      <div>{new Date(memory.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">更新时间</div>
                      <div>{new Date(memory.updatedAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">摘要</label>
                    <input
                      type="text"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="inputField"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={tagsStr}
                      onChange={(e) => setTagsStr(e.target.value)}
                      placeholder="tag1, tag2"
                      className="inputField"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">内容数据（JSON）</label>
                    <textarea
                      value={dataStr}
                      onChange={(e) => setDataStr(e.target.value)}
                      rows={12}
                      className="inputField font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">将对象序列化为 JSON 进行存储</p>
                  </div>
                </div>
              )}
            </div>

            {/* 内容数据预览 */}
            <div className="glassCard p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-lg font-heading font-semibold">内容数据</h2>
              </div>
              <pre className="max-h-[480px] overflow-auto p-4 rounded-xl text-sm font-mono scrollbarThin" style={{ background: 'rgba(0,0,0,0.3)' }}>
{JSON.stringify(content.data ?? {}, null, 2)}
              </pre>
            </div>

            {/* 原始上下文 rawContext */}
            {content.rawContext && Object.keys(content.rawContext).length > 0 && (
              <div className="glassCard p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/20">
                    <FileJson className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-heading font-semibold">原始上下文</h2>
                  <span className="text-xs text-muted-foreground">(完整原始数据)</span>
                </div>
                <pre className="max-h-[480px] overflow-auto p-4 rounded-xl text-sm font-mono scrollbarThin" style={{ background: 'rgba(0,0,0,0.3)' }}>
{JSON.stringify(content.rawContext, null, 2)}
                </pre>
              </div>
            )}

            {/* Artifacts */}
            {content.artifacts && Object.keys(content.artifacts).length > 0 && (
              <div className="glassCard p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/20">
                    <Code className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-heading font-semibold">原始文件/代码片段</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(content.artifacts).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{key}</h3>
                      <pre className="whitespace-pre-wrap text-sm p-4 rounded-xl overflow-x-auto scrollbarThin" style={{ background: 'rgba(0,0,0,0.3)' }}>
{value}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* 元数据 */}
            <div className="glassCard p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/20">
                  <Hash className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="text-lg font-heading font-semibold">元数据</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">ID</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-mono text-xs" title={meta.id}>{meta.id}</span>
                    <button
                      onClick={copyId}
                      className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="复制 ID"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">类型</span>
                  <span style={{ color }}>{meta.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">项目</span>
                  <span>{meta.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">版本</span>
                  <span>{meta.version}</span>
                </div>
                {meta.sessionId && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground shrink-0">会话</span>
                    <span className="truncate text-right font-mono text-xs" title={meta.sessionId}>{meta.sessionId}</span>
                  </div>
                )}
                {meta.tags?.length ? (
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-muted-foreground block mb-2">标签</span>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 导航 */}
            <div className="glassCard p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/20">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-lg font-heading font-semibold">导航</h2>
              </div>
              <div className="space-y-4">
                <Link
                  href="/memories"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  返回记忆列表
                </Link>
                <div className="border-t border-border/30 pt-4">
                  <span className="text-sm text-muted-foreground block mb-3">关联功能</span>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/relations?id=${meta.id}`}
                      className="flex items-center gap-2 text-sm hover:text-cyan-400 transition-colors cursor-pointer group"
                    >
                      <Network className="w-4 h-4" />
                      <span>查看关系链</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link href="/timeline" className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors cursor-pointer">
                      <Clock className="w-4 h-4" />
                      项目时间线
                    </Link>
                    <Link href="/search" className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors cursor-pointer">
                      <Search className="w-4 h-4" />
                      高级搜索
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
