# 常量管理规范

## 📋 概述

本文档规定项目中常量的组织和管理方式，确保代码的结构化、模块化和可维护性。

## 🎯 常量管理原则

1. **集中管理**：所有常量统一存放在 `constants/` 目录
2. **模块化**：按功能模块划分不同的常量文件
3. **类型安全**：使用 TypeScript 定义常量类型
4. **命名规范**：使用 UPPER_SNAKE_CASE 命名常量
5. **文档化**：为常量添加清晰的注释说明

## 📁 目录结构

### 前端常量结构

```text
src/
├── constants/
│   ├── index.ts              # 导出所有常量
│   ├── common.ts             # 通用常量
│   ├── api.ts                # API 相关常量
│   ├── routes.ts             # 路由相关常量
│   ├── submission/           # 提单模块常量
│   │   ├── index.ts
│   │   ├── canvas.ts         # 画布常量
│   │   └── config.ts         # 配置常量
│   ├── configuration/        # 配置管理模块常量
│   │   ├── index.ts
│   │   └── types.ts
│   └── dashboard/            # 工作台模块常量
│       ├── index.ts
│       └── charts.ts
```

### 后端常量结构

```text
app/
├── constants/
│   ├── __init__.py           # 导出所有常量
│   ├── common.py             # 通用常量
│   ├── enums.py              # 枚举类型
│   ├── error_codes.py        # 错误码
│   ├── status.py             # 状态常量
│   └── config.py             # 配置常量
```

## 📝 命名规范

### 常量命名

```typescript
// ✅ 正确：使用 UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const API_TIMEOUT = 30000;
export const DEFAULT_PAGE_SIZE = 20;

// ❌ 错误：不要使用 camelCase
export const maxFileSize = 10 * 1024 * 1024;
export const apiTimeout = 30000;
```

### 常量对象命名

```typescript
// ✅ 正确：对象名使用 UPPER_SNAKE_CASE，属性使用描述性名称
export const CANVAS_LAYOUT = {
  PROJECT_NODE_X: 120,
  PROJECT_NODE_Y: 300,
  SIM_TYPE_NODE_X: 580,
} as const;

// ✅ 正确：使用 as const 确保类型安全
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
} as const;
```

## 🔧 使用示例

### 前端示例

**定义常量** (`src/constants/submission/canvas.ts`):

```typescript
/**
 * 画布布局常量
 */
export const CANVAS_LAYOUT = {
  // 项目节点位置
  PROJECT_NODE_X: 120,
  PROJECT_NODE_Y: 300,
  PROJECT_NODE_WIDTH: 340,

  // 仿真类型节点位置
  SIM_TYPE_NODE_X: 580,
  SIM_TYPE_NODE_WIDTH: 240,

  // 配置模块位置
  CONFIG_BOX_X: 920,
  CONFIG_BOX_WIDTH: 600,
  CONFIG_BOX_HEIGHT: 180,

  // 间距
  VERTICAL_SPACING: 260,
  LINE_OFFSET_Y: 70,
} as const;

/**
 * 画布交互常量
 */
export const CANVAS_INTERACTION = {
  MIN_SCALE: 0.5,
  MAX_SCALE: 2.0,
  SCALE_STEP: 0.1,
  ZOOM_SENSITIVITY: 0.001,
} as const;
```

**导出常量** (`src/constants/submission/index.ts`):

```typescript
export * from './canvas';
export * from './config';
```

**使用常量**:

```typescript
import { CANVAS_LAYOUT, CANVAS_INTERACTION } from '@/constants/submission';

const { PROJECT_NODE_X, PROJECT_NODE_Y } = CANVAS_LAYOUT;
const { MIN_SCALE, MAX_SCALE } = CANVAS_INTERACTION;
```

### 后端示例

**定义常量** (`app/constants/status.py`):

```python
"""
状态常量定义
"""

# 订单状态
class OrderStatus:
    """订单状态"""
    DRAFT = 0           # 草稿
    SUBMITTED = 1       # 已提交
    RUNNING = 2         # 运行中
    COMPLETED = 3       # 已完成
    FAILED = 4          # 失败
    CANCELLED = 5       # 已取消

# 仿真状态
class SimulationStatus:
    """仿真状态"""
    PENDING = 0         # 待运行
    RUNNING = 1         # 运行中
    SUCCESS = 2         # 成功
    FAILED = 3          # 失败
```

**使用常量**:

```python
from app.constants.status import OrderStatus

if order.status == OrderStatus.SUBMITTED:
    # 处理已提交的订单
    pass
```

## 🚫 反模式

### 不要在组件中定义常量

```typescript
// ❌ 错误：在组件文件中定义常量
// src/pages/submission/index.tsx
const PROJECT_NODE_X = 120;
const PROJECT_NODE_Y = 300;

function SubmissionPage() {
  // ...
}
```

```typescript
// ✅ 正确：在常量文件中定义
// src/constants/submission/canvas.ts
export const CANVAS_LAYOUT = {
  PROJECT_NODE_X: 120,
  PROJECT_NODE_Y: 300,
} as const;

// src/pages/submission/index.tsx
import { CANVAS_LAYOUT } from '@/constants/submission';
```

### 不要使用魔法数字

```typescript
// ❌ 错误：使用魔法数字
if (fileSize > 10485760) {
  throw new Error('File too large');
}

// ✅ 正确：使用命名常量
import { MAX_FILE_SIZE } from '@/constants/common';

if (fileSize > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

## 📚 最佳实践

1. **按模块组织**：每个功能模块有自己的常量文件夹
2. **使用 TypeScript**：利用 `as const` 确保类型安全
3. **添加注释**：为每个常量或常量组添加说明
4. **避免重复**：相同的常量只定义一次
5. **集中导出**：通过 index 文件统一导出

## 🔗 相关文档

- [前端代码规范](../structsim-ai-platform/docs/development/CODE_STANDARDS.md)
- [后端开发规范](../structsim-backend/docs/development/DEVELOPMENT.md)
