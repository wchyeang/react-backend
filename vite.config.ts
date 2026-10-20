import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';

/** 非 Mock 模式下，构建完成后从产物中移除 MSW 的 Service Worker 脚本 */
function removeMockWorkerFromBuild(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    name: 'remove-mock-worker',
    apply: 'build',
    closeBundle() {
      if (env.VITE_USE_MOCK === 'true') return;
      const file = path.resolve(__dirname, 'dist', 'mockServiceWorker.js');
      if (existsSync(file)) {
        unlinkSync(file);
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), removeMockWorkerFromBuild(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/_variables" as *; @use "@/styles/_mixins" as *;`,
      },
    },
  },
  server: {
    port: Number(process.env.VITE_DEV_PORT) || 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/redux') || id.includes('node_modules/react-redux')) {
            return 'redux-vendor';
          }
        },
      },
    },
  },
}));
