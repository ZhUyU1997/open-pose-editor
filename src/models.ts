import * as THREE from 'three'
import { FindObjectItem } from './utils/three-utils'
import { LoadFBXFile, LoadGLTFile, LoadObjFile } from './utils/loader'

export let HandObject: THREE.Group | null = null
export let FootObject: THREE.Group | null = null

export const HandModelInfo = {
    meshName: 'shoupolySurface1',
    bonePrefix: 'shoujoint',
}
export const FootModelInfo = {
    meshName: 'FootObject',
    bonePrefix: 'FootBone',
}

export const ExtremitiesMapping: Record<
    string,
    {
        meshName: string
        bonePrefix: string
    }
> = {
    left_hand: HandModelInfo,
    right_hand: HandModelInfo,
    left_foot: FootModelInfo,
    right_foot: FootModelInfo,
}

export function IsMatchBonePrefix(name: string) {
    if (name.startsWith(HandModelInfo.bonePrefix)) return true
    if (name.startsWith(FootModelInfo.bonePrefix)) return true
    return false
}

export async function LoadHand(
    handFBXFileUrl: string,
    onLoading?: (loaded: number) => void
) {
    const fbx = await LoadFBXFile(handFBXFileUrl, onLoading)

    // fbx.scale.multiplyScalar(10)
    const mesh = FindObjectItem<THREE.SkinnedMesh>(fbx, HandModelInfo.meshName)!
    mesh.material = new THREE.MeshPhongMaterial()
    // this.scene.add();
    // const helper = new THREE.SkeletonHelper(mesh.parent!);
    // this.scene.add(helper);

    // console.log(mesh.skeleton.bones)
    mesh.skeleton.bones.forEach((o) => {
        const point = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                //  vertexColors: true,
                depthTest: false,
                opacity: 1,
                transparent: true,
                // depthWrite: false,
                // toneMapped: false,
                // transparent: true,
            })
        )
        point.name = 'red_point'
        // point.scale.setX(0.2)
        // point.position.copy(o.position)
        o.add(point)
    })

    const mask = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.4, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    mask.name = 'hand_mask'
    mask.visible = false
    mask.rotateZ(Math.PI / 2)
    mesh.skeleton.bones[0].add(mask)

    HandObject = fbx
    return fbx
}

export async function LoadFoot(
    footFBXFileUrl: string,
    onLoading?: (loaded: number) => void
) {
    const fbx = await LoadFBXFile(footFBXFileUrl, onLoading)

    console.log(fbx)
    // fbx.scale.multiplyScalar(0.001)

    const mesh = FindObjectItem<THREE.SkinnedMesh>(fbx, FootModelInfo.meshName)!
    mesh.material = new THREE.MeshPhongMaterial()
    // this.scene.add();
    // const helper = new THREE.SkeletonHelper(mesh.parent!);
    // this.scene.add(helper);

    console.log(mesh.skeleton.bones)
    mesh.skeleton.bones.forEach((o) => {
        if (o.name !== 'FootBone2') return
        const point = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                depthTest: false,
                opacity: 1,
                transparent: true,
            })
        )

        point.name = 'red_point'
        // point.position.copy(o.position)
        point.translateX(-0.3)
        o.add(point)
    })

    const mask = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    mask.scale.setX(0.7)
    mask.name = 'foot_mask'
    mask.visible = false
    mesh.skeleton.bones[0].add(mask)

    FootObject = fbx
    return fbx
}
