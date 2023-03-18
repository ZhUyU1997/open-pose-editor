import { Class } from 'type-fest'

// https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md#resources
import type { Results, Pose, PoseConfig } from '@mediapipe/pose'
import * as MediapipePose from '@mediapipe/pose'

// @mediapipe/pose is not an es module ??
// Extract Pose from the window to solve the problem
// To prevent optimization, just print it
console.log('@mediapipe/pose', MediapipePose)
const MyPose = (window as any).Pose as Class<Pose, [PoseConfig]>
console.log('MyPose', MyPose)

const pose = new MyPose({
    locateFile: (file) => {
        const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`

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
            resolve(result)
        })
    })
}
