import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    global: {},
    __APP_VERSION__: JSON.stringify("v0.0.2"),
    __APP_BUILD_TIME__: Date.now()
  },
  build: {
    assetsDir:"."
  },
  plugins: [react(), visualizer()],
})
