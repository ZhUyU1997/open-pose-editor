import fs from 'fs-extra'
import { zip } from 'zip-a-folder'
import path from 'path'

async function main() {
    const list = [
        'pose_landmark_full.tflite',
        'pose_web.binarypb',
        'pose_solution_packed_assets.data',
        'pose_solution_simd_wasm_bin.wasm',
        'pose_solution_packed_assets_loader.js',
        'pose_solution_simd_wasm_bin.js',
    ]

    fs.mkdirpSync('downloads/pose/0.5.1675469404')

    for (const file of list) {
        fs.copyFileSync(
            path.join('node_modules/@mediapipe/pose', file),
            path.join('downloads/pose/0.5.1675469404/', file)
        )
    }
    await zip('downloads', path.join('downloads.zip'))
}

main()
