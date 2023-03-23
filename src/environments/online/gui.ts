import * as dat from 'dat.gui'

export const canvasElement =
    document.querySelector<HTMLCanvasElement>('#canvas')!
export const statsElement = document.body

export function createDatGui() {
    const gui = new dat.GUI()
    return gui
}
