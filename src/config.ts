import { setBackgroundImage } from 'environments/image'
import i18n from './i18n'
import { uploadImage } from './util'

export const options: Record<string, any> = {
    clearColor: 0xaaaaaa,
    autoSize: true,
    Width: 0,
    Height: 0,
    async setBackground() {
        const dataUrl = await uploadImage()
        setBackgroundImage(dataUrl)
    },
}
