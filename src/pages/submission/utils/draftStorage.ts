/**
 * 提单草稿缓存工具
 * 处理 localStorage 的读写操作
 */

import type { SubmissionDraft } from '../types/storage';
import { DRAFT_STORAGE_KEY, DRAFT_VERSION } from '../types/storage';

/**
 * 保存草稿到 localStorage
 */
export const saveDraft = (draft: Omit<SubmissionDraft, 'savedAt' | 'version'>): boolean => {
  try {
    const fullDraft: SubmissionDraft = {
      ...draft,
      savedAt: Date.now(),
      version: DRAFT_VERSION,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fullDraft));
    return true;
  } catch (error) {
    console.error('保存草稿失败:', error);
    return false;
  }
};

/**
 * 从 localStorage 加载草稿
 * @param maxAge 草稿最大有效期（毫秒），默认7天
 */
export const loadDraft = (maxAge = 7 * 24 * 60 * 60 * 1000): SubmissionDraft | null => {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;

    const draft: SubmissionDraft = JSON.parse(stored);

    // 版本检查
    if (draft.version !== DRAFT_VERSION) {
      console.warn('草稿版本不匹配，已忽略');
      clearDraft();
      return null;
    }

    // 过期检查
    if (Date.now() - draft.savedAt > maxAge) {
      console.warn('草稿已过期，已清除');
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.error('加载草稿失败:', error);
    clearDraft();
    return null;
  }
};

/**
 * 清除草稿
 */
export const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('清除草稿失败:', error);
  }
};

/**
 * 检查是否存在草稿
 */
export const hasDraft = (): boolean => {
  try {
    return localStorage.getItem(DRAFT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};
