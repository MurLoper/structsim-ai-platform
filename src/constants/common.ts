/**
 * 通用常量定义
 */

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

// 分页
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 文件大小限制（字节）
export const FILE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_NAME_LENGTH: 255,
} as const;

// 超时设置（毫秒）
export const TIMEOUT = {
  API: 30000, // 30秒
  UPLOAD: 300000, // 5分钟
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;
