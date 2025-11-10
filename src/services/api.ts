import { supabase } from '@/lib/supabase'
import type { 
  Activity, 
  Club, 
  Profile, 
  ActivitySignUp, 
  Collection,
  ClubAdmin 
} from '@/types'

// 用户相关API
export const userApi = {
  // 获取用户资料
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // 更新用户资料
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 检查用户是否为社团管理员
  async isClubAdmin(userId: string, clubId?: string): Promise<boolean> {
    let query = supabase
      .from('club_admins')
      .select('*')
      .eq('user_id', userId)
    
    if (clubId) {
      query = query.eq('club_id', clubId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data?.length || 0) > 0
  }
}

// 社团相关API
export const clubApi = {
  // 获取社团列表
  async getClubs(params?: {
    category?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ clubs: Club[], count: number }> {
    let query = supabase
      .from('clubs')
      .select('*, activities(count)', { count: 'exact' })
      .eq('status', 'active')

    if (params?.category) {
      query = query.eq('category', params.category)
    }

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`)
    }

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    
    const clubs = data?.map(club => ({
      ...club,
      activity_count: club.activities?.[0]?.count || 0
    })) || []
    
    return { clubs, count: count || 0 }
  },

  // 获取单个社团详情
  async getClub(id: string): Promise<Club & { activities: Activity[] }> {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        activities (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建社团（需要管理员权限）
  async createClub(clubData: Omit<Club, 'id' | 'created_at' | 'updated_at'>): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .insert([clubData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新社团信息
  async updateClub(id: string, updates: Partial<Club>): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 活动相关API
export const activityApi = {
  // 获取活动列表
  async getActivities(params?: {
    clubId?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ activities: Activity[], count: number }> {
    let query = supabase
      .from('activities')
      .select(`
        *,
        clubs (name, logo_url)
      `, { count: 'exact' })
      .neq('status', 'cancelled')

    if (params?.clubId) {
      query = query.eq('club_id', params.clubId)
    }

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.search) {
      query = query.ilike('title', `%${params.search}%`)
    }

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query.order('activity_time', { ascending: true })
    
    if (error) throw error
    
    const activities = data?.map(activity => ({
      ...activity,
      club_name: activity.clubs?.name,
      club_logo: activity.clubs?.logo_url
    })) || []
    
    return { activities, count: count || 0 }
  },

  // 获取单个活动详情
  async getActivity(id: string): Promise<Activity & { club: Club }> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        clubs (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { ...data, club: data.clubs }
  },

  // 创建活动（需要社团管理员权限）
  async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新活动信息
  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 报名相关API
export const signUpApi = {
  // 报名活动
  async signUpActivity(activityId: string, formData: Record<string, any>): Promise<ActivitySignUp> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('activity_sign_ups')
      .insert([{
        activity_id: activityId,
        user_id: user.id,
        form_data: formData
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 获取用户报名记录
  async getUserSignUps(userId: string): Promise<ActivitySignUp[]> {
    const { data, error } = await supabase
      .from('activity_sign_ups')
      .select(`
        *,
        activities (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 获取活动报名名单（需要社团管理员权限）
  async getActivitySignUps(activityId: string): Promise<(ActivitySignUp & { profiles: Profile })[]> {
    const { data, error } = await supabase
      .from('activity_sign_ups')
      .select(`
        *,
        profiles (*)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 标记签到
  async checkIn(signUpId: string): Promise<ActivitySignUp> {
    const { data, error } = await supabase
      .from('activity_sign_ups')
      .update({ check_in: true })
      .eq('id', signUpId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 收藏相关API
export const collectionApi = {
  // 添加收藏
  async addCollection(targetType: 'club' | 'activity', targetId: string): Promise<Collection> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('collections')
      .insert([{
        user_id: user.id,
        target_type: targetType,
        target_id: targetId
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 移除收藏
  async removeCollection(targetType: 'club' | 'activity', targetId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
    
    if (error) throw error
  },

  // 获取用户收藏
  async getUserCollections(userId: string, targetType?: 'club' | 'activity'): Promise<Collection[]> {
    let query = supabase
      .from('collections')
      .select(`
        *,
        clubs (*),
        activities (*)
      `)
      .eq('user_id', userId)

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 检查是否已收藏
  async isCollected(targetType: 'club' | 'activity', targetId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 表示没有找到记录
    return !!data
  }
}