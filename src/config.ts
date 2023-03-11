import i18n from './i18n'
import { uploadImage } from './util'

export const options: Record<string, any> = {
    clearColor: 0xaaaaaa,
    autoSize: true,
    Width: 0,
    Height: 0,
    changeLanguage() {
        const url = new URL(window.location.href)
        url.searchParams.set('lng', i18n.language === 'zh' ? 'en' : 'zh')
        window.location.assign(url)
    },
    async setBackground() {
        const dataUrl = await uploadImage()
        const div = document.getElementById('background')

        if (div) div.style.backgroundImage = `url(${dataUrl})`
    },
}
