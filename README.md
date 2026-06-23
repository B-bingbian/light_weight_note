# Notes — 轻量在线笔记

基于 Vue 3 + Express + SQLite 的在线笔记网站，使用 Docker 一键部署。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite + md-editor-v3
- **后端**：Express + TypeScript
- **数据库**：SQLite（sql.js）
- **部署**：Docker + docker-compose

## 本地开发

```bash
# 终端 1：启动后端
cd server
npm install
npm run dev     # 监听 http://localhost:3000

# 终端 2：启动前端
cd client
npm install
npm run dev     # 监听 http://localhost:3030
```

浏览器打开 http://localhost:3030 ，Vite 自动代理 API 请求到后端。

## Docker 部署

```bash
# 构建并启动
docker compose up --build -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

服务运行在 http://localhost:3030，数据持久化在 Docker Volume `notes-data`。

## 功能

- 笔记增删改查
- Markdown 编辑 + 实时分屏预览
- 标题/内容搜索
- 自动保存（停止输入 2 秒后）
- 深色/浅色模式自适应
