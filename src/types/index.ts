export interface User {
  id: string
  email: string
  username: string
  avatar_url: string
  college: string
  grade: string
  role: 'student' | 'club_admin'
  created_at: string
  updated_at: string
}

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

export interface Activity {
  id: string
  club_id: string
  title: string
  description: string
  poster_url: string
  activity_time: string
  location: string
  sign_up_deadline: string
  max_people?: number
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled'
  custom_form_fields?: any
  created_at: string
  updated_at: string
}

export interface ActivitySignUp {
  id: string
  activity_id: string
  user_id: string
  form_data: any
  check_in: boolean
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  target_type: 'club' | 'activity'
  target_id: string
  created_at: string
}