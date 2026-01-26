/**
 * Vitest 测试设置文件
 *
 * 在每个测试文件运行前执行
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// ============================================================
// Testing Library 配置
// ============================================================

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

// ============================================================
// Mock 浏览器 API
// ============================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// ============================================================
// 全局 Mock
// ============================================================

// Mock import.meta.env
beforeAll(() => {
  vi.stubEnv('MODE', 'test');
  vi.stubEnv('DEV', true);
  vi.stubEnv('PROD', false);
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5000');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// 抑制 console.error 中的特定警告
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // 忽略 React 的 act 警告
    if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
