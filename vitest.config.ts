import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    unstubGlobals: true,
    include: ['tests/**/*.test.ts*'],
    alias: {
      vscode: 'tests/_mocks/vscode.ts',
    },
  },
})
