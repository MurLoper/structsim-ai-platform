/**
 * API 数据转换工具
 * 负责前后端数据字段命名转换
 * - 前端: 驼峰命名 (camelCase)
 * - 后端: 下划线命名 (snake_case)
 */

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * 将对象的键从驼峰命名转换为下划线命名
 * @example { projectId: 1 } => { project_id: 1 }
 */
export function toSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase) as T;
  }

  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj as JsonObject)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result as T;
}

/**
 * 将对象的键从下划线命名转换为驼峰命名
 * @example { project_id: 1 } => { projectId: 1 }
 */
export function toCamelCase<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as T;
  }

  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj as JsonObject)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result as T;
}
