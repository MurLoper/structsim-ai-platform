# API 数据映射方案

## 概述

本文档定义了前后端数据字段的映射规则，确保数据在不同层之间正确转换。

## 命名规范

### 后端/数据库（Python/SQL）

- 使用 **下划线命名**（snake_case）
- 使用 **语义化字段名**（不使用通用 `id`）
- 示例：`project_id`, `project_name`, `created_at`

### 前端（TypeScript）

- 使用 **驼峰命名**（camelCase）
- 示例：`projectId`, `projectName`, `createdAt`

### 字段映射关系

| 数据库字段           | 前端字段           | 说明           |
| -------------------- | ------------------ | -------------- |
| `project_id`         | `projectId`        | 项目ID         |
| `project_name`       | `projectName`      | 项目名称       |
| `sim_type_id`        | `simTypeId`        | 仿真类型ID     |
| `sim_type_name`      | `simTypeName`      | 仿真类型名称   |
| `model_level_id`     | `modelLevelId`     | 模型层级ID     |
| `model_level_name`   | `modelLevelName`   | 模型层级名称   |
| `fold_type_id`       | `foldTypeId`       | 折叠状态ID     |
| `fold_type_name`     | `foldTypeName`     | 折叠状态名称   |
| `opt_param_id`       | `optParamId`       | 优化参数ID     |
| `param_name`         | `paramName`        | 参数名称       |
| `param_unit`         | `paramUnit`        | 参数单位       |
| `param_desc`         | `paramDesc`        | 参数描述       |
| `param_default_min`  | `paramDefaultMin`  | 参数默认最小值 |
| `param_default_max`  | `paramDefaultMax`  | 参数默认最大值 |
| `param_default_init` | `paramDefaultInit` | 参数默认初始值 |
| `user_id`            | `userId`           | 用户ID         |
| `user_name`          | `userName`         | 用户名         |
| `user_email`         | `userEmail`        | 用户邮箱       |
| `real_name`          | `realName`         | 真实姓名       |
| `is_super`           | `isSuper`          | 是否超级用户   |
| `created_at`         | `createdAt`        | 创建时间       |
| `updated_at`         | `updatedAt`        | 更新时间       |
| `last_login_at`      | `lastLoginAt`      | 最后登录时间   |

## 数据库 Schema 规范

### 避免使用的关键字

- ❌ `desc` - SQL 关键字，使用 `remark` 或 `description` 代替
- ❌ `order` - SQL 关键字，使用 `sort` 或 `sequence` 代替
- ❌ `group` - SQL 关键字，避免作为表名

### 语义化ID字段

数据库表应使用语义化的主键字段名，而非通用 `id`：

```sql
-- ✅ 推荐
CREATE TABLE projects (
  project_id INT PRIMARY KEY,  -- 语义化字段名
  project_name VARCHAR(100),
  created_at BIGINT,
  updated_at BIGINT
);

-- ❌ 不推荐
CREATE TABLE projects (
  id INT PRIMARY KEY,  -- 通用字段名，不够清晰
  name VARCHAR(100),
  created_at BIGINT,
  updated_at BIGINT
);
```

### 外键字段命名

外键字段应与引用表的主键保持一致：

```sql
CREATE TABLE orders (
  order_id BIGINT PRIMARY KEY,
  project_id INT NOT NULL,  -- 外键，与 projects.project_id 对应
  user_id INT NOT NULL,     -- 外键，与 users.user_id 对应
  FOREIGN KEY (project_id) REFERENCES projects(project_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

## API 转换层实现

### 前端转换函数

在 `src/lib/api-transform.ts` 中实现：

```typescript
/**
 * 将对象的键从驼峰命名转换为下划线命名
 * @example { projectId: 1 } => { project_id: 1 }
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

/**
 * 将对象的键从下划线命名转换为驼峰命名
 * @example { project_id: 1 } => { projectId: 1 }
 */
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}
```

### 在 API Client 中集成

在 `src/api/client.ts` 中：

```typescript
import { toSnakeCase, toCamelCase } from '@/lib/api-transform';

class ApiClient {
  async request<T>(config: RequestConfig): Promise<T> {
    // 请求前：前端驼峰 -> 后端下划线
    if (config.data) {
      config.data = toSnakeCase(config.data);
    }
    if (config.params) {
      config.params = toSnakeCase(config.params);
    }

    const response = await fetch(/* ... */);
    const data = await response.json();

    // 响应后：后端下划线 -> 前端驼峰
    return toCamelCase(data) as T;
  }
}
```

## 时间戳处理

### 统一使用毫秒级 Unix 时间戳

```typescript
// 前端
const timestamp = Date.now(); // 1706112000000

// Python 后端
import time
timestamp = int(time.time() * 1000)  # 1706112000000

// SQL 查询
SELECT UNIX_TIMESTAMP() * 1000 AS timestamp;
```

### 前端时间转换

```typescript
// 时间戳 -> Date 对象
const date = new Date(createdAt);

// 格式化显示
const formatted = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}).format(date);
```

## 数据验证

### 前端类型定义

```typescript
// src/types/config.ts
export interface Project {
  projectId: number;
  projectName: string;
  createdAt: number;
  updatedAt: number;
}

export interface SimType {
  simTypeId: number;
  simTypeName: string;
  createdAt: number;
  updatedAt: number;
}
```

### 后端数据模型

```python
# models/config.py
from pydantic import BaseModel, Field

class Project(BaseModel):
    project_id: int
    project_name: str
    created_at: int
    updated_at: int

class SimType(BaseModel):
    sim_type_id: int
    sim_type_name: str
    created_at: int
    updated_at: int
```

## 特殊字段处理

### JSON 字段

数据库中的 JSON 字段在前后端保持一致的结构：

```typescript
// 前端
interface OriginFileInfo {
  fileName: string;      // 前端使用驼峰
  filePath: string;
  fileSize: number;
}

// 数据库存储（自动转换为下划线）
{
  "file_name": "test.inp",
  "file_path": "/path/to/file",
  "file_size": 2048
}
```

### 数组字段

```typescript
// 前端
involvedUserIds: number[];

// 数据库存储
involved_user_ids: JSON  // [1001, 1002, 1003]
```

## 测试

### 单元测试

```typescript
// src/lib/__tests__/api-transform.test.ts
import { toSnakeCase, toCamelCase } from '../api-transform';

describe('API Transform', () => {
  it('should convert camelCase to snake_case', () => {
    const input = { projectId: 1, projectName: 'test' };
    const output = toSnakeCase(input);
    expect(output).toEqual({ project_id: 1, project_name: 'test' });
  });

  it('should convert snake_case to camelCase', () => {
    const input = { project_id: 1, project_name: 'test' };
    const output = toCamelCase(input);
    expect(output).toEqual({ projectId: 1, projectName: 'test' });
  });

  it('should handle nested objects', () => {
    const input = {
      projectId: 1,
      userInfo: { userId: 100, userName: 'test' },
    };
    const output = toSnakeCase(input);
    expect(output).toEqual({
      project_id: 1,
      user_info: { user_id: 100, user_name: 'test' },
    });
  });
});
```

## 最佳实践

1. **前端只使用驼峰命名** - TypeScript 接口、组件 props 等
2. **后端只使用下划线命名** - 数据库表、API 响应等
3. **在 API 边界自动转换** - 在 API Client 中统一处理
4. **保持转换透明** - 业务代码无需关心转换细节
5. **使用类型约束** - TypeScript 类型定义确保字段正确性

## 迁移检查清单

- [ ] 前端类型定义使用驼峰命名
- [ ] 后端数据模型使用下划线命名
- [ ] API Client 集成转换函数
- [ ] 数据库表使用语义化主键（`project_id` 而非 `id`）
- [ ] 避免使用 SQL 关键字（如 `desc`）
- [ ] 时间戳统一使用毫秒级
- [ ] 编写单元测试验证转换正确性
