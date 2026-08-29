import preact from '@preact/preset-vite'
import { builtinModules } from 'node:module'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  if (mode === 'extension') {
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        lib: {
          entry: resolve(import.meta.dirname, 'src/extension.ts'),
          formats: ['es'],
          fileName: () => 'extension.js',
        },
        rollupOptions: {
          external: ['vscode', ...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)],
        },
      },
    }
  }

  return {
    plugins: [preact()],
    build: {
      outDir: 'dist/views',
      emptyOutDir: false,
      sourcemap: true,
      rollupOptions: {
        input: {
          companion: resolve(import.meta.dirname, 'src/views/companion/App.tsx'),
          pantry: resolve(import.meta.dirname, 'src/views/pantry/App.tsx'),
          stats: resolve(import.meta.dirname, 'src/views/stats/App.tsx'),
          shared: resolve(import.meta.dirname, 'src/views/shared.css'),
        },
        output: {
          format: 'es',
          entryFileNames: '[name]/App.js',
          chunkFileNames: 'shared/[name]-[hash].js',
          assetFileNames: '[name]/App[extname]',
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      cors: true,
      hmr: { protocol: 'ws', host: 'localhost', port: 5173 },
    },
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
  }
})
