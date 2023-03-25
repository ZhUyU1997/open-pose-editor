import { defineConfig, UserConfigFn } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import ConditionalCompile from 'vite-plugin-conditional-compiler'

// https://vitejs.dev/config/
const config: UserConfigFn = ({ command, mode, ssrBuild }) => {
    const pwa = VitePWA({
        workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,obj,fbx,bin}'],
        },
        manifest: {
            name: 'open pose editor',
            short_name: 'open pose editor',
            description: 'open pose editor (Yu Zhu)',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
        },
    })

    return {
        base: mode === 'singlefile' ? './' : '/open-pose-editor/',
        define: {
            global: {},
            __APP_VERSION__: JSON.stringify('v0.0.2'),
            __APP_BUILD_TIME__: Date.now(),
        },
        build: {
            assetsDir: mode === 'singlefile' ? '.' : 'assets',
            emptyOutDir: true,
        },
        plugins: [
            react(),
            mode === 'online' ? pwa : null,
            visualizer(),
            ConditionalCompile(),
        ],
    }
}

export default defineConfig(config)
