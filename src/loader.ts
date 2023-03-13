import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const fbxLoader = new FBXLoader()
export async function LoadFBXFile(
    url: string,
    onLoading?: (loaded: number) => void
): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        // load a resource
        fbxLoader.load(
            // resource URL
            url,
            // called when resource is loaded
            function (object) {
                resolve(object)
            },
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                onLoading?.((xhr.loaded / xhr.total) * 100)
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened')
                reject(error)
            }
        )
    })
}

// instantiate a loader
const loader = new OBJLoader()

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
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened')
                reject(error)
            }
        )
    })
}

export async function LoadGLTFile(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
        // load a resource
        new GLTFLoader().load(
            // resource URL
            url,
            // called when resource is loaded
            function (object) {
                resolve(object)
            },
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened')
                reject(error)
            }
        )
    })
}
