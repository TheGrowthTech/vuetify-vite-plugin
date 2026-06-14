import { createFilter } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'
import { generateImports } from './imports/generateImports'
import type { ResolvedOptions } from './types'

function parseId (id: string) {
  const [pathname, query] = id.split('?')
  return {
    path:  pathname ?? id,
    query: query ? Object.fromEntries(new URLSearchParams(query)) : null,
  }
}

/**
 * `vuetify4:import`
 *
 * Intercepts every compiled Vue file / template chunk and replaces dynamic
 * `_resolveComponent(...)` calls with static tree-shakeable imports from the
 * Vuetify package.
 *
 * Must be placed AFTER the Vue plugin in the plugins array (enforced at
 * `configResolved` time).
 */
export function importPlugin (options: ResolvedOptions): Plugin {
  // Narrowed: if we reach here, autoImport is not false
  const importOptions = options.autoImport as Exclude<ResolvedOptions['autoImport'], false>
  let filter: (id: unknown) => boolean = () => true

  return {
    name: 'vuetify4:import',

    configResolved (config: ResolvedConfig) {
      const selfIdx = config.plugins.findIndex(p => p.name === 'vuetify4:import')
      const vueIdx  = config.plugins.findIndex(p =>
        ['vite:vue', 'unplugin-vue'].includes(p.name)
      )

      if (vueIdx === -1) {
        config.logger.warn(
          '[vite-plugin-vuetify4] No Vue plugin found — ' +
          'auto-import is a no-op. Add @vitejs/plugin-vue ' +
          '(Nuxt provides this automatically).'
        )
        return
      }

      if (selfIdx !== -1 && selfIdx < vueIdx) {
        throw new Error(
          '[vite-plugin-vuetify4] This plugin must be registered AFTER the Vue plugin. ' +
          'Move it below `vue()` in your plugins array.'
        )
      }

      const vuePlugin = config.plugins[vueIdx] as any
      const vueOptions = vuePlugin?.api?.options ?? {}
      filter = createFilter(vueOptions.include, vueOptions.exclude)
    },

    transform (code, id) {
      const { path, query } = parseId(id)

      // A virtual sub-request appended by the Vue plugin (e.g. ?vue&type=template)
      const isVueVirtual = !!query && 'vue' in query
      const isVueFile =
        !isVueVirtual &&
        filter(path) &&
        // Skip render-only re-export stubs that the Vue plugin emits
        !/^import \{ render as _sfc_render \} from ".*"$/m.test(code)
      const isVueTemplate =
        isVueVirtual &&
        (query!.type === 'template' ||
          (query!.type === 'script' && query!.setup === 'true'))

      if (isVueFile || isVueTemplate) {
        const { code: importCode, source } = generateImports(code, importOptions)
        return { code: source + importCode, map: null }
      }

      return null
    },
  }
}
