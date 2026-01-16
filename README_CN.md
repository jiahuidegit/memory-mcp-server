# Memory Pulse MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)

**🧠 精准、结构化的 AI 上下文记忆系统。专为 Claude Code 设计的 MCP Server。**

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
| `MEMORY_DB_PATH` | SQLite 数据库文件路径 | `./memory.db` |
| `DATABASE_URL` | PostgreSQL 连接字符串（使用 postgresql 时必填） | - |

### SQLite 存储（默认）

零配置，开箱即用：

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

> **注意**：PostgreSQL 存储需要 `@prisma/client`，如有需要请手动安装：
> ```bash
> npm install @prisma/client
> ```

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
- [ ] Web Dashboard 可视化
- [ ] CLI 工具
- [ ] 语义搜索（Embedding）
- [ ] 团队协作功能

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

**🧠 让 AI 精准记住一切。**
