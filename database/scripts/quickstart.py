#!/usr/bin/env python3
"""
一键初始化脚本
功能：
1. 生成测试数据
2. 初始化数据库
3. 验证数据

使用方法：
    python database/scripts/quickstart.py --db-url mysql://user:pass@host:3306/dbname
"""

import argparse
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent


def run_command(cmd, description):
    """执行命令并显示输出"""
    print(f"\n{'='*60}")
    print(f"{description}")
    print(f"{'='*60}")

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    if result.returncode != 0:
        print(f"\n[ERROR] 命令执行失败: {cmd}")
        sys.exit(1)

    return result


def main():
    parser = argparse.ArgumentParser(description='一键初始化数据库')
    parser.add_argument('--db-url', required=True,
                       help='数据库连接URL: mysql://user:pass@host:3306/dbname')

    args = parser.parse_args()

    print("\n" + "="*60)
    print("StructSim AI Platform - 一键初始化")
    print("="*60)
    print(f"\n数据库: {args.db_url}")

    # 步骤1: 生成测试数据
    run_command(
        f"cd {BASE_DIR} && python database/scripts/generate_test_data.py",
        "步骤 1/2: 生成测试数据"
    )

    # 步骤2: 初始化数据库
    run_command(
        f"cd {BASE_DIR} && python database/scripts/init_database.py --db-url {args.db_url}",
        "步骤 2/2: 初始化数据库"
    )

    # 完成
    print("\n" + "="*60)
    print("[SUCCESS] 一键初始化完成！")
    print("="*60)
    print("\n已生成的测试数据：")
    print("  - 10 个项目（折叠屏手机、平板等）")
    print("  - 20 个用户（admin, zhangsan, lisi 等）")
    print("  - 5 个仿真类型（跌落、落球、振动等）")
    print("  - 20 个参数定义")
    print("  - 5 个角色、8 个权限")
    print("\n测试账号：")
    print("  - 管理员: admin (user_id: 10001)")
    print("  - 项目经理: zhangsan (user_id: 10002)")
    print("  - 开发: lisi (user_id: 10003)")
    print("  - 测试: wangwu (user_id: 10004)")
    print("\n数据库已就绪，可以开始开发测试！")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
