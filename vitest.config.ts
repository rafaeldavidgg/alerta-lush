import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['vitest.setup.ts'],
    include: [
      'core/**/*.test.ts',
      'stores/**/*.test.ts',
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: ['node_modules', '.next'],
  },
});
