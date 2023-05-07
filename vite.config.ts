import {
    splitVendorChunkPlugin,
    defineConfig,
    UserConfig,
    UserConfigFn,
} from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import ConditionalCompile from 'vite-plugin-conditional-compiler'

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
            {
                urlPattern:
                    /^https:\/\/openpose-editor.oss-cn-beijing\.aliyuncs\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'aliyuncs',
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
    includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'safari-pinned-tab.svg',
    ],
    manifest: {
        name: '3D Openpose Editor',
        short_name: '3D Openpose Editor',
        description: '3D Openpose Editor (Yu Zhu)',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
            {
                src: 'icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
            },
            {
                src: 'icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
            },
            {
                src: 'icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
            },
            {
                src: 'icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
            },
            {
                src: 'icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
            },
            {
                src: 'icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: 'icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
            },
            {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any',
            },
        ],
    },
})

// https://vitejs.dev/config/
const config: UserConfigFn = ({ command, mode, ssrBuild }) => {
    const IsExtension = mode.startsWith('extension')
    const common: UserConfig = {
        base: mode === 'online' ? '/open-pose-editor/' : './',
        define: {
            global: {},
            __APP_VERSION__: JSON.stringify('0.1.23'),
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
            IsExtension ? splitVendorChunkPlugin() : null,
        ],
    }

    if (IsExtension) {
        common.resolve = {
            alias: [
                {
                    // Replace assets.ts for extension
                    find: /.*\/assets(\.ts)?$/,
                    replacement: resolve(
                        __dirname,
                        'src/environments/extension/assets.ts'
                    ),
                },
            ],
        }

        switch (mode) {
            case 'extension-editor':
                {
                    common.build = {
                        ...common.build,
                        assetsDir: '.',
                        outDir: 'pages',
                    }
                }
                break
            case 'extension-entry':
                {
                    common.build = {
                        ...common.build,
                        outDir: 'javascript',
                        assetsDir: '.',
                        rollupOptions: {
                            input: {
                                index: resolve(
                                    __dirname,
                                    'src/environments/extension/entry.ts'
                                ),
                            },
                            output: {
                                entryFileNames: 'index.js',
                                format: 'iife',
                            },
                        },
                    }
                    common.publicDir = false
                }
                break
        }
    }

    return common
}

export default defineConfig(config)
