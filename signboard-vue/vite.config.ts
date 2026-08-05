import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const scssTokens = fileURLToPath(new URL('./src/styles/_tokens.scss', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built renderer works when loaded via file:// in Electron.
  base: './',
  build: {
    // Keep the currently loaded renderer available while the source watcher
    // replaces the next build. Production builds still start from a clean
    // dist directory.
    emptyOutDir: process.env.SIGNBOARD_DEV_WATCH !== '1',
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Shared Vue components use the legacy Sass token names while the
        // active theme remains owned by static/styles.css.
        additionalData: `@use "sass:color";\n@use "${scssTokens}" as *;\n`,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@vendor': fileURLToPath(new URL('../static/vendor', import.meta.url)),
    },
  },
})
