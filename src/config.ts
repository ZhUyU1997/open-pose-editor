import i18n from './i18n'

export const options: Record<string, any> = {
    clearColor: 0xaaaaaa,
    moveMode: false,
    changeLanguage() {
        const url = new URL(window.location.href)
        url.searchParams.set('lng', i18n.language === 'zh' ? 'en' : 'zh')
        window.location.assign(url)
    },
}
