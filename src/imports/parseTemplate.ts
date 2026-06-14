import { camelize, capitalize } from 'vue'

export interface TemplateMatch {
  /** The local JS symbol name, e.g. `_component_VBtn` */
  symbol: string
  /** PascalCase component/directive name, e.g. `VBtn` */
  name: string
  /** Byte offset of the match inside the source string */
  index: number
  /** Byte length of the matched substring */
  length: number
}

/**
 * Parse compiled Vue template code for `_resolveComponent(...)` and
 * `_resolveDirective(...)` calls and return typed match sets.
 *
 * The regex patterns mirror those in `@vuetify/loader-shared` exactly so
 * behaviour is identical.
 */
export function parseTemplate (source: string) {
  const components = collectMatches(
    source.matchAll(/(?:var|const) (\w+) *?= *?_resolveComponent\("([\w-.]+)"\);?/gm)
  )
  const directives = collectMatches(
    source.matchAll(/(?:var|const) (\w+) *?= *?_resolveDirective\("([\w-.]+)"\);?/gm)
  )
  return { components, directives }
}

function collectMatches (
  iter: IterableIterator<RegExpMatchArray>
): Set<TemplateMatch> {
  return new Set(
    Array.from(iter, m => ({
      symbol: m[1],
      name:   capitalize(camelize(m[2])),
      index:  m.index!,
      length: m[0].length,
    }))
  )
}
