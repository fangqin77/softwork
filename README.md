# 校园社团活动管理平台 (Campus Club Hub)

## 项目简介

校园社团活动管理平台是一个面向高校社团与学生的一站式活动管理平台，旨在解决社团活动宣传难、报名统计繁琐、成员管理分散、活动回顾碎片化的痛点。

### 核心功能

- **用户模块**：注册/登录、个人中心、资料编辑
- **社团模块**：社团列表、社团详情、社团管理
- **活动模块**：活动发布、活动列表、活动详情、报名管理
- **报名与统计**：在线报名、报名名单管理、数据导出

### 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **后端**：Supabase (PostgreSQL + Auth + Storage)
- **状态管理**：Pinia
- **路由**：Vue Router
- **样式**：原生 CSS + 响应式设计

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置 Supabase 连接信息：
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 数据库初始化

在 Supabase SQL 编辑器中执行 `database/schema.sql` 文件中的 SQL 语句来创建数据库表结构和权限策略。

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── stores/        # 状态管理
├── types/         # TypeScript 类型定义
├── lib/           # 工具库和配置
├── router/        # 路由配置
└── style.css      # 全局样式
```

## 数据库设计

### 核心数据表

1. **profiles** - 用户资料表
2. **clubs** - 社团信息表
3. **activities** - 活动信息表
4. **activity_sign_ups** - 活动报名记录表
5. **collections** - 用户收藏表
6. **club_admins** - 社团管理员关联表

### 权限控制

项目使用 Supabase Row Level Security (RLS) 实现精细的权限控制：
- 用户只能查看和修改自己的数据
- 社团管理员可以管理自己社团的活动和报名
- 公开信息（活跃社团、未取消活动）对所有用户可见

## 部署

### 构建生产版本

```bash
npm run build
```

### 部署到 Netlify

1. 将代码推送到 GitHub 仓库
2. 在 Netlify 中关联仓库
3. 配置构建命令：`npm run build`
4. 配置发布目录：`dist`
5. 配置环境变量

## 功能特性

### 学生用户功能
- 浏览社团和活动
- 在线报名参加活动
- 查看个人报名记录
- 收藏感兴趣的社团和活动
- 编辑个人资料

### 社团管理员功能
- 管理社团基本信息
- 发布和编辑活动
- 查看和管理报名名单
- 导出报名数据
- 标记签到状态

### 平台特色
- 响应式设计，支持移动端
- 实时数据同步
- 安全的权限控制
- 美观的用户界面

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新的 Vue 组件
2. 在 `src/router/index.ts` 中添加路由配置
3. 更新导航菜单（如果需要）

### 状态管理

使用 Pinia 进行状态管理，主要 store 包括：
- `user` - 用户认证和资料管理
- `clubs` - 社团数据管理
- `activities` - 活动数据管理

### API 调用

所有数据操作通过 `src/lib/supabase.ts` 导出的 Supabase 客户端进行。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目 Issues
- 邮箱：your-email@example.com