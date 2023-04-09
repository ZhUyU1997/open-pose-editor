import { PartIndexMappingOfPoseModel } from './defines'

const PosesLibrary: [number, number, number][][] | null = []

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function GetRandomPose() {
    if (PosesLibrary)
        return PosesLibrary[getRandomInt(0, PosesLibrary.length - 1)]
    return null
}

export async function LoadPosesLibrary(posesLibraryUrl: string) {
    const response = await fetch(posesLibraryUrl)
    const buffer = await response.arrayBuffer()

    console.log(buffer.byteLength)
    const int16Array = new Int32Array(buffer)

    const num = Object.keys(PartIndexMappingOfPoseModel).length

    for (let i = 0; i < int16Array.length / (num * 3); i++) {
        const temp: [number, number, number][] = []
        for (let j = 0; j < num; j++) {
            const a = int16Array[i * (num * 3) + j * 3 + 0]
            const b = int16Array[i * (num * 3) + j * 3 + 1]
            const c = int16Array[i * (num * 3) + j * 3 + 2]

            temp.push([a / 1000.0, b / 1000.0, c / 1000.0])
        }

        PosesLibrary?.push(temp)
    }
}
