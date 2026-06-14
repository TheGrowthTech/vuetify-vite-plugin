import { getImports } from './getImports'
import type { ImportPluginOptions } from '../types'

/**
 * Core transform: given compiled Vue template `source`, generates static
 * Vuetify import statements and erases the `_resolveComponent(...)` /
 * `_resolveDirective(...)` declarations those imports replace.
 *
 * Returns `{ code, source }` where:
 * - `source` is the (possibly mutated) original code with dynamic-resolve
 *   calls blanked out (spaces, preserving source-map columns).
 * - `code` is the new import block to prepend / append.
 */
export function generateImports (
  source: string,
  options: ImportPluginOptions
): { code: string; source: string } {
  const { imports, components, directives } = getImports(source, options)

  let code = ''

  if (components.length || directives.length) {
    code += '\n\n/* Vuetify */\n'

    // Sort import specifiers alphabetically for deterministic output
    Array.from(imports)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .forEach(([from, names]) => {
        code += `import { ${names.join(', ')} } from "${from}"\n`
      })

    code += '\n'

    // Replace matched substrings with spaces to preserve source-map columns
    source = [...components, ...directives].reduce((acc, v) => {
      return acc.slice(0, v.index) + ' '.repeat(v.length) + acc.slice(v.index + v.length)
    }, source)

    // If all resolveComponent / resolveDirective calls are gone, also strip
    // the named imports from the Vue runtime import at the top of the file.
    if (!source.includes('_resolveComponent(')) {
      source = source.replace('resolveComponent as _resolveComponent, ', '')
    }
    if (!source.includes('_resolveDirective(')) {
      source = source.replace('resolveDirective as _resolveDirective, ', '')
    }
  }

  return { code, source }
}
