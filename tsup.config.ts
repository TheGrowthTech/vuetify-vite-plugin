import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM build — shim `__filename` from `import.meta.url` (legal in ESM output)
  {
    entry:     ['src/index.ts'],
    format:    ['esm'],
    dts:       true,
    clean:     true,
    sourcemap: true,
    external:  ['vite', 'vue', 'vuetify'],
    esbuildOptions (opts) {
      opts.platform = 'node'
    },
    banner: {
      js: `import { fileURLToPath as __fileURLToPath } from 'node:url';\nconst __filename = __fileURLToPath(import.meta.url);`,
    },
  },
  // CJS build — `__filename` is provided natively by Node, no shim needed
  {
    entry:     ['src/index.ts'],
    format:    ['cjs'],
    dts:       false,   // types emitted by ESM build only
    clean:     false,
    sourcemap: true,
    external:  ['vite', 'vue', 'vuetify'],
    esbuildOptions (opts) {
      opts.platform = 'node'
    },
  },
])
