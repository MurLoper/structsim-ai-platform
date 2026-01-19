/**
 * 输出定义 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 数据类型选项 */
export const DATA_TYPES = ['float', 'int', 'string', 'array', 'object'] as const;

/** 输出定义创建/编辑表单 Schema */
export const outputDefSchema = z.object({
  name: z.string().min(1, '输出名称必填').max(100, '名称不能超过100字符'),
  code: z
    .string()
    .max(50, '代码不能超过50字符')
    .regex(/^[A-Za-z0-9_-]*$/, '只允许字母、数字、下划线和横线')
    .optional()
    .or(z.literal('')),
  unit: z.string().max(20, '单位不能超过20字符').optional(),
  dataType: z.enum(DATA_TYPES, {
    errorMap: () => ({ message: '请选择有效的数据类型' }),
  }),
  valid: z.number().int().min(0).max(1).default(1),
  sort: z.number().int().min(0).default(0),
  remark: z.string().max(500, '备注不能超过500字符').optional(),
});

/** 输出定义表单数据类型 */
export type OutputDefFormData = z.infer<typeof outputDefSchema>;
