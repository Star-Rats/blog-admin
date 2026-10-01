<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const home = ref({ site: {}, stats: {} })
const recent = ref([])

async function load() {
  const homeRes = await api.get('/api/home')
  home.value = homeRes.data
  const listRes = await api.get('/api/admin/articles', { params: { page: 1, page_size: 5 } })
  recent.value = listRes.data.items
}

function fmt(value) {
  return value ? dayjs(value).format('MM-DD HH:mm') : ''
}

onMounted(load)
</script>

<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card" @click="router.push('/articles')">
          <div class="stat-num">{{ home.stats.article_count ?? 0 }}</div>
          <div class="stat-label">已发布文章</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card" @click="router.push('/categories')">
          <div class="stat-num">{{ home.stats.category_count ?? 0 }}</div>
          <div class="stat-label">分类数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card" @click="router.push('/tags')">
          <div class="stat-num">{{ home.stats.tag_count ?? 0 }}</div>
          <div class="stat-label">标签数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>快捷操作</span>
        </div>
      </template>
      <el-button type="primary" @click="router.push('/articles/new')">✍️ 写新文章</el-button>
      <el-button @click="router.push('/categories')">管理分类</el-button>
      <el-button @click="router.push('/settings')">站点设置</el-button>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>最近编辑</span>
          <el-button link type="primary" @click="router.push('/articles')">全部文章</el-button>
        </div>
      </template>
      <el-table :data="recent" size="small">
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="110">
          <template #default="{ row }">{{ row.category_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="130">
          <template #default="{ row }">{{ fmt(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/articles/${row.id}/edit`)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.stat-card {
  cursor: pointer;
  text-align: center;
}

.stat-num {
  font-size: 26px;
  font-weight: 700;
  color: #d9512c;
}

.stat-label {
  color: #9a9ea6;
  font-size: 13px;
  margin-top: 4px;
}
</style>
