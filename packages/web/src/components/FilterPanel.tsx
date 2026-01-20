'use client';

import { Filter, Lightbulb, Brain, Settings, Code, AlertCircle, MessageSquare, Layers } from 'lucide-react';
import { Select } from './Select';

interface FilterPanelProps {
  filters: {
    projectId: string;
    type: string;
  };
  onChange: (filters: any) => void;
}

const memoryTypes = [
  { value: '', label: '全部类型', icon: <Layers className="w-4 h-4 text-muted-foreground" /> },
  { value: 'decision', label: '架构决策', icon: <Lightbulb className="w-4 h-4 text-emerald-400" /> },
  { value: 'solution', label: '解决方案', icon: <Brain className="w-4 h-4 text-orange-400" /> },
  { value: 'config', label: '配置', icon: <Settings className="w-4 h-4 text-cyan-400" /> },
  { value: 'code', label: '代码', icon: <Code className="w-4 h-4 text-blue-400" /> },
  { value: 'error', label: '错误', icon: <AlertCircle className="w-4 h-4 text-red-400" /> },
  { value: 'session', label: '会话', icon: <MessageSquare className="w-4 h-4 text-gray-400" /> },
];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-3">
      <Filter className="w-5 h-5 text-muted-foreground" />

      {/* 项目筛选 */}
      <input
        type="text"
        value={filters.projectId}
        onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
        placeholder="项目 ID"
        className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-32"
      />

      {/* 类型筛选 */}
      <Select
        value={filters.type}
        onChange={(value) => onChange({ ...filters, type: value })}
        options={memoryTypes}
        placeholder="全部类型"
        className="w-36"
      />
    </div>
  );
}
