import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    silent: true,
    reporters: ['basic'],
    outputFile: {
      json: './test-results.json'
    },
    coverage: {
      reporter: ['text-summary']
    }
  },
}) 