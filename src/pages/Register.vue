<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h2>注册账号</h2>
        <p>加入校园社团活动平台</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="请输入邮箱地址"
            :class="{ error: errors.email }"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="请输入密码（至少6位）"
            :class="{ error: errors.password }"
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            placeholder="请再次输入密码"
            :class="{ error: errors.confirmPassword }"
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <div class="form-group">
          <label for="username">昵称</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="请输入昵称"
            :class="{ error: errors.username }"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="college">学院</label>
          <input
            id="college"
            v-model="form.college"
            type="text"
            required
            placeholder="请输入学院"
            :class="{ error: errors.college }"
          />
          <span v-if="errors.college" class="error-message">{{ errors.college }}</span>
        </div>

        <div class="form-group">
          <label for="grade">年级</label>
          <input
            id="grade"
            v-model="form.grade"
            type="text"
            required
            placeholder="请输入年级（如：2022级）"
            :class="{ error: errors.grade }"
          />
          <span v-if="errors.grade" class="error-message">{{ errors.grade }}</span>
        </div>

        <div class="form-group">
          <label for="role">身份</label>
          <select
            id="role"
            v-model="form.role"
            required
            :class="{ error: errors.role }"
          >
            <option value="">请选择身份</option>
            <option value="student">学生</option>
            <option value="club_admin">社团管理员</option>
          </select>
          <span v-if="errors.role" class="error-message">{{ errors.role }}</span>
        </div>

        <button type="submit" class="register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="login-link">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
  college: '',
  grade: '',
  role: ''
})

const errors = ref({
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
  college: '',
  grade: '',
  role: ''
})

const validateForm = () => {
  // 重置错误信息
  Object.keys(errors.value).forEach(key => {
    errors.value[key as keyof typeof errors.value] = ''
  })

  let isValid = true

  // 邮箱验证
  if (!form.value.email) {
    errors.value.email = '请输入邮箱地址'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 密码验证
  if (!form.value.password) {
    errors.value.password = '请输入密码'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码长度至少6位'
    isValid = false
  }

  // 确认密码验证
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  // 昵称验证
  if (!form.value.username) {
    errors.value.username = '请输入昵称'
    isValid = false
  }

  // 学院验证
  if (!form.value.college) {
    errors.value.college = '请输入学院'
    isValid = false
  }

  // 年级验证
  if (!form.value.grade) {
    errors.value.grade = '请输入年级'
    isValid = false
  }

  // 身份验证
  if (!form.value.role) {
    errors.value.role = '请选择身份'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) return

  try {
    loading.value = true

    // 准备用户数据
    const userData = {
      username: form.value.username,
      college: form.value.college,
      grade: form.value.grade,
      role: form.value.role,
      avatar_url: 'https://picsum.photos/200'
    }

    // 使用user store注册
    const result = await userStore.register(form.value.email, form.value.password, userData)
    
    if (result.success) {
      alert('注册成功！请检查邮箱验证邮件。')
      router.push('/')
    } else {
      if (result.error?.includes('User already registered')) {
        alert('该邮箱已被注册')
      } else {
        alert('注册失败，请重试')
      }
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    alert('注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 2rem 0;
}

.register-container {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  width: 100%;
  max-width: 440px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.register-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error,
.form-group select.error {
  border-color: #ef4444;
}

.error-message {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.register-btn {
  padding: 0.875rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
}

.register-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.register-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.register-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
}

.login-link p {
  color: #6b7280;
  font-size: 0.95rem;
}

.login-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-container {
    padding: 2rem 1.5rem;
    border-radius: 12px;
    margin: 0 0.5rem;
  }
  
  .register-header h2 {
    font-size: 1.6rem;
  }
  
  .register-form {
    gap: 1rem;
  }
}
</style>