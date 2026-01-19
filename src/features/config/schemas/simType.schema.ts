/**
 * 仿真类型 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 仿真类型创建/编辑表单 Schema */
export const simTypeSchema = z.object({
  name: z.string().min(1, '仿真类型名称必填').max(100, '名称不能超过100字符'),
  code: z
    .string()
    .max(50, '代码不能超过50字符')
    .regex(/^[A-Za-z0-9_-]*$/, '只允许字母、数字、下划线和横线')
    .optional()
    .or(z.literal('')),
  category: z.string().max(50, '分类不能超过50字符').optional(),
  defaultParamTplSetId: z.number().positive().optional(),
  defaultCondOutSetId: z.number().positive().optional(),
  defaultSolverId: z.number().positive().optional(),
  supportAlgMask: z.number().int().min(0).default(0),
  nodeIcon: z.string().max(100).optional(),
  colorTag: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '请输入有效的颜色值 (如: #FF5500)')
    .optional()
    .or(z.literal('')),
  valid: z.number().int().min(0).max(1).default(1),
  sort: z.number().int().min(0).default(0),
  remark: z.string().max(500, '备注不能超过500字符').optional(),
});

/** 仿真类型表单数据类型 */
export type SimTypeFormData = z.infer<typeof simTypeSchema>;
