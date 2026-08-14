import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@test': path.resolve(__dirname, './test'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          globals: true,
          environment: 'node',
          clearMocks: true,
          restoreMocks: true,
          setupFiles: ['./test/support/logger.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'api',
          include: ['test/api/**/*.test.ts'],
          globals: true,
          environment: 'node',
          clearMocks: true,
          restoreMocks: true,
          setupFiles: ['./test/msw/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts', 'src/types/**', 'src/example/**'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});