# Memory Pulse

[![npm version](https://img.shields.io/npm/v/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

精准、结构化的 AI 上下文记忆系统。专为 Claude Code 设计的 MCP Server。

## 为什么需要 Memory Pulse？

现有的 AI 记忆方案存在三大痛点：

| 问题 | 传统方案 | Memory Pulse |
|------|---------|--------------|
| **信息丢失** | 向量化压缩导致细节丢失 | 完整保留原始上下文 |
| **检索不准** | 纯语义检索找不到精确信息 | 多级检索：精确 → 全文 → 语义 |
| **决策断层** | 只存结论，不存过程 | 结构化存储：问题 → 分析 → 方案 → 决策 |

## 安装

```bash
npm install -g memory-pulse-mcp-server
```

## 配置 Claude Code

在项目目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "memory-pulse-mcp",
      "args": []
    }
  }
}
```

或全局配置 `~/.claude/mcp.json`：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "memory-pulse-mcp",
      "args": []
    }
  }
}
```

重启 Claude Code 即可使用。

## MCP 工具

| 工具 | 说明 |
|------|------|
| `mpulse_store` | 智能存储记忆，AI 自动分类 |
| `mpulse_store_decision` | 存储架构决策（强制完整字段） |
| `mpulse_store_solution` | 存储问题解决方案 |
| `mpulse_store_session` | 存储会话总结 |
| `mpulse_recall` | 多策略检索记忆 |
| `mpulse_timeline` | 查看项目时间线 |
| `mpulse_relations` | 查询记忆关系链 |

## 使用示例

### 存储决策

AI 调用 `mpulse_store_decision`：

```
问题：状态管理选择什么方案？
选项：
  - Redux: 生态成熟，但样板代码多
  - Zustand: 轻量简洁，TypeScript 友好
  - Jotai: 原子化状态，适合细粒度更新
选择：Zustand
理由：项目规模中等，追求开发效率，Zustand 学习成本低且类型支持好
```

### 检索记忆

AI 调用 `mpulse_recall`：

```
query: "状态管理"
projectId: "my-project"
strategy: "fulltext"
```

返回之前存储的决策记忆，包含完整的分析过程。

## 数据存储

默认使用 SQLite 存储在当前目录 `memory.db`。

自定义路径：

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "memory-pulse-mcp",
      "args": [],
      "env": {
        "MEMORY_DB_PATH": "/your/custom/path/memory.db"
      }
    }
  }
}
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test
```

## 项目结构

```
├── packages/
│   ├── core/           # 核心类型定义
│   ├── storage/        # SQLite/PostgreSQL 存储引擎
│   ├── mcp-server/     # MCP Server（发布到 npm）
│   ├── api/            # REST API (Hono)
│   ├── cli/            # CLI 工具
│   └── web/            # Web Dashboard (Next.js)
```

## Roadmap

- [x] MCP Server 核心功能
- [x] SQLite 本地存储
- [x] 多级检索（精确 + 全文）
- [ ] Web Dashboard 完善
- [ ] CLI 工具发布
- [ ] PostgreSQL 云版支持
- [ ] 语义检索（Embedding）

## License

[MIT](./LICENSE)
