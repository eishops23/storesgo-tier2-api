import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/agent/__integration__/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
