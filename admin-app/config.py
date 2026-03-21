# -*- coding: utf-8 -*-
"""管理后台配置：从环境变量读取数据库与可选密码。"""
import os
from dotenv import load_dotenv

load_dotenv()

mysql_password = os.environ.get("MYSQL_PASSWORD")

# MySQL（与主项目 backend application.yml 一致，连接 yunfu）
MYSQL_HOST = os.environ.get("MYSQL_HOST", "175.24.205.213")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_USER", "username")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", mysql_password)
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "yunfu")

# 可选：本地简单保护
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

# Flask
SECRET_KEY = os.environ.get("SECRET_KEY", "admin-app-local-secret")
