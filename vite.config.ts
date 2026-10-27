import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages serves 404.html for unknown paths. Making it a copy of index.html lets the
// client-side router handle URLs that are opened directly or reloaded.
function spa404Fallback(): Plugin {
  let outDir = ''
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spa404Fallback()],
  // GitHub Pages serves the site from /<repo-name>/
  base: '/guloggartis/',
})
