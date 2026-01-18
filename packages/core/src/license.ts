/**
 * License 验证模块
 *
 * 支持多种验证方式：
 * 1. 环境变量：MEMORY_LICENSE_KEY
 * 2. 本地文件：~/.memory-pulse/license.json
 * 3. 项目文件：.memory-pulse-license.json
 */

import { LicenseType, CloudFeature, type LicenseInfo } from './features.js';

// ============ License 格式 ============

/** License 文件格式 */
export interface LicenseFile {
  /** 许可证版本 */
  version: 1;
  /** 许可证 ID */
  licenseId: string;
  /** 许可证类型 */
  type: LicenseType;
  /** 组织名称 */
  organization: string;
  /** 签发日期 */
  issuedAt: string;
  /** 过期日期 */
  expiresAt: string;
  /** 最大用户数（可选） */
  maxUsers?: number;
  /** 启用的云功能（可选，不填则根据 type 决定） */
  enabledFeatures?: CloudFeature[];
  /** 签名（用于验证） */
  signature: string;
}

/** License Key 编码格式（base64 编码的简化信息） */
export interface LicenseKeyPayload {
  /** 许可证 ID */
  id: string;
  /** 许可证类型简写：o=开源, p=专业, e=企业 */
  t: 'o' | 'p' | 'e';
  /** 过期时间戳（秒） */
  exp: number;
  /** 签名 */
  sig: string;
}

// ============ 许可证解析 ============

/** 从 License Key 解析许可证信息 */
export function parseLicenseKey(key: string): LicenseInfo | null {
  try {
    // License Key 格式: MP-{base64 payload}
    if (!key.startsWith('MP-')) {
      return null;
    }

    const payload = key.slice(3);
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const data = JSON.parse(decoded) as LicenseKeyPayload;

    // 验证签名（简化版本，生产环境应使用非对称加密）
    if (!verifySignature(data)) {
      console.warn('[License] 签名验证失败');
      return null;
    }

    // 检查过期
    const expiresAt = new Date(data.exp * 1000);
    if (expiresAt < new Date()) {
      console.warn('[License] 许可证已过期');
      return null;
    }

    // 映射类型
    const typeMap: Record<string, LicenseType> = {
      o: LicenseType.OPEN_SOURCE,
      p: LicenseType.PROFESSIONAL,
      e: LicenseType.ENTERPRISE,
    };

    return {
      type: typeMap[data.t] || LicenseType.OPEN_SOURCE,
      licenseId: data.id,
      expiresAt,
      enabledCloudFeatures: getDefaultFeaturesForType(typeMap[data.t]),
    };
  } catch (error) {
    console.warn('[License] 解析 License Key 失败:', error);
    return null;
  }
}

/** 从 License 文件解析许可证信息 */
export function parseLicenseFile(content: string): LicenseInfo | null {
  try {
    const data = JSON.parse(content) as LicenseFile;

    // 验证版本
    if (data.version !== 1) {
      console.warn('[License] 不支持的许可证版本:', data.version);
      return null;
    }

    // 验证签名
    if (!verifyFileSignature(data)) {
      console.warn('[License] 文件签名验证失败');
      return null;
    }

    // 检查过期
    const expiresAt = new Date(data.expiresAt);
    if (expiresAt < new Date()) {
      console.warn('[License] 许可证已过期');
      return null;
    }

    return {
      type: data.type,
      licenseId: data.licenseId,
      organization: data.organization,
      expiresAt,
      maxUsers: data.maxUsers,
      enabledCloudFeatures:
        data.enabledFeatures || getDefaultFeaturesForType(data.type),
    };
  } catch (error) {
    console.warn('[License] 解析 License 文件失败:', error);
    return null;
  }
}

// ============ 签名验证 ============

/** 验证 License Key 签名（简化版本） */
function verifySignature(data: LicenseKeyPayload): boolean {
  // 生产环境应使用 RSA/ECDSA 非对称加密验证
  // 这里使用简化的 HMAC 验证作为示例
  const payload = `${data.id}:${data.t}:${data.exp}`;
  const expectedSig = simpleHash(payload);
  return data.sig === expectedSig;
}

/** 验证 License 文件签名 */
function verifyFileSignature(data: LicenseFile): boolean {
  // 生产环境应使用 RSA/ECDSA 非对称加密验证
  const payload = `${data.licenseId}:${data.type}:${data.organization}:${data.expiresAt}`;
  const expectedSig = simpleHash(payload);
  return data.signature === expectedSig;
}

/** 简单哈希（仅用于演示，生产环境使用 crypto） */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============ 默认功能配置 ============

/** 根据许可证类型获取默认启用的云功能 */
function getDefaultFeaturesForType(type: LicenseType): CloudFeature[] {
  switch (type) {
    case LicenseType.PROFESSIONAL:
      return [
        CloudFeature.WORKSPACE_MANAGEMENT,
        CloudFeature.OAUTH_INTEGRATION,
        CloudFeature.RBAC,
        CloudFeature.AUTO_BACKUP,
        CloudFeature.DATA_EXPORT,
        CloudFeature.SEMANTIC_SEARCH,
        CloudFeature.ADVANCED_ANALYTICS,
        CloudFeature.WEBHOOK,
      ];

    case LicenseType.ENTERPRISE:
      return Object.values(CloudFeature);

    default:
      return [];
  }
}

// ============ License 加载器 ============

export interface LicenseLoaderOptions {
  /** 环境变量名 */
  envVar?: string;
  /** 本地文件路径 */
  localPath?: string;
  /** 项目文件路径 */
  projectPath?: string;
}

const DEFAULT_OPTIONS: LicenseLoaderOptions = {
  envVar: 'MEMORY_LICENSE_KEY',
  localPath: '~/.memory-pulse/license.json',
  projectPath: '.memory-pulse-license.json',
};

/** 从多个来源加载许可证 */
export async function loadLicense(
  options: LicenseLoaderOptions = {}
): Promise<LicenseInfo> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. 尝试从环境变量加载
  if (opts.envVar) {
    const key = process.env[opts.envVar];
    if (key) {
      const license = parseLicenseKey(key);
      if (license) {
        console.log('[License] 从环境变量加载许可证:', license.type);
        return license;
      }
    }
  }

  // 2. 尝试从本地文件加载
  if (opts.localPath) {
    const license = await loadLicenseFromFile(expandPath(opts.localPath));
    if (license) {
      console.log('[License] 从本地文件加载许可证:', license.type);
      return license;
    }
  }

  // 3. 尝试从项目文件加载
  if (opts.projectPath) {
    const license = await loadLicenseFromFile(opts.projectPath);
    if (license) {
      console.log('[License] 从项目文件加载许可证:', license.type);
      return license;
    }
  }

  // 4. 默认返回开源版
  console.log('[License] 使用开源版许可证');
  return {
    type: LicenseType.OPEN_SOURCE,
    enabledCloudFeatures: [],
  };
}

/** 从文件加载许可证 */
async function loadLicenseFromFile(path: string): Promise<LicenseInfo | null> {
  try {
    // 动态导入 fs（兼容浏览器环境）
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return parseLicenseFile(content);
  } catch {
    // 文件不存在或无法读取
    return null;
  }
}

/** 展开路径中的 ~ */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    return path.replace('~', home);
  }
  return path;
}

// ============ License Key 生成（用于测试） ============

/** 生成测试用 License Key */
export function generateTestLicenseKey(
  type: LicenseType,
  daysValid: number = 365
): string {
  const typeMap: Record<LicenseType, 'o' | 'p' | 'e'> = {
    [LicenseType.OPEN_SOURCE]: 'o',
    [LicenseType.PROFESSIONAL]: 'p',
    [LicenseType.ENTERPRISE]: 'e',
  };

  const exp = Math.floor(Date.now() / 1000) + daysValid * 24 * 60 * 60;
  const id = `TEST-${Date.now().toString(36).toUpperCase()}`;

  const payload: LicenseKeyPayload = {
    id,
    t: typeMap[type],
    exp,
    sig: '', // 先计算 payload
  };

  // 计算签名
  payload.sig = simpleHash(`${payload.id}:${payload.t}:${payload.exp}`);

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `MP-${encoded}`;
}
