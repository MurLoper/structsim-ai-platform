import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const API_TARGET = env.VITE_API_TARGET || 'http://127.0.0.1:6060';
  return {
    // ✅ 使用相对路径，确保多层代理时 assets 能正确加载
    base: './',
    server: {
      port: 3000,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (!normalizedId.includes('/node_modules/')) {
              return undefined;
            }

            if (normalizedId.includes('/node_modules/echarts-gl/')) return 'charts3d';
            if (normalizedId.includes('/node_modules/zrender/')) return 'chartRuntime';
            if (normalizedId.includes('/node_modules/echarts/')) return 'charts';
            if (normalizedId.includes('/node_modules/xlsx/')) return 'excel';
            if (normalizedId.includes('/node_modules/html2canvas/')) return 'capture';
            if (normalizedId.includes('/node_modules/@xyflow/')) return 'flow';
            if (normalizedId.includes('/node_modules/@tanstack/react-query/')) return 'query';
            if (
              normalizedId.includes('/node_modules/@tanstack/react-table/') ||
              normalizedId.includes('/node_modules/@tanstack/react-virtual/')
            ) {
              return 'table';
            }
            if (
              normalizedId.includes('/node_modules/react-hook-form/') ||
              normalizedId.includes('/node_modules/@hookform/') ||
              normalizedId.includes('/node_modules/zod/')
            ) {
              return 'form';
            }
            if (
              normalizedId.includes('/node_modules/framer-motion/') ||
              normalizedId.includes('/node_modules/lucide-react/') ||
              normalizedId.includes('/node_modules/clsx/') ||
              normalizedId.includes('/node_modules/tailwind-merge/')
            ) {
              return 'ui';
            }
            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/react-router-dom/') ||
              normalizedId.includes('/node_modules/react-router/')
            ) {
              return 'vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
