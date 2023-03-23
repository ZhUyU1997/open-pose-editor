import * as dat from 'dat.gui'
import i18n, { LanguageMapping } from '../../i18n'

export function CreateLanguageFolder(gui: dat.GUI) {
    const current = LanguageMapping[i18n.language] ?? 'English'
    const R_LanguageMapping = Object.fromEntries(
        Object.entries(LanguageMapping).map(([k, v]) => [v, k])
    )
    gui.add({ lang: current }, 'lang', [...Object.values(LanguageMapping)])
        .name('Language')
        .onChange((value) => {
            const lng = R_LanguageMapping[value]
            const url = new URL(window.location.href)

            url.searchParams.set('lng', lng)
            window.location.assign(url)
        })
}
