import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/agent/__integration__/**',
      '**/*.bak*',
      '**/*.backup*',
    ],
  },
});
