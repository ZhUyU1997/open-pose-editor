import * as THREE from 'three'
import { Object3D } from 'three'

export function FindObjectItem<T extends THREE.Object3D>(
    object: THREE.Object3D,
    name: string
): T | null {
    //console.log(object);
    let result = null
    object.traverse((child) => {
        //console.log("child", child);
        if (child.name == name) {
            result = child
        }
    })
    return result
}

export function GetWorldPosition(o: Object3D) {
    const pos = new THREE.Vector3()
    o.getWorldPosition(pos)
    return pos
}

export function GetLocalPosition(obj: Object3D, postion: THREE.Vector3) {
    return obj.worldToLocal(postion.clone())
}
