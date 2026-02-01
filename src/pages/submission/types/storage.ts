/**
 * 提单数据存储结构定义
 * 用于 localStorage 缓存和 API 提交/加载
 */

import type { SubmissionFormValues, SimTypeConfig, GlobalSolverConfig, InpSetInfo } from '../types';
import type { SelectedSimType } from '../hooks/useSubmissionState';

/**
 * 提单草稿数据结构
 * 包含表单数据和仿真配置
 */
export interface SubmissionDraft {
  // 表单基础数据
  formValues: SubmissionFormValues;
  // 选中的仿真类型列表
  selectedSimTypes: SelectedSimType[];
  // 仿真类型配置
  simTypeConfigs: Record<number, SimTypeConfig>;
  // 全局求解器配置
  globalSolver: GlobalSolverConfig;
  // INP文件解析的set集
  inpSets: InpSetInfo[];
  // 草稿保存时间
  savedAt: number;
  // 草稿版本（用于兼容性检查）
  version: string;
}

/**
 * 后端返回的申请单详情结构
 */
export interface OrderDetail {
  id: number;
  orderNo: string;
  projectId: number;
  modelLevelId: number;
  originFile: {
    type: number;
    path: string;
    name: string;
    fileId?: number | null;
  };
  originFoldTypeId: number | null;
  participantIds: number[];
  foldTypeIds: number[];
  remark: string;
  simTypeIds: number[];
  // 存储在 input_json 中的完整配置
  inputJson: {
    optParam: Record<string, SimTypeConfig>;
    globalSolver?: GlobalSolverConfig;
    inpSets?: InpSetInfo[];
  };
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 草稿存储的 localStorage key
 */
export const DRAFT_STORAGE_KEY = 'submission_draft';

/**
 * 当前草稿版本号
 */
export const DRAFT_VERSION = '1.0.0';
