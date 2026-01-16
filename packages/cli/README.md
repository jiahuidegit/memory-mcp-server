# CMS CLI 使用指南

Context Memory System 命令行工具。

## 安装

```bash
# 在项目根目录
pnpm install
pnpm build
```

## 配置

可以在以下位置创建 `.cmsrc.json` 配置文件（优先级从高到低）：

1. 当前目录
2. 用户主目录 (`~/.cmsrc.json`)

配置示例：

```json
{
  "dbPath": "~/.cms/memory.db",
  "defaultProject": "my-project",
  "enableCache": true,
  "cacheSize": 100
}
```

## 命令

### 1. 存储记忆

```bash
cms store \
  --content "实现了用户认证功能" \
  --project "myapp" \
  --type code \
  --tags "auth,feature" \
  --data '{"files": ["auth.ts", "user.ts"]}'
```

**参数**：
- `-c, --content <content>` - 内容摘要（必需）
- `-p, --project <id>` - 项目 ID（可选，使用配置中的默认值）
- `-t, --type <type>` - 类型：decision/solution/config/code/error/session（默认：code）
- `-T, --tags <tags>` - 标签，逗号分隔
- `-s, --session <id>` - 会话 ID
- `-d, --data <json>` - 原始数据（JSON 格式）

### 2. 检索记忆

```bash
cms recall "认证" --project "myapp" --limit 10 --details
```

**参数**：
- `<query>` - 查询内容（必需）
- `-p, --project <id>` - 项目 ID
- `-t, --type <type>` - 类型过滤
- `-T, --tags <tags>` - 标签过滤
- `-s, --strategy <strategy>` - 策略：exact/fulltext/semantic（默认：exact）
- `-l, --limit <number>` - 返回数量（默认：10）
- `-d, --details` - 显示详细信息

### 3. 存储决策

```bash
cms decision \
  --question "选择前端框架" \
  --options '[
    {"name": "React", "pros": ["生态好"], "cons": ["学习曲线"]},
    {"name": "Vue", "pros": ["简单"], "cons": ["生态小"]}
  ]' \
  --chosen "React" \
  --reason "团队熟悉度高" \
  --project "myapp"
```

**参数**：
- `-q, --question <question>` - 决策问题（必需）
- `-o, --options <json>` - 选项列表 JSON（必需）
- `-c, --chosen <name>` - 选择的方案（必需）
- `-r, --reason <reason>` - 选择理由（必需）
- `-p, --project <id>` - 项目 ID
- `-T, --tags <tags>` - 标签
- `-s, --session <id>` - 会话 ID

### 4. 存储解决方案

```bash
cms solution \
  --problem "数据库查询慢" \
  --cause "缺少索引" \
  --solution "添加复合索引" \
  --prevention "定期性能监控" \
  --related "slow-query-001" \
  --project "myapp"
```

**参数**：
- `--problem <problem>` - 问题描述（必需）
- `--cause <cause>` - 根本原因（必需）
- `--solution <solution>` - 解决方案（必需）
- `--prevention <prevention>` - 预防措施
- `--related <issues>` - 关联问题，逗号分隔
- `-p, --project <id>` - 项目 ID
- `-T, --tags <tags>` - 标签
- `-s, --session <id>` - 会话 ID

### 5. 存储会话

```bash
cms session \
  --summary "完成了认证模块开发" \
  --session-id "session-123" \
  --decisions "使用 JWT,启用 2FA" \
  --unfinished "添加单元测试" \
  --next "集成测试,部署" \
  --project "myapp"
```

**参数**：
- `-s, --summary <summary>` - 会话总结（必需）
- `-i, --session-id <id>` - 会话 ID（必需）
- `-p, --project <id>` - 项目 ID
- `-d, --decisions <decisions>` - 决策列表，逗号分隔
- `-u, --unfinished <tasks>` - 未完成任务，逗号分隔
- `-n, --next <steps>` - 下一步计划，逗号分隔

### 6. 查看时间线

```bash
cms timeline --project "myapp" --type decision --limit 50 --details
```

**参数**：
- `-p, --project <id>` - 项目 ID（必需）
- `-t, --type <type>` - 类型过滤
- `-l, --limit <number>` - 返回数量（默认：50）
- `-d, --details` - 显示详细信息

### 7. 查看关系链

```bash
cms relations <memoryId> --depth 2
```

**参数**：
- `<memoryId>` - 记忆 ID（必需）
- `-d, --depth <number>` - 递归深度（默认：2）

## 示例工作流

```bash
# 1. 设置默认项目
echo '{"defaultProject": "myapp"}' > .cmsrc.json

# 2. 存储开发记录
cms store --content "实现用户注册功能" --type code --tags "auth,register"

# 3. 存储决策
cms decision \
  --question "选择密码加密方案" \
  --options '[{"name":"bcrypt","pros":["安全"],"cons":["慢"]},{"name":"argon2","pros":["更安全","快"],"cons":["新"]}]' \
  --chosen "argon2" \
  --reason "性能和安全的平衡"

# 4. 遇到问题，记录解决方案
cms solution \
  --problem "argon2 在某些环境无法编译" \
  --cause "缺少 C++ 构建工具" \
  --solution "回退到 bcrypt" \
  --prevention "提前测试所有目标环境"

# 5. 查看项目历史
cms timeline --limit 100

# 6. 搜索相关记忆
cms recall "密码" --details

# 7. 会话结束，保存总结
cms session \
  --summary "完成用户认证模块" \
  --session-id "2024-01-14" \
  --decisions "使用 bcrypt" \
  --next "添加 2FA 支持"
```

## 输出格式

CLI 使用彩色输出和 spinner 动画，让操作更加直观：

- ✓ 绿色：成功
- ✗ 红色：错误
- 🔵 蓝色：决策
- 🟢 绿色：解决方案
- 🟡 黄色：配置
- 🟣 紫色：代码
- 🔴 红色：错误
- 🔵 青色：会话

## 性能提示

- 启用缓存（默认开启）可以显著提升重复查询性能
- 使用 `--limit` 控制返回数量，避免大量数据输出
- 缓存命中时会显示"(缓存命中)"标识
