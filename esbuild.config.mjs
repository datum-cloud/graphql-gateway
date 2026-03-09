import * as esbuild from 'esbuild'

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  // Mark node_modules as external to avoid bundling them
  packages: 'external',
  // Banner to support __dirname in ESM
  banner: {
    js: `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
  },
}

// Main gateway bundle
await esbuild.build({
  ...sharedConfig,
  entryPoints: ['src/gateway/index.ts'],
  outfile: 'dist/gateway/index.js',
})

// Composition worker – built as a separate bundle so the Worker thread can
// load it independently. Must output to the same directory as index.js so
// the relative path `./compose-worker.js` resolves correctly at runtime.
await esbuild.build({
  ...sharedConfig,
  entryPoints: ['src/gateway/runtime/compose-worker.ts'],
  outfile: 'dist/gateway/compose-worker.js',
})
