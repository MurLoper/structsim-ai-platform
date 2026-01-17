import { api } from './client';
import { Project } from '@/types';

export const projectApi = {
  /**
   * Get all projects
   */
  getAll: () => api.get<Project[]>('/projects'),

  /**
   * Get project by ID
   */
  getById: (id: string) => api.get<Project>(`/projects/${id}`),

  /**
   * Create a new project
   */
  create: (data: Omit<Project, 'id'>) => api.post<Project>('/projects', data),

  /**
   * Update a project
   */
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),

  /**
   * Delete a project
   */
  delete: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),
};
