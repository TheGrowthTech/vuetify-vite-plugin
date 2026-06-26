<h1 align="center">vuetify-vite-plugin</h1>

<p align="center">
  <strong>Vite plugin for Vuetify 4</strong> — tree-shaking auto-import, CSS/SASS/configFile
  style strategies, and Labs support.<br>
  <strong>Zero dependency on <code>@vuetify/loader-shared</code> or <code>vite-plugin-vuetify</code></strong>
  — a clean, self-contained implementation.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vuetify-vite-plugin"><img src="https://img.shields.io/npm/v/vuetify-vite-plugin.svg?color=42b883&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/vuetify-vite-plugin"><img src="https://img.shields.io/npm/dm/vuetify-vite-plugin.svg?color=42b883" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/package/vuetify-vite-plugin"><img src="https://img.shields.io/bundlephobia/minzip/vuetify-vite-plugin?color=42b883&label=minzip" alt="bundle size"></a>
  <a href="https://github.com/thegrowthtech/vuetify-vite-plugin/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/vuetify-vite-plugin.svg?color=blue" alt="MIT license"></a>
  <a href="https://www.npmjs.com/package/vuetify-vite-plugin"><img src="https://img.shields.io/badge/types-included-blue.svg" alt="TypeScript types included"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/vuetify-vite-plugin.svg?color=339933" alt="node version"></a>
</p>

---

## Table of Contents

- [Why?](#why)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Named Exports](#named-exports)
- [How it works](#how-it-works)
- [Comparison with `vite-plugin-vuetify`](#comparison-with-vite-plugin-vuetify)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [Security](#security)
- [Support](#support)
- [License](#license)

---

## Features

- 🌳 **Tree-shaking auto-import** — only the Vuetify components and directives you actually use are bundled.
- 🎨 **Flexible style strategies** — pre-compiled CSS, raw SASS sources, a SASS `configFile`, or none at all.
- 🧪 **Labs support** — opt in to `vuetify/labs` components.
- 🚫 **No legacy loader** — zero dependency on `@vuetify/loader-shared` or `vite-plugin-vuetify`.
- 📦 **ESM + CJS dual output** with bundled TypeScript types.
- ⚡ **Nuxt-friendly** — composes cleanly with `addVitePlugin` in a Nuxt module.

---

## Why?

The official `vite-plugin-vuetify` (v2.x) depends on `@vuetify/loader-shared` which
currently boots the Vuetify 3 runtime under Vuetify 4, producing unstyled output
(see [vuetify-loader#352](https://github.com/vuetifyjs/vuetify-loader/issues/352)).
This plugin reimplements the same transform from scratch, targeting Vuetify 4
exclusively.

## Requirements

| Peer          | Version         |
| ------------- | --------------- |
| `vite`        | ≥ 5.0           |
| `vue`         | ^3.4            |
| `vuetify`     | ^4.0            |
| Node          | ^18 or ≥ 20     |

---

## Installation

```bash
npm install -D vuetify-vite-plugin
```

---

## Usage

### Plain Vite

```ts
// vite.config.ts
import { defineConfig }  from 'vite'
import vue               from '@vitejs/plugin-vue'
import vuetify           from 'vuetify-vite-plugin'

export default defineConfig({
  plugins: [
    // Pass transformAssetUrls so Vite processes image props on Vuetify components
    vue({ template: { transformAssetUrls: vuetify.transformAssetUrls } }),
    // vuetify() MUST come AFTER vue()
    vuetify(),
  ],
})
```

### Nuxt 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    plugins: [
      // Nuxt already adds the Vue plugin internally — just add vuetify after
    ],
  },
  // Or use a Nuxt module that calls addVitePlugin(vuetify(...))
})
```

When used inside a **Nuxt module**, call `addVitePlugin` in your module's
`setup()`:

```ts
import { defineNuxtModule, addVitePlugin } from '@nuxt/kit'
import vuetify from 'vuetify-vite-plugin'

export default defineNuxtModule({
  setup (options, nuxt) {
    addVitePlugin(vuetify({
      styles: { configFile: 'assets/styles/vuetify-settings.scss' },
    }))
  },
})
```

---

## Options

```ts
vuetify({
  autoImport?: boolean | { 
    labs?:   boolean                                      // include labs components
    ignore?: (keyof Components | keyof Directives)[]     // skip specific names
  },
  styles?: true | 'none' | 'sass' | { configFile: string },
})
```

### `autoImport`

| Value           | Behaviour                                            |
| --------------- | ---------------------------------------------------- |
| `true` (default)| Auto-import all stable components + directives       |
| `false`         | Disable — you import manually or use a full bundle   |
| `{ labs: true }`| Also auto-import `vuetify/labs` components           |
| `{ ignore: [] }`| Exclude named components / directives                |

```ts
vuetify({
  autoImport: {
    labs:   true,
    ignore: ['VDataTable'],   // you register this one manually
  },
})
```

### `styles`

| Value               | Behaviour                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `true` (default)    | Use pre-compiled CSS — fastest, no SASS toolchain needed           |
| `'none'`            | Suppress all Vuetify CSS — bring your own                         |
| `'sass'`            | Use raw `.sass`/`.scss` sources (requires `sass` installed)        |
| `{ configFile }`    | Prefix every stylesheet with `@use "your-settings"` (SASS vars)   |

```ts
// SASS variable customisation
vuetify({
  styles: { configFile: 'src/styles/vuetify-settings.scss' },
})
```

```scss
// src/styles/vuetify-settings.scss
@use 'vuetify/settings' with (
  $color-pack: false,
  $utilities:  false,
);
```

### `transformAssetUrls`

```ts
import vuetify from 'vuetify-vite-plugin'

// Pass to @vitejs/plugin-vue so Vuetify image props are processed by Vite
vue({ template: { transformAssetUrls: vuetify.transformAssetUrls } })
```

Covers: `VAppBar`, `VAvatar`, `VBanner`, `VCard`, `VCardItem`, `VCarouselItem`,
`VChip`, `VImg`, `VListItem`, `VNavigationDrawer`, `VParallax`, `VToolbar`.

---

## Named Exports

```ts
import vuetify, {
  // Sub-plugins (for Nuxt modules / custom composition)
  importPlugin,
  stylesPlugin,

  // Core transform utilities
  generateImports,
  parseTemplate,

  // Asset URL map
  transformAssetUrls,
} from 'vuetify-vite-plugin'

// Types
import type {
  Options,
  ImportPluginOptions,
  StylesOption,
  StylesConfigFile,
  ResolvedOptions,
} from 'vuetify-vite-plugin'
```

---

## How it works

### Auto-import (`autoImport`)

After the Vue plugin compiles `.vue` files, the compiled JS contains calls like:

```js
const _component_VBtn = _resolveComponent("VBtn")
```

`vuetify4:import` intercepts these files, reads `vuetify/dist/json/importMap.json`
to find each component's subpath export, then:

1. Adds a static import at the top of the file:
   ```js
   import { VBtn as _component_VBtn } from "vuetify/lib/components/VBtn/VBtn.mjs"
   ```
2. Blanks out the `_resolveComponent(...)` call (preserving source-map columns).

The result: only the components you actually *use* in templates are bundled.

### Styles (`styles`)

`vuetify4:styles` (only active for non-default strategies) runs `enforce: 'pre'`
and intercepts Vuetify's internal `.css` imports via `resolveId`. Depending on
strategy it either voids the CSS, redirects to the SASS source, or wraps the SASS
source in a virtual module prefixed with your settings `@use`.

---

## Comparison with `vite-plugin-vuetify`

| Feature                       | `vite-plugin-vuetify` (official) | `vuetify-vite-plugin` |
| ----------------------------- | -------------------------------- |-----------------------|
| Vuetify 4 compatible          | ❌ (issue #352)                  | ✅                     |
| `@vuetify/loader-shared` dep  | ✅ required                      | ❌ none                |
| Auto-import + tree-shaking    | ✅                               | ✅                     |
| CSS / SASS / configFile styles| ✅                               | ✅                     |
| Labs components               | ✅                               | ✅                     |
| `transformAssetUrls`          | ✅                               | ✅                     |
| Nuxt module friendly          | ✅                               | ✅                     |
| ESM + CJS dual output         | ✅                               | ✅                     |

---

## FAQ

**Does this work with Vuetify 3?**
No. This plugin targets **Vuetify 4** exclusively. For Vuetify 3, use the official
[`vite-plugin-vuetify`](https://github.com/vuetifyjs/vuetify-loader).

**Do I still need `vite-plugin-vuetify` or `@vuetify/loader-shared`?**
No. This plugin is fully self-contained and replaces both for Vuetify 4 projects.

**My components render unstyled — what's wrong?**
Make sure `vuetify()` is registered **after** `@vitejs/plugin-vue`, and that you have
not set `styles: 'none'` unless you intend to supply your own CSS.

**Can I use it with Nuxt?**
Yes — call `addVitePlugin(vuetify(...))` inside a Nuxt module's `setup()`.
See [Usage › Nuxt 4](#nuxt-4).

---

## Contributing

Contributions are welcome! To get started:

```bash
git clone https://github.com/thegrowthtech/vuetify-vite-plugin.git
cd vuetify-vite-plugin
pnpm install
pnpm build      # build the plugin
pnpm typecheck  # run the type checker
```

Please open an [issue](https://github.com/thegrowthtech/vuetify-vite-plugin/issues)
to discuss substantial changes before submitting a pull request, and keep PRs focused
and well described.

---

## Changelog

See the [Releases](https://github.com/thegrowthtech/vuetify-vite-plugin/releases)
page for the version history. This project follows
[Semantic Versioning](https://semver.org/).

---

## Security

If you discover a security vulnerability, please **do not** open a public issue.
Instead, report it privately via the repository's
[security advisories](https://github.com/thegrowthtech/vuetify-vite-plugin/security/advisories/new).
We will respond as quickly as possible.

---

## Support

- 🐛 [Report a bug](https://github.com/thegrowthtech/vuetify-vite-plugin/issues/new)
- 💡 [Request a feature](https://github.com/thegrowthtech/vuetify-vite-plugin/issues/new)
- ⭐ If this plugin helps you, please consider starring the
  [repository](https://github.com/thegrowthtech/vuetify-vite-plugin) — it helps others discover it.

---

## License

[MIT](./LICENSE) © [thegrowthtech](https://github.com/thegrowthtech)
