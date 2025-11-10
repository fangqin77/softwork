import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 页面组件导入
const Home = () => import('@/pages/Home.vue')
const Clubs = () => import('@/pages/Clubs.vue')
const ClubDetail = () => import('@/pages/ClubDetail.vue')
const ActivityDetail = () => import('@/pages/ActivityDetail.vue')
const Login = () => import('@/pages/Login.vue')
const Register = () => import('@/pages/Register.vue')
const Profile = () => import('@/pages/Profile.vue')
const Admin = () => import('@/pages/Admin.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/clubs',
    name: 'Clubs',
    component: Clubs
  },
  {
    path: '/clubs/:id',
    name: 'ClubDetail',
    component: ClubDetail,
    props: true
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: ActivityDetail,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresClubAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.user) {
    next('/login')
    return
  }
  
  // 检查是否需要社团管理员权限
  if (to.meta.requiresClubAdmin && !userStore.isClubAdmin) {
    next('/')
    return
  }
  
  next()
})

export default router