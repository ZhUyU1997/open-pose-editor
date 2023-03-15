import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
export default defineConfig({
  base: '/open-pose-editor/',
  define: {
    global: {},
    __APP_VERSION__: JSON.stringify("v0.0.2"),
    __APP_BUILD_TIME__: Date.now()
  },
  build: {
  },
  plugins: [react(), VitePWA({
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,obj,fbx,bin}']
    },
    manifest: {
      name: 'open pose editor',
      short_name: 'open pose editor',
      description: 'open pose editor (Yu Zhu)',
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    }
  }), visualizer()],
})
