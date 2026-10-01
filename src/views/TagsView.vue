<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const loading = ref(false)
const rows = ref([])
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({ id: null, name: '' })

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/tags')
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  form.value = { id: null, name: '' }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { id: row.id, name: row.name }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/api/admin/tags/${form.value.id}`, form.value)
    } else {
      await api.post('/api/admin/tags', form.value)
    }
    ElMessage.success('已保存')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除标签「${row.name}」？将自动解除与文章的关联。`, '删除确认', {
    type: 'warning',
  })
  await api.delete(`/api/admin/tags/${row.id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<template>
  <el-card shadow="never">
    <div class="page-toolbar">
      <el-text type="info" size="small">标签由博客自身维护；在「文章管理」里给文章打标签时，不存在的标签会自动创建。</el-text>
      <div class="spacer"></div>
      <el-button type="primary" @click="openCreate">新建标签</el-button>
    </div>

    <el-table v-loading="loading" :data="rows">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="200" />
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新建标签'" width="380px">
    <el-input v-model="form.name" placeholder="标签名称" maxlength="50" @keyup.enter="save" />
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
