/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineConfig({
    test: {
      // 使用 happy-dom 模拟浏览器环境，降低内存占用
      environment: 'happy-dom',

      // 全局导入 test, expect, describe 等
      globals: true,

      // 测试设置文件
      setupFiles: ['./src/test/setup.ts'],

      // 包含的测试文件
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],

      // 排除的文件
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

      // 覆盖率配置
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        // 只包含 src 目录下的代码
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'node_modules/**',
          '**/node_modules/**',
          'src/test/**',
          '**/*.d.ts',
          '**/*.config.*',
          '**/types/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],
        // 覆盖率阈值 (目标: 40%)
        // thresholds: {
        //   statements: 40,
        //   branches: 40,
        //   functions: 40,
        //   lines: 40,
        // },
      },

      // 测试超时时间
      testTimeout: 10000,

      // 降低并发避免内存溢出
      pool: 'forks',
      poolOptions: {
        forks: {
          isolate: true,
        },
      },
      fileParallelism: false,
      isolate: true,
      maxConcurrency: 1,

      // 报告器
      reporters: ['verbose'],
    },
  })
);
