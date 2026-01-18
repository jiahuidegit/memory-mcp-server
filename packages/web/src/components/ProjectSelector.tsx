'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderOpen, ChevronDown, Check, Layers } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

export function ProjectSelector() {
  const { projects, currentProject, setCurrentProject, loading } = useProject();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取当前项目显示名称
  const currentLabel = currentProject || '全部项目';
  const currentCount = currentProject
    ? projects.find((p) => p.id === currentProject)?.count || 0
    : projects.reduce((sum, p) => sum + p.count, 0);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer bg-foreground/5 hover:bg-foreground/10 border border-border/50"
      >
        <FolderOpen className="w-4 h-4 text-amber-400" />
        <span className="max-w-[120px] truncate">{currentLabel}</span>
        <span className="text-xs text-muted-foreground">({currentCount})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 py-2 rounded-xl glassDark border border-border/50 shadow-xl z-50 animate-slide-down">
          <div className="px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              选择项目筛选
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* 全部项目选项 */}
            <button
              onClick={() => {
                setCurrentProject(null);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
                !currentProject
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-foreground/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                全部项目
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {projects.reduce((sum, p) => sum + p.count, 0)}
                </span>
                {!currentProject && <Check className="w-4 h-4" />}
              </span>
            </button>

            {/* 分隔线 */}
            <div className="my-1 border-t border-border/30" />

            {/* 项目列表 */}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
                  currentProject === project.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-foreground/5'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{project.id}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{project.count}</span>
                  {currentProject === project.id && <Check className="w-4 h-4" />}
                </span>
              </button>
            ))}

            {projects.length === 0 && !loading && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                暂无项目
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
