# 快速开始指南

## 前提条件

- Node.js 18+
- PostgreSQL database (本地或远程)
- Cloudflare R2 account (或兼容 S3 的对象存储)

## 第一步：安装依赖

```bash
pnpm install
```

## 第二步：配置环境变量

创建 `.env.local` 文件：

```env
# Database connection (required)
DATABASE_URL=postgresql://username:password@db-host:5432/db-name
```

**注意：** R2 存储配置将在初始化向导中设置，无需在环境变量中配置。

## 第三步：启动服务

```bash
pnpm dev
```

## 第四步：系统初始化向导

首次访问 http://localhost:60318 时，系统会自动跳转到初始化向导 `/admin/init`。

**初始化向导包含一步：**

1. **创建管理员账号**
   - 设置管理员姓名、邮箱和密码
   - 这是唯一的管理员账号
   - 系统会自动初始化默认系统配置

R2 存储配置需在登录后台后，进入「System Settings」页面进行设置。

## 第五步：开始使用

### 登录后台
- 访问：http://localhost:60318/admin
- 使用刚创建的管理员账号登录

### 添加产品
1. 点击"Product Management" → "New Product"
2. 填写产品信息（名称、描述、图标等）
3. 保存产品

### 上传版本
1. 进入产品详情页
2. 点击"New Version"
3. 填写版本信息（版本号、更新日志、平台等）
4. 上传文件（支持拖拽、直接上传、预签名上传）
5. 等待上传完成

**注意：** 系统会自动保留每个产品的最新版本，上传新版本时会自动删除旧版本文件（下载统计会保留）。

### 查看统计
- 访问：http://localhost:60318/admin/stats
- 查看下载统计、系统统计等

### 前台访问
- 首页：http://localhost:60318
- 产品详情：http://localhost:60318/products/product-slug
- 用户可以直接下载最新版本

## 就这么简单！🎉

## 生产部署

### 使用 Docker（推荐）

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

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 常见问题

**Q: 如何修改管理员密码？**  
A: 登录后访问 `/admin/settings`，在"Change Password"部分修改。

**Q: 需要手动初始化数据库吗？**  
A: 需要在首次启动前运行数据库迁移命令：`pnpm prisma migrate deploy`。系统会在初始化时创建默认配置，但不会自动运行数据库迁移。

**Q: 如何备份数据？**  
A: 备份 PostgreSQL 数据库和 R2 存储的文件。详见 `使用说明.md`。

**Q: 支持多个版本吗？**  
A: 默认只保留最新版本。如需支持多版本，需要修改 `src/lib/r2-utils.ts` 中的 `deleteOldReleases` 函数逻辑。

**Q: 如何修改 R2 配置？**  
A: 登录后访问 `/admin/settings`，在"System Settings"部分修改。

## 更多文档

- 用户操作手册：`docs/用户操作手册.md`
- 项目审计报告：`docs/AUDIT_REPORT.md`
