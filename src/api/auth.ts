import { api } from './client';
import { User } from '@/types';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  /**
   * User login
   */
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),

  /**
   * User logout
   */
  logout: () => api.post<{ message: string }>('/auth/logout'),

  /**
   * Get current user info
   */
  getCurrentUser: () => api.get<User>('/auth/me'),

  /**
   * Get all users (for demo login)
   */
  getAllUsers: () => api.get<User[]>('/auth/users'),
};
