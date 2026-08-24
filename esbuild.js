import { context, build } from 'esbuild'

const watch = process.argv.includes('--watch')

const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'esm',
  platform: 'node',
  sourcemap: true,
  minify: !watch,
}

async function run() {
  if (watch) {
    const ctx = await context(options)
    await ctx.watch()
  } else {
    await build(options)
  }
}

run().catch(() => process.exit(1))
