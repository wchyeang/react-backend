import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';

/** 构建完成后从产物中移除 MSW 的 Service Worker 脚本，避免把它打进生产包 */
function removeMockWorkerFromBuild(): Plugin {
  return {
    name: 'remove-mock-worker',
    apply: 'build',
    closeBundle() {
      const file = path.resolve(__dirname, 'dist', 'mockServiceWorker.js');
      if (existsSync(file)) {
        unlinkSync(file);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), removeMockWorkerFromBuild()],
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
});
