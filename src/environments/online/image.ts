import { download } from '../../utils/transfer'

document.querySelectorAll('.gallery img').forEach((img) =>
    img.addEventListener('click', (e) => {
        const image = e.target as HTMLImageElement
        const title = image?.getAttribute('title') ?? ''
        const url = image?.getAttribute('src') ?? ''
        download(url, title)
    })
)

export function SetScreenShot(id: string, url: string, name: string) {
    const img = document.querySelector<HTMLImageElement>(`.gallery #${id}`)

    if (img) {
        img.src = url
        img.title = name
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function onMakeImages() {}

export function setBackgroundImage(dataUrl: string | null) {
    const div = document.getElementById('background')

    if (div) {
        if (!dataUrl) div.style.backgroundImage = 'none'
        else div.style.backgroundImage = `url(${dataUrl})`
    }
}
