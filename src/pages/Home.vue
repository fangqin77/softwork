<template>
  <div class="home">
    <!-- 英雄区域 -->
    <section class="hero">
      <div class="container">
        <h1>校园社团活动管理平台</h1>
        <p>一站式解决社团活动宣传、报名统计、成员管理的校园平台</p>
        <div class="hero-actions">
          <router-link to="/activities" class="btn btn-primary">浏览活动</router-link>
          <router-link to="/clubs" class="btn btn-secondary">查看社团</router-link>
        </div>
      </div>
    </section>

    <!-- 功能特色 -->
    <section class="features">
      <div class="container">
        <h2>平台特色</h2>
        <div class="grid grid-3">
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>精准活动推荐</h3>
            <p>根据你的兴趣和学院，智能推荐适合的社团活动</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>便捷在线报名</h3>
            <p>一键报名，实时查看报名状态，避免错过精彩活动</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>社团管理工具</h3>
            <p>为社团管理员提供完整的活动管理和成员统计功能</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门活动 -->
    <section class="hot-activities">
      <div class="container">
        <div class="section-header">
          <h2>热门活动</h2>
          <router-link to="/activities" class="view-all">查看全部 →</router-link>
        </div>
        <div class="activities-grid">
          <div v-for="activity in hotActivities" :key="activity.id" class="activity-card">
            <img :src="activity.poster_url" :alt="activity.title" class="activity-poster" />
            <div class="activity-info">
              <h3>{{ activity.title }}</h3>
              <p class="activity-time">{{ formatDate(activity.activity_time) }}</p>
              <p class="activity-location">{{ activity.location }}</p>
              <div class="activity-status">{{ getStatusLabel(activity.status) }}</div>
              <div class="activity-actions">
                <router-link :to="`/activities/${activity.id}`" class="btn btn-primary">查看详情</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 社团分类 -->
    <section class="club-categories">
      <div class="container">
        <h2>社团分类</h2>
        <div class="categories-grid">
          <div v-for="category in categories" :key="category.value" class="category-card">
            <router-link :to="`/clubs?category=${category.value}`" class="category-link">
              <div class="category-icon">{{ category.icon }}</div>
              <h3>{{ category.label }}</h3>
              <p>{{ category.description }}</p>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types'
import { getStatusLabel } from '@/types'

const hotActivities = ref<Activity[]>([])

const categories = [
  {
    value: 'academic',
    label: '学术类',
    icon: '📚',
    description: '学术研究、学科竞赛、知识分享'
  },
  {
    value: 'art',
    label: '文艺类',
    icon: '🎨',
    description: '音乐、舞蹈、美术、戏剧表演'
  },
  {
    value: 'sports',
    label: '体育类',
    icon: '⚽',
    description: '球类运动、健身、户外活动'
  },
  {
    value: 'public_welfare',
    label: '公益类',
    icon: '❤️',
    description: '志愿服务、公益活动、社会实践'
  },
  {
    value: 'other',
    label: '其他',
    icon: '🔍',
    description: '其他特色社团和活动'
  }
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadHotActivities = async () => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (error) throw error
    hotActivities.value = data || []
  } catch (error) {
    console.error('加载热门活动失败:', error)
  }
}

onMounted(() => {
  loadHotActivities()
})
</script>

<style scoped>
.hero {
  background: #3b82f6;
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  padding: 4rem 0;
  background: #f8fafc;
}

.features h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  color: #2c3e50;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.hot-activities {
  padding: 4rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #2c3e50;
}

.view-all {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-4px);
}

.activity-poster {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.activity-info {
  padding: 1.5rem;
}

.activity-info h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.activity-time,
.activity-location {
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.activity-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e74c3c;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.activity-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.activity-actions .btn {
  width: 100%;
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.activity-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.activity-actions .btn {
  width: 100%;
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.club-categories {
  padding: 4rem 0;
  background: #f8fafc;
}

.club-categories h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  color: #2c3e50;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: translateY(-4px);
}

.category-link {
  text-decoration: none;
  color: inherit;
}

.category-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.category-card h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.category-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
  }
}
</style>