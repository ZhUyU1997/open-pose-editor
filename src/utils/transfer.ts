import { fileOpen, fileSave } from 'browser-fs-access'

export function download(href: string, title: string) {
    const a = document.createElement('a')
    a.setAttribute('href', href)
    a.setAttribute('download', title)
    a.click()
}

export function downloadJson(data: string, fileName: string) {
    const blob = new Blob([data], { type: 'text/json' })
    const href = window.URL.createObjectURL(blob)
    download(href, fileName)
    URL.revokeObjectURL(href)
}

export async function uploadJson() {
    try {
        const file = await fileOpen({
            mimeTypes: ['application/json'],
        })

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function () {
                resolve(reader.result as string)
            }

            reader.onerror = function () {
                reject(reader.error)
            }
            reader.readAsText(file)
        })
    } catch (error) {
        return null
    }
}

export async function uploadImage() {
    try {
        const file = await fileOpen({
            mimeTypes: ['image/*'],
        })

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function () {
                resolve(reader.result as string)
            }

            reader.onerror = function () {
                reject(reader.error)
            }
            reader.readAsDataURL(file)
        })
    } catch (error) {
        return null
    }
}
