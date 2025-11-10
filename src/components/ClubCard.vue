<template>
  <div class="club-card" @click="handleClick">
    <div class="club-image">
      <img :src="club.logo_url" :alt="club.name" />
      <div class="club-status" :class="{ active: club.status === 'active', inactive: club.status === 'inactive' }">
        {{ club.status === 'active' ? '活跃' : '停用' }}
      </div>
    </div>
    
    <div class="club-content">
      <h3 class="club-name">{{ club.name }}</h3>
      <p class="club-category">🏷️ {{ categoryText }}</p>
      <p class="club-intro">{{ club.intro }}</p>
      
      <div class="club-meta">
        <span class="club-contact">📞 {{ club.contact }}</span>
        <span class="club-activities">🎯 {{ club.activity_count || 0 }} 个活动</span>
      </div>
      
      <div class="club-actions">
        <button class="follow-btn" @click.stop="toggleFollow" :class="{ active: isFollowing }">
          {{ isFollowing ? '已关注' : '关注' }}
        </button>
        <button class="view-btn" @click.stop="$router.push(`/clubs/${club.id}`)">
          查看详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Club } from '@/types'

interface Props {
  club: Club
}

const props = defineProps<Props>()

const router = useRouter()
const userStore = useUserStore()
const isFollowing = ref(false)

const categoryText = computed(() => {
  const categories = {
    academic: '学术类',
    art: '文艺类',
    sports: '体育类',
    public_welfare: '公益类',
    other: '其他'
  }
  return categories[props.club.category as keyof typeof categories] || '其他'
})

const handleClick = () => {
  router.push(`/clubs/${props.club.id}`)
}

const toggleFollow = () => {
  if (!userStore.user) {
    router.push('/login')
    return
  }
  
  isFollowing.value = !isFollowing.value
  // 这里应该调用关注API
  console.log('关注状态:', isFollowing.value)
}
</script>

<style scoped>
.club-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.club-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.club-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.club-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.club-status.active {
  background: #10b981;
}

.club-status.inactive {
  background: #6b7280;
}

.club-content {
  padding: 1rem;
}

.club-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #1f2937;
  line-height: 1.4;
}

.club-category {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.club-intro {
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.club-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.club-actions {
  display: flex;
  gap: 0.5rem;
}

.follow-btn, .view-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.follow-btn {
  background: #f3f4f6;
  color: #374151;
}

.follow-btn:hover {
  background: #e5e7eb;
}

.follow-btn.active {
  background: #10b981;
  color: white;
}

.follow-btn.active:hover {
  background: #059669;
}

.view-btn {
  background: #3b82f6;
  color: white;
}

.view-btn:hover {
  background: #2563eb;
}
</style>