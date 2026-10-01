<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const router = useRouter()
const route = useRoute()

// 品牌标题跟随站点设置（公开接口 /api/home 返回站点配置）
const siteTitle = ref('博客管理后台')

onMounted(async () => {
  try {
    const res = await api.get('/api/home')
    const title = res.data.site?.site_title
    if (title) {
      siteTitle.value = title
      document.title = `${title} · 管理后台`
    }
  } catch {
    // 后端不可用时保持默认文案
  }
})

// 与路由配置保持一致的菜单顺序
const menu = [
  { index: '/', title: '仪表盘' },
  { index: '/articles', title: '文章管理' },
  { index: '/categories', title: '分类管理' },
  { index: '/tags', title: '标签管理' },
  { index: '/settings', title: '站点设置' },
]

// 编辑器等子路由也高亮「文章管理」
const activeMenu = computed(() => {
  if (route.path.startsWith('/articles')) return '/articles'
  return route.path
})

function logout() {
  localStorage.removeItem('blog_admin_token')
  router.push('/login')
}
</script>

<template>
  <el-container style="height: 100%">
    <el-aside width="220px" class="aside">
      <div class="brand">
        <span>{{ siteTitle }}</span>
        <small>管理后台</small>
      </div>
      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item v-for="item in menu" :key="item.index" :index="item.index">
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span style="font-size: 16px; font-weight: 600">{{ route.meta.title }}</span>
        <el-button link type="danger" @click="logout">退出登录</el-button>
      </el-header>
      <el-main style="padding: 20px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.aside {
  background: #fff;
  border-right: 1px solid #e8e8ea;
}

.brand {
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px;
  border-bottom: 1px solid #e8e8ea;
}

.brand span {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 1px;
}

.brand small {
  color: #9a9ea6;
  font-size: 12px;
}

.menu {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e8e8ea;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
