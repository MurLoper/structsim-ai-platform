import { api } from './client';
import { SubmissionRequest } from '@/types';

export interface SimulationResultsResponse {
  simulationId: string;
  results: unknown[];
  status: string;
}

export const simulationApi = {
  /**
   * Get all simulation requests
   */
  getAll: () => api.get<SubmissionRequest[]>('/simulations'),

  /**
   * Get simulation by ID
   */
  getById: (id: string) => api.get<SubmissionRequest>(`/simulations/${id}`),

  /**
   * Create a new simulation request
   */
  create: (data: Omit<SubmissionRequest, 'id' | 'createdAt'>) =>
    api.post<SubmissionRequest>('/simulations', data),

  /**
   * Update a simulation request
   */
  update: (id: string, data: Partial<SubmissionRequest>) =>
    api.put<SubmissionRequest>(`/simulations/${id}`, data),

  /**
   * Delete a simulation request
   */
  delete: (id: string) => api.delete<{ message: string }>(`/simulations/${id}`),

  /**
   * Get simulation results
   */
  getResults: (id: string) => api.get<SimulationResultsResponse>(`/simulations/${id}/results`),
};
