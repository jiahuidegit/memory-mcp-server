'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimelineEntry } from '@emp/core';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TimelineChartProps {
  data: TimelineEntry[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  // 按日期分组统计
  const chartData = useMemo(() => {
    const grouped = new Map<string, { date: string; total: number; [key: string]: any }>();

    data.forEach((entry) => {
      const date = format(new Date(entry.memory.meta.timestamp), 'yyyy-MM-dd');
      const type = entry.memory.meta.type;

      if (!grouped.has(date)) {
        grouped.set(date, { date, total: 0 });
      }

      const item = grouped.get(date)!;
      item.total += 1;
      item[type] = (item[type] || 0) + 1;
    });

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          stroke="#64748B"
          fontSize={12}
          tickFormatter={(value) => format(new Date(value), 'MM/dd')}
        />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelFormatter={(value) => format(new Date(value), 'yyyy年MM月dd日', { locale: zhCN })}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="total"
          name="总数"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#colorTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
