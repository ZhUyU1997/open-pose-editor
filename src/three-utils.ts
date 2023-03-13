import * as THREE from 'three'

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
