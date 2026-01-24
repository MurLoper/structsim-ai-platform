# 数据库初始化说明

## 目录结构

```
database/
├── init-data/              # 标准化的初始数据（自动生成）
│   ├── base_config.json    # 基础配置数据
│   ├── users.json          # 用户权限数据
│   ├── param_groups.json   # 参数组数据
│   └── relative_config.json # 关联配置数据
├── scripts/                # 数据处理脚本
│   ├── transform_data.py   # 数据转换脚本
│   └── init_database.py    # 数据库初始化脚本
├── schema.sql              # 数据库表结构定义
└── README.md               # 本文档
```

## 数据流程

```
data-config/*.json          # 1. 手动编辑的参考模板
       ↓
transform_data.py           # 2. 数据转换（添加时间戳）
       ↓
database/init-data/*.json   # 3. 标准化数据
       ↓
init_database.py            # 4. 导入数据库
       ↓
MySQL 数据库                # 5. 生产数据
```

## 快速开始

### 方式一：使用丰富的测试数据（推荐用于开发测试）

```bash
# 1. 生成测试数据（20个用户、10个项目、20个参数等）
python database/scripts/generate_test_data.py

# 2. 一键初始化数据库
python database/scripts/init_database.py \
  --db-url mysql://root:password@localhost:3306/structsim
```

生成的测试数据：

- ✅ 10个项目（折叠屏手机、平板、手表等）
- ✅ 20个用户（含管理员、开发、测试、产品等角色）
- ✅ 5个仿真类型（跌落、落球、振动、冲击、热分析）
- ✅ 20个参数定义（姿态、材料、温度等）
- ✅ 5个角色、8个权限

### 方式二：使用 data-config 模板数据

```bash
# 1. 从 data-config 生成标准化数据
python database/scripts/transform_data.py

# 2. 初始化数据库
python database/scripts/init_database.py \
  --db-url mysql://root:password@localhost:3306/structsim
```

输出：

- `database/init-data/base_config.json`
- `database/init-data/users.json`
- `database/init-data/param_groups.json`
- `database/init-data/relative_config.json`

### 完整初始化流程（空数据库 → 可用系统）

```bash
# 安装依赖
pip install mysqlclient

# 初始化数据库（包含建表和数据导入）
python database/scripts/init_database.py \
  --db-url mysql://user:password@localhost:3306/structsim

# 仅导入数据（跳过建表）
python database/scripts/init_database.py \
  --db-url mysql://user:password@localhost:3306/structsim \
  --skip-schema
```

### 3. 前端API集成

在 `src/api/client.ts` 中集成转换层：

```typescript
import { toSnakeCase, toCamelCase } from '@/lib/api-transform';

class ApiClient {
  async request<T>(config: RequestConfig): Promise<T> {
    // 请求前：驼峰 → 下划线
    if (config.data) {
      config.data = toSnakeCase(config.data);
    }

    const response = await fetch(/* ... */);
    const data = await response.json();

    // 响应后：下划线 → 驼峰
    return toCamelCase(data) as T;
  }
}
```

## 数据规范

### 字段命名

| 层级     | 命名规范                | 示例                       |
| -------- | ----------------------- | -------------------------- |
| 数据库   | 下划线命名 + 语义化主键 | `project_id`, `user_name`  |
| 后端 API | 下划线命名              | `project_id`, `created_at` |
| 前端     | 驼峰命名                | `projectId`, `createdAt`   |

### 主键设计

采用双主键策略：

```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,      -- 自增主键（内部使用）
  project_id VARCHAR(50) NOT NULL UNIQUE, -- 业务主键（对外暴露）
  project_name VARCHAR(100),
  created_at BIGINT,
  updated_at BIGINT
);
```

- `id`：自增主键，数据库内部使用，提升性能
- `project_id`：业务主键，对外暴露，保持语义化

### 时间戳

统一使用毫秒级 Unix 时间戳：

```javascript
// JavaScript
const timestamp = Date.now(); // 1706112000000

// Python
import time
timestamp = int(time.time() * 1000)  # 1706112000000
```

## 字段映射表

### 基础配置

| 数据库字段       | 前端字段       | 类型   | 说明         |
| ---------------- | -------------- | ------ | ------------ |
| project_id       | projectId      | string | 项目ID       |
| project_name     | projectName    | string | 项目名称     |
| sim_type_id      | simTypeId      | number | 仿真类型ID   |
| sim_type_name    | simTypeName    | string | 仿真类型名称 |
| model_level_id   | modelLevelId   | number | 模型层级ID   |
| model_level_name | modelLevelName | string | 模型层级名称 |
| fold_type_id     | foldTypeId     | number | 折叠状态ID   |
| fold_type_name   | foldTypeName   | string | 折叠状态名称 |

### 参数定义

| 数据库字段         | 前端字段         | 类型   | 说明     |
| ------------------ | ---------------- | ------ | -------- |
| opt_param_id       | optParamId       | number | 参数ID   |
| param_name         | paramName        | string | 参数名称 |
| param_unit         | paramUnit        | string | 参数单位 |
| param_desc         | paramDesc        | string | 参数描述 |
| param_default_min  | paramDefaultMin  | number | 最小值   |
| param_default_max  | paramDefaultMax  | number | 最大值   |
| param_default_init | paramDefaultInit | number | 初始值   |

### 用户数据

| 数据库字段 | 前端字段  | 类型   | 说明     |
| ---------- | --------- | ------ | -------- |
| user_id    | userId    | number | 用户ID   |
| user_name  | userName  | string | 用户名   |
| user_email | userEmail | string | 邮箱     |
| real_name  | realName  | string | 真实姓名 |
| is_super   | isSuper   | number | 是否超管 |
| created_at | createdAt | number | 创建时间 |
| updated_at | updatedAt | number | 更新时间 |

## 维护指南

### 修改数据配置

1. 编辑 `data-config/*.json` 中的参考模板
2. 运行 `python database/scripts/transform_data.py` 重新生成标准化数据
3. 运行 `init_database.py` 更新数据库

### 添加新字段

1. 修改 `data-config/*.json` 添加新字段
2. 更新 `database/schema.sql` 添加对应列
3. 更新 `transform_data.py` 处理新字段
4. 更新前端 TypeScript 类型定义
5. 运行转换和初始化脚本

### 修改表结构

1. 编辑 `database/schema.sql`
2. 手动执行 ALTER TABLE 语句或重建数据库
3. 更新 `init_database.py` 的插入逻辑

## 相关文档

- [API数据映射规范](../docs/API_DATA_MAPPING.md) - 详细的字段映射和转换方案
- [数据结构统一方案](../docs/DATA_STRUCTURE_UNIFICATION.md) - 差异分析和统一策略
- [前端API转换层](../src/lib/api-transform.ts) - 命名转换实现

## 常见问题

### Q: 为什么使用双主键？

A:

- `id`：自增主键，数据库内部使用，性能更好
- `xxx_id`：业务主键，语义清晰，符合业务习惯

### Q: 为什么不直接使用 id 字段？

A: 保持语义化命名，避免表关联时字段混淆，提高可读性。

### Q: 时间字段为什么用时间戳？

A:

- 跨时区兼容
- 存储效率高
- 前端处理方便

### Q: 如何处理 data-config 中的注释？

A: `transform_data.py` 使用正则表达式自动移除 `//` 注释。

### Q: 前端如何自动转换字段名？

A: 在 API Client 中集成 `toSnakeCase` 和 `toCamelCase` 函数，自动处理请求和响应数据。
