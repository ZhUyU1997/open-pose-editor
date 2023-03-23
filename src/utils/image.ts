export function getImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = document.createElement('img')

        image.src = url
        image.addEventListener('load', () => {
            resolve(image)
        })
        image.addEventListener('abort', () => {
            reject('onabort')
        })
        image.addEventListener('error', () => {
            reject('onerror')
        })
    })
}
