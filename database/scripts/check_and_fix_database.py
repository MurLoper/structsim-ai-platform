#!/usr/bin/env python3
"""
数据库检查和自动修正工具
功能：
1. 检查已有数据库的表结构
2. 对比目标schema，找出差异
3. 自动生成ALTER TABLE语句
4. 可选：自动执行修正

使用方法：
    # 仅检查（不修改）
    python database/scripts/check_and_fix_database.py \
      --db-url mysql://user:pass@host:3306/dbname \
      --check-only

    # 检查并自动修正
    python database/scripts/check_and_fix_database.py \
      --db-url mysql://user:pass@host:3306/dbname \
      --auto-fix
"""

import argparse
import re
from pathlib import Path
from typing import Dict, List, Tuple, Set

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
SCHEMA_FILE = BASE_DIR / "database" / "schema.sql"


def parse_db_url(db_url: str) -> Dict[str, any]:
    """解析数据库连接字符串"""
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, db_url)
    if not match:
        raise ValueError("数据库URL格式错误")

    user, password, host, port, database = match.groups()
    return {
        'host': host,
        'port': int(port),
        'user': user,
        'passwd': password,
        'db': database,
        'charset': 'utf8mb4'
    }


def parse_schema_file() -> Dict[str, Dict]:
    """解析schema.sql文件，提取表结构定义"""
    with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取所有CREATE TABLE语句
    tables = {}
    pattern = r'CREATE TABLE IF NOT EXISTS (\w+)\s*\((.*?)\)\s*ENGINE'

    for match in re.finditer(pattern, content, re.DOTALL):
        table_name = match.group(1)
        columns_def = match.group(2)

        # 解析列定义
        columns = {}
        for line in columns_def.split('\n'):
            line = line.strip()
            if not line or line.startswith('INDEX') or line.startswith('UNIQUE') or line.startswith('PRIMARY'):
                continue

            # 提取列名和类型
            col_match = re.match(r'(\w+)\s+([A-Z]+(?:\([^)]+\))?)', line)
            if col_match:
                col_name = col_match.group(1)
                col_type = col_match.group(2)

                # 提取约束
                nullable = 'NOT NULL' not in line.upper()
                default = None
                if 'DEFAULT' in line.upper():
                    default_match = re.search(r'DEFAULT\s+([^\s,]+)', line, re.IGNORECASE)
                    if default_match:
                        default = default_match.group(1)

                comment = None
                if 'COMMENT' in line.upper():
                    comment_match = re.search(r"COMMENT\s+'([^']+)'", line, re.IGNORECASE)
                    if comment_match:
                        comment = comment_match.group(1)

                columns[col_name] = {
                    'type': col_type,
                    'nullable': nullable,
                    'default': default,
                    'comment': comment
                }

        tables[table_name] = columns

    return tables


def get_existing_tables(cursor) -> Set[str]:
    """获取数据库中已有的表"""
    cursor.execute("SHOW TABLES")
    return {row[0] for row in cursor.fetchall()}


def get_table_columns(cursor, table_name: str) -> Dict[str, Dict]:
    """获取表的列信息"""
    cursor.execute(f"DESCRIBE {table_name}")
    columns = {}

    for row in cursor.fetchall():
        col_name = row[0]
        col_type = row[1]
        nullable = row[2] == 'YES'
        default = row[4]

        columns[col_name] = {
            'type': col_type.upper(),
            'nullable': nullable,
            'default': default
        }

    return columns


def normalize_type(col_type: str) -> str:
    """标准化类型名称"""
    col_type = col_type.upper()

    # 处理类型别名
    if 'INT(' in col_type:
        col_type = 'INT'
    elif col_type.startswith('VARCHAR'):
        # 保留长度
        pass
    elif col_type == 'TINYINT(1)':
        col_type = 'TINYINT'

    return col_type


def compare_columns(expected: Dict, actual: Dict) -> List[str]:
    """比较列定义，生成ALTER语句"""
    alter_statements = []

    for col_name, expected_def in expected.items():
        if col_name not in actual:
            # 缺失列，需要添加
            col_def = f"{col_name} {expected_def['type']}"
            if not expected_def['nullable']:
                col_def += " NOT NULL"
            if expected_def['default']:
                col_def += f" DEFAULT {expected_def['default']}"
            if expected_def['comment']:
                col_def += f" COMMENT '{expected_def['comment']}'"

            alter_statements.append(f"ADD COLUMN {col_def}")
        else:
            # 检查列定义是否一致
            actual_def = actual[col_name]

            expected_type = normalize_type(expected_def['type'])
            actual_type = normalize_type(actual_def['type'])

            if expected_type != actual_type:
                # 类型不匹配
                col_def = f"{col_name} {expected_def['type']}"
                if not expected_def['nullable']:
                    col_def += " NOT NULL"
                if expected_def['default']:
                    col_def += f" DEFAULT {expected_def['default']}"
                if expected_def['comment']:
                    col_def += f" COMMENT '{expected_def['comment']}'"

                alter_statements.append(f"MODIFY COLUMN {col_def}")

    return alter_statements


def check_database(cursor, expected_schema: Dict) -> Dict[str, List[str]]:
    """检查数据库，返回需要修正的语句"""
    existing_tables = get_existing_tables(cursor)
    fixes = {}

    for table_name, expected_columns in expected_schema.items():
        if table_name not in existing_tables:
            # 表不存在
            fixes[table_name] = ['CREATE_TABLE']
        else:
            # 表存在，检查列
            actual_columns = get_table_columns(cursor, table_name)
            alter_statements = compare_columns(expected_columns, actual_columns)

            if alter_statements:
                fixes[table_name] = alter_statements

    return fixes


def generate_create_table_sql(table_name: str) -> str:
    """从schema.sql中提取建表语句"""
    with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取对应表的CREATE TABLE语句
    pattern = rf'CREATE TABLE IF NOT EXISTS {table_name}\s*\(.*?\)\s*ENGINE[^;]+;'
    match = re.search(pattern, content, re.DOTALL)

    if match:
        return match.group(0)
    return None


def apply_fixes(cursor, fixes: Dict[str, List[str]], conn):
    """执行修正"""
    print("\n开始执行修正...")

    for table_name, statements in fixes.items():
        if statements == ['CREATE_TABLE']:
            # 需要创建表
            create_sql = generate_create_table_sql(table_name)
            if create_sql:
                print(f"\n[CREATE] 创建表: {table_name}")
                print(f"  SQL: {create_sql[:100]}...")
                cursor.execute(create_sql)
                conn.commit()
                print("  [OK]")
        else:
            # 需要修改表
            for stmt in statements:
                sql = f"ALTER TABLE {table_name} {stmt}"
                print(f"\n[ALTER] {table_name}")
                print(f"  SQL: {sql}")
                try:
                    cursor.execute(sql)
                    conn.commit()
                    print("  [OK]")
                except Exception as e:
                    print(f"  [ERROR] {e}")
                    conn.rollback()


def main():
    parser = argparse.ArgumentParser(description='数据库检查和修正工具')
    parser.add_argument('--db-url', required=True,
                       help='数据库连接URL: mysql://user:pass@host:3306/dbname')
    parser.add_argument('--check-only', action='store_true',
                       help='仅检查，不执行修正')
    parser.add_argument('--auto-fix', action='store_true',
                       help='自动执行修正（无需确认）')

    args = parser.parse_args()

    print("=" * 60)
    print("数据库检查和修正工具")
    print("=" * 60)

    # 解析连接字符串
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
        # 解析期望的schema
        print("\n读取目标schema...")
        expected_schema = parse_schema_file()
        print(f"[OK] 已解析 {len(expected_schema)} 个表定义")

        # 检查数据库
        print("\n检查数据库结构...")
        fixes = check_database(cursor, expected_schema)

        if not fixes:
            print("\n" + "=" * 60)
            print("[SUCCESS] 数据库结构完全匹配，无需修正！")
            print("=" * 60)
            return

        # 显示检查结果
        print("\n" + "=" * 60)
        print("检查结果 - 发现以下差异：")
        print("=" * 60)

        for table_name, statements in fixes.items():
            if statements == ['CREATE_TABLE']:
                print(f"\n❌ 表不存在: {table_name}")
                print("   需要创建此表")
            else:
                print(f"\n⚠️  表需要修正: {table_name}")
                for stmt in statements:
                    print(f"   - {stmt}")

        # 决定是否执行修正
        if args.check_only:
            print("\n" + "=" * 60)
            print("[INFO] 仅检查模式，未执行修正")
            print("添加 --auto-fix 参数可自动执行修正")
            print("=" * 60)
        elif args.auto_fix:
            apply_fixes(cursor, fixes, conn)
            print("\n" + "=" * 60)
            print("[SUCCESS] 数据库修正完成！")
            print("=" * 60)
        else:
            # 询问是否执行
            print("\n" + "=" * 60)
            response = input("是否执行修正？(yes/no): ").strip().lower()
            if response in ['yes', 'y']:
                apply_fixes(cursor, fixes, conn)
                print("\n" + "=" * 60)
                print("[SUCCESS] 数据库修正完成！")
                print("=" * 60)
            else:
                print("\n[INFO] 已取消修正")

    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
