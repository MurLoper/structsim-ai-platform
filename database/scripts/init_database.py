#!/usr/bin/env python3
"""
数据库初始化脚本
功能：
1. 读取 database/init-data/*.json 中的标准化数据
2. 插入到数据库表中
3. 支持 MySQL 数据库

使用方法：
    python database/scripts/init_database.py --db-url mysql://user:pass@host:3306/dbname
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Any

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

try:
    import MySQLdb
except ImportError:
    print("错误: 请先安装 MySQLdb: pip install mysqlclient")
    exit(1)

BASE_DIR = Path(__file__).parent.parent.parent
INIT_DATA_DIR = BASE_DIR / "database" / "init-data"
SCHEMA_FILE = BASE_DIR / "database" / "schema.sql"


def load_json(filepath: Path) -> Dict:
    """加载JSON文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_db_url(db_url: str) -> Dict[str, Any]:
    """解析数据库连接字符串"""
    # mysql://user:pass@host:3306/dbname
    import re
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, db_url)
    if not match:
        raise ValueError("数据库URL格式错误，应为: mysql://user:pass@host:3306/dbname")

    user, password, host, port, database = match.groups()
    return {
        'host': host,
        'port': int(port),
        'user': user,
        'passwd': password,
        'db': database,
        'charset': 'utf8mb4'
    }


def execute_schema(cursor, schema_file: Path):
    """执行建表SQL"""
    print("执行数据库schema...")
    with open(schema_file, "r", encoding="utf-8") as f:
        sql = f.read()

    # 分割并执行每个语句
    statements = [s.strip() for s in sql.split(';') if s.strip()]
    for stmt in statements:
        if stmt and not stmt.startswith('--') and not stmt.startswith('/*'):
            cursor.execute(stmt)

    print("[OK] Schema执行完成")


def insert_base_config(cursor, data: Dict):
    """插入基础配置数据"""
    print("\n插入基础配置数据...")

    # 插入项目
    if "projects" in data:
        for p in data["projects"]:
            cursor.execute("""
                INSERT IGNORE INTO projects
                (project_id, project_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (p["project_id"], p["project_name"], p["created_at"], p["updated_at"]))
        print(f"  - 插入 {len(data['projects'])} 个项目")

    # 插入仿真类型
    if "sim_types" in data:
        for st in data["sim_types"]:
            cursor.execute("""
                INSERT IGNORE INTO sim_types
                (sim_type_id, sim_type_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (st["sim_type_id"], st["sim_type_name"], st["created_at"], st["updated_at"]))
        print(f"  - 插入 {len(data['sim_types'])} 个仿真类型")

    # 插入模型层级
    if "model_levels" in data:
        for ml in data["model_levels"]:
            cursor.execute("""
                INSERT IGNORE INTO model_levels
                (model_level_id, model_level_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (ml["model_level_id"], ml["model_level_name"], ml["created_at"], ml["updated_at"]))
        print(f"  - 插入 {len(data['model_levels'])} 个模型层级")

    # 插入折叠状态
    if "fold_types" in data:
        for ft in data["fold_types"]:
            cursor.execute("""
                INSERT IGNORE INTO fold_types
                (fold_type_id, fold_type_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (ft["fold_type_id"], ft["fold_type_name"], ft["created_at"], ft["updated_at"]))
        print(f"  - 插入 {len(data['fold_types'])} 个折叠状态")

    # 插入参数定义
    if "param_defs" in data:
        for pd in data["param_defs"]:
            cursor.execute("""
                INSERT IGNORE INTO param_defs
                (opt_param_id, param_name, param_unit, param_desc,
                 param_default_min, param_default_max, param_default_init,
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                pd["opt_param_id"], pd["param_name"], pd.get("param_unit"),
                pd.get("param_desc"), pd.get("param_default_min"),
                pd.get("param_default_max"), pd.get("param_default_init"),
                pd["created_at"], pd["updated_at"]
            ))
        print(f"  - 插入 {len(data['param_defs'])} 个参数定义")


def insert_users(cursor, data: Dict):
    """插入用户数据"""
    print("\n插入用户数据...")

    # 插入部门
    if "departments" in data:
        for d in data["departments"]:
            cursor.execute("""
                INSERT IGNORE INTO departments
                (department_id, department_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (d["department_id"], d["department_name"], d["created_at"], d["updated_at"]))
        print(f"  - 插入 {len(data['departments'])} 个部门")

    # 插入用户
    if "users" in data:
        for u in data["users"]:
            cursor.execute("""
                INSERT IGNORE INTO users
                (user_id, user_name, user_email, user_account, real_name,
                 department, is_super, access_token, creation_time, last_login_time,
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                u["user_id"], u["user_name"], u.get("user_email"),
                u.get("user_account"), u.get("real_name"), u.get("department"),
                u.get("is_super", 0), u.get("access_token"),
                u.get("creation_time"), u.get("last_login_time"),
                u["created_at"], u["updated_at"]
            ))
        print(f"  - 插入 {len(data['users'])} 个用户")

    # 插入角色
    if "roles" in data:
        for r in data["roles"]:
            perms = r.get("permissions")
            perms_str = json.dumps(perms) if isinstance(perms, list) else str(perms)
            cursor.execute("""
                INSERT IGNORE INTO roles
                (role_id, role_name, permissions, limit_cpu_cores, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (r["role_id"], r["role_name"], perms_str, r.get("limit_cpu_cores", 0),
                  r["created_at"], r["updated_at"]))
        print(f"  - 插入 {len(data['roles'])} 个角色")

    # 插入权限
    if "permissions" in data:
        for p in data["permissions"]:
            cursor.execute("""
                INSERT IGNORE INTO permissions
                (permission_id, permission_name, permission_code, permission_desc,
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                p["permission_id"], p["permission_name"],
                p.get("permission_code"), p.get("permission_desc"),
                p["created_at"], p["updated_at"]
            ))
        print(f"  - 插入 {len(data['permissions'])} 个权限")

    # 插入用户角色关联
    if "user_roles" in data:
        for ur in data["user_roles"]:
            cursor.execute("""
                INSERT IGNORE INTO user_roles (user_id, role_id)
                VALUES (%s, %s)
            """, (ur[0], ur[1]))
        print(f"  - 插入 {len(data['user_roles'])} 条用户角色关联")


def insert_param_groups(cursor, data: Dict):
    """插入参数组数据"""
    print("\n插入参数组数据...")

    # 插入优化参数组
    if "opt_param_groups" in data:
        for g in data["opt_param_groups"]:
            cursor.execute("""
                INSERT IGNORE INTO param_groups
                (group_id, opt_param_ids, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (
                g["group_id"],
                json.dumps(g["opt_param_ids"]),
                g["created_at"],
                g["updated_at"]
            ))
        print(f"  - 插入 {len(data['opt_param_groups'])} 个优化参数组")

    # 插入响应参数组
    if "resp_param_groups" in data:
        for g in data["resp_param_groups"]:
            cursor.execute("""
                INSERT IGNORE INTO resp_param_groups
                (group_id, resp_param_ids, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (
                g["group_id"],
                json.dumps(g["resp_param_ids"]),
                g["created_at"],
                g["updated_at"]
            ))
        print(f"  - 插入 {len(data['resp_param_groups'])} 个响应参数组")


def main():
    parser = argparse.ArgumentParser(description='数据库初始化脚本')
    parser.add_argument('--db-url', required=True,
                       help='数据库连接URL: mysql://user:pass@host:3306/dbname')
    parser.add_argument('--skip-schema', action='store_true',
                       help='跳过schema创建（仅插入数据）')

    args = parser.parse_args()

    print("=" * 60)
    print("StructSim AI Platform - 数据库初始化")
    print("=" * 60)

    # 解析数据库连接
    try:
        db_config = parse_db_url(args.db_url)
        print(f"\n连接数据库: {db_config['user']}@{db_config['host']}:{db_config['port']}/{db_config['db']}")
    except Exception as e:
        print(f"错误: {e}")
        return

    # 连接数据库
    try:
        conn = MySQLdb.connect(**db_config)
        cursor = conn.cursor()
        print("[OK] 数据库连接成功")
    except Exception as e:
        print(f"错误: 数据库连接失败 - {e}")
        return

    try:
        # 执行schema
        if not args.skip_schema:
            execute_schema(cursor, SCHEMA_FILE)
            conn.commit()

        # 加载并插入数据
        base_config = load_json(INIT_DATA_DIR / "base_config.json")
        insert_base_config(cursor, base_config)
        conn.commit()

        users = load_json(INIT_DATA_DIR / "users.json")
        insert_users(cursor, users)
        conn.commit()

        param_groups = load_json(INIT_DATA_DIR / "param_groups.json")
        insert_param_groups(cursor, param_groups)
        conn.commit()

        print("\n" + "=" * 60)
        print("[SUCCESS] 数据库初始化完成！")
        print("=" * 60)

    except Exception as e:
        print(f"\n错误: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
