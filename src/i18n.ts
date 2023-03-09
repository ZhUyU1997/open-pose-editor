import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import commonEn from './locales/en.json'
import commonZh from './locales/zh.json'

const resources = {
    en: { common: commonEn },
    zh: { common: commonZh },
}

const options = {
    order: ['querystring', 'navigator'],
    lookupQuerystring: 'lng',
}

i18next.use(LanguageDetector).init({
    // lng: 'en', // if you're using a language detector, do not define the lng option
    detection: options,
    fallbackLng: 'en',
    debug: true,
    ns: ['common'],
    defaultNS: 'common',
    supportedLngs: ['en', 'zh'],
    interpolation: {
        escapeValue: false,
    },
    resources: resources,
})

export default i18next
