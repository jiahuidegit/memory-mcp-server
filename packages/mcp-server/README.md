# Memory Pulse MCP Server

[![GitHub Stars](https://img.shields.io/github/stars/jiahuidegit/memory-mcp-server?style=social)](https://github.com/jiahuidegit/memory-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)

**A precise, structured AI context memory system. MCP Server designed for Claude Code.**

> **If you find this project helpful, please give it a star on [GitHub](https://github.com/jiahuidegit/memory-mcp-server)!** Your support helps us improve!

[English](https://github.com/jiahuidegit/memory-mcp-server#readme) | [中文](https://github.com/jiahuidegit/memory-mcp-server/blob/main/README_CN.md)

---

## Why Memory Pulse?

### The Problem with Existing AI Memory Solutions

| Problem | Traditional Solutions | Memory Pulse |
|---------|----------------------|--------------|
| **Information Loss** | Vector compression loses details | Complete context preservation |
| **Imprecise Retrieval** | Semantic-only search misses exact matches | Multi-level: Exact → Full-text → Semantic |
| **Decision Gap** | Stores conclusions, not reasoning | Structured: Problem → Analysis → Options → Decision |
| **Context Fragmentation** | Scattered, unrelated memories | Relationship chains & timeline tracking |

### Comparison with Other Memory Systems

| Feature | Memory Pulse | mem0 | Zep | LangChain Memory |
|---------|-------------|------|-----|------------------|
| **Storage** | Full context (no compression) | Vector embeddings | Vector + Graph | Vector embeddings |
| **Retrieval Strategy** | L1 Exact → L2 Full-text → L3 Semantic | Semantic only | Semantic + Temporal | Semantic only |
| **Decision Tracking** | Forced structured fields | - | - | - |
| **Relationship Graph** | Built-in | - | Built-in | - |
| **Timeline View** | Built-in | - | Built-in | - |
| **MCP Native** | Yes | - | - | - |
| **Local-first** | SQLite | Cloud-dependent | Cloud-dependent | Varies |
| **Zero Config** | Yes | - | - | - |

---

## Features

- **Complete Context Preservation** - No compression, no information loss
- **Multi-level Retrieval** - L1 Exact match → L2 Full-text search → L3 Semantic search
- **Structured Memory Types** - Decision / Solution / Session / Code / Error / Config
- **Relationship Chains** - Track how memories relate and evolve
- **Timeline View** - See memory evolution over time
- **Forced Structure** - AI must provide complete context (no lazy summaries)
- **Local-first** - SQLite storage, your data stays with you
- **Zero Config** - Works out of the box

---

## Quick Start

### Option 1: Run with npx (Recommended)

```bash
npx memory-pulse-mcp-server
```

### Option 2: Global Installation

```bash
npm install -g memory-pulse-mcp-server
memory-pulse-mcp
```

### Option 3: Build from Source

```bash
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server
pnpm install
pnpm build
```

---

## Update to Latest Version

### If using npx (Recommended)

npx automatically uses the latest version, just restart your MCP client.

### If globally installed

```bash
npm update -g memory-pulse-mcp-server
# Or reinstall
npm install -g memory-pulse-mcp-server@latest
```

### Check current version

```bash
npm list -g memory-pulse-mcp-server
```

---

## MCP Client Configuration

### Claude Code

Create `.mcp.json` in your project directory:

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

Or global configuration at `~/.claude/mcp.json`:

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

Edit the configuration file:

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

Restart the client after configuration.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMORY_STORAGE` | Storage type: `sqlite` or `postgresql` | `sqlite` |
| `MEMORY_DB_PATH` | SQLite database file path | `./memory.db` |
| `DATABASE_URL` | PostgreSQL connection string (required for postgresql) | - |

### SQLite Storage (Default)

Zero configuration, works out of the box:

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

### Custom SQLite Path

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

### PostgreSQL Storage

For production deployments or team usage:

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

> **Note**: PostgreSQL storage requires `@prisma/client`. Install it manually if needed:
> ```bash
> npm install @prisma/client
> ```

---

## MCP Tools

### Memory Storage

| Tool | Description |
|------|-------------|
| `mpulse_store` | Smart memory storage with auto-classification |
| `mpulse_store_decision` | Store architectural decisions (forced complete fields) |
| `mpulse_store_solution` | Store problem solutions (problem → root cause → solution) |
| `mpulse_store_session` | Store session summaries (call at session end) |

### Memory Retrieval

| Tool | Description |
|------|-------------|
| `mpulse_recall` | Multi-strategy memory retrieval |
| `mpulse_timeline` | View project timeline |
| `mpulse_relations` | Query memory relationship chains |

---

## Usage Examples

### Store a Decision

When you make an architectural decision, AI calls `mpulse_store_decision`:

```
User: Let's use Zustand for state management instead of Redux

AI: [calls mpulse_store_decision]
{
  "question": "Which state management solution to use?",
  "options": [
    { "name": "Redux", "pros": ["Mature ecosystem", "DevTools"], "cons": ["Boilerplate heavy"] },
    { "name": "Zustand", "pros": ["Lightweight", "TypeScript friendly"], "cons": ["Smaller ecosystem"] }
  ],
  "chosen": "Zustand",
  "reason": "Project is medium-sized, prioritizing development efficiency. Zustand has lower learning curve.",
  "projectId": "my-app"
}

Decision stored with ID: mem_xxx
```

### Store a Solution

When you solve a problem, AI calls `mpulse_store_solution`:

```
User: Fixed the memory leak in useEffect

AI: [calls mpulse_store_solution]
{
  "problem": "Memory leak warning in React component",
  "rootCause": "Async operation continues after component unmount",
  "solution": "Added cleanup function in useEffect to cancel pending requests",
  "projectId": "my-app"
}

Solution stored with ID: mem_xxx
```

### Recall Memories

When you need context from previous sessions:

```
User: What did we decide about state management?

AI: [calls mpulse_recall]
{
  "query": "state management",
  "projectId": "my-app",
  "strategy": "fulltext"
}

Found: Decision from 2 days ago - Chose Zustand because...
```

### View Timeline

```
User: Show me what we worked on this week

AI: [calls mpulse_timeline]
{
  "projectId": "my-app",
  "limit": 20
}

Timeline:
- Jan 15: Decision - State management (Zustand)
- Jan 15: Solution - Memory leak fix
- Jan 14: Decision - API architecture (REST vs GraphQL)
...
```

### Query Relationships

```
User: What decisions are related to our API design?

AI: [calls mpulse_relations]
{
  "memoryId": "mem_api_decision",
  "depth": 2
}

Relationships:
- mem_api_decision (Decision: REST API)
  ├── mem_auth_solution (Solution: JWT implementation)
  └── mem_error_handling (Decision: Error response format)
```

---

## Retrieval Algorithm

Memory Pulse uses a **3-level cascade retrieval strategy**:

```
┌─────────────────────────────────────────────────────┐
│                    User Query                        │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│  L1: Exact Match (< 10ms)                           │
│  - projectId + type + keywords index                │
│  - Returns if matches ≥ 5                           │
└─────────────────────┬───────────────────────────────┘
                      ▼ (if insufficient)
┌─────────────────────────────────────────────────────┐
│  L2: Full-text Search (< 100ms)                     │
│  - SQLite FTS5 / PostgreSQL full-text               │
│  - Chinese + English tokenization                   │
│  - Returns if matches ≥ 3                           │
└─────────────────────┬───────────────────────────────┘
                      ▼ (if insufficient)
┌─────────────────────────────────────────────────────┐
│  L3: Semantic Search (< 500ms)                      │
│  - Embedding similarity (optional)                  │
│  - Fallback for fuzzy queries                       │
└─────────────────────────────────────────────────────┘
```

**Why this approach?**

- **Precision first**: Exact matches are faster and more accurate
- **Graceful degradation**: Falls back to broader search when needed
- **No false positives**: Semantic search is last resort, not default

---

## Memory Types

| Type | Use Case | Required Fields |
|------|----------|-----------------|
| `decision` | Architectural choices | question, options, chosen, reason |
| `solution` | Problem fixes | problem, rootCause, solution |
| `session` | Session summaries | summary, decisions, nextSteps |
| `code` | Code implementations | content, artifacts |
| `error` | Error records | content, stackTrace |
| `config` | Configuration info | content, settings |

---

## Security & Privacy

1. **Local-first** - All data stored locally in SQLite, no cloud dependency
2. **Your Data** - Database file is yours, backup/migrate anytime
3. **No Telemetry** - Zero data collection or phone-home
4. **Project Isolation** - Memories isolated by projectId

---

## Roadmap

- [x] MCP Server core functionality
- [x] SQLite local storage
- [x] PostgreSQL cloud support
- [x] Multi-level retrieval (Exact + Full-text)
- [x] Decision/Solution/Session structured storage
- [ ] Web Dashboard for visualization
- [ ] CLI tool for manual operations
- [ ] Semantic search (Embedding)
- [ ] Team collaboration features

---

## Star History

<a href="https://star-history.com/#jiahuidegit/memory-mcp-server&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
 </picture>
</a>

---

## Contributing

Issues and Pull Requests are welcome!

```bash
# Development
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server
pnpm install
pnpm build
pnpm test
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**If you find this project helpful, please give it a star!**

**Feel free to open issues for questions or submit PRs for improvements!**
