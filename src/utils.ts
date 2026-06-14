import { createRequire } from 'node:module'
import nodePath from 'node:path'

// `__filename` is available in both output formats:
// - CJS: provided natively by Node
// - ESM: shimmed from `import.meta.url` via the tsup banner
const _require = createRequire(__filename)

/**
 * Resolves the directory of the installed `vuetify` package.
 */
export function resolveVuetifyBase (): string {
  return nodePath.dirname(
    _require.resolve('vuetify/package.json', { paths: [process.cwd()] })
  )
}

export function loadImportMap () {
  return _require('vuetify/dist/json/importMap.json') as ImportMap
}

export function loadImportMapLabs () {
  return _require('vuetify/dist/json/importMap-labs.json') as ImportMap
}

export interface ImportMap {
  components: Record<string, { from: string }>
  directives: string[]
}

/** Forward-slash paths on Windows for Vite/esbuild compatibility. */
export function normalizePath (p: string): string {
  p = nodePath.normalize(p).replace(/\\/g, '/')
  if (/^[a-z]:\//i.test(p)) p = '/' + p
  return p
}

export function isObject (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

export function isSubdir (root: string, test: string): boolean {
  const rel = nodePath.relative(root, test)
  return !!rel && !rel.startsWith('..') && !nodePath.isAbsolute(rel)
}
