# 孕期宝 · 本地管理后台

Flask 应用，只读直连 MySQL 库 `yunfu`，用于本地查看用户、记录与 AI 对话。

## 功能

- **用户列表**：查看所有用户基本信息（ID、用户名、邮箱、类型、末次月经日、预产期、注册时间），可跳转该用户的记录/对话。
- **记录列表与详情**：按用户/类型筛选记录；详情页按类型展示文字/语音/照片/文件（图片可预览，语音可播放，文件可下载或图片预览）。
- **AI 对话列表与详情**：按用户筛选会话；会话详情按时间顺序展示全部消息，内容为 Markdown 渲染（含图片展示）。

## 运行

1. 安装依赖（建议使用虚拟环境）：

   ```bash
   cd admin-app
   pip install -r requirements.txt
   ```

2. 配置数据库：复制 `.env.example` 为 `.env`，填写与主项目一致的 MySQL 连接（`MYSQL_HOST`、`MYSQL_USER`、`MYSQL_PASSWORD` 等）。若不建 `.env`，则使用 `config.py` 中的默认值（如 localhost、用户名 username）。

3. 启动：

   ```bash
   export FLASK_APP=app.py   # Windows: set FLASK_APP=app.py
   flask run
   # 或直接
   python app.py
   ```

   默认访问：<http://127.0.0.1:5000>。

4. 可选：在 `.env` 中设置 `ADMIN_PASSWORD`，则访问任意页面时需输入该密码（HTTP Basic 认证）。

## 说明

- 仅做只读查询，不执行任何写操作。
- 与主后端、前端独立运行，仅共享 MySQL 数据库。
