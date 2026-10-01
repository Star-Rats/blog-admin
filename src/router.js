import { createRouter, createWebHistory } from 'vue-router'
import { TOKEN_KEY } from './api'

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('./layout/AdminLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { title: '仪表盘' } },
      { path: 'articles', name: 'articles', component: () => import('./views/ArticlesView.vue'), meta: { title: '文章管理' } },
      { path: 'articles/new', name: 'article-new', component: () => import('./views/ArticleEditorView.vue'), meta: { title: '新建文章' } },
      { path: 'articles/:id/edit', name: 'article-edit', component: () => import('./views/ArticleEditorView.vue'), meta: { title: '编辑文章' } },
      { path: 'categories', name: 'categories', component: () => import('./views/CategoriesView.vue'), meta: { title: '分类管理' } },
      { path: 'tags', name: 'tags', component: () => import('./views/TagsView.vue'), meta: { title: '标签管理' } },
      { path: 'settings', name: 'settings', component: () => import('./views/SettingsView.vue'), meta: { title: '站点设置' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (!to.meta.public && !localStorage.getItem(TOKEN_KEY)) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.name === 'login' && localStorage.getItem(TOKEN_KEY)) {
    return { name: 'dashboard' }
  }
})

export default router
