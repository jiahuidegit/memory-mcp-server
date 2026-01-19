# Memory Pulse MCP Server

[![GitHub Stars](https://img.shields.io/github/stars/jiahuidegit/memory-mcp-server?style=social)](https://github.com/jiahuidegit/memory-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)

**🧠 精准、结构化的 AI 上下文记忆系统。专为 Claude Code 设计的 MCP Server。**

> ⭐ **如果这个项目对你有帮助，请在 [GitHub](https://github.com/jiahuidegit/memory-mcp-server) 上给个 Star！** 你的支持是我们前进的动力！

[English](README.md) | [中文](README_CN.md)

---

## ❓ 为什么选择 Memory Pulse？

### 现有 AI 记忆方案的问题

| 问题 | 传统方案 | Memory Pulse |
|------|---------|--------------|
| **信息丢失** | 向量压缩导致细节丢失 | 完整上下文保留 |
| **检索不精准** | 仅语义搜索，容易漏掉精确匹配 | 多级检索：精确 → 全文 → 语义 |
| **决策断层** | 只存结论，不存推理过程 | 结构化：问题 → 分析 → 选项 → 决策 |
| **上下文碎片化** | 记忆分散，缺乏关联 | 关系链 + 时间线追踪 |

### 与其他记忆系统对比

| 特性 | Memory Pulse | mem0 | Zep | LangChain Memory |
|------|-------------|------|-----|------------------|
| **存储方式** | 完整上下文（无压缩） | 向量嵌入 | 向量 + 图 | 向量嵌入 |
| **检索策略** | L1 精确 → L2 全文 → L3 语义 | 仅语义 | 语义 + 时序 | 仅语义 |
| **决策追踪** | ✅ 强制结构化字段 | ❌ | ❌ | ❌ |
| **关系图谱** | ✅ 内置 | ❌ | ✅ | ❌ |
| **时间线视图** | ✅ 内置 | ❌ | ✅ | ❌ |
| **MCP 原生** | ✅ | ❌ | ❌ | ❌ |
| **本地优先** | ✅ SQLite | 依赖云 | 依赖云 | 不确定 |
| **零配置** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 核心特性

- 🧠 **完整上下文保留** - 无压缩，无信息丢失
- 🔍 **多级检索** - L1 精确匹配 → L2 全文搜索 → L3 语义搜索
- 📋 **结构化记忆类型** - Decision / Solution / Session / Code / Error / Config
- 🔗 **关系链追踪** - 追踪记忆间的关联与演进
- 📅 **时间线视图** - 查看记忆随时间的演变
- 🎯 **强制结构化** - AI 必须提供完整上下文（杜绝偷懒式摘要）
- 💾 **本地优先** - SQLite 存储，数据完全掌控
- ⚡ **零配置** - 开箱即用

---

## 📦 快速开始

### 方式一：使用 npx（推荐）

```bash
npx memory-pulse-mcp-server
```

### 方式二：全局安装

```bash
npm install -g memory-pulse-mcp-server
memory-pulse-mcp
```

### 方式三：从源码构建

```bash
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server
pnpm install
pnpm build
```

---

## 🔄 更新到最新版本

### 使用 npx（推荐）

npx 自动使用最新版本，只需重启 MCP 客户端即可。

### 全局安装方式

```bash
npm update -g memory-pulse-mcp-server
# 或重新安装
npm install -g memory-pulse-mcp-server@latest
```

### 检查当前版本

```bash
npm list -g memory-pulse-mcp-server
```

---

## 🎮 MCP 客户端配置

### Claude Code

在项目目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"]
    }
  }
}
```

或全局配置 `~/.claude/mcp.json`：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"]
    }
  }
}
```

### Claude Desktop

编辑配置文件：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"]
    }
  }
}
```

配置完成后重启客户端。

---

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MEMORY_STORAGE` | 存储类型：`sqlite` 或 `postgresql` | `sqlite` |
| `MEMORY_DB_PATH` | SQLite 数据库文件路径 | `~/.emp/memory.db` |
| `DATABASE_URL` | PostgreSQL 连接字符串（使用 postgresql 时必填） | - |

### SQLite 存储（默认）

零配置，开箱即用。数据存储在 `~/.emp/memory.db`：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"]
    }
  }
}
```

### 自定义 SQLite 路径

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"],
      "env": {
        "MEMORY_DB_PATH": "/path/to/your/memory.db"
      }
    }
  }
}
```

### PostgreSQL 存储

适用于生产部署或团队使用：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"],
      "env": {
        "MEMORY_STORAGE": "postgresql",
        "DATABASE_URL": "postgresql://user:password@localhost:5432/memory_pulse"
      }
    }
  }
}
```

> **注意**：使用 PostgreSQL 时，MCP Server 会在首次启动时自动创建所需的数据表。

---

## 🛠️ MCP 工具

### 记忆存储

| 工具 | 说明 |
|------|------|
| `mpulse_store` | 智能存储记忆，AI 自动分类 |
| `mpulse_store_decision` | 存储架构决策（强制完整字段） |
| `mpulse_store_solution` | 存储问题解决方案（问题 → 根因 → 方案） |
| `mpulse_store_session` | 存储会话总结（会话结束时调用） |

### 记忆检索

| 工具 | 说明 |
|------|------|
| `mpulse_recall` | 多策略记忆检索 |
| `mpulse_timeline` | 查看项目时间线 |
| `mpulse_relations` | 查询记忆关系链 |

---

## 💡 使用示例

### 存储决策

当你做出架构决策时，AI 会调用 `mpulse_store_decision`：

```
用户：我们用 Zustand 做状态管理吧，不要 Redux

AI：[调用 mpulse_store_decision]
{
  "question": "状态管理方案选择？",
  "options": [
    { "name": "Redux", "pros": ["生态成熟", "DevTools"], "cons": ["样板代码多"] },
    { "name": "Zustand", "pros": ["轻量", "TypeScript 友好"], "cons": ["生态较小"] }
  ],
  "chosen": "Zustand",
  "reason": "项目规模中等，优先开发效率。Zustand 学习曲线更低。",
  "projectId": "my-app"
}

✅ 决策已存储，ID: mem_xxx
```

### 存储解决方案

当你解决问题时，AI 会调用 `mpulse_store_solution`：

```
用户：我修好了 useEffect 里的内存泄漏

AI：[调用 mpulse_store_solution]
{
  "problem": "React 组件内存泄漏警告",
  "rootCause": "组件卸载后异步操作仍在执行",
  "solution": "在 useEffect 中添加清理函数，取消未完成的请求",
  "projectId": "my-app"
}

✅ 方案已存储，ID: mem_xxx
```

### 检索记忆

当你需要之前会话的上下文时：

```
用户：我们之前用什么状态管理来着？

AI：[调用 mpulse_recall]
{
  "query": "状态管理",
  "projectId": "my-app",
  "strategy": "fulltext"
}

找到：2天前的决策 - 选择了 Zustand，因为...
```

### 查看时间线

```
用户：这周我们都做了什么？

AI：[调用 mpulse_timeline]
{
  "projectId": "my-app",
  "limit": 20
}

时间线：
- 1月15日：决策 - 状态管理（Zustand）
- 1月15日：方案 - 内存泄漏修复
- 1月14日：决策 - API 架构（REST vs GraphQL）
...
```

### 查询关系

```
用户：跟 API 设计相关的决策有哪些？

AI：[调用 mpulse_relations]
{
  "memoryId": "mem_api_decision",
  "depth": 2
}

关系链：
- mem_api_decision（决策：REST API）
  ├── mem_auth_solution（方案：JWT 实现）
  └── mem_error_handling（决策：错误响应格式）
```

---

## 📝 AI 提示词配置（CLAUDE.md）

为了让 AI 自动执行记忆存储和检索，你可以在项目的 `CLAUDE.md` 或全局的 `~/.claude/CLAUDE.md` 中添加以下提示词规则：

### 会话启动协议（推荐）

在 CLAUDE.md 开头添加，确保 AI 每次会话开始时自动检索历史记忆：

```markdown
# ⚠️ 会话启动协议（最高优先级）

**在处理任何用户请求之前，必须先执行以下步骤：**

## 第一步：提取项目名
从当前工作目录提取项目名（最后一级文件夹名）
例：`/Users/xxx/work/my-app` → projectId = `my-app`

## 第二步：检索历史记忆（必须执行）
调用 mpulse_recall 检索该项目的历史记忆：
- query: "项目上下文 架构决策 未完成任务 配置信息"
- projectId: 提取的项目名

## 第三步：汇报记忆结果
- 有记忆 → 简要汇报关键信息后再处理用户请求
- 无记忆 → 说明"该项目暂无历史记忆"后再处理用户请求

**⛔ 未执行记忆检索就处理用户请求 = 违规**
```

### 自动存储规则

添加以下规则，让 AI 在关键节点自动存储记忆：

```markdown
# Memory Pulse 记忆管理规则

## 强制存储时机

| 时机 | 使用工具 | 说明 |
|------|---------|------|
| 架构/技术决策后 | `mpulse_store_decision` | 必须包含：问题、选项、选择、理由 |
| 解决复杂问题后 | `mpulse_store_solution` | 必须包含：问题、根因、方案 |
| 会话结束前 | `mpulse_store_session` | 总结本次工作、未完成任务 |
| 重要配置信息 | `mpulse_store` | 服务器信息、环境配置等 |

## 存储质量要求

### content vs rawContext 区别（重要！）
- **content**: 简洁摘要（1-2句话），用于列表展示
- **rawContext**: 完整原始数据，包括所有细节

### 示例
```json
{
  "content": "配置了 PostgreSQL 数据库连接",
  "rawContext": {
    "host": "10.10.1.12",
    "port": 5432,
    "database": "my_app",
    "user": "postgres",
    "connectionString": "postgresql://postgres:xxx@10.10.1.12:5432/my_app",
    "configFile": "/opt/app/.env"
  }
}
```

## 检索时机

- 遇到类似问题时 → 先检索历史解决方案
- 技术选型前 → 检索之前的决策记录
- 继续之前的工作 → 检索上次会话总结
```

### 完整配置示例

```markdown
# CLAUDE.md

## 会话启动协议
[上面的会话启动协议内容]

## Memory Pulse 使用规则

### 存储规则
- 做出技术决策后 → 必须调用 mpulse_store_decision
- 解决问题后 → 必须调用 mpulse_store_solution
- 会话结束前 → 必须调用 mpulse_store_session
- 用户说"记住这个" → 立即调用 mpulse_store

### 检索规则
- 会话开始 → 自动检索项目历史
- 遇到问题 → 先检索是否有相关解决方案
- 技术选型 → 检索之前的决策记录

### projectId 命名规则
- 使用当前项目文件夹名作为 projectId
- 跨项目通用知识使用 projectId = "global"
```

---

## 🔍 检索算法

Memory Pulse 采用 **三级级联检索策略**：

```
┌─────────────────────────────────────────────────────┐
│                    用户查询                          │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│  L1：精确匹配（< 10ms）                              │
│  - projectId + type + 关键词索引                     │
│  - 匹配数 ≥ 5 时返回                                 │
└─────────────────────┬───────────────────────────────┘
                      ▼ （不足时）
┌─────────────────────────────────────────────────────┐
│  L2：全文搜索（< 100ms）                             │
│  - SQLite FTS5 / PostgreSQL 全文                    │
│  - 中英文分词                                        │
│  - 匹配数 ≥ 3 时返回                                 │
└─────────────────────┬───────────────────────────────┘
                      ▼ （不足时）
┌─────────────────────────────────────────────────────┐
│  L3：语义搜索（< 500ms）                             │
│  - 嵌入向量相似度（可选）                            │
│  - 模糊查询兜底                                      │
└─────────────────────────────────────────────────────┘
```

**为什么这样设计？**

- **精准优先**：精确匹配更快更准
- **优雅降级**：需要时自动扩大搜索范围
- **避免误召回**：语义搜索是最后手段，不是默认选项

---

## 📊 记忆类型

| 类型 | 用途 | 必填字段 |
|------|------|---------|
| `decision` | 架构决策 | question, options, chosen, reason |
| `solution` | 问题修复 | problem, rootCause, solution |
| `session` | 会话总结 | summary, decisions, nextSteps |
| `code` | 代码实现 | content, artifacts |
| `error` | 错误记录 | content, stackTrace |
| `config` | 配置信息 | content, settings |

---

## 🖥️ Web Dashboard

Memory Pulse 提供了精美的 Web Dashboard，用于可视化管理记忆。

### 功能特性

| 功能 | 说明 |
|------|------|
| **记忆管理** | 浏览、搜索、创建记忆，现代化 UI |
| **时间线视图** | 查看记忆随时间的演变 |
| **关系图谱** | 交互式可视化记忆关联 |
| **项目筛选** | 一键切换项目 |
| **全文搜索** | 快速定位任何记忆 |

---

## 📖 部署指南

根据你的需求选择合适的部署场景：

### 场景一：SQLite（本地个人使用）

**适合**：个人开发者、轻量使用、快速上手。

```
┌─────────────────────────────────────────┐
│  你的本地电脑                            │
│                                         │
│  Claude Code → MCP Server               │
│                    ↓                    │
│           ~/.emp/memory.db              │
│                    ↑                    │
│              Web Dashboard              │
│                    ↓                    │
│           http://localhost:3001         │
└─────────────────────────────────────────┘
```

**第一步：配置 MCP Server**

在 Claude MCP 配置文件（`~/.claude.json` 或 `.mcp.json`）中添加：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"]
    }
  }
}
```

**第二步：重启 Claude** 以激活 MCP Server。

**第三步：在本地启动 Web Dashboard**

```bash
# 克隆仓库
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server

# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 启动 API 服务（自动读取 ~/.emp/runtime-config.json）
pnpm --filter @emp/api dev &

# 启动 Web Dashboard
pnpm --filter @emp/web dev
```

**第四步：打开浏览器访问** http://localhost:3001

> **工作原理**：MCP Server 启动时会将配置写入 `~/.emp/runtime-config.json`。API 服务读取这个文件，自动连接同一个 SQLite 数据库。

---

### 场景二：PostgreSQL（团队/生产使用）

**适合**：团队协作、多设备访问、生产环境部署。

```
┌──────────────────┐     ┌──────────────────┐
│  用户 A（本地）   │     │  用户 B（本地）   │
│  MCP Server      │     │  MCP Server      │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ↓                        ↓
      ┌─────────────────────────────┐
      │      PostgreSQL 数据库       │
      │     （共享数据存储）          │
      └──────────────┬──────────────┘
                     ↑
      ┌──────────────┴──────────────┐
      │      Web Dashboard          │
      │    （部署在服务器上）         │
      │   http://your-server:3001   │
      └─────────────────────────────┘
```

**第一步：搭建 PostgreSQL 数据库**

```bash
# 创建数据库
createdb memory_pulse

# 或使用 Docker
docker run -d --name memory-pulse-db \
  -e POSTGRES_DB=memory_pulse \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15
```

**第二步：为每个用户配置 MCP Server**

在 Claude MCP 配置文件（`~/.claude.json` 或 `.mcp.json`）中添加：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "npx",
      "args": ["-y", "memory-pulse-mcp-server"],
      "env": {
        "MEMORY_STORAGE": "postgresql",
        "DATABASE_URL": "postgresql://postgres:your_password@your-db-server:5432/memory_pulse"
      }
    }
  }
}
```

**第三步：在服务器上部署 Web Dashboard**

```bash
# 在你的 Web 服务器上
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server

# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 设置环境变量
export MEMORY_STORAGE=postgresql
export DATABASE_URL="postgresql://postgres:your_password@your-db-server:5432/memory_pulse"

# 启动 API 服务
pnpm --filter @emp/api start &

# 启动 Web Dashboard
pnpm --filter @emp/web start
```

**第四步：访问 Web Dashboard** http://your-server:3001

> **关键点**：MCP Server 和 Web Dashboard 必须使用**相同的 DATABASE_URL** 才能看到相同的数据。

---

### 配置优先级

系统按以下顺序读取配置（先找到的优先）：

1. **环境变量** - `MEMORY_STORAGE`、`DATABASE_URL`、`MEMORY_DB_PATH`
2. **运行时配置文件** - `~/.emp/runtime-config.json`（由 MCP Server 写入）
3. **默认值** - SQLite 存储在 `~/.emp/memory.db`

---

### Docker 部署（生产环境）

生产环境可以使用 Docker：

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install && pnpm build
EXPOSE 3000 3001
CMD ["sh", "-c", "pnpm --filter @emp/api start & pnpm --filter @emp/web start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  memory-pulse:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - MEMORY_STORAGE=postgresql
      - DATABASE_URL=postgresql://postgres:password@db:5432/memory_pulse
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=memory_pulse
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

### 截图预览

**首页概览**
![首页概览](assets/images/dashboard-home.png)

**关系图谱**
![关系图谱](assets/images/dashboard-relations.png)

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory Pulse 系统架构                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Claude Code  │    │Claude Desktop│    │  其他 MCP    │       │
│  │              │    │              │    │   客户端     │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                             ▼                                    │
│              ┌─────────────────────────────┐                     │
│              │     MCP Server (stdio)      │                     │
│              │   memory-pulse-mcp-server   │                     │
│              └─────────────┬───────────────┘                     │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                  │
│         ▼                  ▼                  ▼                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │   SQLite    │   │ PostgreSQL  │   │   API       │            │
│  │  （本地）    │   │  （远程）    │   │  服务器     │            │
│  └─────────────┘   └──────┬──────┘   └──────┬──────┘            │
│                           │                 │                    │
│                           └────────┬────────┘                    │
│                                    ▼                             │
│                          ┌─────────────────┐                     │
│                          │  Web Dashboard  │                     │
│                          │  (Next.js 应用)  │                     │
│                          └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 组件说明

| 组件 | 说明 | 技术栈 |
|------|------|--------|
| **MCP Server** | 通过 MCP 协议提供核心记忆操作 | Node.js, TypeScript |
| **存储层** | 灵活的存储后端 | SQLite / PostgreSQL |
| **API 服务** | 为 Web 提供 RESTful API | Express.js |
| **Web Dashboard** | 可视化管理界面 | Next.js 15, React 19 |

---

## 🔒 安全与隐私

1. **本地优先** - 所有数据存储在本地 SQLite，无云依赖
2. **数据自主** - 数据库文件归你所有，随时备份/迁移
3. **无遥测** - 零数据收集，不上报任何信息
4. **项目隔离** - 记忆按 projectId 隔离

---

## 🗺️ 路线图

- [x] MCP Server 核心功能
- [x] SQLite 本地存储
- [x] PostgreSQL 云端支持
- [x] 多级检索（精确 + 全文）
- [x] Decision/Solution/Session 结构化存储
- [x] Web Dashboard 可视化
- [ ] CLI 工具
- [ ] 语义搜索（Embedding）
- [ ] 团队协作功能

---

## 📈 Star History

<a href="https://star-history.com/#jiahuidegit/memory-mcp-server&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
 </picture>
</a>

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

```bash
# 开发
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server
pnpm install
pnpm build
pnpm test
```

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

**🤝 欢迎提交 Issue 反馈问题，或提交 PR 贡献代码！**
