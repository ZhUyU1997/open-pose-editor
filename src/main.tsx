import './init'
import * as dat from 'dat.gui'
import './index.css'
import { options } from './config'
import { BodyEditor } from './editor'
import i18n from './i18n'
import { CreateBodyParamsControls } from './body-params'
import { CreateLanguageFolder } from './language'

const editor = new BodyEditor(
    document.querySelector<HTMLCanvasElement>('#canvas')!
)
const gui = new dat.GUI()

window.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyX':
            editor.MoveMode = true
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
            editor.MoveMode = false
            gui.updateDisplay()
            break
    }
})

gui.width = 300

CreateLanguageFolder(gui)

gui.add(editor, 'MakeImages').name(
    i18n.t('Generate Skeleton/Depth/Normal/Canny Map')
)

gui.add(editor, 'DetectFromImage').name(i18n.t('Detect From Image'))

gui.add(options, 'setBackground').name(i18n.t('Set Background Image'))

gui.add(editor, 'SaveScene').name(i18n.t('Save Scene'))
gui.add(editor, 'LoadScene').name(i18n.t('Load Scene'))
gui.add(editor, 'RestoreLastSavedScene').name(i18n.t('Restore Last Scene'))

gui.add(editor, 'Undo').name(i18n.t('Undo'))
gui.add(editor, 'Redo').name(i18n.t('Redo'))

gui.add(editor, 'SetRandomPose').name(i18n.t('Set Random Pose [NEW]'))

options['Width'] = editor.Width
options['Height'] = editor.Height
gui.add(options, 'Width', 128, 5000)
    .name(i18n.t('Width'))
    .onChange(() => {
        options.autoSize = false
    })
gui.add(options, 'Height', 128, 5000)
    .name(i18n.t('Height'))
    .onChange(() => {
        options.autoSize = false
    })

function UpdateSize() {
    if (options.autoSize) {
        options['Width'] = editor.Width
        options['Height'] = editor.Height

        gui.updateDisplay()
    }
}

UpdateSize()

gui.add(editor, 'CopyBodyZ').name(i18n.t('Duplicate Skeleton (Z-axis)'))
gui.add(editor, 'CopyBodyX').name(i18n.t('Duplicate Skeleton (X-axis)'))
gui.add(editor, 'RemoveBody').name(
    i18n.t('Delete Selected Skeleton (Press D key)')
)
gui.add(editor, 'MoveMode').name(i18n.t('Move Mode (Press X key)'))
gui.add(editor, 'OnlyHand').name(i18n.t('Only Hand'))

// gui.add(editor, 'enableComposer').name(i18n.t('Show Edge Map'))
gui.add(editor, 'enablePreview').name(i18n.t('Show Preview'))

gui.add(editor, 'CameraNear', 0.1, 1000).name(i18n.t('Camera Near'))
gui.add(editor, 'CameraFar', 0.1, 1000).name(i18n.t('Camera Far'))
gui.add(editor, 'CameraFocalLength', 0.1, 100).name(
    i18n.t('Camera Focal Length')
)

CreateBodyParamsControls(editor, gui)

window.addEventListener('resize', () => {
    UpdateSize()
})

editor.loadBodyData()
