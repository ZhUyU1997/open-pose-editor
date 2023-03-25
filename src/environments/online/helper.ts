import { getImage } from '../../utils/image'
import { uploadImage } from '../../utils/transfer'
import { getCurrentTime } from '../../utils/time'
import { setBackgroundImage, SetScreenShot } from './image'
import { DetectPosefromImage } from '../../utils/detect'

import { GetRandomPose, LoadPosesLibrary } from '../../body'

import Swal from 'sweetalert2'
import { BodyEditor } from '../../editor'
import i18n from '../../i18n'
import { Oops } from '../../components'
import assets from '../../assets'
import * as dat from 'dat.gui'

export class Helper {
    editor: BodyEditor
    gui: dat.GUI
    constructor(gui: dat.GUI, editor: BodyEditor) {
        this.editor = editor
        this.gui = gui
    }

    MakeImages() {
        const image = this.editor.MakeImages()

        for (const [name, imgData] of Object.entries(image)) {
            const fileName = name + '_' + getCurrentTime()
            SetScreenShot(name, imgData, fileName)
        }
    }
    async DetectFromImage() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            await Swal.fire(i18n.t('Please select a skeleton!!'))
            return
        }

        try {
            let loading = true

            const dataUrl = await uploadImage()

            if (!dataUrl) return

            const image = await getImage(dataUrl)
            setBackgroundImage(dataUrl)

            setTimeout(() => {
                if (loading)
                    Swal.fire({
                        title: i18n.t('Downloading MediaPipe Pose Model') ?? '',
                        didOpen: () => {
                            Swal.showLoading()
                        },
                    })
            }, 500)

            const result = await DetectPosefromImage(image)
            loading = false
            Swal.hideLoading()
            Swal.close()

            if (result) {
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
            Swal.hideLoading()
            Swal.close()

            Oops(error)
            console.error(error)
            return null
        }
    }
    async setBackground() {
        const dataUrl = await uploadImage()
        setBackgroundImage(dataUrl)
    }
    async SetRandomPose() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            await Swal.fire(i18n.t('Please select a skeleton!!'))
            return
        }

        try {
            let poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }

            let loading = true

            setTimeout(() => {
                if (loading)
                    Swal.fire({
                        title: i18n.t('Downloading Poses Library') ?? '',
                        didOpen: () => {
                            Swal.showLoading()
                        },
                    })
            }, 500)

            await LoadPosesLibrary(assets['src/poses/data.bin'])
            loading = false
            Swal.hideLoading()
            Swal.close()

            poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }
        } catch (error) {
            Swal.hideLoading()
            Swal.close()

            Oops(error)
            console.error(error)
            return
        }
    }
    Feedback() {
        window.open('https://github.com/ZhUyU1997/open-pose-editor/issues/new')
    }
}
