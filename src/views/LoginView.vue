<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api, { TOKEN_KEY } from '../api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })

// 标题跟随站点设置
const siteTitle = ref('博客管理后台')

onMounted(async () => {
  try {
    const res = await api.get('/api/home')
    if (res.data.site?.site_title) siteTitle.value = res.data.site.site_title
  } catch {
    // 后端不可用时保持默认文案
  }
})

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await api.post('/api/admin/login', form)
    localStorage.setItem(TOKEN_KEY, res.data.access_token)
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 class="title">{{ siteTitle }} · 管理后台</h2>
      <el-form @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            @keyup.enter="submit"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="submit">
          登 录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #fbe4d9 0%, #f5f6f8 55%);
}

.login-card {
  width: 380px;
  padding: 12px 8px;
}

.title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 19px;
  letter-spacing: 1px;
}
</style>
