<template>
  <div class="activity-card" @click="handleClick">
    <div class="activity-image">
      <img :src="activity.poster_url" :alt="activity.title" />
      <div class="activity-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>
    
    <div class="activity-content">
      <h3 class="activity-title">{{ activity.title }}</h3>
      <p class="activity-club">🏢 {{ activity.club_name }}</p>
      <p class="activity-time">📅 {{ formatDate(activity.activity_time) }}</p>
      <p class="activity-location">📍 {{ activity.location }}</p>
      
      <div class="activity-meta">
        <span class="deadline">⏰ 截止: {{ formatDate(activity.sign_up_deadline) }}</span>
        <span v-if="activity.max_people" class="capacity">
          👥 {{ getSignUpCount(activity.id) }}/{{ activity.max_people }}人
        </span>
      </div>
      
      <div class="activity-actions">
        <button 
          v-if="canSignUp" 
          @click.stop="handleSignUp" 
          class="signup-btn"
          :disabled="isSigningUp"
        >
          {{ isSigningUp ? '报名中...' : '立即报名' }}
        </button>
        <button v-else class="view-btn" @click.stop="$router.push(`/activities/${activity.id}`)">
          查看详情
        </button>
        
        <button 
          class="favorite-btn" 
          @click.stop="toggleFavorite"
          :class="{ active: isFavorited }"
        >
          {{ isFavorited ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Activity } from '@/types'

interface Props {
  activity: Activity
  showSignUp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSignUp: false
})

const router = useRouter()
const userStore = useUserStore()
const isSigningUp = ref(false)
const isFavorited = ref(false)

const statusClass = computed(() => {
  const now = new Date()
  const activityTime = new Date(props.activity.activity_time)
  const deadline = new Date(props.activity.sign_up_deadline)
  
  if (props.activity.status === 'cancelled') return 'cancelled'
  if (now > activityTime) return 'completed'
  if (now > deadline) return 'closed'
  if (props.activity.status === 'ongoing') return 'ongoing'
  return 'upcoming'
})

const statusText = computed(() => {
  switch (statusClass.value) {
    case 'cancelled': return '已取消'
    case 'completed': return '已结束'
    case 'closed': return '报名截止'
    case 'ongoing': return '进行中'
    default: return '可报名'
  }
})

const canSignUp = computed(() => {
  if (!userStore.user) return false
  if (statusClass.value !== 'upcoming') return false
  return props.showSignUp
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSignUpCount = (activityId: string) => {
  // 这里应该从store或API获取实际的报名人数
  return Math.floor(Math.random() * 50) // 模拟数据
}

const handleClick = () => {
  router.push(`/activities/${props.activity.id}`)
}

const handleSignUp = async () => {
  if (!userStore.user) {
    router.push('/login')
    return
  }
  
  isSigningUp.value = true
  try {
    // 这里应该调用报名API
    console.log('报名活动:', props.activity.id)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('报名成功！')
  } catch (error) {
    console.error('报名失败:', error)
    alert('报名失败，请重试')
  } finally {
    isSigningUp.value = false
  }
}

const toggleFavorite = () => {
  if (!userStore.user) {
    router.push('/login')
    return
  }
  
  isFavorited.value = !isFavorited.value
  // 这里应该调用收藏API
  console.log('收藏状态:', isFavorited.value)
}
</script>

<style scoped>
.activity-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.activity-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.activity-status.upcoming { background: #10b981; }
.activity-status.ongoing { background: #3b82f6; }
.activity-status.closed { background: #6b7280; }
.activity-status.completed { background: #9ca3af; }
.activity-status.cancelled { background: #ef4444; }

.activity-content {
  padding: 1rem;
}

.activity-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #1f2937;
  line-height: 1.4;
}

.activity-club, .activity-time, .activity-location {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  margin: 0.75rem 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.activity-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}

.signup-btn, .view-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signup-btn {
  background: #10b981;
  color: white;
}

.signup-btn:hover:not(:disabled) {
  background: #059669;
}

.signup-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.view-btn {
  background: #3b82f6;
  color: white;
}

.view-btn:hover {
  background: #2563eb;
}

.favorite-btn {
  padding: 0.75rem;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.favorite-btn.active {
  background: #fef2f2;
  color: #ef4444;
}
</style>