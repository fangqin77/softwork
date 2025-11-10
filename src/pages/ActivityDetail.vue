<template>
  <div class="activity-detail">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="activity" class="activity-content">
      <!-- 活动头部信息 -->
      <div class="activity-header">
        <img :src="activity.poster_url" :alt="activity.title" class="activity-poster" />
        <div class="activity-basic-info">
          <h1>{{ activity.title }}</h1>
          <div class="activity-meta">
            <div class="meta-item">
              <span class="label">活动时间:</span>
              <span class="value">{{ formatDate(activity.activity_time) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">活动地点:</span>
              <span class="value">{{ activity.location }}</span>
            </div>
            <div class="meta-item">
              <span class="label">报名截止:</span>
              <span class="value">{{ formatDate(activity.sign_up_deadline) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">人数限制:</span>
              <span class="value">{{ activity.max_people || '无限制' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">活动状态:</span>
              <span class="value status" :class="getStatusClass(activity.status)">
                {{ getStatusLabel(activity.status) }}
              </span>
            </div>
          </div>
          
          <div class="action-buttons">
            <button 
              v-if="userStore.user" 
              @click="toggleCollection" 
              :class="['btn', 'btn-secondary', { collected: isCollected }]"
            >
              {{ isCollected ? '已收藏' : '收藏活动' }}
            </button>
            <button 
              v-if="canSignUp" 
              @click="showSignUpForm = true" 
              class="btn btn-primary"
            >
              立即报名
            </button>
            <button 
              v-else-if="hasSignedUp" 
              class="btn btn-success"
              disabled
            >
              已报名
            </button>
            <button 
              v-else 
              class="btn btn-disabled"
              disabled
            >
              无法报名
            </button>
          </div>
        </div>
      </div>

      <!-- 活动详情 -->
      <div class="activity-details">
        <div class="detail-section">
          <h3>活动描述</h3>
          <p class="description">{{ activity.description }}</p>
        </div>

        <!-- 所属社团信息 -->
        <div class="detail-section" v-if="club">
          <h3>所属社团</h3>
          <div class="club-info" @click="$router.push(`/clubs/${club.id}`)">
            <img :src="club.logo_url" :alt="club.name" class="club-logo" />
            <div class="club-text">
              <h4>{{ club.name }}</h4>
              <p>{{ club.intro }}</p>
            </div>
          </div>
        </div>

        <!-- 报名统计 -->
        <div class="detail-section">
          <h3>报名情况</h3>
          <div class="sign-up-stats">
            <div class="stat-item">
              <span class="stat-label">已报名人数:</span>
              <span class="stat-value">{{ signUpCount }}</span>
            </div>
            <div class="stat-item" v-if="activity.max_people">
              <span class="stat-label">剩余名额:</span>
              <span class="stat-value">{{ activity.max_people - signUpCount }}</span>
            </div>
          </div>
        </div>

        <!-- 管理员操作区域 -->
        <div v-if="isActivityAdmin" class="detail-section admin-section">
          <h3>活动管理</h3>
          <div class="admin-actions">
            <button @click="$router.push(`/activities/${activity.id}/edit`)" class="btn btn-primary">
              编辑活动
            </button>
            <button @click="exportSignUps" class="btn btn-secondary">
              导出报名名单
            </button>
            <button 
              v-if="activity.status === 'pending'" 
              @click="updateActivityStatus('ongoing')" 
              class="btn btn-warning"
            >
              开始活动
            </button>
            <button 
              v-if="activity.status === 'ongoing'" 
              @click="updateActivityStatus('completed')" 
              class="btn btn-success"
            >
              结束活动
            </button>
          </div>
        </div>
      </div>

      <!-- 报名表单模态框 -->
      <div v-if="showSignUpForm" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>报名 {{ activity.title }}</h3>
            <button @click="showSignUpForm = false" class="close-btn">×</button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="submitSignUp">
              <div 
                v-for="field in customFormFields" 
                :key="field.name" 
                class="form-field"
              >
                <label :for="field.name">
                  {{ field.label || field.name }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  :id="field.name"
                  v-model="formData[field.name]"
                  :type="getFieldType(field.type)"
                  :required="field.required"
                  :placeholder="field.placeholder || `请输入${field.label || field.name}`"
                />
              </div>
              
              <div class="form-actions">
                <button type="button" @click="showSignUpForm = false" class="btn btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="signingUp">
                  {{ signingUp ? '报名中...' : '确认报名' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <h2>活动不存在</h2>
      <button @click="$router.push('/')" class="btn btn-primary">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import type { Activity, Club, Collection, ActivitySignUp } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activity = ref<Activity | null>(null)
const club = ref<Club | null>(null)
const collections = ref<Collection[]>([])
const signUps = ref<ActivitySignUp[]>([])
const loading = ref(true)
const showSignUpForm = ref(false)
const signingUp = ref(false)
const formData = ref<Record<string, string>>({})

const activityId = computed(() => route.params.id as string)

const customFormFields = computed(() => {
  return activity.value?.custom_form_fields || []
})

const isActivityAdmin = computed(() => {
  if (!userStore.user || !club.value) return false
  // 这里需要检查用户是否是活动所属社团的管理员
  return userStore.user.role === 'club_admin'
})

const isCollected = computed(() => {
  return collections.value.some(c => c.target_type === 'activity' && c.target_id === activityId.value)
})

const hasSignedUp = computed(() => {
  if (!userStore.user) return false
  return signUps.value.some(signUp => signUp.user_id === userStore.user?.id)
})

const signUpCount = computed(() => signUps.value.length)

const canSignUp = computed(() => {
  if (!userStore.user || !activity.value) return false
  if (hasSignedUp.value) return false
  if (activity.value.status === 'cancelled') return false
  if (new Date(activity.value.sign_up_deadline) < new Date()) return false
  if (activity.value.max_people && signUpCount.value >= activity.value.max_people) return false
  return true
})

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待开始',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status as keyof typeof labels] || status
}

const getStatusClass = (status: string) => {
  const classes = {
    pending: 'pending',
    ongoing: 'ongoing',
    completed: 'completed',
    cancelled: 'cancelled'
  }
  return classes[status as keyof typeof classes] || ''
}

const getFieldType = (type?: string) => {
  return type || 'text'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const fetchActivity = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId.value)
      .single()

    if (error) throw error
    activity.value = data
    
    if (data) {
      await fetchClub(data.club_id)
    }
  } catch (error) {
    console.error('获取活动详情失败:', error)
    activity.value = null
  } finally {
    loading.value = false
  }
}

const fetchClub = async (clubId: string) => {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single()

    if (error) throw error
    club.value = data
  } catch (error) {
    console.error('获取社团信息失败:', error)
  }
}

const fetchSignUps = async () => {
  try {
    const { data, error } = await supabase
      .from('activity_sign_ups')
      .select('*')
      .eq('activity_id', activityId.value)

    if (error) throw error
    signUps.value = data || []
  } catch (error) {
    console.error('获取报名列表失败:', error)
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
        .eq('target_type', 'activity')
        .eq('target_id', activityId.value)

      if (error) throw error
      collections.value = collections.value.filter(c => 
        !(c.target_type === 'activity' && c.target_id === activityId.value)
      )
    } else {
      // 添加收藏
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userStore.user.id,
          target_type: 'activity',
          target_id: activityId.value
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

const submitSignUp = async () => {
  if (!userStore.user || !activity.value) return
  
  try {
    signingUp.value = true
    const { error } = await supabase
      .from('activity_sign_ups')
      .insert({
        activity_id: activity.value.id,
        user_id: userStore.user.id,
        form_data: formData.value
      })

    if (error) throw error
    
    showSignUpForm.value = false
    formData.value = {}
    await fetchSignUps()
    alert('报名成功！')
  } catch (error) {
    console.error('报名失败:', error)
    alert('报名失败，请重试')
  } finally {
    signingUp.value = false
  }
}

const exportSignUps = async () => {
  // 导出报名名单的逻辑
  console.log('导出报名名单')
}

const updateActivityStatus = async (status: string) => {
  if (!activity.value) return
  
  try {
    const { error } = await supabase
      .from('activities')
      .update({ status })
      .eq('id', activity.value.id)

    if (error) throw error
    
    activity.value.status = status
    alert('活动状态更新成功')
  } catch (error) {
    console.error('更新活动状态失败:', error)
    alert('更新失败，请重试')
  }
}

onMounted(async () => {
  await fetchActivity()
  if (activity.value) {
    await fetchSignUps()
    await fetchCollections()
  }
})

watch(() => route.params.id, async () => {
  await fetchActivity()
  if (activity.value) {
    await fetchSignUps()
    await fetchCollections()
  }
})
</script>

<style scoped>
.activity-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .not-found {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

.activity-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.activity-poster {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.activity-basic-info h1 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
}

.activity-meta {
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  margin-bottom: 10px;
}

.label {
  width: 80px;
  color: #666;
  font-weight: 500;
}

.value {
  flex: 1;
  color: #333;
}

.status.pending { color: #ffc107; }
.status.ongoing { color: #17a2b8; }
.status.completed { color: #28a745; }
.status.cancelled { color: #dc3545; }

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
}

.activity-details {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.description {
  line-height: 1.6;
  color: #666;
}

.club-info {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.club-info:hover {
  background: #e9ecef;
}

.club-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.club-text h4 {
  margin-bottom: 5px;
  color: #333;
}

.club-text p {
  color: #666;
  font-size: 0.9rem;
}

.sign-up-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.admin-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.admin-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-field {
  margin-bottom: 15px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.required {
  color: #dc3545;
}

.form-field input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .activity-header {
    grid-template-columns: 1fr;
  }
  
  .activity-poster {
    height: 150px;
  }
  
  .sign-up-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .admin-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>