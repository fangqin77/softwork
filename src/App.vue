<template>
  <div id="app">
    <NavBar />
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="footer">
      <div class="footer-content">
        <p>© 2024 校园社团活动管理平台 - 打造校园社团生态闭环</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import NavBar from '@/components/NavBar.vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.initialize()
})
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 140px);
}

.footer {
  background: #34495e;
  color: white;
  padding: 2rem 0;
  text-align: center;
}
</style>