import { getImage } from '../../utils/image'
import { uploadImage } from '../../utils/transfer'
import { DetectPosefromImage } from '../../utils/detect'

import { BodyControlor, GetRandomPose, LoadPosesLibrary } from '../../body'

import { GetLoading } from '../../components/Loading'
import { BodyEditor } from '../../editor'
import i18n from '../../i18n'
import { Oops } from '../../components/Oops'
import assets from '../../assets'
import { ShowToast } from '../../components/Toast'

export class Helper {
    editor: BodyEditor
    constructor(editor: BodyEditor) {
        this.editor = editor
    }

    async DetectFromImage(onChangeBackground: (url: string) => void) {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        const loading = GetLoading(500)

        try {
            const dataUrl = await uploadImage()

            if (!dataUrl) return

            const image = await getImage(dataUrl)
            onChangeBackground(dataUrl)

            loading.show({ title: i18n.t('Downloading MediaPipe Pose Model') })
            const result = await DetectPosefromImage(image)
            loading.hide()

            if (result) {
                if (!result.poseWorldLandmarks)
                    throw new Error(JSON.stringify(result))

                const positions: [number, number, number][] =
                    result.poseWorldLandmarks.map(({ x, y, z }) => [
                        x * 100,
                        -y * 100,
                        -z * 100,
                    ])

                // this.drawPoseData(
                //     result.poseWorldLandmarks.map(({ x, y, z }) =>
                //         new THREE.Vector3().fromArray([x * 100, -y * 100, -z * 100])
                //     )
                // )

                await this.editor.SetBlazePose(positions)
                return
            }
        } catch (error) {
            loading.hide()

            Oops(error)
            console.error(error)
            return null
        }
    }

    async CopyKeypointToClipboard() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }
        try {
            const data = new BodyControlor(body).Get18keyPointsData()
            await navigator.clipboard.writeText(JSON.stringify(data, null, 4))
            ShowToast({ title: i18n.t('Copied to Clipboard') })
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }
    async SetRandomPose() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        const loading = GetLoading(500)

        try {
            let poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }

            loading.show({ title: i18n.t('Downloading Poses Library') })

            await LoadPosesLibrary(assets['src/poses/data.bin'])
            loading.hide()

            poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }
        } catch (error) {
            loading.hide()

            Oops(error)
            console.error(error)
            return
        }
    }
    Feedback() {
        window.open('https://github.com/ZhUyU1997/open-pose-editor/issues/new')
    }
}
