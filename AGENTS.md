# AGENTS.md

面向 coding agent 的仓库工作指南。

## 项目概述

博客管理后台前端（配套后端 `../blog`，FastAPI）。Vue 3 + Vite + Element Plus + wangEditor 富文本编辑器。

## 常用命令

```bash
npm install
npm run dev     # http://127.0.0.1:5174
npm run build   # 产物 dist/（勿提交）
```

后端地址默认 `http://127.0.0.1:8000`，构建时 `VITE_API_BASE` 覆盖；axios 实例在 `src/api.js`（自动带 JWT，401 时清 token 并跳登录页）。

## 页面与约定

- 路由在 `src/router.js`，页面在 `src/views/`，侧栏菜单在 `layout/AdminLayout.vue`（新增页面需同步加菜单，子路由用 `activeMenu` 计算属性高亮父级）
- 登录态：token 存 `localStorage`（key 在 `api.js` 的 `TOKEN_KEY`），路由守卫 `router.js`
- 文章编辑器 `views/ArticleEditorView.vue`：
  - wangEditor 实例通过 v-model 绑定 `form.body_html`，数据就绪后（`ready`）才挂载编辑器
  - 图片上传指向后端 `/api/admin/images`（OSS），dev 模式下 `window.__wangEditor` 暴露实例供自动化测试
  - 头图上传复用同一接口
- 分层对齐后端：分类/标签写操作走 `/api/admin/*`，响应模型见后端 `app/schemas/blog.py`
- 品牌标题跟随后端站点设置（`/api/home` 返回的 `site.site_title`），不写死

## 风格

- 注释、提交信息用中文
- Element Plus 主题色通过 `styles.css` 的 `--el-color-primary` 系列覆盖（赭石色，与主站一致）
- `node_modules/`、`dist/` 不进仓库
