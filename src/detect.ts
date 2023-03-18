import { Pose, Results } from '@mediapipe/pose'

// https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md#resources

const pose = new Pose({
    locateFile: (file) => {
        const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`

        console.log('load pose model', url)
        return url
    },
})

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
