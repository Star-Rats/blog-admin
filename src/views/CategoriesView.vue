<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const loading = ref(false)
const rows = ref([])

const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, name: '', slug: '', description: '', order_num: 0, is_visible: true })

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/categories')
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', slug: '', description: '', order_num: 0, is_visible: true })
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    order_num: row.order_num,
    is_visible: row.is_visible,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/api/admin/categories/${form.id}`, form)
    } else {
      await api.post('/api/admin/categories', form)
    }
    ElMessage.success('已保存')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  await ElMessageBox.confirm(
    `确定删除分类「${row.name}」？有关联文章时将无法删除。`,
    '删除确认',
    { type: 'warning' },
  )
  await api.delete(`/api/admin/categories/${row.id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<template>
  <el-card shadow="never">
    <div class="page-toolbar">
      <el-text type="info" size="small">分类由博客自身维护，同步不会改动；文章在「文章管理」里指派分类。</el-text>
      <div class="spacer"></div>
      <el-button type="primary" @click="openCreate">新建分类</el-button>
    </div>

    <el-table v-loading="loading" :data="rows">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="slug" label="Slug" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
      <el-table-column prop="order_num" label="排序" width="70" />
      <el-table-column label="可见" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_visible ? 'success' : 'info'" size="small">
            {{ row.is_visible ? '显示' : '隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="article_count" label="文章数" width="80" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建分类'" width="440px">
    <el-form label-width="80px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" placeholder="如：技术" maxlength="100" />
      </el-form-item>
      <el-form-item label="Slug">
        <el-input v-model="form.slug" placeholder="留空则由名称自动生成" maxlength="100" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" maxlength="500" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.order_num" :min="0" />
      </el-form-item>
      <el-form-item label="前台可见">
        <el-switch v-model="form.is_visible" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
