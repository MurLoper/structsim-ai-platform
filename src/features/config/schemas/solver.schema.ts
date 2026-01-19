/**
 * 求解器 Zod Schema
 * 用于表单验证
 */
import { z } from 'zod';

/** 求解器创建/编辑表单 Schema */
export const solverSchema = z
  .object({
    name: z.string().min(1, '求解器名称必填').max(100, '名称不能超过100字符'),
    code: z
      .string()
      .max(50, '代码不能超过50字符')
      .regex(/^[A-Za-z0-9_-]*$/, '只允许字母、数字、下划线和横线')
      .optional()
      .or(z.literal('')),
    version: z.string().max(20, '版本号不能超过20字符').optional(),
    cpuCoreMin: z.number().int().min(1, 'CPU最小核数至少为1').default(1),
    cpuCoreMax: z.number().int().min(1, 'CPU最大核数至少为1').default(64),
    cpuCoreDefault: z.number().int().min(1).default(4),
    memoryMin: z.number().int().min(1, '内存最小值至少为1GB').default(1),
    memoryMax: z.number().int().min(1, '内存最大值至少为1GB').default(256),
    memoryDefault: z.number().int().min(1).default(8),
    valid: z.number().int().min(0).max(1).default(1),
    sort: z.number().int().min(0).default(0),
    remark: z.string().max(500, '备注不能超过500字符').optional(),
  })
  .refine(data => data.cpuCoreMin <= data.cpuCoreMax, {
    message: 'CPU最小核数不能大于最大核数',
    path: ['cpuCoreMin'],
  })
  .refine(
    data => data.cpuCoreDefault >= data.cpuCoreMin && data.cpuCoreDefault <= data.cpuCoreMax,
    {
      message: 'CPU默认核数必须在最小和最大范围内',
      path: ['cpuCoreDefault'],
    }
  )
  .refine(data => data.memoryMin <= data.memoryMax, {
    message: '内存最小值不能大于最大值',
    path: ['memoryMin'],
  })
  .refine(data => data.memoryDefault >= data.memoryMin && data.memoryDefault <= data.memoryMax, {
    message: '内存默认值必须在最小和最大范围内',
    path: ['memoryDefault'],
  });

/** 求解器表单数据类型 */
export type SolverFormData = z.infer<typeof solverSchema>;
