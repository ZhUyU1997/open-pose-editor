import fs from 'fs-extra'
import path from 'path'
const list: Record<
    string,
    {
        prefix?: string
        mimetype: string
    }
> = {
    'models/foot.fbx': { mimetype: 'application/octet-stream' },
    'models/hand.fbx': { mimetype: 'application/octet-stream' },
    'src/poses/data.bin': { mimetype: 'application/octet-stream' },
    'pose_landmark_full.tflite': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/octet-stream',
    },
    'pose_web.binarypb': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/octet-stream',
    },
    'pose_solution_packed_assets.data': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/octet-stream',
    },
    'pose_solution_simd_wasm_bin.wasm': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/wasm',
    },
    'pose_solution_packed_assets_loader.js': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/javascript',
    },
    'pose_solution_simd_wasm_bin.js': {
        prefix: 'node_modules/@mediapipe/pose/',
        mimetype: 'application/javascript',
    },
}

const output = Object.fromEntries(
    Object.entries(list).map(([file, { prefix, mimetype }]) => [
        file,
        `data:${mimetype};base64,${fs
            .readFileSync(path.join(prefix ?? '.', file))
            .toString('base64')}`,
    ])
)

fs.writeFile(
    'src/assets.ts',
    'export default ' + JSON.stringify(output, null, 4)
)