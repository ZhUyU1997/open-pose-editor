import i18n from './i18n'

export const options: Record<string, any> = {
    clearColor: 0xaaaaaa,
    moveMode: false,
    changeLanguage() {
        let url = new URL(window.location.href)
        url.searchParams.append('lng', i18n.language === 'zh' ? 'en' : 'zh')
        window.location.assign(url)
    },
}
