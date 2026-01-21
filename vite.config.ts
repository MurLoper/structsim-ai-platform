import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
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
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query', '@tanstack/react-table', '@tanstack/react-virtual'],
            charts: ['echarts', 'echarts-for-react'],
            flow: ['@xyflow/react'],
            form: ['react-hook-form', '@hookform/resolvers', 'zod'],
            ui: ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
