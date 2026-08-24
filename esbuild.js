import { context, build } from 'esbuild'

const watch = process.argv.includes('--watch')

const extensionOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'esm',
  platform: 'node',
  sourcemap: true,
  minify: !watch,
}

const webviewOptions = {
  entryPoints: ['src/ui/webview/main.tsx', 'src/ui/pantry/main.tsx', 'src/ui/stats/main.tsx'],
  bundle: true,
  outbase: 'src/ui',
  outdir: 'dist/ui',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  sourcemap: true,
  minify: !watch,
}

async function run() {
  if (watch) {
    const [extensionCtx, webviewCtx] = await Promise.all([context(extensionOptions), context(webviewOptions)])
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()])
  } else {
    await Promise.all([build(extensionOptions), build(webviewOptions)])
  }
}

run().catch(() => process.exit(1))
