import { Class } from 'type-fest'

// https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md#resources
import type { Results, Pose, PoseConfig } from '@mediapipe/pose'
import * as MediapipePose from '@mediapipe/pose'
import assets from '../assets'

// @mediapipe/pose is not an es module ??
// Extract Pose from the window to solve the problem
// To prevent optimization, just print it
console.log('@mediapipe/pose', MediapipePose)
const MyPose = import.meta.env.DEV
    ? MediapipePose.Pose
    : ((window as any).Pose as Class<Pose, [PoseConfig]>)
console.log('MyPose', MyPose)

const AliyuncsBase =
    'https://openpose-editor.oss-cn-beijing.aliyuncs.com/%40mediapipe/pose'
const JsdelivrBase = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'

let UseJsdelivrBase = true
function GetCDNBase() {
    if (UseJsdelivrBase) return JsdelivrBase
    else return AliyuncsBase
}

export function SetCDNBase(isJsdelivrBase: boolean) {
    UseJsdelivrBase = isJsdelivrBase
}

const pose = new MyPose({
    locateFile: (file) => {
        if (file in assets) {
            console.log('local', file)
            return (assets as any)[file]
        }
        const url = `${GetCDNBase()}/${file}`

        console.log('load pose model', url)
        return url
    },
})

// https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md#solution-apis
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
})

export function DetectPosefromImage(image: HTMLImageElement): Promise<Results> {
    return new Promise((resolve) => {
        pose.reset()
        pose.send({ image: image })
        pose.onResults((result) => {
            console.log(result)
            resolve(result)
        })
    })
}
