import * as Sentry from '@sentry/react';

/**
 * Sentry 初始化状态
 */
let isInitialized = false;

/**
 * 初始化 Sentry 错误监控
 * 仅在生产环境启用
 */
export function initSentry() {
  // 防止重复初始化
  if (isInitialized) {
    return;
  }

  // 开发环境跳过
  if (import.meta.env.DEV) {
    console.log('[Sentry] Skipped in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    // 性能追踪采样率
    tracesSampleRate: 0.1,
    // 会话回放采样率
    replaysSessionSampleRate: 0.1,
    // 错误回放采样率
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration({
        enableInp: true,
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // 过滤敏感信息
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
    // 忽略的错误
    ignoreErrors: [
      // 忽略网络错误
      'Network Error',
      'Failed to fetch',
      'Load failed',
      // 忽略取消的请求
      'AbortError',
      'canceled',
      // ResizeObserver 错误
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });

  isInitialized = true;
  console.log('[Sentry] Initialized successfully');
}

/**
 * 检查 Sentry 是否已初始化
 */
export function isSentryInitialized(): boolean {
  return isInitialized;
}

/**
 * 手动捕获错误并发送到 Sentry
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error captured:', error, context);
  }
}

/**
 * 设置用户信息用于错误追踪
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * 清除用户信息（登出时调用）
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * 添加面包屑（操作记录）
 */
export function addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user-action',
    level: level || 'info',
  });
}
