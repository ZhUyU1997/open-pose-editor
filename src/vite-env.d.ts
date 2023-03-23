/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_BUILD_TIME__: number
declare module 'environments/gui' {
    export const canvasElement: HTMLCanvasElement
    export const statsElement: HTMLElement | undefined
    export function createDatGui(): dat.GUI
}
declare module 'environments/assets' {
    export = {
        'models/hand.fbx': string,
        'models/foot.fbx': string,
        'src/poses/data.bin': string,
    }
}
declare module 'environments/image' {
    export function SetScreenShot(id: string, url: string, name: string): void
    export function onMakeImages(): void
    export function setBackgroundImage(dataUrl: string | null): void
}
declare module 'environments/init' {}
