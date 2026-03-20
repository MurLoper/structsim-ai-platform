/**
 * 提单草稿缓存工具
 * 处理 localStorage 的读写操作
 *
 * 存储隔离规则：
 * - 新建态 key = "submission_draft:new"
 * - 编辑态 key = "submission_draft:order:{orderId}"
 * - 多窗口隔离 key suffix = ":scope:{scopeId}"
 */

import type { SubmissionDraft } from '../types/storage';
import { getDraftStorageKey, DRAFT_VERSION } from '../types/storage';

/**
 * 保存草稿到 localStorage
 * @param draft 草稿数据（不含 savedAt / version）
 * @param orderId 编辑态传入订单 ID，新建态传 null/undefined
 * @param scopeId 窗口作用域 ID（用于多开隔离）
 */
export const saveDraft = (
  draft: Omit<SubmissionDraft, 'savedAt' | 'version'>,
  orderId?: number | null,
  scopeId?: string
): boolean => {
  try {
    const fullDraft: SubmissionDraft = {
      ...draft,
      savedAt: Date.now(),
      version: DRAFT_VERSION,
    };
    const key = getDraftStorageKey(orderId, scopeId);
    localStorage.setItem(key, JSON.stringify(fullDraft));
    return true;
  } catch (error) {
    console.error('保存草稿失败:', error);
    return false;
  }
};

/**
 * 从 localStorage 加载草稿
 * @param orderId 编辑态传入订单 ID，新建态传 null/undefined
 * @param maxAge 草稿最大有效期（毫秒），默认7天
 * @param scopeId 窗口作用域 ID（用于多开隔离）
 */
export const loadDraft = (
  orderId?: number | null,
  maxAge = 7 * 24 * 60 * 60 * 1000,
  scopeId?: string
): SubmissionDraft | null => {
  try {
    const key = getDraftStorageKey(orderId, scopeId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const draft: SubmissionDraft = JSON.parse(stored);

    if (draft.version !== DRAFT_VERSION) {
      console.warn('草稿版本不匹配，已忽略');
      clearDraft(orderId, scopeId);
      return null;
    }

    if (Date.now() - draft.savedAt > maxAge) {
      console.warn('草稿已过期，已清除');
      clearDraft(orderId, scopeId);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('加载草稿失败:', error);
    clearDraft(orderId, scopeId);
    return null;
  }
};

/**
 * 清除草稿
 * @param orderId 编辑态传入订单 ID，新建态传 null/undefined
 * @param scopeId 窗口作用域 ID（用于多开隔离）
 */
export const clearDraft = (orderId?: number | null, scopeId?: string): void => {
  try {
    const key = getDraftStorageKey(orderId, scopeId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清除草稿失败:', error);
  }
};

/**
 * 检查是否存在草稿
 * @param orderId 编辑态传入订单 ID，新建态传 null/undefined
 * @param scopeId 窗口作用域 ID（用于多开隔离）
 */
export const hasDraft = (orderId?: number | null, scopeId?: string): boolean => {
  try {
    const key = getDraftStorageKey(orderId, scopeId);
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};
