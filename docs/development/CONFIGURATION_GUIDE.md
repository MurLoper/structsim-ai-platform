# 配置化开发指南

## 📋 概述

本文档规定项目中配置数据的管理方式，明确哪些数据应该存储在数据库中，哪些应该作为常量。

## 🎯 配置数据分类原则

### 1. 数据库配置（动态配置）

**适用场景：**

- 需要后端存储和管理
- 需要在运行时修改
- 需要在多个地方复用
- 业务数据或用户数据
- 需要持久化的数据

**示例：**

- 项目列表
- 仿真类型
- 参数模板
- 工况配置
- 输出模板
- 求解器配置
- 用户权限
- 系统配置

### 2. 常量配置（静态配置）

**适用场景：**

- 前端独立使用
- 纯数字或固定值
- 不需要修改
- UI 相关配置
- 布局参数

**示例：**

- 画布布局常量
- UI 尺寸参数
- 颜色主题
- 动画时长
- HTTP 状态码
- 分页默认值

## 📊 决策流程图

```text
数据需要存储吗？
├─ 是 → 需要后端管理吗？
│  ├─ 是 → 数据库配置
│  └─ 否 → 本地存储（localStorage）
└─ 否 → 需要修改吗？
   ├─ 是 → 数据库配置
   └─ 否 → 常量配置
```

## 🗄️ 数据库配置实现

### 后端实现

**1. 创建配置表**

```python
# app/models/config.py
class SystemConfig(db.Model):
    """系统配置表"""
    __tablename__ = 'system_configs'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20))  # string, number, json, boolean
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
```

**2. 配置 API**

```python
# app/api/v1/config/routes.py
@bp.route('/system-configs', methods=['GET'])
def get_system_configs():
    """获取系统配置"""
    configs = SystemConfig.query.all()
    return success_response([{
        'key': c.key,
        'value': c.value,
        'type': c.type,
    } for c in configs])

@bp.route('/system-configs/<key>', methods=['PUT'])
@require_permission('MANAGE_CONFIG')
def update_system_config(key):
    """更新系统配置"""
    data = request.get_json()
    config = SystemConfig.query.filter_by(key=key).first_or_404()
    config.value = data['value']
    db.session.commit()
    return success_response(config)
```

### 前端实现

**1. API 调用**

```typescript
// src/api/config.ts
export const configApi = {
  getSystemConfigs: () => api.get<SystemConfig[]>('/system-configs'),
  updateSystemConfig: (key: string, value: unknown) => api.put(`/system-configs/${key}`, { value }),
};
```

**2. Store 管理**

```typescript
// src/stores/configStore.ts
interface ConfigState {
  systemConfigs: Record<string, unknown>;
  fetchSystemConfigs: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>(set => ({
  systemConfigs: {},

  fetchSystemConfigs: async () => {
    const configs = await configApi.getSystemConfigs();
    const configMap = configs.reduce(
      (acc, c) => {
        acc[c.key] = c.value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    set({ systemConfigs: configMap });
  },
}));
```

## 🔧 Redis 缓存集成

### 后端缓存实现

```python
# app/common/cache.py
from flask_caching import Cache

cache = Cache()

def init_cache(app):
    cache.init_app(app, config={
        'CACHE_TYPE': 'redis',
        'CACHE_REDIS_URL': app.config['REDIS_URL'],
        'CACHE_DEFAULT_TIMEOUT': 300,
    })

# 使用缓存
@cache.cached(timeout=300, key_prefix='system_configs')
def get_system_configs():
    return SystemConfig.query.all()

# 清除缓存
def update_system_config(key, value):
    config = SystemConfig.query.filter_by(key=key).first()
    config.value = value
    db.session.commit()
    cache.delete('system_configs')  # 清除缓存
    return config
```

## 📝 配置数据示例

### 数据库配置示例

```sql
-- 系统配置
INSERT INTO system_configs (key, value, type, description) VALUES
('max_upload_size', '104857600', 'number', '最大上传文件大小（字节）'),
('default_solver', '1', 'number', '默认求解器ID'),
('enable_notifications', 'true', 'boolean', '是否启用通知'),
('api_rate_limit', '{"requests": 100, "period": 60}', 'json', 'API速率限制');
```

### 常量配置示例

```typescript
// src/constants/common.ts
export const FILE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['.zip', '.rar', '.7z'],
} as const;

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 64,
  ANIMATION_DURATION: 300,
} as const;
```

## 🔄 配置更新流程

### 数据库配置更新

1. 用户在配置页面修改
2. 前端调用 API 更新
3. 后端更新数据库
4. 清除 Redis 缓存
5. 返回更新结果
6. 前端更新 Store

### 常量配置更新

1. 开发者修改常量文件
2. 提交代码
3. 部署新版本

## 🚀 最佳实践

1. **优先使用数据库配置**：如果不确定，优先选择数据库配置
2. **使用 Redis 缓存**：减少数据库查询，提高性能
3. **配置分组**：按模块或功能分组管理配置
4. **配置验证**：更新配置时进行数据验证
5. **配置历史**：记录配置变更历史
6. **配置备份**：定期备份配置数据

## 📋 配置清单

### 需要数据库配置的数据

- [ ] 项目列表
- [ ] 仿真类型
- [ ] 参数定义
- [ ] 工况定义
- [ ] 输出定义
- [ ] 求解器配置
- [ ] 参数模板
- [ ] 工况输出集
- [ ] 流程配置
- [ ] 状态定义
- [ ] 权限配置
- [ ] 系统设置

### 可以使用常量的数据

- [ ] 画布布局参数
- [ ] UI 尺寸
- [ ] 动画时长
- [ ] HTTP 状态码
- [ ] 错误码
- [ ] 分页默认值

## 🔗 相关文档

- [常量管理规范](./CONSTANTS_MANAGEMENT.md)
- [后端开发规范](../../structsim-backend/docs/development/DEVELOPMENT.md)
- [API 设计规范](../../structsim-backend/docs/architecture/API_DESIGN.md)
