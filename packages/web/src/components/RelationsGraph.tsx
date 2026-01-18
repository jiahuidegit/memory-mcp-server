'use client';

import { useEffect, useRef } from 'react';
import type { RelationNode } from '@emp/core';
import cytoscape from 'cytoscape';

interface RelationsGraphProps {
  relationRoot: RelationNode;
  onNodeClick?: (nodeId: string) => void;
}

// 类型颜色映射
const typeColors: Record<string, string> = {
  decision: '#10B981',
  solution: '#F97316',
  config: '#06B6D4',
  code: '#3B82F6',
  error: '#EF4444',
  session: '#6B7280',
};

export function RelationsGraph({ relationRoot, onNodeClick }: RelationsGraphProps) {
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
          label: centerNode.content.summary?.slice(0, 25) || '中心节点',
          type: centerNode.meta.type,
          isCenter: true,
        },
      },
      ...relations.map((rel) => ({
        data: {
          id: rel.memory.meta.id,
          label: rel.memory.content.summary?.slice(0, 25) || '节点',
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
              return typeColors[type] || '#6B7280';
            },
            'background-opacity': 0.9,
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'font-size': '11px',
            'font-family': 'Inter, system-ui, sans-serif',
            color: '#94A3B8',
            width: (ele: any) => (ele.data('isCenter') ? 70 : 50),
            height: (ele: any) => (ele.data('isCenter') ? 70 : 50),
            'border-width': (ele: any) => (ele.data('isCenter') ? 4 : 2),
            'border-color': (ele: any) => {
              const type = ele.data('type');
              const color = typeColors[type] || '#6B7280';
              return ele.data('isCenter') ? '#fff' : color;
            },
            'border-opacity': (ele: any) => (ele.data('isCenter') ? 0.8 : 0.5),
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            opacity: 0.5,
          },
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 4,
            'border-color': '#3B82F6',
            'border-opacity': 1,
            'background-opacity': 1,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#3B82F6',
            'border-opacity': 1,
          },
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': '#60A5FA',
            'target-arrow-color': '#60A5FA',
            opacity: 0.8,
            width: 3,
          },
        },
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 120,
        nodeOverlap: 30,
        refresh: 20,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 120,
        nodeRepulsion: 500000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 60,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as any,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // 添加节点点击事件
    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.data('id');
      const isCenter = node.data('isCenter');

      // 如果不是中心节点，触发回调切换中心
      if (!isCenter && onNodeClick) {
        onNodeClick(nodeId);
      }
    });

    // 添加鼠标样式
    cyRef.current.on('mouseover', 'node', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'pointer';
      }
    });

    cyRef.current.on('mouseout', 'node', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [relationRoot, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-xl border border-border/50"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
          linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
      }}
    />
  );
}
