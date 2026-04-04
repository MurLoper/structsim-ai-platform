import { z } from 'zod';

// ============ 提单页面类型定义 ============

// 模型级别枚举
export enum ModelLevel {
  WHOLE = 1, // 整机
  PART = 2, // 单件
}

// 算法类型枚举
export enum AlgorithmType {
  BAYESIAN = 1, // 贝叶斯优化
  DOE = 2, // DOE遍历
  DOE_FILE = 5, // DOE文件导入
}

// 目标类型枚举
export enum TargetType {
  MAX = 'max', // 最大化
  MIN = 'min', // 最小化
  TARGET = 'target', // 靠近目标值
  USER_DEFINED = 'userdefined', // 用户自定义
}

// 求解器配置
export interface SolverConfig {
  solverId: number;
  solverVersion?: string;
  cpuType: number; // -1: 单节点, 1: 并行
  cpuCores: number; // -1: 使用节点全部核数, 其他值为指定核数
  double: number; // 双精度设置: 0: 关闭, 1: 开启
  applyGlobal: number | null; // 是否应用全局设置: 1: 应用, 0: 不应用
  useGlobalConfig: number; // 是否使用全局参数: 1: 使用, 0: 不使用
  resourceId: number | null; // 计算资源池ID
  otherParams?: Record<string, unknown>; // 其他求解器参数
}

// 参数域定义（单个参数的配置）
export interface ParamDomain {
  paramName: string; // 参数名称
  minValue: number; // 最小值
  maxValue: number; // 最大值
  initValue: number; // 初始值
  range: string; // 离散取值范围字符串（逗号分隔）
  rangeList: number[]; // 离散取值范围数组
}

// 批次大小配置
export interface BatchSizeItem {
  value: number;
}

// 自定义批次配置
export interface CustomBatchSize {
  startIndex: number;
  endIndex: number;
  value: number;
}

// 优化参数配置
export interface OptParams {
  algType: AlgorithmType; // 算法类型
  domain: ParamDomain[]; // 参数域列表
  doeParamCsvPath?: string; // DOE CSV文件路径
  doeParamJsonPath?: string; // DOE JSON文件路径
  doeParamHeads?: string[]; // DOE参数表头
  doeParamData?: Record<string, number | string>[]; // DOE参数数据
  batchSizeType?: number; // 批次类型: 1: 固定, 2: 自定义
  batchSize: BatchSizeItem[]; // 批次大小数组
  customBatchSize?: CustomBatchSize[]; // 自定义批次配置
  maxIter: number; // 最大迭代次数
}

// 参数配置
export interface ParamConfig {
  mode: 'template' | 'custom'; // 模板应用 or 自定义
  templateSetId: number | null; // 参数模板集ID
  templateItemId: number | null; // 参数模板明细ID
  algorithm: 'bayesian' | 'doe'; // 贝叶斯优化 or DOE覆盖
  customValues: Record<string, number>; // 自定义参数值
  optParams?: OptParams; // 优化参数配置
}

// 响应输出详情
export interface RespDetail {
  set: string; // 输出集名称
  outputType: string; // 输出类型: RF3, LEP2, LEP1, S33等
  integrationPoint?: string; // 积分点(integration point)，如 CENTROID, MAX, MIN
  component: string; // 后处理方式编码（接口字段名仍为 component）
  stepName?: string; // 分析步名称，特殊输出才需要
  specialOutputSet?: string; // 特殊输出set，仅component为特殊值时需要
  description?: string; // 描述
  lowerLimit: number | null; // 下限（可选）
  upperLimit: number | null; // 上限（可选）
  weight: number; // 权重
  multiple: number; // 数量级
  targetValue: number | null; // 目标值（可选）
  targetType: TargetType; // 目标类型
}

// 输出配置
export interface OutputConfig {
  mode: 'template' | 'custom'; // 模板应用 or 自定义
  outputSetId: number | null; // 输出集ID
  selectedConditionIds: number[]; // 自定义选择的工况
  conditionValues: Record<number, Record<string, number | string>>; // 工况参数值
  selectedOutputIds: number[]; // 自定义选择的输出
  respDetails?: RespDetail[]; // 响应输出详情列表
}

// 仿真类型配置（以 conditionId 为 key，conditionId 来自工况配置表 condition_config.id）
export interface SimTypeConfig {
  conditionId: number; // 工况配置ID（condition_config.id = foldTypeId + simTypeId 组合的唯一标识）
  foldTypeId: number; // 所属姿态ID
  simTypeId: number; // 仿真类型ID
  params: ParamConfig;
  output: OutputConfig;
  solver: SolverConfig;
  careDeviceIds: string[]; // 关注器件ID列表
  conditionRemark?: string; // 当前姿态+仿真类型工况备注
}

// 全局求解器配置（可应用到所有仿真类型）
export interface GlobalSolverConfig extends SolverConfig {
  applyToAll: boolean;
}

// ============ input_json 提单数据存储结构 ============

/** 项目信息（存储在 input_json.projectInfo） */
export interface InputProjectInfo {
  projectId: number;
  phaseId?: number | null;
  projectName?: string;
  modelLevelId: number;
  originFile: OriginFile;
  originFoldTypeId?: number | null;
  participantIds: string[];
  issueTitle?: string;
  remark?: string;
}

/** 工况条目 — 以 conditionId 关联的完整配置 */
export interface InputConditionEntry {
  conditionId: number; // 工况配置ID（condition_config.id）
  foldTypeId: number;
  foldTypeName?: string;
  simTypeId: number;
  simTypeName?: string;
  params: ParamConfig;
  output: OutputConfig;
  solver: SolverConfig;
  careDeviceIds: string[];
  remark?: string;
}

/** input_json 顶层结构 */
export interface InputJson {
  /** 版本号，用于前端兼容旧数据 */
  version: number;
  /** 项目级信息 */
  projectInfo: InputProjectInfo;
  /** 工况列表（每个条目 = conditionId 关联的姿态 + 仿真类型 + 配置） */
  conditions: InputConditionEntry[];
  /** 全局求解器配置 */
  globalSolver: GlobalSolverConfig;
  /** INP 文件解析出的 set 集合 */
  inpSets?: InpSetInfo[];
}

// 源文件配置
export interface OriginFile {
  type: number; // 1: 路径, 2: ID, 3: 上传
  path: string;
  name: string;
  verified: boolean; // 是否已验证
  verifiedName?: string; // 验证后的文件名
  verifiedPath?: string; // 验证后的文件路径
  inpSets?: InpSetInfo[]; // INP文件的set集信息
  fileSize?: number; // 文件大小
  fileMd5?: string; // 文件MD5
  uploadId?: number | null; // 上传ID
  taskId?: number | null; // 任务ID
  fileId?: number | null; // 文件ID (type=2时)
}

// INP文件set集信息
export interface InpSetInfo {
  type: 'eleset' | 'nodeset' | 'component' | 'other';
  name: string;
}

// 工况条件配置
export interface ConditionItem {
  conditionType: number; // 工况类型
  targetFoldType: number; // 目标姿态: 0: 展开态, 1: 折叠态
  simTypeId: number; // 仿真类型ID
  modelLevelId?: number; // 模型级别
  careDeviceIds: number[]; // 关注器件ID列表
}

// 画布变换状态
export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

// 抽屉模式
export type DrawerMode = 'project' | 'params' | 'output' | 'solver' | 'careDevices';

export const submissionFormSchema = z.object({
  projectId: z
    .number()
    .nullable()
    .refine(value => value !== null, { message: '请选择项目' }),
  phaseId: z.number().nullable().optional(),
  issueTitle: z.string().max(200, { message: '标题不能超过200字' }).optional().default(''),
  modelLevelId: z.number().default(ModelLevel.WHOLE), // 模型级别
  originFile: z
    .object({
      type: z.number(),
      path: z.string().optional().default(''),
      name: z.string().optional().default(''),
      verified: z.boolean().optional().default(false),
      verifiedName: z.string().optional(),
      verifiedPath: z.string().optional(),
      fileSize: z.number().optional(),
      fileMd5: z.string().optional(),
      uploadId: z.number().nullable().optional(),
      taskId: z.number().nullable().optional(),
      fileId: z.number().nullable().optional(),
    })
    .superRefine((value, ctx) => {
      const path = (value.path || '').trim();
      const name = (value.name || '').trim();
      if (value.type === 1 || value.type === 2) {
        if (!path) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: value.type === 1 ? '请输入源文件路径' : '请输入源文件ID',
            path: ['path'],
          });
        }
      }
      if (value.type === 3 && !name && !path) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '请填写上传文件名',
          path: ['name'],
        });
      }
    }),
  originFoldTypeId: z.number().nullable().optional(),
  participantIds: z.array(z.string()).optional().default([]),
  foldTypeIds: z.array(z.number().int()).min(1, { message: '请至少选择一个目标姿态' }),
  remark: z.string().max(500, { message: '备注不能超过500字' }).optional().default(''),
  simTypeIds: z.array(z.number().int()).min(1, { message: '请至少选择一个仿真类型' }),
});

export type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

// 导出存储相关类型
export * from './types/storage';
