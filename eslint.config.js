import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
  },
  // 对特定文件禁用 react-refresh 规则
  {
    files: [
      '**/routes/**/*.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/submission/components/CanvasElements.tsx',
      '**/components/charts/BaseChart.tsx',
      '**/components/ui/ConfirmDialog.tsx',
      '**/components/ui/Toast.tsx',
      '**/canvas/components/FlowCanvas.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // 对测试文件放宽 any 类型限制
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
