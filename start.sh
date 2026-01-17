#!/bin/bash

# 启动健康检查脚本
# 用于在应用启动时检查系统状态

echo "============================================"
echo "BinaryStore 启动健康检查"
echo "============================================"
echo "开始时间: $(date)"
echo "============================================"

# 检查 Node.js 版本
echo "1. 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   Node.js 版本: $NODE_VERSION"
else
    echo "   Node.js 未安装"
    exit 1
fi

# 检查环境变量
echo "2. 检查环境变量配置..."
if [ -f .env ]; then
    echo "   找到 .env 文件"
else
    echo "   未找到 .env 文件，使用默认环境变量"
fi

# 检查依赖是否安装
echo "3. 检查依赖安装情况..."
if [ -d "node_modules" ]; then
    echo "   node_modules 目录存在"
else
    echo "   node_modules 目录不存在，正在安装依赖..."
    npm install --prod --frozen-lockfile
    if [ $? -eq 0 ]; then
        echo "   依赖安装成功"
    else
        echo "   依赖安装失败"
        exit 1
    fi
fi

# 检查 Prisma Client 是否生成
echo "4. 检查 Prisma Client..."
if [ -d "node_modules/.prisma" ]; then
    echo "   Prisma Client 已生成"
else
    echo "   Prisma Client 未生成，正在生成..."
    npx prisma generate
    if [ $? -eq 0 ]; then
        echo "   Prisma Client 生成成功"
    else
        echo "   risma Client 生成失败"
        exit 1
    fi
fi

# 启动应用服务器
echo "============================================"
echo "启动应用服务器..."
echo "============================================"

# 启动 Next.js 服务器
exec node server.js