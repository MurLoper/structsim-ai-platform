/**
 * 参数定义 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 参数值类型枚举 */
export const VAL_TYPE = {
  FLOAT: 1,
  INT: 2,
  STRING: 3,
  ENUM: 4,
  BOOL: 5,
} as const;

/** 参数定义创建/编辑表单 Schema */
export const paramDefSchema = z
  .object({
    name: z.string().min(1, '参数名称必填').max(100, '名称不能超过100字符'),
    key: z
      .string()
      .min(1, '参数键必填')
      .max(50, '键不能超过50字符')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, '必须以字母或下划线开头'),
    valType: z.number().int().min(1).max(5),
    unit: z.string().max(20, '单位不能超过20字符').optional(),
    minVal: z.number().optional(),
    maxVal: z.number().optional(),
    defaultVal: z.string().max(200, '默认值不能超过200字符').optional(),
    precision: z.number().int().min(0).max(10).default(2),
    enumOptions: z.array(z.any()).optional(),
    required: z.number().int().min(0).max(1).default(0),
    valid: z.number().int().min(0).max(1).default(1),
    sort: z.number().int().min(0).default(0),
    remark: z.string().max(500, '备注不能超过500字符').optional(),
  })
  .refine(
    data => {
      // 如果设置了最小值和最大值，确保最小值不大于最大值
      if (data.minVal !== undefined && data.maxVal !== undefined) {
        return data.minVal <= data.maxVal;
      }
      return true;
    },
    { message: '最小值不能大于最大值', path: ['minVal'] }
  );

/** 参数定义表单数据类型 */
export type ParamDefFormData = z.infer<typeof paramDefSchema>;
