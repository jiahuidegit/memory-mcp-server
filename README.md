# Memory Pulse (记忆脉搏)

> ELB Memory Pulse - 精准、结构化的 AI 上下文记忆系统

## 核心特性

- ✅ **完整上下文保留** - 不压缩，不丢失细节
- ✅ **结构化存储** - 保存决策路径，不只是结论
- ✅ **多级检索** - 精确匹配 + 全文搜索 + 语义检索
- ✅ **Timeline 视图** - 清晰的记忆演进历史
- ✅ **关系链追溯** - 了解记忆之间的关联
- ✅ **MCP 原生支持** - 无缝集成 Claude Code
- ✅ **团队协作** - 支持多人共享项目记忆

## 项目结构

```
elb-memory-pulse/
├── packages/
│   ├── core/              # 核心数据模型和类型定义 (@emp/core)
│   ├── storage/           # 存储层实现 (@emp/storage)
│   ├── mcp-server/        # MCP Server 实现 (@emp/mcp-server)
│   ├── api/               # REST API (Hono) (@emp/api)
│   ├── web/               # Next.js Dashboard (@emp/web)
│   └── cli/               # CLI 工具 (@emp/cli)
├── apps/
│   ├── docs/              # 文档站点
│   └── examples/          # 示例项目
├── docs/                  # 技术设计文档
├── scripts/               # 构建脚本
└── config/                # 共享配置
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## MCP 配置

在 Claude Code 项目中使用，创建 `.mcp.json`:

```json
{
  "mcpServers": {
    "memory-pulse": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/index.js"],
      "env": {
        "EMP_DB_PATH": "/path/to/data/memory.db"
      }
    }
  }
}
```

## MCP 工具

- `mpulse_store` - 智能存储记忆
- `mpulse_store_decision` - 存储架构决策
- `mpulse_store_solution` - 存储解决方案
- `mpulse_store_session` - 存储会话总结
- `mpulse_recall` - 检索记忆
- `mpulse_timeline` - 时间线视图
- `mpulse_relations` - 关系链查询

## CLI 命令

```bash
# 安装后可用的命令
mpulse store "内容" --project my-project
mpulse recall "查询" --project my-project
mpulse timeline --project my-project
```

## 版本

- **开源版**: SQLite 本地存储，适合个人使用
- **云版**: PostgreSQL + Meilisearch，支持团队协作

## 文档

- [架构设计](./docs/architecture/)
- [API 文档](./docs/api/)
- [使用指南](./docs/guides/)
- [操作手册](./docs/OPERATION_MANUAL.md)

## License

MIT (开源版) / Commercial (云版)
