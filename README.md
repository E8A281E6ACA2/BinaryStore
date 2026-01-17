# 软件下载平台

一个简约、现代化的软件下载展示平台。

## 特性

- **现代化 UI** - 渐变背景、流畅动画、响应式设计
- **高性能** - Next.js 静态生成 + ISR
- **下载统计** - 记录和展示下载数据
- **智能检测** - 自动识别用户系统并推荐对应版本
- **版本管理** - 自动删除旧版本，保留最新版本节省存储
- **Docker 部署** - 一键部署到你的服务器
- **低成本** - 文件存储在 Cloudflare R2

## 界面预览

- **首页**: 渐变 Hero 区域 + 产品卡片展示
- **产品页**: 大号下载按钮 + 智能平台检测
- **管理后台**: 产品管理、版本上传、统计分析、系统设置

## 快速开始

详细的快速开始指南请参考：[QUICKSTART.md](QUICKSTART.md)

### 简要步骤

```bash
# 1. 克隆项目
git clone <your-repo>
cd BinaryStore

# 2. 安装依赖
pnpm install

# 3. 配置数据库连接
echo 'DATABASE_URL=postgresql://username:password@db-host:5432/db-name' > .env.local

# 4. 启动服务
pnpm dev

# 5. 访问 http://localhost:60318
# 首次访问会进入初始化向导 `/admin/init`
```

## 使用管理后台

### 登录后台

1. 访问：`http://localhost:60318/admin`
2. 使用初始化时创建的管理员账号登录

### 添加产品

1. 进入「产品管理」
2. 点击「新建产品」
3. 填写产品信息（名称、标语、描述、图标等）
4. 保存产品

### 上传版本

1. 在产品列表中点击产品
2. 点击「新建版本」
3. 填写版本信息（版本号、更新日志、平台等）
4. 上传文件（支持拖拽上传、直接上传、预签名上传）
5. 等待上传完成

**注意：** 系统会自动保留每个产品的最新版本，上传新版本时会自动删除旧版本文件。

### 查看统计

访问 `/admin/stats` 查看：
- 总下载次数
- 各产品下载统计
- 平台分布
- 最近 30 天下载趋势
- 系统统计信息

## 🔧 配置

### 环境变量

**必需：**
```env
# Database connection (required)
DATABASE_URL=postgresql://username:password@db-host:5432/db-name
```

**可选：**
R2 存储配置可以通过初始化向导或后台管理界面配置，无需环境变量。

### 系统设置

登录后台 → 系统设置，可以配置：
- R2 对象存储（Bucket、Endpoint、Access Key 等）
- R2 目录前缀
- R2 公开 URL（自定义域名）

### 修改管理员密码

登录后台 → 系统设置 → 修改密码

## 项目结构

产品数据存储在数据库，通过后台 `/admin` 管理，项目中不再有本地 `products/` 目录。

```
.
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # 首页
│   │   ├── products/[slug]/    # 产品详情页
│   │   ├── admin/              # 管理后台
│   │   │   ├── products/       # 产品管理
│   │   │   ├── stats/          # 统计分析
│   │   │   ├── settings/       # 系统设置
│   │   │   └── users/          # 用户管理
│   │   └── api/                # API Routes
│   │       ├── admin/          # 管理 API（包含初始化和认证）
│   │       ├── download/       # 下载相关 API
│   │       ├── track-download/ # 下载统计 API
│   │       └── health/         # 系统健康检查 API
│   ├── components/             # React 组件
│   │   ├── admin/              # 后台组件
│   │   └── ...                 # 前台组件
│   └── lib/                    # 工具函数
│       ├── auth.ts             # 认证工具
│       ├── r2-utils.ts         # R2 存储工具
│       └── platform-detect.ts  # 平台检测
├── prisma/                     # 数据库 Schema & 迁移
├── public/                     # 静态资源
├── docker-compose.yml          # Docker 配置
└── Dockerfile                  # Docker 镜像
```

## 生产部署

### 使用 Docker

```bash
# Build image
docker build -t binarystore .

# Run container
docker run -d \
  -p 60318:60318 \
  -e DATABASE_URL="postgresql://username:password@db-host:5432/db-name" \
  --name binarystore \
  binarystore
```

**注意：** 容器启动后，首次访问会进入初始化向导，配置管理员账号。R2 存储配置需在登录后台后进行设置。

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:60318;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## License

MIT

