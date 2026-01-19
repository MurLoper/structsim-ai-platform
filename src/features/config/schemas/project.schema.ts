/**
 * 项目配置 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 项目创建/编辑表单 Schema */
export const projectSchema = z.object({
  name: z.string().min(1, '项目名称必填').max(100, '项目名称不能超过100字符'),
  code: z
    .string()
    .max(50, '项目代码不能超过50字符')
    .regex(/^[A-Za-z0-9_-]*$/, '只允许字母、数字、下划线和横线')
    .optional()
    .or(z.literal('')),
  defaultSimTypeId: z.number().positive('请选择默认仿真类型').optional(),
  defaultSolverId: z.number().positive('请选择默认求解器').optional(),
  valid: z.number().int().min(0).max(1).default(1),
  sort: z.number().int().min(0).default(0),
  remark: z.string().max(500, '备注不能超过500字符').optional(),
});

/** 项目表单数据类型 */
export type ProjectFormData = z.infer<typeof projectSchema>;

/** 项目搜索/筛选 Schema */
export const projectFilterSchema = z.object({
  keyword: z.string().optional(),
  valid: z.number().optional(),
});

export type ProjectFilterData = z.infer<typeof projectFilterSchema>;
