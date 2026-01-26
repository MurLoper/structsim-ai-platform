import * as Sentry from '@sentry/react';

/**
 * Sentry 初始化状态
 */
let isInitialized = false;

/**
 * 初始化 Sentry 错误监控
 * 仅在生产环境启用
 */
function parseSampleRate(value: string | undefined, fallback: number) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, parsed));
}

export function initSentry() {
  // 防止重复初始化
  if (isInitialized) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const enabledByEnv = import.meta.env.VITE_SENTRY_ENABLED === 'true';
  const isProd = import.meta.env.PROD;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  if (!isProd && !enabledByEnv) {
    // Skip initialization in non-prod mode
    return;
  }

  const environment = import.meta.env.VITE_SENTRY_ENV || import.meta.env.MODE;
  const tracesSampleRate = parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1);
  const replaysSessionSampleRate = parseSampleRate(
    import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    0.1
  );
  const replaysOnErrorSampleRate = parseSampleRate(
    import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    1.0
  );

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enabled: isProd || enabledByEnv,
    debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
    // 性能追踪采样率
    tracesSampleRate,
    // 会话回放采样率
    replaysSessionSampleRate,
    // 错误回放采样率
    replaysOnErrorSampleRate,
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
  if (isInitialized) {
    Sentry.captureException(error, {
      extra: context,
    });
    return;
  }
  console.error('Error captured:', error, context);
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
