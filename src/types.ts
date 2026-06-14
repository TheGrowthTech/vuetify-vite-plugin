import type * as Components from 'vuetify/components'
import type * as Directives from 'vuetify/directives'

// ─── Auto-import options ──────────────────────────────────────────────────────

export interface ImportPluginOptions {
  /**
   * Include Vuetify Labs components (`vuetify/labs/*`).
   * @default false
   */
  labs?: boolean
  /**
   * Component or directive names to exclude from auto-import.
   * Useful when you want to manually register a component with a custom impl.
   */
  ignore?: (keyof typeof Components | keyof typeof Directives)[]
}

// ─── Styles options ───────────────────────────────────────────────────────────

export interface StylesConfigFile {
  /**
   * Path to a SASS/SCSS config file that is @use-d before every Vuetify
   * component stylesheet. Relative to `vite.config` root, or absolute.
   *
   * Example:
   * ```ts
   * styles: { configFile: 'src/styles/vuetify-settings.scss' }
   * ```
   */
  configFile: string
}

/**
 * How to handle Vuetify stylesheets:
 * - `true`  — use the pre-compiled CSS (default, fastest)
 * - `'none'` — suppress all Vuetify CSS (you bring your own)
 * - `'sass'` — use the raw SASS/SCSS sources (requires sass)
 * - `{ configFile }` — use SASS sources prefixed with your settings file
 */
export type StylesOption = true | 'none' | 'sass' | StylesConfigFile

// ─── Top-level options ────────────────────────────────────────────────────────

export interface Options {
  /**
   * Enable/configure component + directive auto-import with tree-shaking.
   * - `true`  — auto-import everything (default)
   * - `false` — disable (you import manually or use a full bundle)
   * - `{ labs, ignore }` — fine-grained control
   */
  autoImport?: boolean | ImportPluginOptions

  /**
   * Stylesheet handling strategy.
   * @default true
   */
  styles?: StylesOption
}

// ─── Internal resolved types ──────────────────────────────────────────────────

export interface ResolvedOptions {
  autoImport: false | ImportPluginOptions
  styles: StylesOption
}

export function resolveOptions (raw: Options): ResolvedOptions {
  const autoImport: ResolvedOptions['autoImport'] =
    raw.autoImport === false
      ? false
      : raw.autoImport === true || raw.autoImport == null
      ? {}
      : raw.autoImport

  return {
    autoImport,
    styles: raw.styles ?? true,
  }
}
