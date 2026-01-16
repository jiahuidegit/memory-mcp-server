import type { SearchResult, SearchFilters } from '@emp/core';

/**
 * LRU 缓存节点
 */
interface CacheNode {
  key: string;
  value: SearchResult;
  prev: CacheNode | null;
  next: CacheNode | null;
}

/**
 * LRU（Least Recently Used）缓存
 * 用于缓存热点查询，提升检索性能
 */
export class LRUCache {
  private capacity: number;
  private cache: Map<string, CacheNode>;
  private head: CacheNode | null;
  private tail: CacheNode | null;
  private hits: number;
  private misses: number;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 生成缓存 key
   */
  static generateKey(filters: SearchFilters): string {
    const parts = [
      filters.query || '',
      filters.projectId || '',
      filters.type || '',
      filters.sessionId || '',
      filters.strategy || '',
      filters.limit || '',
      filters.offset || '',
      (filters.tags || []).sort().join(','),
    ];
    return parts.join('|');
  }

  /**
   * 获取缓存
   */
  get(key: string): SearchResult | null {
    const node = this.cache.get(key);
    if (!node) {
      this.misses++;
      return null;
    }

    // 移到链表头部（最近使用）
    this.moveToHead(node);
    this.hits++;

    // 标记为缓存命中
    return {
      ...node.value,
      metrics: {
        dbTime: node.value.metrics?.dbTime || 0,
        parseTime: node.value.metrics?.parseTime || 0,
        strategyTime: node.value.metrics?.strategyTime,
        cacheHit: true,
      },
    };
  }

  /**
   * 设置缓存
   */
  set(key: string, value: SearchResult): void {
    let node = this.cache.get(key);

    if (node) {
      // 更新已存在的节点
      node.value = value;
      this.moveToHead(node);
    } else {
      // 创建新节点
      node = {
        key,
        value,
        prev: null,
        next: null,
      };

      this.cache.set(key, node);
      this.addToHead(node);

      // 超出容量，删除最少使用的
      if (this.cache.size > this.capacity) {
        const removed = this.removeTail();
        if (removed) {
          this.cache.delete(removed.key);
        }
      }
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 失效指定项目的所有缓存
   */
  invalidateProject(projectId: string): void {
    const keysToDelete: string[] = [];

    for (const [key, _] of this.cache) {
      if (key.includes(`|${projectId}|`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const node = this.cache.get(key);
      if (node) {
        this.removeNode(node);
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  // ========== 双向链表操作 ==========

  private addToHead(node: CacheNode): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: CacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): CacheNode | null {
    const node = this.tail;
    if (node) {
      this.removeNode(node);
    }
    return node;
  }
}
