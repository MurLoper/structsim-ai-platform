/**
 * API Client 测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { api } from '../client';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Get the mocked axios instance
const mockAxiosInstance = axios.create();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('api.get', () => {
    it('应该发送 GET 请求并返回数据', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: { id: 1, name: 'Test' } },
      };
      vi.mocked(mockAxiosInstance.get).mockResolvedValue(mockResponse);

      const result = await api.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('应该传递配置参数', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: [] },
      };
      vi.mocked(mockAxiosInstance.get).mockResolvedValue(mockResponse);

      const config = { params: { page: 1, limit: 10 } };
      await api.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });

    it('请求失败时应该抛出错误', async () => {
      const error = new Error('Network Error');
      vi.mocked(mockAxiosInstance.get).mockRejectedValue(error);

      await expect(api.get('/test')).rejects.toThrow('Network Error');
    });
  });

  describe('api.post', () => {
    it('应该发送 POST 请求并返回数据', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: { id: 1 } },
      };
      vi.mocked(mockAxiosInstance.post).mockResolvedValue(mockResponse);

      const postData = { name: 'Test' };
      const result = await api.post('/test', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('应该支持不带数据的 POST 请求', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: null },
      };
      vi.mocked(mockAxiosInstance.post).mockResolvedValue(mockResponse);

      await api.post('/test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', undefined, undefined);
    });
  });

  describe('api.put', () => {
    it('应该发送 PUT 请求并返回数据', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: { id: 1, name: 'Updated' } },
      };
      vi.mocked(mockAxiosInstance.put).mockResolvedValue(mockResponse);

      const putData = { name: 'Updated' };
      const result = await api.put('/test/1', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('api.delete', () => {
    it('应该发送 DELETE 请求并返回数据', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: { success: true } },
      };
      vi.mocked(mockAxiosInstance.delete).mockResolvedValue(mockResponse);

      const result = await api.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('api.patch', () => {
    it('应该发送 PATCH 请求并返回数据', async () => {
      const mockResponse = {
        data: { code: 0, msg: 'success', data: { id: 1, status: 'active' } },
      };
      vi.mocked(mockAxiosInstance.patch).mockResolvedValue(mockResponse);

      const patchData = { status: 'active' };
      const result = await api.patch('/test/1', patchData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('错误处理', () => {
    it('业务错误应该被正确处理', async () => {
      const mockResponse = {
        data: { code: 1001, msg: '参数错误', data: null },
      };
      vi.mocked(mockAxiosInstance.get).mockResolvedValue(mockResponse);

      // 注意：实际的业务错误处理在拦截器中，这里测试正常返回
      const result = await api.get('/test');
      expect(result).toEqual(mockResponse.data);
    });

    it('网络错误应该被正确传播', async () => {
      const networkError = {
        response: { status: 500, data: { message: 'Server Error' } },
      };
      vi.mocked(mockAxiosInstance.get).mockRejectedValue(networkError);

      await expect(api.get('/test')).rejects.toEqual(networkError);
    });
  });
});
