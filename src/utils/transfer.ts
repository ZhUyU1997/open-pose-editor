import {
    fileOpen,
    fileSave,
    FileWithHandle,
    FirstFileOpenOptions,
} from 'browser-fs-access'

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

async function fileOpenLegacy<M extends boolean | undefined = false>(
    _options: FirstFileOpenOptions<M> = {}
): Promise<FileWithHandle | FileWithHandle[]> {
    let options: FirstFileOpenOptions<M>[]
    if (!Array.isArray(_options)) {
        options = [_options]
    } else options = _options
    return new Promise((resolve, reject) => {
        const input = document.createElement('input') as HTMLInputElement
        input.type = 'file'
        const accept = [
            ...options.map((option) => option.mimeTypes || []),
            ...options.map((option) => option.extensions || []),
        ].join()
        input.multiple = options[0].multiple || false
        // Empty string allows everything.
        input.accept = accept || ''
        // Append to the DOM, else Safari on iOS won't fire the `change` event
        // reliably.
        input.style.display = 'none'
        document.body.append(input)

        const _reject = () => cleanupListenersAndMaybeReject?.(reject)
        const _resolve = (value: FileWithHandle | FileWithHandle[]) => {
            if (typeof cleanupListenersAndMaybeReject === 'function') {
                cleanupListenersAndMaybeReject()
            }
            resolve(value)
        }
        // ToDo: Remove this workaround once
        // https://github.com/whatwg/html/issues/6376 is specified and supported.
        const cleanupListenersAndMaybeReject =
            options[0].legacySetup &&
            options[0].legacySetup(_resolve, _reject, input)

        const cancelDetector = () => {
            window.removeEventListener('focus', cancelDetector)
            input.remove()
        }

        input.addEventListener('click', () => {
            window.addEventListener('focus', cancelDetector)
        })

        input.addEventListener('change', () => {
            window.removeEventListener('focus', cancelDetector)
            input.remove()

            if (input.files)
                _resolve(
                    input.multiple ? Array.from(input.files) : input.files[0]
                )
            else {
                _reject()
            }
        })

        if ('showPicker' in HTMLInputElement.prototype) {
            input.showPicker()
        } else {
            input.click()
        }
    })
}

export async function uploadJson() {
    try {
        const file = await fileOpenLegacy({
            mimeTypes: ['application/json'],
            legacySetup: (_, rejectionHandler) => {
                const timeoutId = setTimeout(rejectionHandler, 10_000)
                return (reject) => {
                    clearTimeout(timeoutId)
                    if (reject) {
                        console.error('reject')
                        reject('Failed to Open file')
                    }
                }
            },
        })

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function () {
                resolve(reader.result as string)
            }

            reader.onerror = function () {
                reject(reader.error)
            }

            if (Array.isArray(file) == false)
                reader.readAsText(file as FileWithHandle)
            else reject("Don't select multiple files")
        })
    } catch (error) {
        console.log(error)
        return null
    }
}

export async function uploadImage() {
    try {
        const file = await fileOpenLegacy({
            mimeTypes: ['image/*'],
            legacySetup: (_, rejectionHandler) => {
                const timeoutId = setTimeout(rejectionHandler, 10_000)
                return (reject) => {
                    clearTimeout(timeoutId)
                    console.log('reject')
                    if (reject) {
                        reject('Open file timeout')
                    }
                }
            },
        })

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function () {
                resolve(reader.result as string)
            }

            reader.onerror = function () {
                reject(reader.error)
            }

            if (Array.isArray(file) == false)
                reader.readAsDataURL(file as FileWithHandle)
            else reject("Don't select multiple files")
        })
    } catch (error) {
        console.log(error)
        return null
    }
}

export async function CopyTextToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        // https://github.com/sudodoki/copy-to-clipboard/blob/main/index.js
        const input = document.createElement('input') as HTMLInputElement
        input.type = 'text'
        input.style.display = 'none'
        input.value = text
        input.ariaHidden = 'true'
        // reset user styles for span element
        input.style.all = 'unset'
        // prevents scrolling to the end of the page
        input.style.position = 'fixed'
        input.style.top = '0'
        input.style.clip = 'rect(0, 0, 0, 0)'

        document.body.append(input)

        input.select()
        const successful = document.execCommand('copy')

        input.remove()

        if (!successful) {
            throw new Error('copy command was unsuccessful')
        }
    }
}
