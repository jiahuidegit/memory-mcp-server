# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# 配置 npm 使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm 并配置镜像
RUN npm install -g pnpm@8.15.0 && \
    pnpm config set registry https://registry.npmmirror.com

# 复制 package.json 和 pnpm workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/storage/package.json ./packages/storage/
COPY packages/api/package.json ./packages/api/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY packages/core ./packages/core
COPY packages/storage ./packages/storage
COPY packages/api ./packages/api
COPY tsconfig.json turbo.json ./

# 生成 Prisma Client
RUN cd packages/storage && pnpm prisma:generate && cd ../..

# 使用 turbo 统一构建所有包（自动处理依赖顺序）
RUN pnpm turbo build --filter=@emp/api...

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 复制构建产物和依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/storage ./packages/storage
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "--filter", "@emp/api", "start"]
