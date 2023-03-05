import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from "three"


// const fbxLoader = new FBXLoader()
// fbxLoader.load(
//   '/models/rp_mei_posed_001_100k.fbx',
//   (object) => {
//     // object.traverse(function (child) {
//     //     if ((child as THREE.Mesh).isMesh) {
//     //         // (child as THREE.Mesh).material = material
//     //         if ((child as THREE.Mesh).material) {
//     //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
//     //         }
//     //     }
//     // })
//     // object.scale.set(.01, .01, .01)
//     scene.add(object)
//   },
//   (xhr) => {
//     console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
//   },
//   (error) => {
//     console.log(error)
//   }
// )

// instantiate a loader
const loader = new OBJLoader();

export async function LoadObjFile(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        // load a resource
        loader.load(
            // resource URL
            url,
            // called when resource is loaded
            function (object) {
                resolve(object)
            },
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function (error) {

                console.log('An error happened');
                reject(error)
            }
        );
    })
}
