import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api';

// API Configuration
// 开发环境使用相对路径，通过 Vite 代理转发到后端
// 生产环境可通过环境变量配置完整 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and trace_id
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 生成trace_id便于追踪
    config.headers['X-Trace-ID'] = Math.random().toString(36).substring(2, 10);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and unwrap data
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 如果是新版API响应格式，检查code
    if (response.data && typeof response.data.code === 'number') {
      if (response.data.code !== 0) {
        // 业务错误
        return Promise.reject({
          code: response.data.code,
          message: response.data.msg,
          data: response.data.data,
          trace_id: response.data.trace_id,
        });
      }
      // 成功时返回整个response.data（包含data字段）
      return response;
    }
    // 兼容旧版API直接返回数据
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

// Generic request methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then(res => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then(res => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then(res => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then(res => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then(res => res.data),
};

export default apiClient;
