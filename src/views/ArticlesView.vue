<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, keyword: '', status: null, category_id: null })
const categories = ref([])

// 指派对话框（分类/标签仍可批量调整）
const assignVisible = ref(false)
const assigning = ref(false)
const assignForm = reactive({ article: null, category_id: null, tags: [] })
const allTags = ref([])

async function load() {
  loading.value = true
  try {
    const params = { page: query.page, page_size: query.page_size }
    if (query.keyword) params.keyword = query.keyword
    if (query.status !== null && query.status !== '') params.status = query.status
    if (query.category_id) params.category_id = query.category_id
    const res = await api.get('/api/admin/articles', { params })
    rows.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function loadTaxonomy() {
  const [catRes, tagRes] = await Promise.all([api.get('/api/admin/categories'), api.get('/api/admin/tags')])
  categories.value = catRes.data
  allTags.value = tagRes.data
}

function statusTag(row) {
  return row.status === 1
    ? { text: '已发布', type: 'success' }
    : { text: '草稿', type: 'warning' }
}

function openAssign(row) {
  assignForm.article = row
  assignForm.category_id = row.category_id
  assignForm.tags = row.tags.map((t) => t.name)
  assignVisible.value = true
}

async function saveAssign() {
  assigning.value = true
  try {
    await api.put(`/api/admin/articles/${assignForm.article.id}`, {
      category_id: assignForm.category_id,
      tags: assignForm.tags,
    })
    ElMessage.success('已保存')
    assignVisible.value = false
    load()
  } finally {
    assigning.value = false
  }
}

async function togglePublish(row) {
  const target = row.status === 1 ? 0 : 1
  await api.put(`/api/admin/articles/${row.id}`, { status: target })
  ElMessage.success(target === 1 ? '已发布' : '已转为草稿')
  load()
}

function handleCommand(command, row) {
  if (command === 'edit') router.push(`/articles/${row.id}/edit`)
  else if (command === 'assign') openAssign(row)
  else if (command === 'togglePublish') togglePublish(row)
  else if (command === 'delete') remove(row)
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除文章「${row.title}」？删除后不可恢复。`, '删除确认', {
    type: 'warning',
  })
  await api.delete(`/api/admin/articles/${row.id}`)
  ElMessage.success('已删除')
  load()
}

function fmt(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function reset() {
  query.page = 1
  query.keyword = ''
  query.status = null
  query.category_id = null
  load()
}

onMounted(() => {
  load()
  loadTaxonomy()
})
</script>

<template>
  <el-card shadow="never">
    <div class="page-toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="按标题搜索"
        clearable
        style="width: 200px"
        @keyup.enter="query.page = 1; load()"
        @clear="query.page = 1; load()"
      />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px" @change="query.page = 1; load()">
        <el-option label="已发布" :value="1" />
        <el-option label="草稿" :value="0" />
      </el-select>
      <el-select v-model="query.category_id" placeholder="分类" clearable style="width: 140px" @change="query.page = 1; load()">
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-button @click="reset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" @click="router.push('/articles/new')">新建文章</el-button>
    </div>

    <el-table v-loading="loading" :data="rows">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="标题" min-width="220">
        <template #default="{ row }">
          <router-link :to="`/articles/${row.id}/edit`" style="color: inherit">{{ row.title }}</router-link>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="110">
        <template #default="{ row }">{{ row.category_name || '—' }}</template>
      </el-table-column>
      <el-table-column label="标签" min-width="140">
        <template #default="{ row }">
          <el-tag v-for="t in row.tags" :key="t.id" size="small" style="margin-right: 4px">{{ t.name }}</el-tag>
          <span v-if="!row.tags.length">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row).type" size="small">{{ statusTag(row).text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="views" label="浏览" width="70" />
      <el-table-column label="更新时间" width="150">
        <template #default="{ row }">{{ fmt(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
            <el-button link type="primary">
              操作<el-icon style="margin-left: 2px"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="assign">分类标签</el-dropdown-item>
                <el-dropdown-item command="togglePublish" divided>
                  {{ row.status === 1 ? '转为草稿' : '发布' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      :page-size="query.page_size"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="load"
    />
  </el-card>

  <el-dialog v-model="assignVisible" title="调整分类与标签" width="460px">
    <div v-if="assignForm.article">
      <p style="margin-bottom: 14px; color: #7a8087; font-size: 13px">
        {{ assignForm.article.title }}
      </p>
      <el-form label-width="70px">
        <el-form-item label="分类">
          <el-select v-model="assignForm.category_id" placeholder="未分类" clearable style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="assignForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新标签"
            style="width: 100%"
          >
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="assignVisible = false">取消</el-button>
      <el-button type="primary" :loading="assigning" @click="saveAssign">保存</el-button>
    </template>
  </el-dialog>
</template>
