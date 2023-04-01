import { RefObject, useEffect, useState } from 'react'
import assets from '../assets'
import { CreateTemplateBody, LoadFoot, LoadHand } from '../body'
import { GetLoading } from '../components/Loading'
import { BodyEditor } from '../editor'
import i18n, { LanguageMapping } from '../i18n'

export async function LoadBodyData() {
    const loading = GetLoading(500)
    loading.show({ title: i18n.t('Downloading Hand Model') })
    const hand = await LoadHand(assets['models/hand.fbx'])
    loading.show({ title: i18n.t('Downloading Foot Model') })
    const foot = await LoadFoot(assets['models/foot.fbx'])
    loading.hide()
    CreateTemplateBody(hand, foot)
}

export function useBodyEditor(
    canvasRef: RefObject<HTMLCanvasElement>,
    parent?: RefObject<HTMLDivElement>
) {
    const [editor, setEditor] = useState<BodyEditor>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        console.warn('create editor')

        let editor: BodyEditor | null = new BodyEditor({
            canvas,
            parentElem: parent?.current ?? (document as any),
            statsElem: import.meta.env.DEV ? document.body : undefined,
        })

        setEditor(editor)

        const init = async () => {
            // StrictMode will render twice
            // we have to check if the editor is null to avoid meaningless operations
            if (editor) {
                await LoadBodyData()
                editor?.InitScene()
            }
        }
        init()

        return () => {
            console.warn('disponse')
            editor?.disponse()
            editor = null
        }
    }, [])

    return editor
}

export function useLanguageSelect() {
    const [current] = useState(
        () => LanguageMapping[i18n.language] ?? 'English'
    )
    const [R_LanguageMapping] = useState(() =>
        Object.fromEntries(
            Object.entries(LanguageMapping).map(([k, v]) => [v, k])
        )
    )

    return {
        current,
        languagList: [...Object.values(LanguageMapping)],
        changeLanguage: (value: string) => {
            const lng = R_LanguageMapping[value]
            const url = new URL(window.location.href)

            url.searchParams.set('lng', lng)
            window.location.assign(url)
        },
    }
}
