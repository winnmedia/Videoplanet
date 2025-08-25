import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // TODO(human): Configure test environment settings
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/',
        '**/test/',
        'src/test/',
        'src/app/globals.css',
        'src/app/layout.tsx',
        'src/app/not-found.tsx',
        'src/app/loading.tsx',
        'src/app/error.tsx',
        'src/app/providers.tsx',
        '**/*.stories.{js,ts,jsx,tsx}',
        'tailwind.config.ts',
        'next.config.ts',
        'next-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})