<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import api, { TOKEN_KEY } from '../api'

const route = useRoute()
const router = useRouter()
const articleId = route.params.id ? Number(route.params.id) : null

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

const editorRef = shallowRef(null)
const editorConfig = ref({
  placeholder: '开始写作…',
  MENU_CONF: {
    // 图片上传到后端接口（阿里云 OSS），失败信息后端已格式化
    uploadImage: {
      server: `${API_BASE}/api/admin/images`,
      fieldName: 'file',
      maxFileSize: 10 * 1024 * 1024,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}` },
      timeout: 30 * 1000,
    },
  },
})

const saving = ref(false)
const ready = ref(false)

// 语雀导入
const importVisible = ref(false)
const importing = ref(false)
const importUrl = ref('')

async function doImport() {
  const url = importUrl.value.trim()
  if (!url) {
    ElMessage.warning('请粘贴语雀文档链接')
    return
  }
  importing.value = true
  try {
    const res = await api.post('/api/admin/articles/import', { url })
    const a = res.data
    importVisible.value = false
    importUrl.value = ''
    Object.assign(form, {
      title: a.title,
      body_html: a.body_html ?? '',
      description: a.description || '',
      cover: a.cover || '',
      slug: a.slug,
      status: a.status,
      category_id: a.category_id,
      tags: a.tags.map((t) => t.name),
    })
    // 编辑器已挂载时直接替换内容
    editorRef.value?.setHtml?.(form.body_html)
    ElMessage.success('导入成功，已生成可编辑草稿')
    router.replace(`/articles/${a.id}/edit`)
  } finally {
    importing.value = false
  }
}

const form = reactive({
  title: '',
  body_html: '',
  description: '',
  cover: '',
  slug: '',
  status: 0,
  category_id: null,
  tags: [],
})
const categories = ref([])
const allTags = ref([])
const settingsOpen = ref(false)

// 封面上传
const coverInputRef = ref(null)
const coverUploading = ref(false)

function pickCover() {
  coverInputRef.value?.click()
}

async function onCoverChange(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // 允许重复选择同一文件
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 10MB')
    return
  }
  coverUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/api/admin/images', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.cover = res.data.data.url
    ElMessage.success('封面上传成功')
  } finally {
    coverUploading.value = false
  }
}

function removeCover() {
  form.cover = ''
}

// 工具栏：贴近语雀的常用写作配置
const toolbarConfig = {
  excludeKeys: ['group-video', 'fullScreen', 'insertVideo', 'uploadVideo'],
}

onMounted(async () => {
  const [catRes, tagRes] = await Promise.all([api.get('/api/admin/categories'), api.get('/api/admin/tags')])
  categories.value = catRes.data
  allTags.value = tagRes.data
  if (articleId) {
    // 详情接口含 body_html，编辑器加载用
    const res = await api.get(`/api/admin/articles/${articleId}`)
    const a = res.data
    Object.assign(form, {
      title: a.title,
      body_html: a.body_html ?? '',
      description: a.description || '',
      cover: a.cover || '',
      slug: a.slug,
      status: a.status,
      category_id: a.category_id,
      tags: a.tags.map((t) => t.name),
    })
  }
  // 数据就绪后再挂载编辑器，保证 v-model 初始正文正确
  ready.value = true
})

function handleCreated(editor) {
  editorRef.value = editor
  // 仅供本地自动化测试使用：暴露编辑器实例
  if (import.meta.env.DEV) window.__wangEditor = editor
}

onBeforeUnmount(() => {
  editorRef.value?.destroy?.()
})

async function save(status) {
  if (!form.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  const html = editorRef.value ? editorRef.value.getHtml() : form.body_html
  if (!html || html === '<p><br></p>') {
    ElMessage.warning('正文不能为空')
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title,
      body_html: html,
      description: form.description || null,
      cover: form.cover || null,
      slug: form.slug || null,
      status,
      category_id: form.category_id,
      tags: form.tags,
    }
    const res = articleId
      ? await api.put(`/api/admin/articles/${articleId}`, payload)
      : await api.post('/api/admin/articles', payload)
    ElMessage.success(status === 1 ? '已发布' : '草稿已保存')
    const saved = res.data
    if (!articleId) {
      // 新建后跳到编辑路由，避免重复创建
      router.replace(`/articles/${saved.id}/edit`)
    } else {
      form.slug = saved.slug
      form.status = saved.status
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="editor-page">
    <div class="editor-top">
      <el-input
        v-model="form.title"
        placeholder="输入文章标题…"
        size="large"
        maxlength="255"
        class="title-input"
      />
      <div class="actions">
        <el-button v-if="!articleId" @click="importVisible = true">导入语雀文章</el-button>
        <el-button :disabled="saving" @click="settingsOpen = !settingsOpen">
          {{ settingsOpen ? '收起设置' : '文章设置' }}
        </el-button>
        <el-button :loading="saving" @click="save(0)">存草稿</el-button>
        <el-button type="primary" :loading="saving" @click="save(1)">
          {{ form.status === 1 ? '更新并发布' : '发布' }}
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="form.status === 1"
      type="success"
      :closable="false"
      style="margin-bottom: 12px"
      :title="`当前状态：已发布（slug: ${form.slug || '保存后生成'}）`"
    />

    <el-collapse-transition>
      <el-card v-show="settingsOpen" shadow="never" class="settings-card">
        <el-form label-width="80px" size="default">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分类">
                <el-select v-model="form.category_id" placeholder="未分类" clearable style="width: 100%">
                  <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签">
                <el-select
                  v-model="form.tags"
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
            </el-col>
            <el-col :span="12">
              <el-form-item label="头图">
                <div class="cover-field">
                  <img v-if="form.cover" :src="form.cover" class="cover-preview" alt="封面预览" />
                  <div v-else class="cover-empty" @click="pickCover">
                    <el-icon size="20"><Plus /></el-icon>
                    <span>上传头图</span>
                  </div>
                  <div v-if="form.cover" class="cover-actions">
                    <el-button link type="primary" size="small" @click="pickCover">更换</el-button>
                    <el-button link type="danger" size="small" @click="removeCover">移除</el-button>
                  </div>
                  <el-text v-if="!form.cover" type="info" size="small" class="cover-tip">
                    上传到 OSS；留空则自动取正文第一张图
                  </el-text>
                </div>
                <input
                  ref="coverInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  style="display: none"
                  @change="onCoverChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Slug">
                <el-input v-model="form.slug" placeholder="留空自动生成；仅小写字母/数字/连字符" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="摘要">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="2"
                  maxlength="500"
                  placeholder="留空则自动取正文前 120 字"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </el-collapse-transition>

    <div v-if="ready" class="editor-wrap">
      <Toolbar class="editor-toolbar" :editor="editorRef" :default-config="toolbarConfig" mode="default" />
      <Editor
        v-model="form.body_html"
        class="editor-content"
        :default-config="editorConfig"
        mode="default"
        @on-created="handleCreated"
      />
    </div>
  </div>
  <el-dialog v-model="importVisible" title="导入语雀文章" width="520px">
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 14px"
      title="粘贴公开的语雀文档链接，导入为可编辑的草稿（私有文档无法导入）。"
    />
    <el-input
      v-model="importUrl"
      placeholder="https://www.yuque.com/用户名/知识库/文档slug"
      clearable
      @keyup.enter="doImport"
    />
    <template #footer>
      <el-button @click="importVisible = false">取消</el-button>
      <el-button type="primary" :loading="importing" @click="doImport">导入</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.editor-page {
  max-width: 920px;
  margin: 0 auto;
}

.editor-top {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.settings-card {
  margin-bottom: 12px;
}

.editor-wrap {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  z-index: 10;
}

.editor-toolbar {
  border-bottom: 1px solid #e8e8ea;
}

.editor-content {
  min-height: 480px;
  overflow-y: auto;
}

.cover-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-preview {
  width: 128px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e8e8ea;
  display: block;
}

.cover-empty {
  width: 128px;
  height: 80px;
  border: 1px dashed #cdd0d6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #9a9ea6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.cover-empty:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cover-tip {
  flex: 1;
}
</style>
