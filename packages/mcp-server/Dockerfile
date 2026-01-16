# MCP Server 镜像
FROM node:18-alpine

WORKDIR /app

# 安装构建依赖（better-sqlite3 需要）
RUN apk add --no-cache python3 py3-setuptools make g++ git

# 配置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm

# 配置 pnpm 镜像源
RUN pnpm config set registry https://registry.npmmirror.com

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所需的包
COPY packages/core/package.json ./packages/core/
COPY packages/storage/package.json ./packages/storage/
COPY packages/mcp-server/package.json ./packages/mcp-server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY packages/core ./packages/core
COPY packages/storage ./packages/storage
COPY packages/mcp-server ./packages/mcp-server
COPY tsconfig.json turbo.json ./

# 生成 Prisma Client
RUN cd packages/storage && pnpm prisma:generate && cd ../..

# 顺序构建各包
RUN pnpm --filter @cms/core build
RUN pnpm --filter @cms/storage build
RUN pnpm --filter @cms/mcp-server build

# 创建数据目录
RUN mkdir -p /data

# 设置环境变量
ENV CMS_DB_PATH=/data/memory.db

# MCP Server 使用 stdio 通信，需要 -i 参数运行
ENTRYPOINT ["node", "/app/packages/mcp-server/dist/index.js"]
