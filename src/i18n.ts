import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import commonEn from './locales/en.json'
import commonZh_CN from './locales/zh-CN.json'
import commonZh_TW from './locales/zh-TW.json'
import commonZh_HK from './locales/zh-HK.json'
import commonJa_JP from './locales/ja.json'
import commonDe from './locales/de.json'
import commonSp from './locales/sp.json'

export const resources = {
    en: { common: commonEn },
    zh: { common: commonZh_CN },
    'zh-TW': { common: commonZh_TW },
    'zh-HK': { common: commonZh_HK },
    ja: { common: commonJa_JP },
    de: { common: commonDe },
    sp: { common: commonSp },
}

export const LanguageMapping: Record<string, string> = {
    en: 'English',
    zh: '简体中文',
    'zh-TW': '繁體中文（台灣）',
    'zh-HK': '繁體中文（香港）',
    ja: '日本語',
    de: 'Deutsch',
    sp: 'español',
}

const options = {
    order: ['querystring', 'localStorage', 'navigator'],
    lookupQuerystring: 'lng',
}

i18next.use(LanguageDetector).init({
    // lng: 'en', // if you're using a language detector, do not define the lng option
    detection: options,
    fallbackLng: 'en',
    debug: true,
    ns: ['common'],
    defaultNS: 'common',
    supportedLngs: Object.keys(resources),
    interpolation: {
        escapeValue: false,
    },
    resources: resources,
})

export function IsChina() {
    return (
        i18next.language === 'zh-CN' ||
        window.navigator.language === 'zh-CN' ||
        window.navigator.language?.includes('zh-CN')
    )
}

export default i18next
