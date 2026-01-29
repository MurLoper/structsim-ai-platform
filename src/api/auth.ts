import { api } from './client';
import { User, MenuItem } from '@/types';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface VerifyResponse {
  user: User;
  menus: MenuItem[];
}

export interface HeartbeatResponse {
  valid: boolean;
  expiresIn: number;
  shouldRefresh: boolean;
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
   * Verify token and get user info + menus (for SSO callback)
   */
  verifyToken: () => api.get<VerifyResponse>('/auth/verify'),

  /**
   * Get all users (for demo login)
   */
  getAllUsers: () => api.get<User[]>('/auth/users'),

  /**
   * Get user menus (tree structure)
   */
  getUserMenus: () => api.get<MenuItem[]>('/auth/menus'),

  /**
   * Refresh access token
   */
  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),

  /**
   * Heartbeat check - lightweight session validation
   */
  heartbeat: () => api.get<HeartbeatResponse>('/auth/heartbeat'),
};
