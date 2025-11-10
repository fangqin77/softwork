import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const isClubAdmin = computed(() => user.value?.role === 'club_admin')

  // 初始化用户
  const initialize = async () => {
    try {
      loading.value = true
      
      // 获取当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // 获取用户资料
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) throw profileError
        user.value = profile
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('初始化用户失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) throw authError
      
      if (data.user) {
        // 获取用户资料
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) throw profileError
        user.value = profile
      }
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            email: email
          }
        }
      })
      
      if (authError) throw authError
      
      return { success: true, user: data.user }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      
      user.value = null
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : '退出失败'
    }
  }

  // 更新用户资料
  const updateProfile = async (profileData: Partial<User>) => {
    try {
      if (!user.value) throw new Error('用户未登录')
      
      loading.value = true
      error.value = null
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.value.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      user.value = data
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 设置用户信息
  const setUser = (userData: User) => {
    user.value = userData
  }

  // 监听认证状态变化
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profile) user.value = profile
    } else if (event === 'SIGNED_OUT') {
      user.value = null
    }
  })

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isClubAdmin,
    initialize,
    login,
    register,
    logout,
    updateProfile,
    setUser
  }
})