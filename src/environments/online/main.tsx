import './init'
import './index.css'
import { options } from '../../config'
import { BodyEditor } from '../../editor'
import i18n from '../../i18n'
import { CreateBodyParamsControls } from './body-params'
import { CreateLanguageFolder } from './language'
import { canvasElement, createDatGui, statsElement } from './gui'
import Swal from 'sweetalert2'
import { CreateTemplateBody, LoadFoot, LoadHand } from '../../body'

import assets from '../../assets'
import { Helper } from './helper'

async function LoadBodyData() {
    const hand = await LoadHand(assets['models/hand.fbx'], (loaded) => {
        if (loaded >= 100) {
            Swal.hideLoading()
            Swal.close()
        } else if (Swal.isVisible() == false) {
            Swal.fire({
                title: i18n.t('Downloading Hand Model') ?? '',
                didOpen: () => {
                    Swal.showLoading()
                },
            })
        }
    })
    const foot = await LoadFoot(assets['models/foot.fbx'], (loaded) => {
        if (loaded >= 100) {
            Swal.hideLoading()
            Swal.close()
        } else if (Swal.isVisible() == false) {
            Swal.fire({
                title: i18n.t('Downloading Foot Model') ?? '',
                didOpen: () => {
                    Swal.showLoading()
                },
            })
        }
    })
    CreateTemplateBody(hand, foot)
}

export async function Main() {
    const editor = new BodyEditor(canvasElement, statsElement)
    const gui = createDatGui()
    gui.width = 300

    window.addEventListener('keydown', function (event) {
        if (editor.paused) {
            return
        }
        switch (event.code) {
            case 'KeyX':
                editor.MoveMode = true
                gui.updateDisplay()
                break
        }
    })

    window.addEventListener('keyup', function (event) {
        if (editor.paused) {
            return
        }
        switch (event.code) {
            case 'KeyX':
                editor.MoveMode = false
                gui.updateDisplay()
                break
        }
    })

    const UpdateSize = () => {
        if (options.autoSize) {
            options['Width'] = editor.Width
            options['Height'] = editor.Height

            gui.updateDisplay()
        }
    }

    UpdateSize()

    window.addEventListener('resize', UpdateSize)

    CreateLanguageFolder(gui)

    const helper = new Helper(gui, editor)

    gui.add(helper, 'MakeImages').name(
        i18n.t('Generate Skeleton/Depth/Normal/Canny Map')
    )
    gui.add(helper, 'DetectFromImage').name(i18n.t('Detect From Image'))
    gui.add(helper, 'setBackground').name(i18n.t('Set Background Image'))

    gui.add(editor, 'SaveScene').name(i18n.t('Save Scene'))
    gui.add(editor, 'LoadScene').name(i18n.t('Load Scene'))
    gui.add(editor, 'RestoreLastSavedScene').name(i18n.t('Restore Last Scene'))

    gui.add(helper, 'SetRandomPose').name(i18n.t('Set Random Pose [NEW]'))

    const edit = gui.addFolder(i18n.t('Edit'))
    edit.add(editor, 'Undo').name(i18n.t('Undo'))
    edit.add(editor, 'Redo').name(i18n.t('Redo'))

    edit.add(editor, 'CopySelectedBody').name(
        i18n.t('Duplicate Skeleton (Shift + D)')
    )
    // gui.add(editor, 'CopyBodyX').name(i18n.t('Duplicate Skeleton (X-axis)'))
    edit.add(editor, 'RemoveBody').name(i18n.t('Delete Skeleton (Del)'))

    const setting = gui.addFolder(i18n.t('Setting'))

    if (options['Width'] == 0 || options['Height'] == 0) {
        options['Width'] = editor.Width
        options['Height'] = editor.Height
    }
    setting
        .add(options, 'Width', 128, 5000)
        .name(i18n.t('Width'))
        .onChange(() => {
            options.autoSize = false
        })
    setting
        .add(options, 'Height', 128, 5000)
        .name(i18n.t('Height'))
        .onChange(() => {
            options.autoSize = false
        })

    setting.add(editor, 'MoveMode').name(i18n.t('Move Mode (Press X key)'))
    setting.add(editor, 'FreeMode').name(i18n.t('Free Mode'))
    setting.add(editor, 'OnlyHand').name(i18n.t('Only Hand'))

    // gui.add(editor, 'enableComposer').name(i18n.t('Show Edge Map'))
    setting.add(editor, 'enablePreview').name(i18n.t('Show Preview'))

    setting.add(editor, 'CameraNear', 0.1, 1000).name(i18n.t('Camera Near'))
    setting.add(editor, 'CameraFar', 0.1, 1000).name(i18n.t('Camera Far'))
    setting
        .add(editor, 'CameraFocalLength', 0.1, 100)
        .name(i18n.t('Camera Focal Length'))

    const view = gui.addFolder(i18n.t('View'))
    view.add(editor, 'FixView').name(i18n.t('Fix View'))
    view.add(editor, 'RestoreView').name(i18n.t('Restore View'))

    CreateBodyParamsControls(editor, gui)

    gui.add(helper, 'Feedback').name(i18n.t('Feedback'))

    await LoadBodyData()
    editor.InitScene()
}
