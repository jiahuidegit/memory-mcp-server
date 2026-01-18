/**
 * Feature Flag 系统
 *
 * 采用 Open Core 模式：
 * - 开源版（MIT）：完整功能的 MCP Server、CLI、Web Dashboard、SQLite/PostgreSQL 存储
 * - 闭源部分（Commercial）：云平台服务（多租户、计费、SSO、审计等）
 */

// ============ 功能分类 ============

/** 开源功能（默认开启） */
export enum OpenSourceFeature {
  // 存储
  SQLITE_STORAGE = 'sqlite_storage',
  POSTGRESQL_STORAGE = 'postgresql_storage',

  // 检索
  EXACT_SEARCH = 'exact_search',
  FULLTEXT_SEARCH = 'fulltext_search',

  // 记忆类型
  DECISION_MEMORY = 'decision_memory',
  SOLUTION_MEMORY = 'solution_memory',
  SESSION_MEMORY = 'session_memory',

  // 视图
  TIMELINE_VIEW = 'timeline_view',
  RELATIONS_VIEW = 'relations_view',

  // 接口
  MCP_SERVER = 'mcp_server',
  REST_API = 'rest_api',
  WEB_DASHBOARD = 'web_dashboard',
  CLI_TOOL = 'cli_tool',
}

/** 云平台功能（需要授权） */
export enum CloudFeature {
  // 多租户
  MULTI_TENANT = 'multi_tenant',
  WORKSPACE_MANAGEMENT = 'workspace_management',

  // 用户管理
  SSO_SAML = 'sso_saml',
  OAUTH_INTEGRATION = 'oauth_integration',
  RBAC = 'rbac',

  // 数据服务
  AUTO_BACKUP = 'auto_backup',
  DATA_EXPORT = 'data_export',
  DATA_MIGRATION = 'data_migration',

  // 高级功能
  SEMANTIC_SEARCH = 'semantic_search',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  AUDIT_LOG = 'audit_log',

  // 集成
  WEBHOOK = 'webhook',
  CUSTOM_STORAGE = 'custom_storage',

  // 支持
  PRIORITY_SUPPORT = 'priority_support',
}

// ============ 许可证类型 ============

export enum LicenseType {
  /** 开源版 - 所有开源功能 */
  OPEN_SOURCE = 'open_source',

  /** 专业版 - 开源 + 部分云功能 */
  PROFESSIONAL = 'professional',

  /** 企业版 - 所有功能 */
  ENTERPRISE = 'enterprise',
}

// ============ 类型定义 ============

export type FeatureKey = OpenSourceFeature | CloudFeature;

export interface FeatureConfig {
  /** 功能键 */
  key: FeatureKey;
  /** 功能名称 */
  name: string;
  /** 功能描述 */
  description: string;
  /** 是否开源功能 */
  isOpenSource: boolean;
  /** 所需最低许可证 */
  requiredLicense: LicenseType;
  /** 是否启用 */
  enabled: boolean;
}

export interface LicenseInfo {
  /** 许可证类型 */
  type: LicenseType;
  /** 许可证 ID */
  licenseId?: string;
  /** 组织名称 */
  organization?: string;
  /** 过期时间 */
  expiresAt?: Date;
  /** 最大用户数 */
  maxUsers?: number;
  /** 启用的云功能 */
  enabledCloudFeatures: CloudFeature[];
}

// ============ 功能注册表 ============

const FEATURE_REGISTRY: Record<FeatureKey, Omit<FeatureConfig, 'key' | 'enabled'>> = {
  // 开源功能
  [OpenSourceFeature.SQLITE_STORAGE]: {
    name: 'SQLite 存储',
    description: '本地 SQLite 数据库存储',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.POSTGRESQL_STORAGE]: {
    name: 'PostgreSQL 存储',
    description: 'PostgreSQL 云端数据库存储',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.EXACT_SEARCH]: {
    name: '精确搜索',
    description: 'L1 精确匹配搜索',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.FULLTEXT_SEARCH]: {
    name: '全文搜索',
    description: 'L2 全文索引搜索',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.DECISION_MEMORY]: {
    name: '决策记忆',
    description: '结构化架构决策记录',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.SOLUTION_MEMORY]: {
    name: '方案记忆',
    description: '问题解决方案记录',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.SESSION_MEMORY]: {
    name: '会话记忆',
    description: '会话总结记录',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.TIMELINE_VIEW]: {
    name: '时间线视图',
    description: '记忆时间线展示',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.RELATIONS_VIEW]: {
    name: '关系视图',
    description: '记忆关系链展示',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.MCP_SERVER]: {
    name: 'MCP Server',
    description: 'Model Context Protocol 服务器',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.REST_API]: {
    name: 'REST API',
    description: 'HTTP REST API 接口',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.WEB_DASHBOARD]: {
    name: 'Web Dashboard',
    description: 'Web 可视化管理面板',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },
  [OpenSourceFeature.CLI_TOOL]: {
    name: 'CLI 工具',
    description: '命令行管理工具',
    isOpenSource: true,
    requiredLicense: LicenseType.OPEN_SOURCE,
  },

  // 云平台功能
  [CloudFeature.MULTI_TENANT]: {
    name: '多租户',
    description: '多租户隔离与管理',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
  [CloudFeature.WORKSPACE_MANAGEMENT]: {
    name: '工作空间管理',
    description: '团队工作空间管理',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.SSO_SAML]: {
    name: 'SSO/SAML',
    description: '单点登录与 SAML 集成',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
  [CloudFeature.OAUTH_INTEGRATION]: {
    name: 'OAuth 集成',
    description: 'OAuth 2.0 身份验证',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.RBAC]: {
    name: '角色权限',
    description: '基于角色的访问控制',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.AUTO_BACKUP]: {
    name: '自动备份',
    description: '定时自动备份数据',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.DATA_EXPORT]: {
    name: '数据导出',
    description: '批量数据导出',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.DATA_MIGRATION]: {
    name: '数据迁移',
    description: '跨存储数据迁移',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
  [CloudFeature.SEMANTIC_SEARCH]: {
    name: '语义搜索',
    description: 'L3 向量语义搜索',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.ADVANCED_ANALYTICS]: {
    name: '高级分析',
    description: '使用统计与趋势分析',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.AUDIT_LOG]: {
    name: '审计日志',
    description: '操作审计记录',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
  [CloudFeature.WEBHOOK]: {
    name: 'Webhook',
    description: 'Webhook 事件推送',
    isOpenSource: false,
    requiredLicense: LicenseType.PROFESSIONAL,
  },
  [CloudFeature.CUSTOM_STORAGE]: {
    name: '自定义存储',
    description: '自定义存储后端',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
  [CloudFeature.PRIORITY_SUPPORT]: {
    name: '优先支持',
    description: '优先技术支持',
    isOpenSource: false,
    requiredLicense: LicenseType.ENTERPRISE,
  },
};

// ============ Feature Flag 管理器 ============

export class FeatureManager {
  private license: LicenseInfo;
  private overrides: Map<FeatureKey, boolean> = new Map();

  constructor(license?: Partial<LicenseInfo>) {
    // 默认开源版许可证
    this.license = {
      type: LicenseType.OPEN_SOURCE,
      enabledCloudFeatures: [],
      ...license,
    };
  }

  /** 检查功能是否启用 */
  isEnabled(feature: FeatureKey): boolean {
    // 检查手动覆盖
    if (this.overrides.has(feature)) {
      return this.overrides.get(feature)!;
    }

    const config = FEATURE_REGISTRY[feature];
    if (!config) {
      return false;
    }

    // 开源功能默认启用
    if (config.isOpenSource) {
      return true;
    }

    // 云功能需要检查许可证
    return this.checkLicenseForFeature(feature as CloudFeature);
  }

  /** 检查许可证是否支持某云功能 */
  private checkLicenseForFeature(feature: CloudFeature): boolean {
    // 检查许可证是否过期
    if (this.license.expiresAt && new Date() > this.license.expiresAt) {
      return false;
    }

    // 检查是否在启用列表中
    if (this.license.enabledCloudFeatures.includes(feature)) {
      return true;
    }

    // 检查许可证类型是否满足要求
    const config = FEATURE_REGISTRY[feature];
    return this.isLicenseTypeAtLeast(config.requiredLicense);
  }

  /** 检查许可证等级 */
  private isLicenseTypeAtLeast(required: LicenseType): boolean {
    const levels: Record<LicenseType, number> = {
      [LicenseType.OPEN_SOURCE]: 0,
      [LicenseType.PROFESSIONAL]: 1,
      [LicenseType.ENTERPRISE]: 2,
    };
    return levels[this.license.type] >= levels[required];
  }

  /** 获取功能配置 */
  getFeatureConfig(feature: FeatureKey): FeatureConfig {
    const config = FEATURE_REGISTRY[feature];
    return {
      key: feature,
      ...config,
      enabled: this.isEnabled(feature),
    };
  }

  /** 获取所有功能配置 */
  getAllFeatures(): FeatureConfig[] {
    return Object.entries(FEATURE_REGISTRY).map(([key, config]) => ({
      key: key as FeatureKey,
      ...config,
      enabled: this.isEnabled(key as FeatureKey),
    }));
  }

  /** 获取所有开源功能 */
  getOpenSourceFeatures(): FeatureConfig[] {
    return this.getAllFeatures().filter(f => f.isOpenSource);
  }

  /** 获取所有云功能 */
  getCloudFeatures(): FeatureConfig[] {
    return this.getAllFeatures().filter(f => !f.isOpenSource);
  }

  /** 获取当前许可证信息 */
  getLicense(): LicenseInfo {
    return { ...this.license };
  }

  /** 更新许可证 */
  setLicense(license: Partial<LicenseInfo>): void {
    this.license = { ...this.license, ...license };
  }

  /** 手动覆盖功能开关（用于测试或特殊场景） */
  override(feature: FeatureKey, enabled: boolean): void {
    this.overrides.set(feature, enabled);
  }

  /** 清除覆盖 */
  clearOverride(feature: FeatureKey): void {
    this.overrides.delete(feature);
  }

  /** 清除所有覆盖 */
  clearAllOverrides(): void {
    this.overrides.clear();
  }

  /** 要求某功能可用，否则抛出异常 */
  require(feature: FeatureKey): void {
    if (!this.isEnabled(feature)) {
      const config = FEATURE_REGISTRY[feature];
      throw new FeatureNotAvailableError(
        feature,
        config.name,
        config.requiredLicense
      );
    }
  }
}

// ============ 错误类型 ============

export class FeatureNotAvailableError extends Error {
  constructor(
    public readonly feature: FeatureKey,
    public readonly featureName: string,
    public readonly requiredLicense: LicenseType
  ) {
    super(
      `功能 "${featureName}" 不可用。需要 ${requiredLicense} 许可证。` +
      `\n访问 https://memory-pulse.com/pricing 了解更多。`
    );
    this.name = 'FeatureNotAvailableError';
  }
}

// ============ 全局实例 ============

/** 全局 Feature Manager 实例 */
let globalFeatureManager: FeatureManager | null = null;

/** 获取全局 Feature Manager */
export function getFeatureManager(): FeatureManager {
  if (!globalFeatureManager) {
    globalFeatureManager = new FeatureManager();
  }
  return globalFeatureManager;
}

/** 初始化全局 Feature Manager */
export function initFeatureManager(license?: Partial<LicenseInfo>): FeatureManager {
  globalFeatureManager = new FeatureManager(license);
  return globalFeatureManager;
}

/** 快捷方法：检查功能是否启用 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return getFeatureManager().isEnabled(feature);
}

/** 快捷方法：要求功能可用 */
export function requireFeature(feature: FeatureKey): void {
  getFeatureManager().require(feature);
}
