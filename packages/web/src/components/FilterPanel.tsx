'use client';

import { Filter } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    projectId: string;
    type: string;
  };
  onChange: (filters: any) => void;
}

const memoryTypes = [
  { value: '', label: '全部类型' },
  { value: 'decision', label: '架构决策' },
  { value: 'solution', label: '解决方案' },
  { value: 'config', label: '配置' },
  { value: 'code', label: '代码' },
  { value: 'error', label: '错误' },
  { value: 'session', label: '会话' },
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
      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
      >
        {memoryTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
}
