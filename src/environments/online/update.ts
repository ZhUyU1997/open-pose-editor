/// <reference types="vite-plugin-pwa/client" />

// #v-ifdef VITE_IS_ONLINE
import { registerSW } from 'virtual:pwa-register'
// #v-endif

import { ShowToast } from '../../components/Toast'
import i18n from '../../i18n'

async function PWAPopup(update: (reloadPage?: boolean) => Promise<void>) {
    const result = await ShowToast({
        title: i18n.t('Updates are available, please confirm!!'),
    })

    if (result === 'action') {
        update(true)
    }
}
export function PWACheck() {
    if (import.meta.env.MODE !== 'online') return
    const updateSW = registerSW({
        onNeedRefresh() {
            console.log('有更新，需要刷新！！')
            PWAPopup(updateSW)
        },
        onOfflineReady() {
            console.log('已经入离线模式！！')
        },
    })
}
