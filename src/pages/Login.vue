<template>
  <div class="login">
    <div class="login-container">
      <div class="login-card">
        <h2>登录</h2>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="login-footer">
          <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const result = await userStore.login(form.email, form.password)
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error || '登录失败'
    }
  } catch (err) {
    error.value = '登录失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 2rem 0;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 0 1rem;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.login-form {
  margin-bottom: 2rem;
}

.login-btn {
  width: 100%;
  padding: 0.875rem;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 10px;
  margin-top: 0.5rem;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #fecaca;
  font-size: 0.9rem;
}

.login-footer {
  text-align: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
}

.login-footer p {
  color: #6b7280;
  font-size: 0.95rem;
}

.login-footer a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-footer a:hover {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    border-radius: 12px;
    margin: 0 0.5rem;
  }
  
  .login-card h2 {
    font-size: 1.75rem;
  }
}
</style>