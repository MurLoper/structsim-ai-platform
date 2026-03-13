/**
 * SSO配置
 * 用于切换SSO模式和普通登录模式
 */

// SSO模式开关
export const SSO_ENABLED = import.meta.env.VITE_SSO_ENABLED === 'true';

// SSO服务地址（内网环境）
export const SSO_SERVER_URL = import.meta.env.VITE_SSO_SERVER_URL || '';

// SSO配置
export const SSO_CONFIG = {
  enabled: SSO_ENABLED,
  serverUrl: SSO_SERVER_URL,
  loginPath: '/api/v1/sso/login',
  verifyPath: '/api/v1/sso/verify',
  logoutPath: '/api/v1/sso/logout',
};
