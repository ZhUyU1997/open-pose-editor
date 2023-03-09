import './init'
import * as dat from 'dat.gui'
import './index.css'
import { options } from './config'
import { BodyEditor } from './editor'
import i18n from './i18n'

const editor = new BodyEditor(
    document.querySelector<HTMLCanvasElement>('#canvas')!
)
const gui = new dat.GUI()

window.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyX':
            options.moveMode = true
            gui.updateDisplay()
            break
        case 'KeyD':
            editor.RemoveBody()
            break
    }
})

window.addEventListener('keyup', function (event) {
    switch (event.code) {
        case 'KeyX':
            options.moveMode = false
            gui.updateDisplay()
            break
    }
})

gui.add(options, 'changeLanguage').name('Change Language/切换语言')
gui.add(options, 'setBackground').name(i18n.t('Set Background Image'))

gui.add(editor, 'SaveScene').name(i18n.t('Save Scene'))
gui.add(editor, 'LoadScene').name(i18n.t('Load Scene'))
gui.add(editor, 'RestoreAutoSavedScene').name(i18n.t('Restore Last Scene'))

options['width'] = editor.Width
options['height'] = editor.Height
gui.add(editor, 'Width').name(i18n.t('Width'))
gui.add(editor, 'Height').name(i18n.t('Height'))

function UpdateSize() {
    options['width'] = editor.Width
    options['height'] = editor.Height

    gui.updateDisplay()
}

UpdateSize()

gui.add(editor, 'MakeImages').name(
    i18n.t('Skeleton Map/Depth Map/Normal Map/Edge Map')
)
gui.add(editor, 'CopyBodyZ').name(i18n.t('Duplicate Skeleton (Z-axis)'))
gui.add(editor, 'CopyBodyX').name(i18n.t('Duplicate Skeleton (X-axis)'))
gui.add(editor, 'RemoveBody').name(
    i18n.t('Delete Selected Skeleton (Press D key)')
)
gui.add(options, 'moveMode').name(i18n.t('Move Mode (Press X key)'))

gui.add(editor, 'enableComposer').name(i18n.t('Show Edge Map'))

gui.add(editor, 'CameraNear', 0.1, 1000).name(i18n.t('Camera Near'))
gui.add(editor, 'CameraFar', 0.1, 1000).name(i18n.t('Camera Far'))

window.addEventListener('resize', () => {
    UpdateSize()
})

editor.loadBodyData()
