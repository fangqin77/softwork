// 用户相关类型
export interface User {
  id: string
  username: string
  avatar_url: string
  college: string
  grade: string
  role: 'student' | 'club_admin'
  created_at: string
  updated_at: string
}

// 社团相关类型
export interface Club {
  id: string
  name: string
  category: 'academic' | 'art' | 'sports' | 'public_welfare' | 'other'
  intro: string
  logo_url: string
  contact: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 活动相关类型
export interface Activity {
  id: string
  club_id: string
  title: string
  description: string
  poster_url: string
  activity_time: string
  location: string
  sign_up_deadline: string
  max_people: number | null
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled'
  custom_form_fields: FormField[]
  created_at: string
  updated_at: string
}

// 表单字段类型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea'
  required: boolean
  placeholder?: string
}

// 报名记录类型
export interface ActivitySignUp {
  id: string
  activity_id: string
  user_id: string
  form_data: Record<string, any>
  check_in: boolean
  created_at: string
}

// 收藏类型
export interface Collection {
  id: string
  user_id: string
  target_type: 'club' | 'activity'
  target_id: string
  created_at: string
}

// 社团管理员关联类型
export interface ClubAdmin {
  id: string
  club_id: string
  user_id: string
  created_at: string
}

// 分类映射
const categoryMap: Record<Club['category'], string> = {
  academic: '学术类',
  art: '文艺类',
  sports: '体育类',
  public_welfare: '公益类',
  other: '其他'
}

const statusMap: Record<Activity['status'], string> = {
  pending: '待开始',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

// 工具函数
export const getCategoryLabel = (category: Club['category']): string => {
  return categoryMap[category] || '其他'
}

export const getStatusLabel = (status: Activity['status']): string => {
  return statusMap[status] || '未知'
}