import type { Plugin } from 'vite'
import { resolveOptions } from './types'
import { importPlugin } from './importPlugin'
import { stylesPlugin } from './stylesPlugin'
import type { Options } from './types'

// ─── transformAssetUrls ───────────────────────────────────────────────────────
// Tells @vitejs/plugin-vue which Vuetify component props carry asset URLs
// (images, posters, etc.) so Vite can process them as static assets.
// Mirrors the official plugin's export exactly.

function toKebabCase (str = '') {
  return str
    .replace(/[^a-z]/gi, '-')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase()
}

const _transformAssetUrls: Record<string, string[]> = {
  VAppBar:          ['image'],
  VAvatar:          ['image'],
  VBanner:          ['avatar'],
  VCard:            ['image', 'prependAvatar', 'appendAvatar'],
  VCardItem:        ['prependAvatar', 'appendAvatar'],
  VCarouselItem:    ['src', 'lazySrc', 'srcset'],
  VChip:            ['prependAvatar', 'appendAvatar'],
  VImg:             ['src', 'lazySrc', 'srcset'],
  VListItem:        ['prependAvatar', 'appendAvatar'],
  VNavigationDrawer:['image'],
  VParallax:        ['src', 'lazySrc', 'srcset'],
  VToolbar:         ['image'],
}

// Add kebab-case aliases and default HTML tag attrs
for (const [tag, attrs] of Object.entries(_transformAssetUrls)) {
  attrs.forEach(attr => {
    if (/[A-Z]/.test(attr)) attrs.push(toKebabCase(attr))
  })
  _transformAssetUrls[toKebabCase(tag)] = attrs
}
Object.assign(_transformAssetUrls, {
  video:  ['src', 'poster'],
  source: ['src'],
  img:    ['src'],
  image:  ['xlink:href', 'href'],
  use:    ['xlink:href', 'href'],
})

export const transformAssetUrls = _transformAssetUrls

// ─── Main plugin factory ──────────────────────────────────────────────────────

/**
 * `vite-plugin-vuetify4`
 *
 * Drop-in Vite plugin for Vuetify 4 with:
 * - Tree-shaking auto-import (no `@vuetify/loader-shared` dependency)
 * - CSS / SASS / configFile style strategies
 * - Lab component support
 * - `transformAssetUrls` for @vitejs/plugin-vue
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import vue from '@vitejs/plugin-vue'
 * import vuetify from 'vite-plugin-vuetify4'
 *
 * export default defineConfig({
 *   plugins: [
 *     vue({ template: { transformAssetUrls: vuetify.transformAssetUrls } }),
 *     vuetify({ styles: { configFile: 'src/styles/settings.scss' } }),
 *   ],
 * })
 * ```
 */
function vuetify (rawOptions: Options = {}): Plugin[] {
  const options = resolveOptions(rawOptions)
  const plugins: Plugin[] = []

  if (options.autoImport !== false) {
    plugins.push(importPlugin(options))
  }

  // Style plugin is only needed for non-default strategies
  if (
    options.styles === 'none' ||
    options.styles === 'sass' ||
    (typeof options.styles === 'object' && 'configFile' in options.styles)
  ) {
    plugins.push(stylesPlugin(options))
  }

  return plugins
}

vuetify.transformAssetUrls = transformAssetUrls

export default vuetify

// Named exports for Nuxt module / programmatic usage
export type { Options, ImportPluginOptions, StylesOption, StylesConfigFile, ResolvedOptions } from './types'
export { importPlugin }  from './importPlugin'
export { stylesPlugin }  from './stylesPlugin'
export { generateImports } from './imports/generateImports'
export { parseTemplate }   from './imports/parseTemplate'
