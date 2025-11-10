<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>社团管理后台</h1>
      <p>管理您的社团信息和活动</p>
    </div>

    <div class="admin-content">
      <div class="admin-sidebar">
        <nav class="admin-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
            class="nav-btn"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="admin-main">
        <!-- 社团信息管理 -->
        <div v-if="activeTab === 'club-info'" class="tab-content">
          <h2>社团信息管理</h2>
          <div class="club-form">
            <div class="form-group">
              <label>社团名称</label>
              <input v-model="clubForm.name" type="text" placeholder="请输入社团名称">
            </div>
            <div class="form-group">
              <label>社团分类</label>
              <select v-model="clubForm.category">
                <option value="academic">学术类</option>
                <option value="art">文艺类</option>
                <option value="sports">体育类</option>
                <option value="public_welfare">公益类</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label>社团简介</label>
              <textarea v-model="clubForm.intro" placeholder="请输入社团简介" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label>联系方式</label>
              <input v-model="clubForm.contact" type="text" placeholder="请输入联系方式">
            </div>
            <button @click="saveClubInfo" class="save-btn">保存信息</button>
          </div>
        </div>

        <!-- 活动管理 -->
        <div v-if="activeTab === 'activities'" class="tab-content">
          <div class="tab-header">
            <h2>活动管理</h2>
            <button @click="showCreateActivity = true" class="create-btn">创建新活动</button>
          </div>
          
          <div class="activities-list">
            <div v-for="activity in activities" :key="activity.id" class="activity-item">
              <div class="activity-info">
                <h3>{{ activity.title }}</h3>
                <p>时间: {{ formatDate(activity.activity_time) }}</p>
                <p>地点: {{ activity.location }}</p>
                <p>状态: {{ getStatusText(activity.status) }}</p>
              </div>
              <div class="activity-actions">
                <button @click="editActivity(activity)" class="edit-btn">编辑</button>
                <button @click="viewSignUps(activity)" class="view-btn">查看报名</button>
                <button @click="deleteActivity(activity.id)" class="delete-btn">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 报名管理 -->
        <div v-if="activeTab === 'signups'" class="tab-content">
          <h2>报名管理</h2>
          <div v-if="selectedActivity" class="signup-management">
            <h3>{{ selectedActivity.title }} - 报名名单</h3>
            <div class="signup-list">
              <div v-for="signup in signups" :key="signup.id" class="signup-item">
                <div class="user-info">
                  <strong>{{ signup.profiles?.username }}</strong>
                  <span>{{ signup.profiles?.college }} - {{ signup.profiles?.grade }}</span>
                </div>
                <div class="signup-info">
                  <span>报名时间: {{ formatDate(signup.created_at) }}</span>
                  <span :class="{ checked: signup.check_in }">
                    {{ signup.check_in ? '已签到' : '未签到' }}
                  </span>
                </div>
                <div class="signup-actions">
                  <button 
                    v-if="!signup.check_in" 
                    @click="checkIn(signup.id)" 
                    class="checkin-btn"
                  >
                    标记签到
                  </button>
                  <button @click="viewFormData(signup)" class="view-btn">查看详情</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <p>请先选择一个活动查看报名名单</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建活动模态框 -->
    <div v-if="showCreateActivity" class="modal-overlay">
      <div class="modal">
        <h3>创建新活动</h3>
        <div class="activity-form">
          <div class="form-group">
            <label>活动标题</label>
            <input v-model="activityForm.title" type="text" placeholder="请输入活动标题">
          </div>
          <div class="form-group">
            <label>活动描述</label>
            <textarea v-model="activityForm.description" placeholder="请输入活动描述" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>活动时间</label>
            <input v-model="activityForm.activity_time" type="datetime-local">
          </div>
          <div class="form-group">
            <label>活动地点</label>
            <input v-model="activityForm.location" type="text" placeholder="请输入活动地点">
          </div>
          <div class="form-group">
            <label>报名截止时间</label>
            <input v-model="activityForm.sign_up_deadline" type="datetime-local">
          </div>
          <div class="form-group">
            <label>最大报名人数</label>
            <input v-model="activityForm.max_people" type="number" placeholder="0表示无限制">
          </div>
          <div class="form-actions">
            <button @click="createActivity" class="save-btn">创建活动</button>
            <button @click="showCreateActivity = false" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { clubApi, activityApi, signUpApi } from '@/services/api'
import type { Club, Activity, ActivitySignUp } from '@/types'

const userStore = useUserStore()

const tabs = [
  { id: 'club-info', label: '社团信息' },
  { id: 'activities', label: '活动管理' },
  { id: 'signups', label: '报名管理' }
]

const activeTab = ref('club-info')
const showCreateActivity = ref(false)
const clubForm = ref({
  name: '',
  category: 'academic',
  intro: '',
  contact: ''
})

const activityForm = ref({
  title: '',
  description: '',
  activity_time: '',
  location: '',
  sign_up_deadline: '',
  max_people: 0
})

const activities = ref<Activity[]>([])
const signups = ref<(ActivitySignUp & { profiles: any })[]>([])
const selectedActivity = ref<Activity | null>(null)

onMounted(async () => {
  await loadClubInfo()
  await loadActivities()
})

const loadClubInfo = async () => {
  // 这里应该加载当前用户管理的社团信息
  // 暂时使用模拟数据
  clubForm.value = {
    name: '计算机协会',
    category: 'academic',
    intro: '致力于计算机技术学习和交流的社团',
    contact: 'QQ群: 123456789'
  }
}

const loadActivities = async () => {
  try {
    // 这里应该加载当前社团的活动
    // 暂时使用模拟数据
    activities.value = [
      {
        id: '1',
        club_id: '1',
        title: '编程竞赛培训',
        description: '为编程竞赛准备的培训活动',
        activity_time: '2024-12-15T14:00:00',
        location: '计算机学院101',
        sign_up_deadline: '2024-12-14T23:59:59',
        max_people: 50,
        status: 'pending'
      }
    ]
  } catch (error) {
    console.error('加载活动失败:', error)
  }
}

const saveClubInfo = async () => {
  try {
    // 这里应该调用API保存社团信息
    console.log('保存社团信息:', clubForm.value)
    alert('社团信息保存成功！')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  }
}

const createActivity = async () => {
  try {
    // 这里应该调用API创建活动
    console.log('创建活动:', activityForm.value)
    showCreateActivity.value = false
    alert('活动创建成功！')
    await loadActivities()
  } catch (error) {
    console.error('创建失败:', error)
    alert('创建失败，请重试')
  }
}

const editActivity = (activity: Activity) => {
  console.log('编辑活动:', activity)
  // 实现编辑逻辑
}

const viewSignUps = async (activity: Activity) => {
  selectedActivity.value = activity
  activeTab.value = 'signups'
  
  try {
    // 这里应该加载报名名单
    // 暂时使用模拟数据
    signups.value = [
      {
        id: '1',
        activity_id: activity.id,
        user_id: '1',
        form_data: {},
        check_in: false,
        created_at: '2024-12-01T10:00:00',
        profiles: {
          username: '张三',
          college: '计算机学院',
          grade: '2022级'
        }
      }
    ]
  } catch (error) {
    console.error('加载报名名单失败:', error)
  }
}

const deleteActivity = async (activityId: string) => {
  if (confirm('确定要删除这个活动吗？')) {
    try {
      // 这里应该调用API删除活动
      console.log('删除活动:', activityId)
      alert('活动删除成功！')
      await loadActivities()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }
}

const checkIn = async (signUpId: string) => {
  try {
    // 这里应该调用API标记签到
    console.log('标记签到:', signUpId)
    alert('签到成功！')
  } catch (error) {
    console.error('签到失败:', error)
    alert('签到失败，请重试')
  }
}

const viewFormData = (signup: ActivitySignUp) => {
  console.log('查看报名详情:', signup)
  // 实现查看详情逻辑
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待开始',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status as keyof typeof statusMap] || status
}
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-header {
  text-align: center;
  margin-bottom: 2rem;
}

.admin-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.admin-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.admin-sidebar {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-btn {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background: #e9ecef;
}

.nav-btn.active {
  background: #007bff;
  color: white;
}

.admin-main {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.create-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.save-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.activity-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn { background: #ffc107; color: black; }
.view-btn { background: #17a2b8; color: white; }
.delete-btn { background: #dc3545; color: white; }

.edit-btn, .view-btn, .delete-btn {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.signup-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.signup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.signup-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.checked {
  color: #28a745;
  font-weight: bold;
}

.checkin-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>