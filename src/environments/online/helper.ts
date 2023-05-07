import { getImage } from '../../utils/image'
import {
    CopyTextToClipboard,
    uploadImage,
    uploadJson,
} from '../../utils/transfer'
import { DetectPosefromImage } from '../../utils/detect'

import { BodyControlor } from '../../body'

import { GetLoading } from '../../components/Loading'
import { BodyEditor } from '../../editor'
import i18n, { IsChina } from '../../i18n'
import { Oops } from '../../components/Oops'
import assets from '../../assets'
import { ShowToast } from '../../components/Toast'
import { GetRandomPose, LoadPosesLibrary } from '../../pose-library'
import { IsQQBrowser } from '../../utils/browser'

export class Helper {
    editor: BodyEditor
    constructor(editor: BodyEditor) {
        this.editor = editor
    }

    async DetectFromImage(onChangeBackground: (url: string) => void) {
        if (IsQQBrowser()) {
            Oops('QQ浏览器暂不支持图片检测，请使用其他浏览器试试')
            return
        }
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
            if (error === 'Timeout') {
                if (IsChina())
                    Oops(
                        '下载超时，请点击“从图片中检测 [中国]”或者开启魔法，再试一次。' +
                            '\n' +
                            error
                    )
                else Oops(error)
            } else
                Oops(
                    i18n.t(
                        'If you try to detect anime characters, you may get an error. Please try again with photos.'
                    ) +
                        '\n' +
                        error
                )
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
            await CopyTextToClipboard(JSON.stringify(data, null, 4))
            ShowToast({ title: i18n.t('Copied to Clipboard') })
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async SaveGesture() {
        const hand = await this.editor.getSelectedHand()
        if (!hand) {
            ShowToast({ title: i18n.t('Please select a hand!!') })
            return
        }
        try {
            this.editor.SaveGesture()
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async LoadGesture() {
        const hand = await this.editor.getSelectedHand()

        if (!hand) {
            ShowToast({ title: i18n.t('Please select a hand!!') })
            return
        }

        const rawData = await uploadJson()
        if (!rawData) return

        try {
            this.editor.RestoreGesture(rawData)
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async GenerateSceneURL() {
        try {
            const d = encodeURIComponent(
                JSON.stringify(this.editor.GetSceneData())
            )
            const url_base = location.href.replace(/#$/, '')
            const url = `${url_base}#${d}`
            await CopyTextToClipboard(url)
            ShowToast({ title: i18n.t('Copied to Clipboard') })
        } catch (error) {
            Oops(error)
            console.error(error)
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
    async CopySkeleton() {
        const body = this.editor.getSelectedBody()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        this.editor.CopySelectedBody()
    }
    async RemoveSkeleton() {
        const body = this.editor.getSelectedBody()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        this.editor.RemoveBody()
    }
    FeedbackByQQ() {
        window.open('https://jq.qq.com/?_wv=1027&k=N6j4nigd')
    }
    FeedbackByGithub() {
        window.open('https://github.com/ZhUyU1997/open-pose-editor/issues/new')
    }
}
