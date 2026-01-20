# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# 构建时环境变量（Next.js NEXT_PUBLIC_ 前缀变量必须在构建时设置）
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 配置 npm 使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm 并配置镜像
RUN npm install -g pnpm@8.15.0 && \
    pnpm config set registry https://registry.npmmirror.com

# 复制 package.json 和 pnpm workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/web/package.json ./packages/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY packages/core ./packages/core
COPY packages/web ./packages/web
COPY tsconfig.json ./

# 构建项目（NEXT_PUBLIC_API_URL 会在此时注入到前端代码中）
RUN pnpm --filter @emp/core build
RUN pnpm --filter @emp/web build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 复制构建产物和依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/web ./packages/web
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["pnpm", "--filter", "@emp/web", "start"]
