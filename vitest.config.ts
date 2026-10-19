import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    reporters: [
      'default', // 仍然输出到终端
      ['json', { outputFile: 'test-results.json' }], // JSON 报告
      ['html', { outputFile: 'test-results.html' }], // HTML 报告
    ],
  },
});
