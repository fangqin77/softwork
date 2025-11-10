<template>
  <div class="profile-page">
    <div v-if="!userStore.user" class="not-logged-in">
      <p>请先登录</p>
      <button @click="$router.push('/login')" class="btn btn-primary">去登录</button>
    </div>

    <div v-else class="profile-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-header">
          <img :src="userStore.user.avatar_url" :alt="userStore.user.username" class="avatar" />
          <div class="user-info">
            <h2>{{ userStore.user.username }}</h2>
            <p class="role">{{ userStore.user.role === 'student' ? '学生' : '社团管理员' }}</p>
            <p class="college">{{ userStore.user.college }} - {{ userStore.user.grade }}</p>
          </div>
          <button @click="showEditForm = true" class="btn btn-outline">编辑资料</button>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'signups' }]" 
          @click="activeTab = 'signups'"
        >
          我的报名
        </button>
        <button 
          :class="['tab', { active: activeTab === 'collections' }]" 
          @click="activeTab = 'collections'"
        >
          我的收藏
        </button>
        <button 
          v-if="userStore.user.role === 'club_admin'"
          :class="['tab', { active: activeTab === 'admin' }]" 
          @click="activeTab = 'admin'"
        >
          社团管理
        </button>
      </div>

      <!-- 我的报名 -->
      <div v-if="activeTab === 'signups'" class="tab-content">
        <div v-if="signUpsLoading" class="loading">加载中...</div>
        
        <div v-else-if="userSignUps.length === 0" class="empty-state">
          <p>暂无报名记录</p>
          <button @click="$router.push('/')" class="btn btn-primary">去发现活动</button>
        </div>
        
        <div v-else class="sign-ups-list">
          <div 
            v-for="signUp in userSignUps" 
            :key="signUp.id" 
            class="sign-up-item"
            @click="$router.push(`/activities/${signUp.activity.id}`)"
          >
            <img :src="signUp.activity.poster_url" :alt="signUp.activity.title" class="activity-poster" />
            <div class="sign-up-info">
              <h4>{{ signUp.activity.title }}</h4>
              <p class="activity-time">{{ formatDate(signUp.activity.activity_time) }}</p>
              <p class="activity-location">{{ signUp.activity.location }}</p>
              <p class="sign-up-time">报名时间: {{ formatDate(signUp.created_at) }}</p>
              <p class="status" :class="getStatusClass(signUp.activity.status)">
                {{ getStatusLabel(signUp.activity.status) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的收藏 -->
      <div v-if="activeTab === 'collections'" class="tab-content">
        <div v-if="collectionsLoading" class="loading">加载中...</div>
        
        <div v-else-if="userCollections.length === 0" class="empty-state">
          <p>暂无收藏</p>
        </div>
        
        <div v-else class="collections-grid">
          <div 
            v-for="collection in userCollections" 
            :key="collection.id" 
            class="collection-item"
            @click="handleCollectionClick(collection)"
          >
            <div v-if="collection.target_type === 'club'" class="collection-club">
              <img :src="collection.club.logo_url" :alt="collection.club.name" class="collection-image" />
              <div class="collection-info">
                <h4>{{ collection.club.name }}</h4>
                <p>{{ collection.club.intro }}</p>
                <span class="collection-type">社团</span>
              </div>
            </div>
            
            <div v-else class="collection-activity">
              <img :src="collection.activity.poster_url" :alt="collection.activity.title" class="collection-image" />
              <div class="collection-info">
                <h4>{{ collection.activity.title }}</h4>
                <p>{{ formatDate(collection.activity.activity_time) }}</p>
                <span class="collection-type">活动</span>
              </div>
            </div>
            
            <button @click.stop="removeCollection(collection)" class="remove-btn">取消收藏</button>
          </div>
        </div>
      </div>

      <!-- 社团管理 -->
      <div v-if="activeTab === 'admin'" class="tab-content">
        <div v-if="adminClubsLoading" class="loading">加载中...</div>
        
        <div v-else-if="adminClubs.length === 0" class="empty-state">
          <p>您还没有管理的社团</p>
          <button @click="$router.push('/clubs/create')" class="btn btn-primary">创建社团</button>
        </div>
        
        <div v-else class="admin-clubs">
          <div 
            v-for="club in adminClubs" 
            :key="club.id" 
            class="admin-club-item"
            @click="$router.push(`/clubs/${club.id}`)"
          >
            <img :src="club.logo_url" :alt="club.name" class="club-logo" />
            <div class="club-info">
              <h4>{{ club.name }}</h4>
              <p>{{ club.intro }}</p>
            </div>
            <div class="club-actions">
              <button @click.stop="$router.push(`/activities/create?club=${club.id}`)" class="btn btn-primary">
                发布活动
              </button>
              <button @click.stop="$router.push(`/clubs/${club.id}/edit`)" class="btn btn-secondary">
                编辑社团
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑资料模态框 -->
      <div v-if="showEditForm" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>编辑资料</h3>
            <button @click="showEditForm = false" class="close-btn">×</button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="updateProfile">
              <div class="form-field">
                <label for="username">昵称</label>
                <input
                  id="username"
                  v-model="editForm.username"
                  type="text"
                  required
                  placeholder="请输入昵称"
                />
              </div>
              
              <div class="form-field">
                <label for="college">学院</label>
                <input
                  id="college"
                  v-model="editForm.college"
                  type="text"
                  required
                  placeholder="请输入学院"
                />
              </div>
              
              <div class="form-field">
                <label for="grade">年级</label>
                <input
                  id="grade"
                  v-model="editForm.grade"
                  type="text"
                  required
                  placeholder="请输入年级"
                />
              </div>
              
              <div class="form-actions">
                <button type="button" @click="showEditForm = false" class="btn btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="updating">
                  {{ updating ? '更新中...' : '保存' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import type { ActivitySignUp, Collection, Club } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<'signups' | 'collections' | 'admin'>('signups')
const showEditForm = ref(false)
const updating = ref(false)
const signUpsLoading = ref(false)
const collectionsLoading = ref(false)
const adminClubsLoading = ref(false)

const userSignUps = ref<Array<ActivitySignUp & { activity: any }>>([])
const userCollections = ref<Array<Collection & { club?: Club; activity?: any }>>([])
const adminClubs = ref<Club[]>([])

const editForm = ref({
  username: userStore.user?.username || '',
  college: userStore.user?.college || '',
  grade: userStore.user?.grade || ''
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const fetchUserSignUps = async () => {
  if (!userStore.user) return
  
  try {
    signUpsLoading.value = true
    const { data, error } = await supabase
      .from('activity_sign_ups')
      .select(`
        *,
        activity:activities(*)
      `)
      .eq('user_id', userStore.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    userSignUps.value = data || []
  } catch (error) {
    console.error('获取报名记录失败:', error)
  } finally {
    signUpsLoading.value = false
  }
}

const fetchUserCollections = async () => {
  if (!userStore.user) return
  
  try {
    collectionsLoading.value = true
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userStore.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // 获取收藏的详细信息
    const collectionsWithDetails = await Promise.all(
      (data || []).map(async (collection) => {
        if (collection.target_type === 'club') {
          const { data: clubData } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', collection.target_id)
            .single()
          return { ...collection, club: clubData }
        } else {
          const { data: activityData } = await supabase
            .from('activities')
            .select('*')
            .eq('id', collection.target_id)
            .single()
          return { ...collection, activity: activityData }
        }
      })
    )
    
    userCollections.value = collectionsWithDetails.filter(item => 
      (item.target_type === 'club' && item.club) || 
      (item.target_type === 'activity' && item.activity)
    )
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  } finally {
    collectionsLoading.value = false
  }
}

const fetchAdminClubs = async () => {
  if (!userStore.user) return
  
  try {
    adminClubsLoading.value = true
    // 这里需要根据用户ID获取管理的社团
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    adminClubs.value = data || []
  } catch (error) {
    console.error('获取管理社团失败:', error)
  } finally {
    adminClubsLoading.value = false
  }
}

const handleCollectionClick = (collection: any) => {
  if (collection.target_type === 'club') {
    router.push(`/clubs/${collection.target_id}`)
  } else {
    router.push(`/activities/${collection.target_id}`)
  }
}

const removeCollection = async (collection: any) => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collection.id)

    if (error) throw error
    
    userCollections.value = userCollections.value.filter(c => c.id !== collection.id)
  } catch (error) {
    console.error('取消收藏失败:', error)
  }
}

const updateProfile = async () => {
  if (!userStore.user) return
  
  try {
    updating.value = true
    const { error } = await supabase
      .from('profiles')
      .update({
        username: editForm.value.username,
        college: editForm.value.college,
        grade: editForm.value.grade,
        updated_at: new Date().toISOString()
      })
      .eq('id', userStore.user.id)

    if (error) throw error
    
    // 更新本地状态
    userStore.setUser({
      ...userStore.user,
      username: editForm.value.username,
      college: editForm.value.college,
      grade: editForm.value.grade
    })
    
    showEditForm.value = false
    alert('资料更新成功')
  } catch (error) {
    console.error('更新资料失败:', error)
    alert('更新失败，请重试')
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  if (userStore.user) {
    await fetchUserSignUps()
    await fetchUserCollections()
    if (userStore.user.role === 'club_admin') {
      await fetchAdminClubs()
    }
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.not-logged-in {
  text-align: center;
  padding: 40px;
  color: #666;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-info h2 {
  margin-bottom: 5px;
  color: #333;
}

.role, .college {
  color: #666;
  margin-bottom: 5px;
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

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn:hover {
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

.tab-content {
  min-height: 400px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.sign-ups-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sign-up-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.sign-up-item:hover {
  transform: translateY(-1px);
}

.activity-poster {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.sign-up-info {
  flex: 1;
}

.sign-up-info h4 {
  margin-bottom: 5px;
  color: #333;
}

.activity-time, .activity-location, .sign-up-time {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.status.pending { color: #ffc107; }
.status.ongoing { color: #17a2b8; }
.status.completed { color: #28a745; }
.status.cancelled { color: #dc3545; }

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collection-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.collection-item:hover {
  transform: translateY(-1px);
}

.collection-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 15px;
}

.collection-club, .collection-activity {
  display: flex;
  align-items: center;
}

.collection-info {
  flex: 1;
}

.collection-info h4 {
  margin-bottom: 5px;
  color: #333;
}

.collection-info p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.collection-type {
  background: #f0f0f0;
  color: #666;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.admin-clubs {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.admin-club-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.admin-club-item:hover {
  transform: translateY(-1px);
}

.club-logo {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 50%;
}

.club-info {
  flex: 1;
}

.club-info h4 {
  margin-bottom: 5px;
  color: #333;
}

.club-info p {
  color: #666;
  font-size: 0.9rem;
}

.club-actions {
  display: flex;
  gap: 10px;
  align-items: center;
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
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1;
    min-width: 100px;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
  
  .admin-club-item {
    flex-direction: column;
  }
  
  .club-actions {
    justify-content: center;
  }
}
</style>