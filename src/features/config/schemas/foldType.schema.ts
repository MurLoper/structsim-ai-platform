/**
 * 姿态类型 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 姿态类型创建/编辑表单 Schema */
export const foldTypeSchema = z.object({
  name: z.string().min(1, '姿态名称必填').max(100, '名称不能超过100字符'),
  code: z
    .string()
    .max(50, '代码不能超过50字符')
    .regex(/^[A-Za-z0-9_-]*$/, '只允许字母、数字、下划线和横线')
    .optional()
    .or(z.literal('')),
  angle: z.number().min(-360, '角度不能小于-360').max(360, '角度不能大于360'),
  valid: z.number().int().min(0).max(1).default(1),
  sort: z.number().int().min(0).default(0),
  remark: z.string().max(500, '备注不能超过500字符').optional(),
});

/** 姿态类型表单数据类型 */
export type FoldTypeFormData = z.infer<typeof foldTypeSchema>;
