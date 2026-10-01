<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const saving = ref(false)
const form = reactive({ site_title: '', site_description: '', site_footer: '', about_content: '' })

// OSS 配置
const ossSaving = ref(false)
const ossTesting = ref(false)
const ossForm = reactive({ endpoint: '', access_key_id: '', access_key_secret: '', bucket: '', custom_domain: '' })
const ossMasked = ref('')
const ossConfigured = ref(false)

async function load() {
  const res = await api.get('/api/admin/settings')
  Object.assign(form, res.data)
  const oss = (await api.get('/api/admin/oss/config')).data
  ossForm.endpoint = oss.endpoint
  ossForm.access_key_id = oss.access_key_id
  ossForm.bucket = oss.bucket
  ossForm.custom_domain = oss.custom_domain
  ossMasked.value = oss.access_key_secret_masked
  ossConfigured.value = oss.configured
}

async function save() {
  saving.value = true
  try {
    await api.put('/api/admin/settings', form)
    ElMessage.success('已保存')
  } finally {
    saving.value = false
  }
}

async function saveOss() {
  ossSaving.value = true
  try {
    const res = await api.put('/api/admin/oss/config', {
      endpoint: ossForm.endpoint,
      access_key_id: ossForm.access_key_id,
      access_key_secret: ossForm.access_key_secret, // 留空 = 保持不变
      bucket: ossForm.bucket,
      custom_domain: ossForm.custom_domain,
    })
    ossMasked.value = res.data.access_key_secret_masked
    ossConfigured.value = res.data.configured
    ossForm.access_key_secret = ''
    ElMessage.success('OSS 配置已保存')
  } finally {
    ossSaving.value = false
  }
}

async function testOss() {
  ossTesting.value = true
  try {
    const res = await api.post('/api/admin/oss/test')
    ElMessage.success(`连接成功：${res.data.bucket}（${res.data.region}）`)
  } finally {
    ossTesting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header><span>站点设置（博客主站展示）</span></template>
      <el-form label-width="100px" style="max-width: 560px">
        <el-form-item label="站点标题">
          <el-input v-model="form.site_title" maxlength="50" />
        </el-form-item>
        <el-form-item label="站点描述">
          <el-input v-model="form.site_description" type="textarea" :rows="2" maxlength="200" />
        </el-form-item>
        <el-form-item label="页脚文案">
          <el-input v-model="form.site_footer" placeholder="如：© 2026 xxx · 备案号" maxlength="200" />
        </el-form-item>
        <el-form-item label="关于我">
          <el-input
            v-model="form.about_content"
            type="textarea"
            :rows="10"
            maxlength="10000"
            placeholder="「关于」页内容，支持 Markdown"
          />
          <div style="width: 100%; margin-top: 4px">
            <el-text type="info" size="small">保存后展示在主站「关于」页，支持 Markdown 语法。</el-text>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>图片存储（阿里云 OSS）</span>
          <el-tag :type="ossConfigured ? 'success' : 'info'" size="small">
            {{ ossConfigured ? '已配置' : '未配置（编辑器无法上传图片）' }}
          </el-tag>
        </div>
      </template>
      <el-form label-width="120px" style="max-width: 620px">
        <el-form-item label="Endpoint">
          <el-input v-model="ossForm.endpoint" placeholder="如 oss-cn-hangzhou.aliyuncs.com" />
        </el-form-item>
        <el-form-item label="Bucket">
          <el-input v-model="ossForm.bucket" placeholder="Bucket 名称" />
        </el-form-item>
        <el-form-item label="AccessKeyId">
          <el-input v-model="ossForm.access_key_id" placeholder="阿里云 AccessKeyId" />
        </el-form-item>
        <el-form-item label="AccessKeySecret">
          <el-input
            v-model="ossForm.access_key_secret"
            type="password"
            show-password
            :placeholder="ossMasked ? `已保存（${ossMasked}），输入新值以更换` : '阿里云 AccessKeySecret'"
          />
        </el-form-item>
        <el-form-item label="自定义域名">
          <el-input v-model="ossForm.custom_domain" placeholder="可选，绑定了 CDN 的自定义域名；留空用 Bucket 默认域名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="ossSaving" @click="saveOss">保存配置</el-button>
          <el-button :loading="ossTesting" @click="testOss">测试连接</el-button>
          <div style="width: 100%; margin-top: 4px">
            <el-text type="info" size="small">
              AccessKey 建议仅授予该 Bucket 的读写权限；保存后编辑器上传的图片即存储到 OSS。
            </el-text>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
