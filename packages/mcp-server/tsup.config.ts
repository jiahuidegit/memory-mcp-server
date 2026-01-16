import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  // 打包内部依赖，不打包外部依赖
  noExternal: ['@emp/core', '@emp/storage'],
  external: [
    '@modelcontextprotocol/sdk',
    'better-sqlite3',
    'nanoid',
    '@prisma/client',  // PostgreSQL 存储依赖
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
