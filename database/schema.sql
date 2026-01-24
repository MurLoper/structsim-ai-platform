-- StructSim AI Platform Database Schema
-- 基于 data-config 的数据库结构定义

-- ============================================
-- 基础配置表
-- ============================================

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键（内部使用）',
  project_id VARCHAR(50) NOT NULL UNIQUE COMMENT '项目ID（业务主键）',
  project_name VARCHAR(100) NOT NULL COMMENT '项目名称',
  created_at BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
  updated_at BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- 仿真类型表
CREATE TABLE IF NOT EXISTS sim_types (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
  sim_type_id INT NOT NULL UNIQUE COMMENT '仿真类型ID（业务主键）',
  sim_type_name VARCHAR(100) NOT NULL COMMENT '仿真类型名称',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_sim_type_id (sim_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仿真类型表';

-- 模型层级表
CREATE TABLE IF NOT EXISTS model_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_level_id INT NOT NULL UNIQUE COMMENT '模型层级ID（业务主键）',
  model_level_name VARCHAR(100) NOT NULL COMMENT '模型层级名称',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_model_level_id (model_level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型层级表';

-- 折叠状态表
CREATE TABLE IF NOT EXISTS fold_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fold_type_id INT NOT NULL UNIQUE COMMENT '折叠状态ID（业务主键）',
  fold_type_name VARCHAR(100) NOT NULL COMMENT '折叠状态名称',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_fold_type_id (fold_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='折叠状态表';

-- 参数定义表
CREATE TABLE IF NOT EXISTS param_defs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opt_param_id INT NOT NULL UNIQUE COMMENT '参数ID（业务主键）',
  param_name VARCHAR(100) NOT NULL COMMENT '参数名称',
  param_unit VARCHAR(20) COMMENT '参数单位',
  param_desc TEXT COMMENT '参数描述',
  param_default_min DOUBLE COMMENT '默认最小值',
  param_default_max DOUBLE COMMENT '默认最大值',
  param_default_init DOUBLE COMMENT '默认初始值',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_opt_param_id (opt_param_id),
  INDEX idx_param_name (param_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='参数定义表';

-- ============================================
-- 用户权限系统
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID（业务主键）',
  user_name VARCHAR(100) NOT NULL COMMENT '用户名',
  user_email VARCHAR(100) COMMENT '用户邮箱',
  user_account VARCHAR(100) COMMENT '用户账号',
  real_name VARCHAR(100) COMMENT '真实姓名',
  department INT COMMENT '部门ID',
  is_super TINYINT DEFAULT 0 COMMENT '是否超级用户',
  access_token VARCHAR(255) COMMENT '访问令牌',
  creation_time VARCHAR(50) COMMENT '创建时间（字符串格式）',
  last_login_time VARCHAR(50) COMMENT '最后登录时间（字符串格式）',
  created_at BIGINT NOT NULL COMMENT '创建时间（时间戳）',
  updated_at BIGINT NOT NULL COMMENT '更新时间（时间戳）',
  INDEX idx_user_id (user_id),
  INDEX idx_user_name (user_name),
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 部门表
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL UNIQUE COMMENT '部门ID（业务主键）',
  department_name VARCHAR(100) NOT NULL COMMENT '部门名称',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL UNIQUE COMMENT '角色ID（业务主键）',
  role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
  permissions TEXT COMMENT '权限列表（JSON或逗号分隔）',
  limit_cpu_cores INT DEFAULT 0 COMMENT 'CPU核心数限制',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_id INT NOT NULL UNIQUE COMMENT '权限ID（业务主键）',
  permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  permission_code VARCHAR(100) COMMENT '权限代码',
  permission_desc TEXT COMMENT '权限描述',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  role_id INT NOT NULL COMMENT '角色ID',
  UNIQUE KEY unique_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ============================================
-- 参数模板配置
-- ============================================

-- 参数组表
CREATE TABLE IF NOT EXISTS param_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL UNIQUE COMMENT '参数组ID（业务主键）',
  opt_param_ids JSON COMMENT '优化参数ID列表',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='参数组表';

-- 响应参数组表
CREATE TABLE IF NOT EXISTS resp_param_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL UNIQUE COMMENT '响应参数组ID（业务主键）',
  resp_param_ids JSON COMMENT '响应参数ID列表',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='响应参数组表';

-- ============================================
-- 项目配置关联
-- ============================================

-- 项目仿真配置表
CREATE TABLE IF NOT EXISTS project_sim_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL COMMENT '项目ID',
  fold_type_id INT NOT NULL COMMENT '折叠状态ID',
  sim_type_id INT NOT NULL COMMENT '仿真类型ID',
  model_level_id INT NOT NULL COMMENT '模型层级ID',
  param_tpl_set_id INT COMMENT '参数模板集ID',
  cond_out_set_id INT COMMENT '输出指标集ID',
  solver_id INT COMMENT '求解器ID',
  INDEX idx_project_id (project_id),
  INDEX idx_sim_type_id (sim_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目仿真配置表';

-- ============================================
-- 说明
-- ============================================

/*
数据库设计说明：

1. 双主键策略：
   - id: 自增主键（内部使用，性能优化）
   - xxx_id: 业务主键（如 project_id, user_id）

2. 字段命名：
   - 统一使用下划线命名（snake_case）
   - 保留 data-config 中的原始字段名
   - 避免使用 SQL 关键字（如 desc, order）

3. 时间戳：
   - created_at, updated_at: 毫秒级 Unix 时间戳
   - 原始时间字符串保留（如 creation_time）

4. JSON 字段：
   - 使用 MySQL 的 JSON 类型存储复杂数据
   - 示例：opt_param_ids, resp_param_ids

5. 索引策略：
   - 业务主键添加唯一索引
   - 常用查询字段添加普通索引
*/
