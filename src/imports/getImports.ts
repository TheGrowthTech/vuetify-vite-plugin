import { parseTemplate } from './parseTemplate'
import { loadImportMap, loadImportMapLabs } from '../utils'
import type { TemplateMatch } from './parseTemplate'
import type { ImportPluginOptions } from '../types'

/**
 * Given compiled Vue template source, returns:
 * - `imports`    Map<from-specifier, ["Name as _symbol", ...]>
 * - `components` matched component descriptors (for source-rewriting)
 * - `directives` matched directive descriptors (for source-rewriting)
 */
export function getImports (source: string, options: ImportPluginOptions) {
  const importMap     = loadImportMap()
  const importMapLabs = loadImportMapLabs()

  const { components, directives } = parseTemplate(source)
  const resolvedComponents: TemplateMatch[] = []
  const resolvedDirectives: TemplateMatch[] = []
  const imports = new Map<string, string[]>()

  const ignore     = options.ignore ?? null
  const includeLabs = !!options.labs

  // Merge labs into the lookup when requested
  const componentMap: Record<string, { from: string }> = includeLabs
    ? { ...importMap.components, ...importMapLabs.components }
    : { ...importMap.components }

  components.forEach(c => {
    if (ignore?.includes(c.name as never)) return
    if (c.name in componentMap) resolvedComponents.push(c)
  })

  directives.forEach(d => {
    if (importMap.directives.includes(d.name) && !ignore?.includes(d.name as never)) {
      resolvedDirectives.push(d)
    }
  })

  resolvedComponents.forEach(c => {
    const { from } = componentMap[c.name]
    // Vuetify ≥3.7.11 / v4: `from` ends in `.mjs` and is a subpath export.
    // Older builds use a bare lib path.
    const specifier = from.endsWith('.mjs') ? `vuetify/lib/${from}` : `vuetify/${from}`
    addImport(imports, c.name, c.symbol, specifier)
  })

  resolvedDirectives.forEach(d => {
    addImport(imports, d.name, d.symbol, 'vuetify/directives')
  })

  return { imports, components: resolvedComponents, directives: resolvedDirectives }
}

function addImport (
  imports: Map<string, string[]>,
  name: string,
  as: string,
  from: string
) {
  if (!imports.has(from)) imports.set(from, [])
  imports.get(from)!.push(`${name} as ${as}`)
}
