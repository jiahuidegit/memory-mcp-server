'use client';

import { useEffect, useRef } from 'react';
import type { RelationNode } from '@emp/core';
import cytoscape from 'cytoscape';
import { getMemoryTypeColor } from '@/lib/utils';

interface RelationsGraphProps {
  relationRoot: RelationNode;
}

export function RelationsGraph({ relationRoot }: RelationsGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const centerNode = relationRoot.memory;
    const relations = relationRoot.related || [];

    // 构建节点和边
    const nodes = [
      {
        data: {
          id: centerNode.meta.id,
          label: centerNode.content.summary?.slice(0, 30) || 'Center',
          type: centerNode.meta.type,
          isCenter: true,
        },
      },
      ...relations.map((rel) => ({
        data: {
          id: rel.memory.meta.id,
          label: rel.memory.content.summary?.slice(0, 30) || 'Node',
          type: rel.memory.meta.type,
          isCenter: false,
        },
      })),
    ];

    const edges = relations.map((rel) => ({
      data: {
        id: `${centerNode.meta.id}-${rel.memory.meta.id}`,
        source: centerNode.meta.id,
        target: rel.memory.meta.id,
        // 根据 relations 字段推断关系类型
        relationType: 'relatedTo',
      },
    }));

    // 初始化 Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              const type = ele.data('type');
              const colorClass = getMemoryTypeColor(type);
              // 转换 Tailwind 类名为实际颜色 - 科技感配色
              const colorMap: Record<string, string> = {
                'bg-blue-500': '#3B82F6',    // 代码
                'bg-green-500': '#10B981',   // 决策
                'bg-cyan-500': '#06B6D4',    // 配置
                'bg-purple-500': '#06B6D4',  // 兼容旧配置类名
                'bg-orange-500': '#F97316',  // 解决方案
                'bg-red-500': '#EF4444',     // 错误
                'bg-gray-500': '#6B7280',    // 会话
              };
              return colorMap[colorClass] || '#6B7280';
            },
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '10px',
            color: '#FFFFFF',
            'text-outline-width': 2,
            'text-outline-color': (ele: any) => {
              const type = ele.data('type');
              const colorClass = getMemoryTypeColor(type);
              const colorMap: Record<string, string> = {
                'bg-blue-500': '#3B82F6',
                'bg-green-500': '#10B981',
                'bg-cyan-500': '#06B6D4',
                'bg-purple-500': '#06B6D4',  // 兼容旧配置类名
                'bg-orange-500': '#F97316',
                'bg-red-500': '#EF4444',
                'bg-gray-500': '#6B7280',
              };
              return colorMap[colorClass] || '#6B7280';
            },
            width: (ele: any) => (ele.data('isCenter') ? 60 : 40),
            height: (ele: any) => (ele.data('isCenter') ? 60 : 40),
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#CBD5E1',
            'target-arrow-color': '#CBD5E1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1,
            opacity: 0.6,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#3B82F6',
          },
        },
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as any,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // 添加交互
    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      console.log('点击节点:', node.data());
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [relationRoot]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] bg-background rounded-lg border border-border"
    />
  );
}
