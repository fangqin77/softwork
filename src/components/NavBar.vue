<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        🏫 校园社团活动平台
      </router-link>
      
      <div class="nav-menu">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/clubs" class="nav-link">社团</router-link>
        
        <div v-if="userStore.user" class="user-section">
          <router-link to="/profile" class="nav-link">个人中心</router-link>
          <button @click="handleLogout" class="logout-btn">退出</button>
        </div>
        <div v-else class="auth-section">
          <router-link to="/login" class="nav-link">登录</router-link>
          <router-link to="/register" class="nav-link">注册</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogout = async () => {
  try {
    await userStore.logout()
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>

<style scoped>
.navbar {
  background: white;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  text-decoration: none;
  letter-spacing: -0.025em;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: #3b82f6;
  background-color: #f8fafc;
}

.nav-link.router-link-active {
  color: #3b82f6;
  background-color: #eff6ff;
}

.user-section, .auth-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }
  
  .nav-menu {
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>