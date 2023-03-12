import { BodyEditor } from './editor'
import * as dat from 'dat.gui'
import i18n from './i18n'
import { BodyControlor } from './body'

const bodyParams = {
    HeadCircumference: 100,
    HeadSize: 100,
    NoseToNeck: 100,
    ShoulderWidth: 100,
    ChestWidth: 100,
    Belly: 100,
    Waist: 100,
    Hips: 100,
    ArmLength: 100,
    UpperArm: 100,
    Forearm: 100,
    HandSize: 10,
    Thigh: 100,
    LowerLeg: 100,
    ShoulderToHip: 100,
    ShoulderToWaist: 100,
    WaistToKnee: 100,
    LegLength: 100,
    FootSize: 10,
}

export function CreateBodyParamsControls(editor: BodyEditor, gui: dat.GUI) {
    let currentControlor: BodyControlor | null = null
    const params = gui.addFolder(i18n.t('Body Parameters'))
    params
        .add(bodyParams, 'HeadSize', 0.1, 100)
        .name(i18n.t('Head Size'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.HeadSize = value
        })
    params
        .add(bodyParams, 'NoseToNeck', 0.1, 100)
        .name(i18n.t('Nose To Neck'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.NoseToNeck = value
        })
    params
        .add(bodyParams, 'ShoulderWidth', 0.1, 100)
        .name(i18n.t('Shoulder Width'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.ShoulderWidth = value
        })
    params
        .add(bodyParams, 'ShoulderToHip', 0.1, 100)
        .name(i18n.t('Shoulder To Hip'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.ShoulderToHip = value
        })
    params
        .add(bodyParams, 'ArmLength', 0.1, 100)
        .name(i18n.t('Arm Length'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.ArmLength = value
        })
    params
        .add(bodyParams, 'Forearm', 0.1, 100)
        .name(i18n.t('Forearm'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.Forearm = value
        })
    params
        .add(bodyParams, 'UpperArm', 0.1, 100)
        .name(i18n.t('Upper Arm'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.UpperArm = value
        })
    params
        .add(bodyParams, 'HandSize', 0.1, 10)
        .name(i18n.t('Hand Size'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.HandSize = value
        })

    params
        .add(bodyParams, 'Hips', 0.1, 100)
        .name(i18n.t('Hips'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.Hips = value
        })

    params
        .add(bodyParams, 'LegLength', 0.1, 200)
        .name(i18n.t('Leg Length'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.LegLength = value
        })

    params
        .add(bodyParams, 'Thigh', 0.1, 100)
        .name(i18n.t('Thigh'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.Thigh = value
        })
    params
        .add(bodyParams, 'LowerLeg', 0.1, 100)
        .name(i18n.t('Lower Leg'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.LowerLeg = value
        })
    params
        .add(bodyParams, 'FootSize', 0.1, 10)
        .name(i18n.t('Foot Size'))
        .onChange((value: number) => {
            if (currentControlor) currentControlor.FootSize = value
        })
    params.hide()

    editor.RegisterEvent({
        select(controlor) {
            currentControlor = controlor
            console.log('select')
            bodyParams.HeadSize = currentControlor.HeadSize

            bodyParams.NoseToNeck = currentControlor.NoseToNeck

            bodyParams.ShoulderWidth = currentControlor.ShoulderWidth
            bodyParams.ShoulderToHip = currentControlor.ShoulderToHip

            bodyParams.ArmLength = currentControlor.ArmLength
            bodyParams.UpperArm = currentControlor.UpperArm
            bodyParams.Forearm = currentControlor.Forearm
            bodyParams.HandSize = currentControlor.HandSize

            bodyParams.Hips = currentControlor.Hips

            bodyParams.LegLength = currentControlor.LegLength
            bodyParams.Thigh = currentControlor.Thigh
            bodyParams.LowerLeg = currentControlor.LowerLeg

            bodyParams.FootSize = currentControlor.FootSize

            params.updateDisplay()
            params.show()
            // params.open()
        },
        unselect() {
            params.hide()
        },
    })
}
