# 精品商城电商网站

一个基于 Supabase 和 Netlify 构建的现代化电商网站，提供完整的在线购物体验。

## 🚀 功能特性

### 🛍️ 核心功能
- **产品展示**: 精美的产品列表和详情页面
- **购物车**: 完整的购物车功能，支持添加、删除、修改数量
- **用户系统**: 用户注册、登录、个人信息管理
- **订单管理**: 完整的订单流程和状态跟踪
- **地址管理**: 多收货地址管理
- **收藏功能**: 产品收藏夹
- **搜索筛选**: 产品搜索和分类筛选

### 🎨 设计特点
- **响应式设计**: 完美适配桌面端和移动端
- **现代UI**: 采用渐变色和卡片式设计
- **用户体验**: 流畅的交互动画和操作反馈
- **无障碍**: 遵循Web无障碍标准

### 📱 页面结构
1. **首页** (`index.html`) - 产品展示和分类导航
2. **产品列表页** (`products.html`) - 产品浏览、搜索和筛选
3. **购物车页** (`cart.html`) - 购物车管理和结算
4. **个人中心** (`profile.html`) - 用户信息和订单管理

## 🛠️ 技术栈

### 前端
- **HTML5**: 语义化标记
- **CSS3**: 现代样式和动画
- **JavaScript ES6+**: 原生JS实现所有功能
- **响应式设计**: Flexbox和Grid布局

### 后端服务
- **Supabase**: 数据库、认证和存储
  - PostgreSQL 数据库
  - 用户认证系统
  - 实时数据同步
  - 行级安全策略

### 部署
- **Netlify**: 静态网站托管
  - 自动HTTPS
  - 全球CDN
  - 持续部署
  - 表单处理

## 📊 数据库设计

### 核心数据表 (4张主要表 + 扩展表)

1. **users** - 用户信息
   - 扩展 Supabase auth.users
   - 个人资料和偏好设置

2. **products** - 产品信息
   - 产品详情、价格、库存
   - 分类关联
   - SEO优化字段

3. **orders** - 订单信息
   - 订单状态和金额
   - 配送和支付信息
   - 订单项关联

4. **categories** - 产品分类
   - 分类层级管理
   - 图标和描述

### 扩展功能表
- **addresses** - 收货地址
- **favorites** - 收藏夹
- **cart_items** - 购物车
- **coupons** - 优惠券系统
- **reviews** - 评论系统
- **product_variants** - 产品变体

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Supabase 账户
- Netlify 账户

### 1. 克隆项目
```bash
git clone <your-repository-url>
cd 202502
```

### 2. 设置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL 编辑器中运行 `supabase-schema.sql` 创建数据库表
3. 在认证设置中配置:
   - 站点URL: `https://your-site.netlify.app`
   - 重定向URL: `https://your-site.netlify.app/**`

### 3. 配置环境变量

#### 方法1: 修改配置文件
编辑 `js/config.js` 文件:
```javascript
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    // ...
};
```

#### 方法2: Netlify 环境变量 (推荐)
在 Netlify 后台设置环境变量:
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥

### 4. 部署到 Netlify

#### 方法1: 通过 Git 集成
1. 将代码推送到 GitHub/GitLab
2. 在 Netlify 中连接仓库
3. 设置构建命令: `echo "No build command needed"`
4. 设置发布目录: `.` (根目录)

#### 方法2: 直接上传
1. 安装 Netlify CLI: `npm install -g netlify-cli`
2. 登录: `netlify login`
3. 部署: `netlify deploy --prod --dir=.`

### 5. 测试网站
访问你的 Netlify 网站URL，测试各项功能是否正常工作。

## 📁 项目结构

```
202502/
├── index.html              # 首页
├── products.html           # 产品列表页
├── cart.html              # 购物车页
├── profile.html           # 个人中心页
├── css/
│   └── style.css          # 主样式文件
├── js/
│   ├── config.js          # 配置文件
│   ├── database.js        # 数据库操作封装
│   ├── auth.js            # 认证服务
│   ├── products.js        # 产品服务
│   ├── cart.js            # 购物车服务
│   ├── main.js            # 主要功能
│   ├── products-page.js   # 产品页专用
│   ├── cart-page.js       # 购物车页专用
│   └── profile.js         # 个人中心页专用
├── supabase-schema.sql    # 数据库结构
├── netlify.toml           # Netlify 配置
└── README.md              # 项目文档
```

## 🔧 开发指南

### 本地开发

由于项目使用纯静态文件，可以直接在浏览器中打开 `index.html` 进行开发。

对于需要 Supabase 连接的功能:
1. 在 `js/config.js` 中配置你的 Supabase 凭据
2. 或使用本地 Supabase 实例

### 数据库管理

所有数据库操作通过 `js/database.js` 封装，支持:
- Supabase 实时数据库
- 本地存储备份模式

### 添加新功能

1. 在相应的 HTML 文件中添加界面
2. 在 `js/` 目录中添加对应的 JavaScript 文件
3. 在 `css/style.css` 中添加样式
4. 如需新的数据表，更新 `supabase-schema.sql`

## 🎯 核心功能说明

### 用户认证
- 基于 Supabase Auth
- 支持邮箱/密码注册登录
- 行级安全策略保护用户数据

### 产品管理
- 动态产品加载
- 分类筛选和搜索
- 产品变体支持 (颜色、尺寸等)
- 库存管理

### 购物流程
- 添加到购物车
- 优惠券系统
- 运费计算
- 订单生成和跟踪

### 数据安全
- Supabase RLS (行级安全)
- 前端输入验证
- XSS 防护
- 安全头部设置

## 🚀 部署优化

### 性能优化
- 图片CDN加速
- 静态资源缓存
- CSS/JS 压缩
- 懒加载图片

### SEO优化
- 语义化HTML
- Meta标签
- 结构化数据
- 友好URL

### 安全措施
- HTTPS强制
- 安全头部
- CSP策略
- 输入验证

## 🔍 故障排除

### 常见问题

1. **Supabase 连接失败**
   - 检查 URL 和密钥配置
   - 确认数据库表已创建
   - 验证 RLS 策略设置

2. **样式加载异常**
   - 检查 CSS 文件路径
   - 确认服务器正确配置 MIME 类型

3. **功能不工作**
   - 检查浏览器控制台错误
   - 确认 JavaScript 文件正确加载
   - 验证网络请求

### 调试技巧

1. 使用浏览器开发者工具
2. 查看 Netlify 构建日志
3. 检查 Supabase 日志
4. 使用本地存储模式测试

## 📈 扩展建议

### 短期扩展
- 支付集成 (Stripe/支付宝)
- 邮件通知系统
- 社交分享功能
- 产品评论系统

### 长期扩展
- 移动应用版本
- 多语言支持
- 高级搜索功能
- AI 产品推荐

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 📞 支持

如有问题，请:
1. 查看 FAQ 部分
2. 检查 Issues 页面
3. 创建新的 Issue
4. 联系项目维护者

---

**注意**: 这是一个示例项目，生产环境使用前请进行充分测试并根据实际需求调整配置。