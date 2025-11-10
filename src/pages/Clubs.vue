<template>
  <div class="clubs-page">
    <div class="page-header">
      <h1>社团列表</h1>
      <div class="search-filter">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索社团..." 
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-select">
          <option value="">全部分类</option>
          <option value="academic">学术类</option>
          <option value="art">文艺类</option>
          <option value="sports">体育类</option>
          <option value="public_welfare">公益类</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else class="clubs-grid">
      <div 
        v-for="club in filteredClubs" 
        :key="club.id" 
        class="club-card"
        @click="$router.push(`/clubs/${club.id}`)"
      >
        <div class="club-logo">
          <img :src="club.logo_url" :alt="club.name" />
        </div>
        <div class="club-info">
          <h3>{{ club.name }}</h3>
          <p class="category">{{ getCategoryLabel(club.category) }}</p>
          <p class="intro">{{ club.intro }}</p>
          <div class="club-stats">
            <span class="contact">{{ club.contact }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredClubs.length === 0" class="no-results">
      暂无社团数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Club } from '@/types'

const clubs = ref<Club[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')

const filteredClubs = computed(() => {
  return clubs.value.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         club.intro.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || club.category === selectedCategory.value
    return matchesSearch && matchesCategory
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

const fetchClubs = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    clubs.value = data || []
  } catch (error) {
    console.error('获取社团列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClubs()
})
</script>

<style scoped>
.clubs-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
}

.search-filter {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.category-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.club-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.club-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.club-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
}

.club-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.club-info h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #333;
}

.category {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.intro {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.club-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #888;
}

.loading, .no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .clubs-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: none;
  }
}
</style>