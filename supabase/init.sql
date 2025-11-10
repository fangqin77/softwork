-- 校园社团活动管理平台数据库初始化脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表（profiles）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT DEFAULT 'https://picsum.photos/200',
  college TEXT NOT NULL DEFAULT '未填写',
  grade TEXT NOT NULL DEFAULT '未填写',
  role TEXT NOT NULL CHECK (role IN ('student', 'club_admin')) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 社团表（clubs）
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('academic', 'art', 'sports', 'public_welfare', 'other')),
  intro TEXT NOT NULL,
  logo_url TEXT DEFAULT 'https://picsum.photos/300/300',
  contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 社团管理员关联表（club_admins）
CREATE TABLE IF NOT EXISTS club_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (club_id, user_id)
);

-- 4. 活动表（activities）
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT DEFAULT 'https://picsum.photos/800/450',
  activity_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  sign_up_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  max_people INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
  custom_form_fields JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 活动报名记录表（activity_sign_ups）
CREATE TABLE IF NOT EXISTS activity_sign_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL,
  check_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_id, user_id)
);

-- 6. 收藏表（collections）
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'activity')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, target_type, target_id)
);

-- 触发器：用户注册后自动创建 profiles 记录
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, college, grade, role)
  VALUES (NEW.id, NEW.email, '用户' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6), '未填写', '未填写', 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 权限控制：profiles 表
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Club admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.user_id = auth.uid())
);

-- 权限控制：clubs 表
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active clubs" ON clubs FOR SELECT USING (status = 'active');
CREATE POLICY "Club admins can update their clubs" ON clubs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.club_id = clubs.id AND club_admins.user_id = auth.uid())
);

-- 权限控制：activities 表
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view non-cancelled activities" ON activities FOR SELECT USING (status != 'cancelled');
CREATE POLICY "Club admins can create activities for their clubs" ON activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.club_id = activities.club_id AND club_admins.user_id = auth.uid())
);
CREATE POLICY "Club admins can update their club's activities" ON activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.club_id = activities.club_id AND club_admins.user_id = auth.uid())
);

-- 权限控制：activity_sign_ups 表
ALTER TABLE activity_sign_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sign ups" ON activity_sign_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Club admins can view sign ups for their club's activities" ON activity_sign_ups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_admins
    JOIN activities ON club_admins.club_id = activities.club_id
    WHERE activities.id = activity_sign_ups.activity_id AND club_admins.user_id = auth.uid()
  )
);
CREATE POLICY "Users can sign up for activities" ON activity_sign_ups FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 权限控制：collections 表
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- 权限控制：club_admins 表
ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Club admins can view their admin relationships" ON club_admins FOR SELECT USING (auth.uid() = user_id);

-- 插入示例数据
INSERT INTO clubs (name, category, intro, contact) VALUES 
('计算机协会', 'academic', '专注于计算机技术学习和交流的社团，定期举办编程讲座和项目实践', 'QQ群：123456789'),
('摄影社', 'art', '热爱摄影，记录美好瞬间，组织外拍活动和摄影技巧分享', 'QQ群：987654321'),
('篮球社', 'sports', '热爱篮球运动，定期组织训练和比赛，培养团队合作精神', 'QQ群：456789123'),
('志愿者协会', 'public_welfare', '致力于社会公益服务，组织各类志愿服务活动', 'QQ群：789123456'),
('英语角', 'academic', '英语学习交流平台，提高口语表达能力，结交国际友人', 'QQ群：111222333'),
('数学建模协会', 'academic', '培养数学建模能力，参加各类数学建模竞赛', 'QQ群：444555666'),
('机器人协会', 'academic', '机器人设计与制作，参加机器人竞赛，探索人工智能', 'QQ群：777888999'),
('文学社', 'art', '文学创作与交流，组织读书分享会和写作工作坊', 'QQ群：222333444'),
('音乐社', 'art', '音乐爱好者聚集地，组织乐队排练和音乐表演', 'QQ群：555666777'),
('舞蹈社', 'art', '各类舞蹈教学与表演，培养艺术修养和身体素质', 'QQ群：888999000'),
('书法协会', 'art', '传承中华书法艺术，组织书法练习和作品展示', 'QQ群：333444555'),
('足球社', 'sports', '足球运动爱好者，组织训练和友谊赛', 'QQ群：666777888'),
('羽毛球社', 'sports', '羽毛球爱好者，定期组织训练和比赛', 'QQ群：999000111'),
('乒乓球社', 'sports', '乒乓球运动，培养反应能力和协调性', 'QQ群：222333444'),
('游泳社', 'sports', '游泳爱好者，组织游泳训练和比赛', 'QQ群：555666777'),
('环保协会', 'public_welfare', '关注环境保护，组织环保宣传和实践活动', 'QQ群：888999000'),
('心理健康协会', 'public_welfare', '关注心理健康，组织心理讲座和辅导活动', 'QQ群：111222333'),
('动漫社', 'other', '动漫爱好者聚集地，组织动漫展和cosplay活动', 'QQ群：444555666'),
('电竞社', 'other', '电子竞技爱好者，组织游戏比赛和观赛活动', 'QQ群：777888999'),
('创业协会', 'other', '创业思维培养，组织创业讲座和项目路演', 'QQ群：222333444'),
('辩论社', 'other', '辩论技巧训练，组织辩论赛和思维训练', 'QQ群：555666777'),
('天文社', 'other', '天文爱好者，组织天文观测和科普活动', 'QQ群：888999000');

-- 为第一个社团添加管理员（需要替换为实际用户ID）
-- INSERT INTO club_admins (club_id, user_id) VALUES 
-- ((SELECT id FROM clubs WHERE name = '计算机协会'), 'your-user-id-here');

-- 插入示例活动
INSERT INTO activities (club_id, title, description, activity_time, location, sign_up_deadline, max_people) VALUES 
((SELECT id FROM clubs WHERE name = '计算机协会'), 'Python编程入门讲座', '面向初学者的Python编程基础讲座', '2024-12-15 14:00:00', '教学楼A101', '2024-12-14 23:59:59', 50),
((SELECT id FROM clubs WHERE name = '摄影社'), '校园秋色摄影活动', '一起记录校园美丽的秋色', '2024-12-10 09:00:00', '校园中心广场', '2024-12-09 23:59:59', 30),
((SELECT id FROM clubs WHERE name = '篮球社'), '新生篮球友谊赛', '欢迎新同学加入的友谊赛', '2024-12-12 16:00:00', '体育馆篮球场', '2024-12-11 23:59:59', 20),
((SELECT id FROM clubs WHERE name = '英语角'), '英语口语交流活动', '与外国留学生一起练习英语口语', '2024-12-08 19:00:00', '外语学院咖啡厅', '2024-12-07 23:59:59', 40),
((SELECT id FROM clubs WHERE name = '数学建模协会'), '数学建模竞赛培训', '为即将到来的数学建模竞赛做准备', '2024-12-20 15:00:00', '数学楼302', '2024-12-19 23:59:59', 60),
((SELECT id FROM clubs WHERE name = '机器人协会'), '机器人制作工作坊', '学习机器人基础制作和编程', '2024-12-25 10:00:00', '工程训练中心', '2024-12-24 23:59:59', 25),
((SELECT id FROM clubs WHERE name = '文学社'), '读书分享会', '分享最近阅读的好书和心得体会', '2024-12-18 18:30:00', '图书馆研讨室', '2024-12-17 23:59:59', 30),
((SELECT id FROM clubs WHERE name = '音乐社'), '校园音乐节排练', '为即将到来的校园音乐节做准备', '2024-12-22 19:00:00', '音乐厅排练室', '2024-12-21 23:59:59', 50),
((SELECT id FROM clubs WHERE name = '舞蹈社'), '街舞基础教学', '学习街舞基础动作和节奏感', '2024-12-14 16:00:00', '体育馆舞蹈室', '2024-12-13 23:59:59', 20),
((SELECT id FROM clubs WHERE name = '书法协会'), '书法作品展', '展示会员的优秀书法作品', '2024-12-28 14:00:00', '艺术学院展厅', '2024-12-27 23:59:59', 100),
((SELECT id FROM clubs WHERE name = '足球社'), '足球友谊赛', '与其他学院进行足球友谊赛', '2024-12-16 15:00:00', '足球场', '2024-12-15 23:59:59', 22),
((SELECT id FROM clubs WHERE name = '羽毛球社'), '羽毛球双打比赛', '组织羽毛球双打比赛', '2024-12-19 19:00:00', '体育馆羽毛球场', '2024-12-18 23:59:59', 32),
((SELECT id FROM clubs WHERE name = '乒乓球社'), '乒乓球技巧训练', '专业教练指导乒乓球技巧', '2024-12-11 18:00:00', '体育馆乒乓球室', '2024-12-10 23:59:59', 20),
((SELECT id FROM clubs WHERE name = '游泳社'), '游泳安全知识讲座', '学习游泳安全知识和自救技巧', '2024-12-13 19:30:00', '游泳馆会议室', '2024-12-12 23:59:59', 80),
((SELECT id FROM clubs WHERE name = '环保协会'), '校园清洁活动', '组织校园环境清洁和垃圾分类宣传', '2024-12-17 09:00:00', '校园中心广场', '2024-12-16 23:59:59', 50),
((SELECT id FROM clubs WHERE name = '心理健康协会'), '压力管理讲座', '学习应对学业和生活压力的方法', '2024-12-23 15:00:00', '心理辅导中心', '2024-12-22 23:59:59', 60),
((SELECT id FROM clubs WHERE name = '动漫社'), '动漫角色扮演活动', '动漫角色扮演和摄影活动', '2024-12-30 13:00:00', '学生活动中心', '2024-12-29 23:59:59', 40),
((SELECT id FROM clubs WHERE name = '电竞社'), '英雄联盟校园赛', '组织英雄联盟校园比赛', '2024-12-26 19:00:00', '电竞实训室', '2024-12-25 23:59:59', 16),
((SELECT id FROM clubs WHERE name = '创业协会'), '创业项目路演', '优秀创业项目展示和投资对接', '2024-12-29 14:00:00', '创业孵化基地', '2024-12-28 23:59:59', 100),
((SELECT id FROM clubs WHERE name = '辩论社'), '辩论技巧培训', '学习辩论技巧和逻辑思维训练', '2024-12-21 18:30:00', '法学院模拟法庭', '2024-12-20 23:59:59', 40),
((SELECT id FROM clubs WHERE name = '天文社'), '天文观测活动', '使用天文望远镜观测星空', '2024-12-27 20:00:00', '天文台', '2024-12-26 23:59:59', 30);