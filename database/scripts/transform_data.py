#!/usr/bin/env python3
"""
数据转换脚本 - 最小化扩展原始数据
策略：
1. 保留原始字段名（project_id, project_name等）
2. 只添加系统必需的时间戳字段
3. 不改变原有数据结构
"""

import json
import re
import time
from pathlib import Path
from typing import Any, Dict

BASE_DIR = Path(__file__).parent.parent.parent
DATA_CONFIG_DIR = BASE_DIR / "data-config"
INIT_DATA_DIR = BASE_DIR / "database" / "init-data"

INIT_DATA_DIR.mkdir(parents=True, exist_ok=True)

CURRENT_TS = int(time.time() * 1000)


def load_json_with_comments(filepath: Path) -> Dict:
    """加载包含注释的JSON文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r'//.*', '', content)
    return json.loads(content)


def add_timestamps(item: Dict[str, Any]) -> Dict[str, Any]:
    """只添加时间戳字段（如果不存在）"""
    if "created_at" not in item:
        item["created_at"] = CURRENT_TS
    if "updated_at" not in item:
        item["updated_at"] = CURRENT_TS
    return item


def transform_base_config():
    """转换 base_config.json - 保持原始结构"""
    data = load_json_with_comments(DATA_CONFIG_DIR / "base_config.json")

    output = {}

    # 项目列表 - 保留原始字段名
    if "projject_list" in data:
        output["projects"] = [add_timestamps(dict(p)) for p in data["projject_list"]]

    # 仿真类型 - 保留原始字段名
    if "sim_type_list" in data:
        output["sim_types"] = [add_timestamps(dict(st)) for st in data["sim_type_list"]]

    # 模型层级 - 保留原始字段名
    if "model_level_list" in data:
        output["model_levels"] = [add_timestamps(dict(ml)) for ml in data["model_level_list"]]

    # 折叠状态 - 保留原始字段名
    if "fold_type_list" in data:
        output["fold_types"] = [add_timestamps(dict(ft)) for ft in data["fold_type_list"]]

    # 参数定义 - 保留原始字段名
    if "param_map" in data:
        output["param_defs"] = [add_timestamps(dict(pm)) for pm in data["param_map"]]

    with open(INIT_DATA_DIR / "base_config.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("[OK] 已生成 base_config.json")


def transform_users():
    """转换 users.json - 保持原始结构"""
    data = load_json_with_comments(DATA_CONFIG_DIR / "users.json")

    output = {}

    # 用户列表 - 保留原始字段名
    if "user_list" in data:
        output["users"] = [add_timestamps(dict(u)) for u in data["user_list"]]

    # 部门列表 - 保留原始字段名
    if "department_list" in data:
        output["departments"] = [add_timestamps(dict(d)) for d in data["department_list"]]

    # 角色列表 - 保留原始字段名
    if "role_list" in data:
        output["roles"] = [add_timestamps(dict(r)) for r in data["role_list"]]

    # 权限列表 - 保留原始字段名
    if "permission_list" in data:
        output["permissions"] = [add_timestamps(dict(p)) for p in data["permission_list"]]

    # 用户角色关联 - 直接复制
    if "user_roles" in data:
        output["user_roles"] = data["user_roles"]

    with open(INIT_DATA_DIR / "users.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("[OK] 已生成 users.json")


def transform_param_groups():
    """转换 param_groups.json - 保持原始结构"""
    data = load_json_with_comments(DATA_CONFIG_DIR / "param_groups.json")

    output = {}

    # 优化参数组 - 保留原始字段名
    if "opt_param_groups" in data:
        output["opt_param_groups"] = [add_timestamps(dict(g)) for g in data["opt_param_groups"]]

    # 响应参数组 - 保留原始字段名
    if "resp_param_groups" in data:
        output["resp_param_groups"] = [add_timestamps(dict(g)) for g in data["resp_param_groups"]]

    with open(INIT_DATA_DIR / "param_groups.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("[OK] 已生成 param_groups.json")


def transform_relative_config():
    """转换 relative_config.json - 保持原始结构"""
    data = load_json_with_comments(DATA_CONFIG_DIR / "relative_config.json")

    # 直接复制，这个是数组格式，保持不变
    output = data

    with open(INIT_DATA_DIR / "relative_config.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("[OK] 已生成 relative_config.json")


def transform_submit_issue():
    """转换 submit_issue.json - 保持原始结构"""
    data = load_json_with_comments(DATA_CONFIG_DIR / "submit_issue.json")

    # 添加时间戳
    if "created_at" not in data:
        data["created_at"] = CURRENT_TS
    if "updated_at" not in data:
        data["updated_at"] = CURRENT_TS

    with open(INIT_DATA_DIR / "submit_issue_template.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("[OK] 已生成 submit_issue_template.json")


def main():
    print("=" * 60)
    print("数据转换脚本 - data-config -> database/init-data")
    print("策略: 保留原始字段结构，只添加时间戳")
    print("=" * 60)

    transform_base_config()
    transform_users()
    transform_param_groups()
    transform_relative_config()
    transform_submit_issue()

    print("=" * 60)
    print("[SUCCESS] 所有数据转换完成！")
    print(f"输出目录: {INIT_DATA_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
