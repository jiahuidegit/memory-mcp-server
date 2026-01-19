# Memory Pulse MCP Server

[![GitHub Stars](https://img.shields.io/github/stars/jiahuidegit/memory-mcp-server?style=social)](https://github.com/jiahuidegit/memory-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/memory-pulse-mcp-server.svg)](https://www.npmjs.com/package/memory-pulse-mcp-server)

**🧠 A precise, structured AI context memory system. MCP Server designed for Claude Code.**

> ⭐ **If you find this project helpful, please give it a star on [GitHub](https://github.com/jiahuidegit/memory-mcp-server)!** Your support helps us improve!

[English](README.md) | [中文](README_CN.md)

---

## ❓ Why Memory Pulse?

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
| **Decision Tracking** | ✅ Forced structured fields | ❌ | ❌ | ❌ |
| **Relationship Graph** | ✅ Built-in | ❌ | ✅ | ❌ |
| **Timeline View** | ✅ Built-in | ❌ | ✅ | ❌ |
| **MCP Native** | ✅ | ❌ | ❌ | ❌ |
| **Local-first** | ✅ SQLite | Cloud-dependent | Cloud-dependent | Varies |
| **Zero Config** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Features

- 🧠 **Complete Context Preservation** - No compression, no information loss
- 🔍 **Multi-level Retrieval** - L1 Exact match → L2 Full-text search → L3 Semantic search
- 📋 **Structured Memory Types** - Decision / Solution / Session / Code / Error / Config
- 🔗 **Relationship Chains** - Track how memories relate and evolve
- 📅 **Timeline View** - See memory evolution over time
- 🎯 **Forced Structure** - AI must provide complete context (no lazy summaries)
- 💾 **Local-first** - SQLite storage, your data stays with you
- ⚡ **Zero Config** - Works out of the box

---

## 📦 Quick Start

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

## 🔄 Update to Latest Version

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

## 🎮 MCP Client Configuration

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

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMORY_STORAGE` | Storage type: `sqlite` or `postgresql` | `sqlite` |
| `MEMORY_DB_PATH` | SQLite database file path | `~/.emp/memory.db` |
| `DATABASE_URL` | PostgreSQL connection string (required for postgresql) | - |

### SQLite Storage (Default)

Zero configuration, works out of the box. Data is stored in `~/.emp/memory.db`:

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

> **Note**: When using PostgreSQL, the MCP Server will automatically create the required tables on first run.

---

## 🛠️ MCP Tools

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

## 💡 Usage Examples

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

✅ Decision stored with ID: mem_xxx
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

✅ Solution stored with ID: mem_xxx
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

## 📝 AI Prompt Configuration (CLAUDE.md)

To make AI automatically store and retrieve memories, add the following prompt rules to your project's `CLAUDE.md` or global `~/.claude/CLAUDE.md`:

### Session Startup Protocol (Recommended)

Add at the beginning of CLAUDE.md to ensure AI retrieves history at session start:

```markdown
# ⚠️ Session Startup Protocol (Highest Priority)

**Before processing any user request, execute the following steps:**

## Step 1: Extract Project Name
Extract project name from current working directory (last folder name)
Example: `/Users/xxx/work/my-app` → projectId = `my-app`

## Step 2: Retrieve History (Mandatory)
Call mpulse_recall to retrieve project history:
- query: "project context architecture decisions unfinished tasks config"
- projectId: extracted project name

## Step 3: Report Memory Results
- Has memories → Brief summary before processing user request
- No memories → State "No history found" then process user request

**⛔ Processing request without memory retrieval = Violation**
```

### Auto-Store Rules

Add these rules to make AI automatically store memories at key points:

```markdown
# Memory Pulse Rules

## Mandatory Storage Triggers

| Trigger | Tool | Required Fields |
|---------|------|-----------------|
| After architecture/tech decisions | `mpulse_store_decision` | question, options, chosen, reason |
| After solving complex problems | `mpulse_store_solution` | problem, rootCause, solution |
| Before session ends | `mpulse_store_session` | summary, unfinished tasks |
| Important config info | `mpulse_store` | content, rawContext |

## Storage Quality Requirements

### content vs rawContext (Important!)
- **content**: Brief summary (1-2 sentences), for list display
- **rawContext**: Complete original data, including all details

### Example
```json
{
  "content": "Configured PostgreSQL database connection",
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

## Retrieval Triggers

- Encountering similar issues → Search for existing solutions first
- Before tech decisions → Check previous decision records
- Continuing previous work → Retrieve last session summary
```

### Complete Configuration Example

```markdown
# CLAUDE.md

## Session Startup Protocol
[Session startup protocol content above]

## Memory Pulse Usage Rules

### Storage Rules
- After tech decisions → Must call mpulse_store_decision
- After solving problems → Must call mpulse_store_solution
- Before session ends → Must call mpulse_store_session
- User says "remember this" → Immediately call mpulse_store

### Retrieval Rules
- Session start → Auto-retrieve project history
- Facing issues → Search for related solutions first
- Tech decisions → Check previous decision records

### projectId Naming Convention
- Use current project folder name as projectId
- Cross-project knowledge uses projectId = "global"
```

---

## 🔍 Retrieval Algorithm

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

## 📊 Memory Types

| Type | Use Case | Required Fields |
|------|----------|-----------------|
| `decision` | Architectural choices | question, options, chosen, reason |
| `solution` | Problem fixes | problem, rootCause, solution |
| `session` | Session summaries | summary, decisions, nextSteps |
| `code` | Code implementations | content, artifacts |
| `error` | Error records | content, stackTrace |
| `config` | Configuration info | content, settings |

---

## 🖥️ Web Dashboard

Memory Pulse includes a beautiful Web Dashboard for visualizing and managing your memories.

### Features

| Feature | Description |
|---------|-------------|
| **Memory Management** | Browse, search, and create memories with a modern UI |
| **Timeline View** | See your memory evolution over time |
| **Relationship Graph** | Interactive visualization of memory connections |
| **Project Filtering** | Switch between projects with one click |
| **Full-text Search** | Quickly find any memory |

---

## 📖 Deployment Guide

Choose the deployment scenario that fits your needs:

### Scenario 1: SQLite (Local Personal Use)

**Best for**: Individual developers, lightweight usage, getting started quickly.

```
┌─────────────────────────────────────────┐
│  Your Local Machine                      │
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

**Step 1: Configure MCP Server**

Add to your Claude MCP config (`~/.claude.json` or `.mcp.json`):

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

**Step 2: Restart Claude** to activate the MCP Server.

**Step 3: Start Web Dashboard locally**

```bash
# Clone the repository
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start API server (reads config from ~/.emp/runtime-config.json)
pnpm --filter @emp/api dev &

# Start Web Dashboard
pnpm --filter @emp/web dev
```

**Step 4: Open http://localhost:3001** in your browser.

> **How it works**: When MCP Server starts, it writes its configuration to `~/.emp/runtime-config.json`. The API server reads this file and automatically connects to the same SQLite database.

---

### Scenario 2: PostgreSQL (Team / Production Use)

**Best for**: Team collaboration, multi-device access, production deployment.

```
┌──────────────────┐     ┌──────────────────┐
│  User A (Local)  │     │  User B (Local)  │
│  MCP Server      │     │  MCP Server      │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ↓                        ↓
      ┌─────────────────────────────┐
      │      PostgreSQL Database    │
      │   (Shared data storage)     │
      └──────────────┬──────────────┘
                     ↑
      ┌──────────────┴──────────────┐
      │      Web Dashboard          │
      │   (Deployed on server)      │
      │   http://your-server:3001   │
      └─────────────────────────────┘
```

**Step 1: Set up PostgreSQL database**

```bash
# Create database
createdb memory_pulse

# Or use Docker
docker run -d --name memory-pulse-db \
  -e POSTGRES_DB=memory_pulse \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15
```

**Step 2: Configure MCP Server for each user**

Add to Claude MCP config (`~/.claude.json` or `.mcp.json`):

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

**Step 3: Deploy Web Dashboard on your server**

```bash
# On your web server
git clone https://github.com/jiahuidegit/memory-mcp-server.git
cd memory-mcp-server

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Set environment variables
export MEMORY_STORAGE=postgresql
export DATABASE_URL="postgresql://postgres:your_password@your-db-server:5432/memory_pulse"

# Start API server
pnpm --filter @emp/api start &

# Start Web Dashboard
pnpm --filter @emp/web start
```

**Step 4: Access Web Dashboard** at `http://your-server:3001`

> **Key point**: Both MCP Server and Web Dashboard must use the **same DATABASE_URL** to see the same data.

---

### Configuration Priority

The system reads configuration in this order (first found wins):

1. **Environment variables** - `MEMORY_STORAGE`, `DATABASE_URL`, `MEMORY_DB_PATH`
2. **Runtime config file** - `~/.emp/runtime-config.json` (written by MCP Server)
3. **Default values** - SQLite at `~/.emp/memory.db`

---

### Docker Deployment (Production)

For production environments, you can use Docker:

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

### Screenshots

**Dashboard Home**
![Dashboard Home](assets/images/dashboard-home.png)

**Relationship Graph**
![Relationship Graph](assets/images/dashboard-relations.png)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Memory Pulse System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Claude Code  │    │Claude Desktop│    │  Other MCP   │       │
│  │              │    │              │    │   Clients    │       │
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
│  │  (Local)    │   │  (Remote)   │   │  Server     │            │
│  └─────────────┘   └──────┬──────┘   └──────┬──────┘            │
│                           │                 │                    │
│                           └────────┬────────┘                    │
│                                    ▼                             │
│                          ┌─────────────────┐                     │
│                          │  Web Dashboard  │                     │
│                          │  (Next.js App)  │                     │
│                          └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description | Technology |
|-----------|-------------|------------|
| **MCP Server** | Core memory operations via MCP protocol | Node.js, TypeScript |
| **Storage Layer** | Flexible storage backends | SQLite / PostgreSQL |
| **API Server** | RESTful API for web access | Express.js |
| **Web Dashboard** | Visual management interface | Next.js 15, React 19 |

---

## 🔒 Security & Privacy

1. **Local-first** - All data stored locally in SQLite, no cloud dependency
2. **Your Data** - Database file is yours, backup/migrate anytime
3. **No Telemetry** - Zero data collection or phone-home
4. **Project Isolation** - Memories isolated by projectId

---

## 🗺️ Roadmap

- [x] MCP Server core functionality
- [x] SQLite local storage
- [x] PostgreSQL cloud support
- [x] Multi-level retrieval (Exact + Full-text)
- [x] Decision/Solution/Session structured storage
- [x] Web Dashboard for visualization
- [ ] CLI tool for manual operations
- [ ] Semantic search (Embedding)
- [ ] Team collaboration features

---

## 📊 Star History

<a href="https://star-history.com/#jiahuidegit/memory-mcp-server&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=jiahuidegit/memory-mcp-server&type=Date" />
 </picture>
</a>

---

## 🤝 Contributing

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

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**⭐ If you find this project helpful, please give it a star!**

**🤝 Feel free to open issues for questions or submit PRs for improvements!**
