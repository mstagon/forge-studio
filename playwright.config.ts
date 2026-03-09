import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.{test,spec}.ts',
  timeout: 30000,
  retries: 0,
  use: {
    trace: 'off'
  },
  outputDir: './e2e/results'
})
