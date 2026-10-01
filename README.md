# blog-admin · 博客管理后台

配套 `../../blog` 后端（FastAPI）的管理后台。Vue 3 + Vite + Element Plus + wangEditor 富文本编辑器。

## 功能

- **写作发布**：wangEditor 编辑器，文章设置（分类/标签/头图上传/slug/摘要），存草稿、发布、转草稿
- **导入语雀文章**：贴公开文档链接 → 抓取转 Markdown → 生成可编辑草稿；已配置 OSS 时自动转存文中图片
- **文章管理**：搜索/筛选、操作菜单（编辑/分类标签/发布切换/删除）
- **分类 / 标签管理**：独立 CRUD，删除保护
- **站点设置**：标题/描述/页脚、关于页 Markdown、阿里云 OSS 图片存储配置（含连接测试）

## 启动

```bash
npm install
npm run dev   # http://127.0.0.1:5174
```

账号密码即后端 `.env.dev` 的 `ADMIN_USERNAME / ADMIN_PASSWORD`（默认 admin / admin123）。API 地址默认 `http://127.0.0.1:8000`，构建时 `VITE_API_BASE` 覆盖。
