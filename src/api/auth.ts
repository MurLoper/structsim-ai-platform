import { api } from './client';
import { User, MenuItem } from '@/types';

export interface LoginRequest {
  domainAccount: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

export interface LoginModeResponse {
  ssoEnabled: boolean;
  ssoRedirectUrl: string;
  testAccountBypassEnabled?: boolean;
  uidExpireSeconds: number;
}

export interface SsoCallbackRequest {
  uid: string;
}

export const authApi = {
  /**
   * User login by domain account
   */
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),

  /**
   * Get login mode (SSO on/off)
   */
  getLoginMode: () => api.get<LoginModeResponse>('/auth/login-mode'),

  /**
   * SSO callback exchange
   */
  ssoCallbackLogin: (data: SsoCallbackRequest) =>
    api.post<LoginResponse>('/auth/sso/callback', data),

  /**
   * User logout
   */
  logout: () => api.post<{ message: string }>('/auth/logout'),

  /**
   * Get current user info
   */
  getCurrentUser: () => api.get<User>('/auth/me'),

  /**
   * Verify token and get user info + menus
   */
  verifyToken: () => api.get<VerifyResponse>('/auth/verify'),

  /**
   * Get all users
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
