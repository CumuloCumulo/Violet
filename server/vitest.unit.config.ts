import { defineConfig } from 'vitest/config';
import swc from 'vite-plugin-swc-transform';

export default defineConfig({
  plugins: [
    swc({
      swcOptions: {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            useDefineForClassFields: false,
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 30000,
  },
  resolve: {
    conditions: ['node'],
  },
});
