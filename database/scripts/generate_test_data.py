#!/usr/bin/env python3
"""
测试数据生成器
功能：生成丰富的测试数据用于开发和测试
"""

import json
import time
from pathlib import Path
from typing import List, Dict

BASE_DIR = Path(__file__).parent.parent.parent
OUTPUT_DIR = BASE_DIR / "database" / "init-data"

CURRENT_TS = int(time.time() * 1000)


def generate_base_config() -> Dict:
    """生成基础配置测试数据"""

    # 项目数据（10个项目）
    projects = []
    project_names = [
        "折叠屏手机A", "折叠屏手机B", "折叠屏平板",
        "智能手表", "笔记本电脑", "游戏主机",
        "VR头显", "智能音箱", "车载显示屏", "工业平板"
    ]
    for i, name in enumerate(project_names, 1):
        projects.append({
            "project_id": str(1750 + i),
            "project_name": name,
            "created_at": CURRENT_TS - (i * 86400000),  # 每个项目间隔1天
            "updated_at": CURRENT_TS
        })

    # 仿真类型（5种）
    sim_types = [
        {"sim_type_id": 1, "sim_type_name": "跌落"},
        {"sim_type_id": 2, "sim_type_name": "落球"},
        {"sim_type_id": 3, "sim_type_name": "振动"},
        {"sim_type_id": 4, "sim_type_name": "冲击"},
        {"sim_type_id": 5, "sim_type_name": "热分析"},
    ]
    for st in sim_types:
        st["created_at"] = CURRENT_TS
        st["updated_at"] = CURRENT_TS

    # 模型层级
    model_levels = [
        {"model_level_id": 1, "model_level_name": "整机"},
        {"model_level_id": 2, "model_level_name": "单件"},
        {"model_level_id": 3, "model_level_name": "部件"},
    ]
    for ml in model_levels:
        ml["created_at"] = CURRENT_TS
        ml["updated_at"] = CURRENT_TS

    # 折叠状态
    fold_types = [
        {"fold_type_id": 0, "fold_type_name": "展开态"},
        {"fold_type_id": 1, "fold_type_name": "折叠态"},
        {"fold_type_id": 2, "fold_type_name": "半折叠态"},
    ]
    for ft in fold_types:
        ft["created_at"] = CURRENT_TS
        ft["updated_at"] = CURRENT_TS

    # 参数定义（20个参数）
    params = [
        # 姿态参数
        {"opt_param_id": 1, "param_name": "x_deg", "param_unit": "°",
         "param_desc": "X轴旋转角度", "param_default_min": 0, "param_default_max": 90, "param_default_init": 0},
        {"opt_param_id": 2, "param_name": "y_deg", "param_unit": "°",
         "param_desc": "Y轴旋转角度", "param_default_min": 0, "param_default_max": 360, "param_default_init": 0},
        {"opt_param_id": 3, "param_name": "z_deg", "param_unit": "°",
         "param_desc": "Z轴旋转角度", "param_default_min": 0, "param_default_max": 90, "param_default_init": 0},

        # 跌落参数
        {"opt_param_id": 4, "param_name": "drop_height", "param_unit": "m",
         "param_desc": "跌落高度", "param_default_min": 0.5, "param_default_max": 2.0, "param_default_init": 1.0},
        {"opt_param_id": 5, "param_name": "gravity", "param_unit": "m/s²",
         "param_desc": "重力加速度", "param_default_min": 9.8, "param_default_max": 9.8, "param_default_init": 9.8},
        {"opt_param_id": 6, "param_name": "init_velocity", "param_unit": "m/s",
         "param_desc": "初始速度", "param_default_min": 0, "param_default_max": 10, "param_default_init": 0},

        # 落球参数
        {"opt_param_id": 7, "param_name": "ball_mass", "param_unit": "kg",
         "param_desc": "球体质量", "param_default_min": 0.1, "param_default_max": 1.0, "param_default_init": 0.5},
        {"opt_param_id": 8, "param_name": "ball_radius", "param_unit": "mm",
         "param_desc": "球体半径", "param_default_min": 10, "param_default_max": 50, "param_default_init": 25},
        {"opt_param_id": 9, "param_name": "impact_x", "param_unit": "mm",
         "param_desc": "撞击点X坐标", "param_default_min": -100, "param_default_max": 100, "param_default_init": 0},
        {"opt_param_id": 10, "param_name": "impact_y", "param_unit": "mm",
         "param_desc": "撞击点Y坐标", "param_default_min": -100, "param_default_max": 100, "param_default_init": 0},

        # 振动参数
        {"opt_param_id": 11, "param_name": "frequency", "param_unit": "Hz",
         "param_desc": "振动频率", "param_default_min": 10, "param_default_max": 2000, "param_default_init": 100},
        {"opt_param_id": 12, "param_name": "amplitude", "param_unit": "mm",
         "param_desc": "振幅", "param_default_min": 0.1, "param_default_max": 10, "param_default_init": 1.0},
        {"opt_param_id": 13, "param_name": "duration", "param_unit": "s",
         "param_desc": "持续时间", "param_default_min": 1, "param_default_max": 60, "param_default_init": 10},

        # 材料参数
        {"opt_param_id": 14, "param_name": "youngs_modulus", "param_unit": "GPa",
         "param_desc": "杨氏模量", "param_default_min": 50, "param_default_max": 300, "param_default_init": 200},
        {"opt_param_id": 15, "param_name": "poisson_ratio", "param_unit": "",
         "param_desc": "泊松比", "param_default_min": 0.2, "param_default_max": 0.4, "param_default_init": 0.3},
        {"opt_param_id": 16, "param_name": "density", "param_unit": "kg/m³",
         "param_desc": "密度", "param_default_min": 1000, "param_default_max": 8000, "param_default_init": 7850},

        # 温度参数
        {"opt_param_id": 17, "param_name": "ambient_temp", "param_unit": "°C",
         "param_desc": "环境温度", "param_default_min": -40, "param_default_max": 85, "param_default_init": 25},
        {"opt_param_id": 18, "param_name": "heat_flux", "param_unit": "W/m²",
         "param_desc": "热流密度", "param_default_min": 0, "param_default_max": 10000, "param_default_init": 1000},

        # 网格参数
        {"opt_param_id": 19, "param_name": "mesh_size", "param_unit": "mm",
         "param_desc": "网格尺寸", "param_default_min": 0.5, "param_default_max": 5.0, "param_default_init": 2.0},
        {"opt_param_id": 20, "param_name": "time_step", "param_unit": "ms",
         "param_desc": "时间步长", "param_default_min": 0.01, "param_default_max": 1.0, "param_default_init": 0.1},
    ]
    for p in params:
        p["created_at"] = CURRENT_TS
        p["updated_at"] = CURRENT_TS

    return {
        "projects": projects,
        "sim_types": sim_types,
        "model_levels": model_levels,
        "fold_types": fold_types,
        "param_defs": params
    }


def generate_users() -> Dict:
    """生成用户测试数据"""

    # 部门数据
    departments = [
        {"department_id": 1, "department_name": "研发部"},
        {"department_id": 2, "department_name": "测试部"},
        {"department_id": 3, "department_name": "产品部"},
        {"department_id": 4, "department_name": "设计部"},
    ]
    for d in departments:
        d["created_at"] = CURRENT_TS
        d["updated_at"] = CURRENT_TS

    # 用户数据（20个用户）
    users = []
    user_data = [
        (10001, "admin", "admin@example.com", "系统管理员", 1, 1),
        (10002, "zhangsan", "zhangsan@example.com", "张三", 1, 0),
        (10003, "lisi", "lisi@example.com", "李四", 1, 0),
        (10004, "wangwu", "wangwu@example.com", "王五", 2, 0),
        (10005, "zhaoliu", "zhaoliu@example.com", "赵六", 2, 0),
        (10006, "sunqi", "sunqi@example.com", "孙七", 3, 0),
        (10007, "zhouba", "zhouba@example.com", "周八", 3, 0),
        (10008, "wujiu", "wujiu@example.com", "吴九", 4, 0),
        (10009, "zhengshi", "zhengshi@example.com", "郑十", 4, 0),
        (10010, "test_user1", "test1@example.com", "测试用户1", 1, 0),
        (10011, "test_user2", "test2@example.com", "测试用户2", 1, 0),
        (10012, "test_user3", "test3@example.com", "测试用户3", 2, 0),
        (10013, "test_user4", "test4@example.com", "测试用户4", 2, 0),
        (10014, "test_user5", "test5@example.com", "测试用户5", 3, 0),
        (10015, "dev_user1", "dev1@example.com", "开发1", 1, 0),
        (10016, "dev_user2", "dev2@example.com", "开发2", 1, 0),
        (10017, "qa_user1", "qa1@example.com", "测试1", 2, 0),
        (10018, "qa_user2", "qa2@example.com", "测试2", 2, 0),
        (10019, "pm_user1", "pm1@example.com", "产品经理1", 3, 0),
        (10020, "designer1", "design1@example.com", "设计师1", 4, 0),
    ]

    for uid, username, email, real_name, dept, is_super in user_data:
        users.append({
            "user_id": uid,
            "user_name": username,
            "user_email": email,
            "user_account": username,
            "real_name": real_name,
            "department": dept,
            "is_super": is_super,
            "access_token": f"token_{uid}",
            "creation_time": "2024-01-01 00:00:00",
            "last_login_time": "2024-01-24 00:00:00",
            "created_at": CURRENT_TS - (uid - 10000) * 3600000,  # 每小时一个
            "updated_at": CURRENT_TS
        })

    # 角色数据
    roles = [
        {"role_id": 1, "role_name": "超级管理员", "permissions": "all", "limit_cpu_cores": 512},
        {"role_id": 2, "role_name": "项目经理", "permissions": [1,2,3,4,5,6,7,8], "limit_cpu_cores": 256},
        {"role_id": 3, "role_name": "开发工程师", "permissions": [1,2,3,4,5], "limit_cpu_cores": 128},
        {"role_id": 4, "role_name": "测试工程师", "permissions": [1,3,4], "limit_cpu_cores": 64},
        {"role_id": 5, "role_name": "产品经理", "permissions": [1,2,6], "limit_cpu_cores": 32},
    ]
    for r in roles:
        r["created_at"] = CURRENT_TS
        r["updated_at"] = CURRENT_TS

    # 权限数据
    permissions = [
        {"permission_id": 1, "permission_name": "查看仪表盘", "permission_code": "VIEW_DASHBOARD", "permission_desc": "查看系统仪表盘"},
        {"permission_id": 2, "permission_name": "管理配置", "permission_code": "MANAGE_CONFIG", "permission_desc": "管理系统配置"},
        {"permission_id": 3, "permission_name": "查看结果", "permission_code": "VIEW_RESULTS", "permission_desc": "查看仿真结果"},
        {"permission_id": 4, "permission_name": "创建工单", "permission_code": "CREATE_ORDER", "permission_desc": "创建仿真工单"},
        {"permission_id": 5, "permission_name": "编辑工单", "permission_code": "EDIT_ORDER", "permission_desc": "编辑仿真工单"},
        {"permission_id": 6, "permission_name": "管理用户", "permission_code": "MANAGE_USERS", "permission_desc": "管理用户权限"},
        {"permission_id": 7, "permission_name": "系统设置", "permission_code": "SYSTEM_SETTINGS", "permission_desc": "修改系统设置"},
        {"permission_id": 8, "permission_name": "删除数据", "permission_code": "DELETE_DATA", "permission_desc": "删除系统数据"},
    ]
    for p in permissions:
        p["created_at"] = CURRENT_TS
        p["updated_at"] = CURRENT_TS

    # 用户角色关联（为所有用户分配角色）
    user_roles = [
        [10001, 1],  # admin - 超级管理员
        [10002, 2],  # zhangsan - 项目经理
        [10003, 3],  # lisi - 开发工程师
        [10004, 4],  # wangwu - 测试工程师
        [10005, 4],  # zhaoliu - 测试工程师
        [10006, 5],  # sunqi - 产品经理
        [10007, 5],  # zhouba - 产品经理
        [10008, 3],  # wujiu - 开发工程师
        [10009, 3],  # zhengshi - 开发工程师
        [10010, 3],  # test_user1 - 开发工程师
        [10011, 3],  # test_user2 - 开发工程师
        [10012, 4],  # test_user3 - 测试工程师
        [10013, 4],  # test_user4 - 测试工程师
        [10014, 5],  # test_user5 - 产品经理
        [10015, 3],  # dev_user1 - 开发工程师
        [10016, 3],  # dev_user2 - 开发工程师
        [10017, 4],  # qa_user1 - 测试工程师
        [10018, 4],  # qa_user2 - 测试工程师
        [10019, 2],  # pm_user1 - 项目经理
        [10020, 3],  # designer1 - 开发工程师
    ]

    return {
        "users": users,
        "departments": departments,
        "roles": roles,
        "permissions": permissions,
        "user_roles": user_roles
    }


def generate_param_groups() -> Dict:
    """生成参数组测试数据"""

    # 优化参数组（5个组）
    opt_param_groups = [
        {"group_id": 1, "opt_param_ids": [1, 2, 3, 4, 5, 6]},      # 跌落姿态组
        {"group_id": 2, "opt_param_ids": [7, 8, 9, 10]},           # 落球参数组
        {"group_id": 3, "opt_param_ids": [11, 12, 13]},            # 振动参数组
        {"group_id": 4, "opt_param_ids": [14, 15, 16]},            # 材料参数组
        {"group_id": 5, "opt_param_ids": [17, 18, 19, 20]},        # 热分析参数组
    ]
    for g in opt_param_groups:
        g["created_at"] = CURRENT_TS
        g["updated_at"] = CURRENT_TS

    # 响应参数组（5个组）
    resp_param_groups = [
        {"group_id": 1, "resp_param_ids": [1, 2, 3]},    # 跌落输出
        {"group_id": 2, "resp_param_ids": [4, 5]},       # 落球输出
        {"group_id": 3, "resp_param_ids": [6, 7]},       # 振动输出
        {"group_id": 4, "resp_param_ids": [8, 9]},       # 应力输出
        {"group_id": 5, "resp_param_ids": [10, 11]},     # 温度输出
    ]
    for g in resp_param_groups:
        g["created_at"] = CURRENT_TS
        g["updated_at"] = CURRENT_TS

    return {
        "opt_param_groups": opt_param_groups,
        "resp_param_groups": resp_param_groups
    }


def main():
    print("=" * 60)
    print("生成测试数据...")
    print("=" * 60)

    # 生成数据
    base_config = generate_base_config()
    users = generate_users()
    param_groups = generate_param_groups()

    # 保存文件
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_DIR / "base_config.json", "w", encoding="utf-8") as f:
        json.dump(base_config, f, ensure_ascii=False, indent=2)
    print("[OK] 生成 base_config.json")
    print(f"     - {len(base_config['projects'])} 个项目")
    print(f"     - {len(base_config['sim_types'])} 个仿真类型")
    print(f"     - {len(base_config['param_defs'])} 个参数定义")

    with open(OUTPUT_DIR / "users.json", "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    print("[OK] 生成 users.json")
    print(f"     - {len(users['users'])} 个用户")
    print(f"     - {len(users['departments'])} 个部门")
    print(f"     - {len(users['roles'])} 个角色")
    print(f"     - {len(users['permissions'])} 个权限")

    with open(OUTPUT_DIR / "param_groups.json", "w", encoding="utf-8") as f:
        json.dump(param_groups, f, ensure_ascii=False, indent=2)
    print("[OK] 生成 param_groups.json")
    print(f"     - {len(param_groups['opt_param_groups'])} 个优化参数组")
    print(f"     - {len(param_groups['resp_param_groups'])} 个响应参数组")

    print("=" * 60)
    print("[SUCCESS] 测试数据生成完成！")
    print(f"输出目录: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
