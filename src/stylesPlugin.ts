import nodePath from 'node:path'
import fs from 'node:fs/promises'
import { resolveVuetifyBase, normalizePath, isObject, isSubdir } from './utils'
import type { Plugin, ResolvedConfig } from 'vite'
import type { ResolvedOptions, StylesConfigFile } from './types'

const VIRTUAL_PREFIX = 'virtual:'
const PLUGIN_VIRTUAL_NAME = 'plugin-vuetify4'
const VIRTUAL_MODULE_ID = `${VIRTUAL_PREFIX}${PLUGIN_VIRTUAL_NAME}`

/**
 * `vuetify4:styles`
 *
 * Intercepts Vuetify's internal `.css` imports and redirects them according to
 * `options.styles`:
 *
 * - `'none'` → return empty module (suppress all Vuetify CSS)
 * - `'sass'` → resolve to the companion `.sass` / `.scss` source
 * - `{ configFile }` → prefix every component stylesheet with `@use configFile`
 *
 * When `styles: true` (default), this plugin is not added at all — Vite
 * handles the pre-compiled CSS normally.
 */
export function stylesPlugin (options: ResolvedOptions): Plugin {
  const vuetifyBase = resolveVuetifyBase()

  let configFile = ''
  // Virtual file contents keyed by relative path (configFile strategy)
  const tempFiles = new Map<string, string>()
  // Cache css → sass/scss path resolutions
  const cssToSass = new Map<string, string>()

  async function resolveSass (target: string): Promise<string> {
    let cached = cssToSass.get(target)
    if (!cached) {
      cached = target.replace(/\.css$/, '.sass')
      try {
        await fs.access(cached, fs.constants.R_OK)
      } catch (err) {
        // Fallback to .scss
        if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
          cached = target.replace(/\.css$/, '.scss')
        } else {
          throw err
        }
      }
      cssToSass.set(target, cached)
    }
    return cached
  }

  return {
    name:    'vuetify4:styles',
    enforce: 'pre',   // Must run before Vite's default CSS resolution

    configResolved (config: ResolvedConfig) {
      if (isObject(options.styles) && 'configFile' in options.styles) {
        const cf = (options.styles as StylesConfigFile).configFile
        configFile = nodePath.isAbsolute(cf)
          ? cf
          : nodePath.join(config.root || process.cwd(), cf)
      }
    },

    async resolveId (source, importer, ctx) {
      const isVuetifyStyles =
        source === 'vuetify/styles' ||
        (
          importer &&
          source.endsWith('.css') &&
          isSubdir(
            vuetifyBase,
            nodePath.isAbsolute(source) ? source : importer
          )
        )

      if (isVuetifyStyles) {
        // ── Strategy: none ────────────────────────────────────────────────────
        if (options.styles === 'none') {
          return `${VIRTUAL_PREFIX}__void__`
        }

        // ── Strategy: sass ────────────────────────────────────────────────────
        if (options.styles === 'sass') {
          const resolution = await this.resolve(source, importer, {
            skipSelf: true,
            custom: ctx.custom,
          })
          if (!resolution) return null
          return resolveSass(resolution.id)
        }

        // ── Strategy: { configFile } ──────────────────────────────────────────
        if (isObject(options.styles) && 'configFile' in options.styles) {
          const resolution = await this.resolve(source, importer, {
            skipSelf: true,
            custom: ctx.custom,
          })
          if (!resolution) return null

          const sassFile = await resolveSass(resolution.id)
          const relFile  = nodePath.relative(nodePath.join(vuetifyBase, 'lib'), sassFile)
          const suffix   = sassFile.endsWith('.scss') ? ';\n' : '\n'
          const contents =
            `@use "${normalizePath(configFile)}"${suffix}` +
            `@use "${normalizePath(sassFile)}"${suffix}`

          tempFiles.set(relFile, contents)
          return `${VIRTUAL_MODULE_ID}:${relFile}`
        }
      }

      // ── Vite SSR virtual re-entry aliases ─────────────────────────────────
      if (source.startsWith(`/${PLUGIN_VIRTUAL_NAME}:`)) {
        return VIRTUAL_PREFIX + source.slice(1)
      }
      if (source.startsWith(`/@id/__x00__${PLUGIN_VIRTUAL_NAME}:`)) {
        return VIRTUAL_PREFIX + source.slice(12)
      }
      if (source.startsWith(`/${VIRTUAL_MODULE_ID}:`)) {
        return source.slice(1)
      }

      return null
    },

    load (id) {
      // __void__ — suppress CSS (styles: 'none')
      // Vite may append a version hash: `?v=abc123`
      if (new RegExp(`^${VIRTUAL_PREFIX}__void__(\\?.*)?$`).test(id)) {
        return ''
      }

      // Virtual config-prefixed sass files
      if (id.startsWith(VIRTUAL_MODULE_ID)) {
        const file = new RegExp(`^${VIRTUAL_MODULE_ID}:(.*?)(\\?.*)?$`).exec(id)?.[1]
        if (file) return tempFiles.get(file) ?? null
      }

      return null
    },
  }
}
