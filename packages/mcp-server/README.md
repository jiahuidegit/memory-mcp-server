# Memory Pulse MCP Server

精准、结构化的 AI 上下文记忆系统 - MCP Server

## 安装

```bash
npm install -g memory-pulse-mcp-server
```

## 配置 Claude Code

在 `~/.claude/mcp.json` 或项目目录 `.mcp.json` 中添加：

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

## 可用工具

| 工具 | 说明 |
|------|------|
| `mpulse_store` | 智能存储记忆，AI 自动分类和结构化 |
| `mpulse_store_decision` | 存储架构决策（强制字段，防止 AI 偷懒） |
| `mpulse_store_solution` | 存储问题解决方案 |
| `mpulse_store_session` | 存储会话总结（会话结束时调用） |
| `mpulse_recall` | 检索记忆（多策略：精确、全文、语义） |
| `mpulse_timeline` | 查看项目的时间线视图 |
| `mpulse_relations` | 查询记忆的关系链 |

## 使用示例

### 存储决策

```
AI 会自动调用 mpulse_store_decision 工具：
- question: "状态管理选择什么？"
- options: [{ name: "Redux", pros: [...], cons: [...] }, ...]
- chosen: "Zustand"
- reason: "轻量、TypeScript 支持好"
```

### 检索记忆

```
AI 会自动调用 mpulse_recall 工具：
- query: "状态管理"
- projectId: "my-project"
- strategy: "fulltext"
```

## 数据存储

默认使用 SQLite 存储在当前目录的 `memory.db` 文件中。

## License

MIT
