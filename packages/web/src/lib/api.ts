import type { Memory, SearchFilters, SearchResult, TimelineResult, RelationNode } from '@emp/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * API 客户端 - 封装所有 API 调用
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===== 记忆管理 =====

  /**
   * 获取记忆列表
   */
  async getMemories(filters?: SearchFilters & { offset?: number }): Promise<SearchResult & { limit?: number; offset?: number }> {
    const query = new URLSearchParams();
    if (filters?.query) query.set('query', filters.query);
    if (filters?.projectId) query.set('projectId', filters.projectId);
    if (filters?.type) query.set('type', filters.type);
    if (filters?.limit) query.set('limit', filters.limit.toString());
    if (filters?.offset !== undefined) query.set('offset', filters.offset.toString());

    return this.request<SearchResult & { limit?: number; offset?: number }>(`/memories?${query}`);
  }

  /**
   * 获取单个记忆详情
   */
  async getMemory(id: string): Promise<Memory> {
    const res = await this.request<{ success: boolean; data: Memory }>(`/memories/${id}`);
    return res.data;
  }

  /**
   * 创建记忆
   */
  async createMemory(data: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 更新记忆
   */
  async updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>(`/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<void> {
    return this.request<void>(`/memories/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== 搜索 =====

  /**
   * 搜索记忆
   */
  async searchMemories(filters: SearchFilters): Promise<SearchResult> {
    return this.request<SearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  // ===== 时间线 =====

  /**
   * 获取时间线
   */
  async getTimeline(projectId: string, options?: {
    dateRange?: [string, string];
    type?: string;
    limit?: number;
  }): Promise<TimelineResult> {
    const query = new URLSearchParams({ projectId });
    if (options?.dateRange) {
      query.set('startDate', options.dateRange[0]);
      query.set('endDate', options.dateRange[1]);
    }
    if (options?.type) query.set('type', options.type);
    if (options?.limit) query.set('limit', options.limit.toString());

    const res = await this.request<{ success: boolean; data: TimelineResult['entries']; total: number }>(`/timeline?${query}`);
    return { entries: res.data || [], total: res.total || 0 };
  }

  // ===== 关系链 =====

  /**
   * 获取记忆关系链
   */
  async getRelations(memoryId: string, depth: number = 2): Promise<RelationNode> {
    const res = await this.request<{ success: boolean; data: RelationNode }>(`/relations/${memoryId}?depth=${depth}`);
    return res.data;
  }

  // ===== 项目管理 =====

  /**
   * 获取所有项目列表
   */
  async getProjects(): Promise<string[]> {
    return this.request<string[]>('/projects');
  }

  // ===== 项目组管理 =====

  /**
   * 获取所有项目组
   */
  async getProjectGroups(): Promise<{ name: string; projects: string[] }[]> {
    const res = await this.request<{ success: boolean; data: { groups: { name: string; projects: string[] }[] } }>('/project-groups');
    return res.data.groups;
  }

  /**
   * 获取单个项目组
   */
  async getProjectGroup(name: string): Promise<{ name: string; projects: string[] } | null> {
    const res = await this.request<{ success: boolean; data: { name: string; projects: string[] } | null }>(`/project-groups/${encodeURIComponent(name)}`);
    return res.data;
  }

  /**
   * 创建或更新项目组
   */
  async saveProjectGroup(name: string, projects: string[]): Promise<void> {
    await this.request('/project-groups', {
      method: 'POST',
      body: JSON.stringify({ name, projects }),
    });
  }

  /**
   * 删除项目组
   */
  async deleteProjectGroup(name: string): Promise<void> {
    await this.request(`/project-groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  /**
   * 获取项目所属的项目组
   */
  async getProjectGroupByProject(projectId: string): Promise<{ name: string; projects: string[] } | null> {
    const res = await this.request<{ success: boolean; data: { name: string; projects: string[] } | null }>(`/project-groups/by-project/${encodeURIComponent(projectId)}`);
    return res.data;
  }

  // ===== 记忆关联详情 =====

  /**
   * 获取记忆的关联详情
   */
  async getMemoryRelations(memoryId: string, options?: { includeAutoGenerated?: boolean; type?: string }): Promise<{
    memoryId: string;
    relations: Array<{
      targetId: string;
      type: string;
      confidence: number;
      reason: string;
      isAutoGenerated: boolean;
      targetMemory: {
        id: string;
        summary: string;
        type: string;
        projectId: string;
        tags: string[];
        timestamp: string;
      } | null;
    }>;
    total: number;
    autoGeneratedCount: number;
  }> {
    const query = new URLSearchParams();
    if (options?.includeAutoGenerated !== undefined) {
      query.set('includeAutoGenerated', options.includeAutoGenerated.toString());
    }
    if (options?.type) {
      query.set('type', options.type);
    }
    const res = await this.request<{ success: boolean; data: any }>(`/relations/${memoryId}/details?${query}`);
    return res.data;
  }

  /**
   * 删除记忆关联
   */
  async deleteMemoryRelation(sourceId: string, targetId: string, type?: string): Promise<void> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    await this.request(`/relations/${sourceId}/${targetId}${query}`, {
      method: 'DELETE',
    });
  }

  // ===== 统计 =====

  /**
   * 获取统计信息
   */
  async getStats(projectId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    recentCount: number;
  }> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request(`/stats${query}`);
  }

  /**
   * 获取项目列表（从统计）
   */
  async getProjectsWithCount(): Promise<{ id: string; count: number }[]> {
    const res = await this.request<{ projects: { id: string; count: number }[] }>('/stats/projects');
    return res.projects;
  }
}

// 导出单例
export const api = new ApiClient();
export default api;
