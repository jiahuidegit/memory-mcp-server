'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface ProjectContextType {
  projects: { id: string; count: number }[];
  currentProject: string | null;  // null 表示全部项目
  setCurrentProject: (projectId: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<{ id: string; count: number }[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProjectsWithCount();
      setProjects(data);
    } catch (err) {
      console.error('加载项目列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 切换项目时保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentProject) {
        localStorage.setItem('cms-current-project', currentProject);
      } else {
        localStorage.removeItem('cms-current-project');
      }
    }
  }, [currentProject]);

  // 初始化时从 localStorage 读取
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cms-current-project');
      if (saved) {
        setCurrentProject(saved);
      }
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        loading,
        refresh: loadProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
