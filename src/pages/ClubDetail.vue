<template>
  <div class="club-detail">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="club" class="club-content">
      <!-- 社团头部信息 -->
      <div class="club-header">
        <div class="club-basic-info">
          <img :src="club.logo_url" :alt="club.name" class="club-logo" />
          <div class="club-text-info">
            <h1>{{ club.name }}</h1>
            <p class="category">{{ getCategoryLabel(club.category) }}</p>
            <p class="contact">联系方式: {{ club.contact }}</p>
            <p class="intro">{{ club.intro }}</p>
            <button 
              v-if="userStore.user" 
              @click="toggleCollection" 
              :class="['collect-btn', { collected: isCollected }]"
            >
              {{ isCollected ? '已收藏' : '收藏社团' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 活动标签页 -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'current' }]" 
          @click="activeTab = 'current'"
        >
          当前活动
        </button>
        <button 
          :class="['tab', { active: activeTab === 'past' }]" 
          @click="activeTab = 'past'"
        >
          过往活动
        </button>
      </div>

      <!-- 活动列表 -->
      <div class="activities-section">
        <div v-if="activitiesLoading" class="loading">加载活动中...</div>
        
        <div v-else-if="filteredActivities.length === 0" class="no-activities">
          <p>暂无{{ activeTab === 'current' ? '当前' : '过往' }}活动</p>
        </div>
        
        <div v-else class="activities-grid">
          <div 
            v-for="activity in filteredActivities" 
            :key="activity.id" 
            class="activity-card"
            @click="$router.push(`/activities/${activity.id}`)"
          >
            <img :src="activity.poster_url" :alt="activity.title" class="activity-poster" />
            <div class="activity-info">
              <h3>{{ activity.title }}</h3>
              <p class="activity-time">
                {{ formatDate(activity.activity_time) }}
              </p>
              <p class="activity-location">{{ activity.location }}</p>
              <p class="activity-status">{{ getStatusLabel(activity.status) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理员操作区域 -->
      <div v-if="isClubAdmin" class="admin-section">
        <h3>社团管理</h3>
        <div class="admin-actions">
          <button @click="$router.push(`/clubs/${club.id}/edit`)" class="btn btn-primary">
            编辑社团信息
          </button>
          <button @click="$router.push('/activities/create')" class="btn btn-secondary">
            发布新活动
          </button>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <h2>社团不存在</h2>
      <button @click="$router.push('/clubs')" class="btn btn-primary">返回社团列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import type { Club, Activity, Collection } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const club = ref<Club | null>(null)
const activities = ref<Activity[]>([])
const collections = ref<Collection[]>([])
const loading = ref(true)
const activitiesLoading = ref(false)
const activeTab = ref<'current' | 'past'>('current')

const clubId = computed(() => route.params.id as string)

const isClubAdmin = computed(() => {
  if (!userStore.user || !club.value) return false
  // 这里需要检查用户是否是社团管理员
  return userStore.user.role === 'club_admin'
})

const isCollected = computed(() => {
  return collections.value.some(c => c.target_type === 'club' && c.target_id === clubId.value)
})

const filteredActivities = computed(() => {
  const now = new Date()
  return activities.value.filter(activity => {
    if (activeTab.value === 'current') {
      return activity.status === 'pending' || activity.status === 'ongoing'
    } else {
      return activity.status === 'completed' || activity.status === 'cancelled'
    }
  })
})

const getCategoryLabel = (category: string) => {
  const labels = {
    academic: '学术类',
    art: '文艺类',
    sports: '体育类',
    public_welfare: '公益类',
    other: '其他'
  }
  return labels[category as keyof typeof labels] || category
}

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待开始',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status as keyof typeof labels] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const fetchClub = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId.value)
      .single()

    if (error) throw error
    club.value = data
  } catch (error) {
    console.error('获取社团详情失败:', error)
    club.value = null
  } finally {
    loading.value = false
  }
}

const fetchActivities = async () => {
  if (!club.value) return
  
  try {
    activitiesLoading.value = true
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('club_id', club.value.id)
      .order('activity_time', { ascending: false })

    if (error) throw error
    activities.value = data || []
  } catch (error) {
    console.error('获取社团活动失败:', error)
  } finally {
    activitiesLoading.value = false
  }
}

const fetchCollections = async () => {
  if (!userStore.user) return
  
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userStore.user.id)

    if (error) throw error
    collections.value = data || []
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  }
}

const toggleCollection = async () => {
  if (!userStore.user) {
    router.push('/login')
    return
  }

  try {
    if (isCollected.value) {
      // 取消收藏
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('user_id', userStore.user.id)
        .eq('target_type', 'club')
        .eq('target_id', clubId.value)

      if (error) throw error
      collections.value = collections.value.filter(c => 
        !(c.target_type === 'club' && c.target_id === clubId.value)
      )
    } else {
      // 添加收藏
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userStore.user.id,
          target_type: 'club',
          target_id: clubId.value
        })
        .select()
        .single()

      if (error) throw error
      collections.value.push(data)
    }
  } catch (error) {
    console.error('操作收藏失败:', error)
  }
}

onMounted(async () => {
  await fetchClub()
  if (club.value) {
    await fetchActivities()
    await fetchCollections()
  }
})

watch(() => route.params.id, async () => {
  await fetchClub()
  if (club.value) {
    await fetchActivities()
    await fetchCollections()
  }
})
</script>

<style scoped>
.club-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .not-found {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

.club-header {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.club-basic-info {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.club-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.club-text-info {
  flex: 1;
}

.club-text-info h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #333;
}

.category {
  color: #666;
  font-size: 1rem;
  margin-bottom: 10px;
}

.contact {
  color: #888;
  margin-bottom: 15px;
}

.intro {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.collect-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.collect-btn.collected {
  background: #007bff;
  color: white;
}

.collect-btn:hover {
  opacity: 0.8;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.activity-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.activity-poster {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.activity-info {
  padding: 15px;
}

.activity-info h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #333;
}

.activity-time, .activity-location, .activity-status {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.admin-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
}

.admin-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.admin-actions {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.8;
}

.no-activities {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .club-basic-info {
    flex-direction: column;
    text-align: center;
  }
  
  .club-logo {
    align-self: center;
  }
  
  .admin-actions {
    flex-direction: column;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
  }
}
</style>