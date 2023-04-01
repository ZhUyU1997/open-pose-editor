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
            // https://vite-pwa-org.netlify.app/workbox/generate-sw.html#cache-external-resources
            runtimeCaching: [
                {
                    urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'jsdelivr-cdn',
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
            ],
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
            __APP_VERSION__: JSON.stringify('0.1.3'),
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
