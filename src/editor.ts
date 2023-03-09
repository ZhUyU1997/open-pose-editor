import * as THREE from "three"
import { Bone, MeshDepthMaterial, MeshNormalMaterial, MeshPhongMaterial, Object3D, Skeleton, SkinnedMesh } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

// @ts-ignore
import { CCDIKHelper, CCDIKSolver, IKS } from 'three/examples/jsm/animate/CCDIKSolver';

import Stats from "three/examples/jsm/libs/stats.module";
import { CloneBody, CreateTemplateBody } from "./body";
import { options } from "./config";
import { SetScreenShot } from "./image";
import { LoadFBXFile, LoadGLTFile, LoadObjFile } from "./loader";
import { getCurrentTime } from "./util";
import handObjFileUrl from "../models/hand.obj?url"
import xbotFileUrl from "../models/hand2.glb?url"
import handFBXFileUrl from "../models/hand.fbx?url"

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import Swal from "sweetalert2";
import i18n from "./i18n"

const pickableObjectNames: string[] = ["torso",
    "neck",
    "right_shoulder",
    "left_shoulder",
    "right_elbow",
    "left_elbow",
    "right_hip",
    "left_hip",
    "right_knee",
    "left_knee",
]


export class BodyEditor {
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    gridHelper: THREE.GridHelper
    axesHelper: THREE.AxesHelper
    camera: THREE.PerspectiveCamera
    orbitControls: OrbitControls
    transformControl: TransformControls

    dlight: THREE.DirectionalLight
    alight: THREE.AmbientLight
    raycaster = new THREE.Raycaster()
    IsClick = false
    stats: Stats

    ikSolver?: CCDIKSolver
    composer?: EffectComposer
    effectSobel?: ShaderPass
    enableComposer: boolean = false
    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            // logarithmicDepthBuffer: true
        });
        this.renderer.setClearColor(options.clearColor, 1.0)
        this.scene = new THREE.Scene();

        this.gridHelper = new THREE.GridHelper(800, 200)
        this.axesHelper = new THREE.AxesHelper(1000);
        this.scene.add(this.gridHelper)
        this.scene.add(this.axesHelper);

        let aspect = window.innerWidth / window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

        this.camera.position.set(0, 100, 200)
        this.camera.lookAt(0, 100, 0);
        // this.camera.near = 130
        // this.camera.far = 600
        this.camera.updateProjectionMatrix();

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target = new THREE.Vector3(0, 100, 0);
        this.orbitControls.update();

        this.transformControl = new TransformControls(this.camera, this.renderer.domElement);

        this.transformControl.setMode("rotate");//旋转
        // transformControl.setSize(0.4);
        this.transformControl.setSpace("local");
        this.transformControl.addEventListener('change', () => this.renderer.render(this.scene, this.camera));

        this.transformControl.addEventListener('mouseDown', () => {
            this.orbitControls.enabled = false
        })
        this.transformControl.addEventListener('mouseUp', () => {
            this.orbitControls.enabled = true
        })

        this.scene.add(this.transformControl);


        // Light
        this.dlight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.dlight.position.set(0, 160, 1000);
        this.scene.add(this.dlight);
        this.alight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.alight);


        this.renderer.domElement.addEventListener('mousedown', () => this.IsClick = true, false)
        this.renderer.domElement.addEventListener('mousemove', () => this.IsClick = false, false)
        this.renderer.domElement.addEventListener('mouseup', this.onMouseDown.bind(this), false)

        this.renderer.domElement.addEventListener('resize', this.handleResize.bind(this))

        this.initEdgeComposer();

        // // Create a render target with depth texture
        // this.setupRenderTarget();

        // // Setup post-processing step
        // this.setupPost();

        this.stats = Stats()
        document.body.appendChild(this.stats.dom)
        this.animate()
        this.handleResize()
    }

    target?: THREE.WebGLRenderTarget
    setupRenderTarget() {

        if (this.target) this.target.dispose();

        const params = {
            format: THREE.DepthFormat,
            type: THREE.UnsignedShortType
        };

        const format = params.format;
        const type = params.type;

        this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.target.texture.minFilter = THREE.NearestFilter;
        this.target.texture.magFilter = THREE.NearestFilter;
        this.target.stencilBuffer = (format === THREE.DepthStencilFormat) ? true : false;
        this.target.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
        this.target.depthTexture.format = format;
        this.target.depthTexture.type = type;

    }

    postCamera?: THREE.OrthographicCamera
    postMaterial?: THREE.ShaderMaterial
    postScene?: THREE.Scene
    setupPost() {

        // Setup post processing stage
        this.postCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
        this.postMaterial = new THREE.ShaderMaterial({
            vertexShader: document.querySelector('#post-vert')?.textContent?.trim(),
            fragmentShader: document.querySelector('#post-frag')?.textContent?.trim(),
            uniforms: {
                cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far },
                tDiffuse: { value: null },
                tDepth: { value: null }
            }
        });
        const postPlane = new THREE.PlaneGeometry(2, 2);
        const postQuad = new THREE.Mesh(postPlane, this.postMaterial);
        this.postScene = new THREE.Scene();
        this.postScene.add(postQuad);
    }

    render() {
        this.handleResize();

        this.ikSolver?.update();

        if (this.postMaterial && this.target) {
            this.renderer.setRenderTarget(this.target);
            // this.postMaterial.uniforms.cameraNear.value = 100
            // this.postMaterial.uniforms.cameraNear.value = 200
            this.postMaterial.uniforms.tDiffuse.value = this.target.texture;
            this.postMaterial.uniforms.tDepth.value = this.target.depthTexture;
        }

        if (this.enableComposer && this.composer)
            this.composer?.render();
        else
            this.renderer.render(this.scene, this.camera);

        if (this.postScene && this.postCamera) {
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.postScene!, this.postCamera!)
        }

        this.stats.update()
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.render()
    }

    getBodyByPart(o: Object3D) {
        let obj: Object3D | null = o
        while (obj) {
            if (obj?.name !== "torso")
                obj = obj.parent
            else
                break
        }
        while (obj) {
            if (obj?.parent?.name == "torso")
                obj = obj.parent
            else
                break
        }

        return obj
    }
    onMouseDown(event: MouseEvent) {

        this.raycaster.setFromCamera(
            {
                x: (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
                y: -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1
            },
            this.camera
        )
        let intersects: THREE.Intersection[] = this.raycaster.intersectObjects(this.scene.children.filter(o => o?.name === "torso"), true)
        let intersectedObject: THREE.Object3D | null = intersects.length > 0 ? intersects[0].object : null
        const name = intersectedObject ? intersectedObject.name : ""
        let obj: Object3D | null = intersectedObject
        console.log(obj?.name)

        if (this.IsClick) {
            if (!obj) {
                this.transformControl.detach()
                return
            }

            if (options.moveMode) {
                obj = this.getBodyByPart(obj)

                if (obj) {
                    console.log(obj.name)
                    this.transformControl.setMode("translate")
                    this.transformControl.setSpace("world")
                    this.transformControl.attach(obj)
                }


            }
            else if (pickableObjectNames.includes(name) || name.startsWith("shoujoint")) {
                while (obj) {
                    if (obj?.parent?.name == name)
                        obj = obj.parent
                    else
                        break
                }
                if (obj) {
                    this.transformControl.setMode("rotate")
                    this.transformControl.setSpace("local")
                    this.transformControl.attach(obj)
                }
            }
        }

    }

    traverseHandObjecct(handle: (o: THREE.Mesh) => void) {
        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name === "038F_05SET_04SHOT") {
                        handle(child as THREE.Mesh)
                    }
                })
            })
    }
    Capture() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)

        this.traverseHandObjecct(o => o.visible = false)

        this.render();
        let imgData = this.renderer.domElement.toDataURL("image/png");
        const fileName = "pose_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        this.traverseHandObjecct(o => o.visible = true)

        return {
            imgData, fileName
        }
    }

    hideSkeleten() {
        const map = new Map<Object3D, Object3D | null>()

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name === "038F_05SET_04SHOT") {
                        map.set(child, child.parent)
                        this.scene.attach(child)
                    }
                    else if (child?.name.startsWith("shoujoint") && !(child instanceof THREE.Bone)) {
                        child.visible = false
                    }
                })
                o.visible = false
            })
        return map
    }

    showSkeleten(map: Map<Object3D, Object3D | null>) {
        for (const [k, v] of map.entries()) {
            v?.attach(k)
        }

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name.startsWith("shoujoint") && !(child instanceof THREE.Bone)) {
                        child.visible = true
                    }
                })
                o.visible = true

            })
    }

    changeComposer(enable: boolean) {
        const save = this.enableComposer
        this.enableComposer = enable

        return () => this.enableComposer = save
    }
    CaptureCanny() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)

        const map = this.hideSkeleten()

        const restore = this.changeComposer(true)
        this.render();


        let imgData = this.renderer.domElement.toDataURL("image/png");
        const fileName = "canny_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        this.showSkeleten(map)
        restore()

        return {
            imgData, fileName
        }
    }


    changeHandMaterial(type: "depth" | "normal" | "phone") {
        let initType = "depth"
        this.traverseHandObjecct(child => {
            const o = this.findObjectItem<THREE.SkinnedMesh>(child, "shoupolySurface1")!
            if (o.material) {
                if (o.material instanceof MeshNormalMaterial)
                    initType = "normal"
                if (o.material instanceof MeshPhongMaterial)
                    initType = "phone"
            }

            if (type == "depth")
                o.material = new MeshDepthMaterial()
            else if (type == "normal")
                o.material = new MeshNormalMaterial()
            else if (type == "phone")
                o.material = new MeshPhongMaterial()
        })


        return () => {
            this.traverseHandObjecct(child => {
                const o = this.findObjectItem<THREE.SkinnedMesh>(child, "shoupolySurface1")!

                if (initType == "depth")
                    o.material = new MeshDepthMaterial()
                else if (initType == "normal")
                    o.material = new MeshNormalMaterial()
                else if (initType == "phone")
                    o.material = new MeshPhongMaterial()
            })
        }

    }
    CaptureNormal() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)


        const restoreHand = this.changeHandMaterial("normal");
        const map = this.hideSkeleten()
        const restore = this.changeComposer(false)
        this.render();


        let imgData = this.renderer.domElement.toDataURL("image/png");
        const fileName = "normal_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        this.showSkeleten(map)
        restore()
        restoreHand()

        return {
            imgData, fileName
        }
    }

    changeCamera() {
        const hands: THREE.Mesh[] = []
        this.scene.traverse(o => { if (o.name === "038F_05SET_04SHOT") hands.push(o as THREE.Mesh) })

        const cameraPos = new THREE.Vector3()
        this.camera.getWorldPosition(cameraPos)

        const handsPos = hands.map((o) => {
            const cameraPos = new THREE.Vector3()
            o.getWorldPosition(cameraPos)
            return cameraPos
        })

        const handsDis = handsPos.map((pos) => {
            return cameraPos.distanceTo(pos)
        })

        const minDis = Math.min(...handsDis)
        const maxDis = Math.max(...handsDis)


        const saveNear = this.camera.near
        const saveFar = this.camera.far

        this.camera.near = minDis - 20
        this.camera.far = maxDis + 20
        this.camera.updateProjectionMatrix()
        return () => {

            this.camera.near = saveNear
            this.camera.far = saveFar
            this.camera.updateProjectionMatrix()
        }
    }
    CaptureDepth() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)

        const restoreHand = this.changeHandMaterial("depth")
        const map = this.hideSkeleten()
        const restore = this.changeComposer(false)

        const restoreCamera = this.changeCamera()
        this.render();
        restoreCamera()

        let imgData = this.renderer.domElement.toDataURL("image/png");
        const fileName = "depth_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        this.showSkeleten(map)
        restore()
        restoreHand()

        return {
            imgData, fileName
        }
    }

    MakeImages() {
        {
            const { imgData, fileName } = this.Capture()
            SetScreenShot("pose", imgData, fileName)
        }
        {
            const { imgData, fileName } = this.CaptureDepth()
            SetScreenShot("depth", imgData, fileName)
        }
        {
            const { imgData, fileName } = this.CaptureNormal()
            SetScreenShot("normal", imgData, fileName)
        }

        {
            const { imgData, fileName } = this.CaptureCanny()
            SetScreenShot("canny", imgData, fileName)
        }
    }

    CopyBodyZ() {
        const body = CloneBody()
        if (!body)
            return

        const list = this.scene.children
            .filter(o => o?.name === "torso")
            .filter(o => o.position.x === 0)
            .map(o => Math.ceil(o.position.z / 30))

        if (list.length > 0)
            body.translateZ((Math.min(...list) - 1) * 30)
        this.scene.add(body)

    }

    CopyBodyX() {
        const body = CloneBody()
        if (!body)
            return

        const list = this.scene.children
            .filter(o => o?.name === "torso")
            .filter(o => o.position.z === 0)
            .map(o => Math.ceil(o.position.x / 50))

        if (list.length > 0)
            body.translateX((Math.min(...list) - 1) * 50)
        this.scene.add(body)

    }

    RemoveBody() {
        let obj: Object3D | null = this.transformControl.object ?? null
        obj = obj ? this.getBodyByPart(obj) : null

        if (obj) {
            console.log(obj.name)
            obj.removeFromParent()
            this.transformControl.detach()
        }
    }
    get Width() {
        return this.renderer.domElement.clientWidth
    }

    get Height() {
        return this.renderer.domElement.clientHeight
    }



    handleResize() {
        const size = new THREE.Vector2()
        this.renderer.getSize(size)

        if (size.width == this.Width && size.height === this.Height)
            return


        const canvas = this.renderer.domElement
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight

        this.camera.updateProjectionMatrix()

        console.log(canvas.clientWidth, canvas.clientHeight)
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
        this.chnageComposerResoultion()
    }

    initEdgeComposer() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // color to grayscale conversion

        const effectGrayScale = new ShaderPass(LuminosityShader);
        this.composer.addPass(effectGrayScale);

        // you might want to use a gaussian blur filter before
        // the next pass to improve the result of the Sobel operator

        // Sobel operator

        const effectSobel = new ShaderPass(SobelOperatorShader);
        effectSobel.uniforms['resolution'].value.x = this.Width * window.devicePixelRatio;
        effectSobel.uniforms['resolution'].value.y = this.Height * window.devicePixelRatio;
        this.composer.addPass(effectSobel);
    }

    chnageComposerResoultion() {
        this.composer?.setSize(this.Width, this.Height);
        if (this.effectSobel) {
            this.effectSobel.uniforms['resolution'].value.x = this.Width * window.devicePixelRatio;
            this.effectSobel.uniforms['resolution'].value.y = this.Height * window.devicePixelRatio;
        }
    }

    async loadHand() {
        const fbx = await LoadFBXFile(handFBXFileUrl, (loaded) => {
            if (loaded >= 100) {
                Swal.hideLoading()
                Swal.close()
            }
            else if (Swal.isVisible() == false) {
                Swal.fire({
                    title: i18n.t('Downloading Hand Model') ?? '',
                    didOpen: () => {
                        Swal.showLoading()
                    },
                })
            }
        })
        fbx.name = "038F_05SET_04SHOT"
        // fbx.scale.multiplyScalar(10)
        const mesh = this.findObjectItem<THREE.SkinnedMesh>(fbx, "shoupolySurface1")!
        mesh.material = new MeshPhongMaterial()
        // this.scene.add();
        // const helper = new THREE.SkeletonHelper(mesh.parent!);
        // this.scene.add(helper);
        mesh.skeleton.bones.forEach((o) => {
            const point = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            )
            point.scale.setX(0.2)
            point.name = o.name
            point.position.copy(o.position)
            o.add(point)
        })

        return fbx
    }
    async loadBodyData() {
        // const object = await LoadObjFile(handObjFileUrl)
        // object.traverse(function (child) {

        //     if (child instanceof THREE.Mesh) {

        //         child.material = new MeshPhongMaterial();
        //     }
        // });

        const object = await this.loadHand()
        CreateTemplateBody(object)
        // scene.add( object );
        const body = CloneBody()!

        this.scene.add(body);
        this.dlight.target = body;

        // await this.loadHand()
        // test

        // const { scene: xbot } = await LoadGLTFile(xbotFileUrl)
        // xbot.scale.multiplyScalar(100)
        // xbot.translateZ(30)
        // console.log('gltf对象场景属性', xbot);
        // xbot.visible = true
        // this.scene.add(xbot);

        // xbot.traverse((child) => {
        //     if (child.type === 'Object3D' || child.type === 'SkinnedMesh') {
        //         if(child.name)
        //         console.log("traverse: ", child.name, child.type)
        //         child.frustumCulled = false;
        //     }
        // })

        // const mesh: SkinnedMesh = await this.findObjectItem(xbot, "Bodybaked") as SkinnedMesh;
        // console.log(mesh.skeleton.bones)
        // const helper = new THREE.SkeletonHelper(mesh.parent!);
        // this.scene.add(helper);

        // const iks: IKS[] = [
        //     {
        //         target: 45, // "target"
        //         effector: 61, // "bone3"
        //         iteration: 1,
        //         links: [
        //             {
        //                 enabled: true,
        //                 index: 60
        //             },
        //             {
        //                 enabled: true,
        //                 index: 59
        //             },
        //             {
        //                 enabled: true,
        //                 index: 58
        //             },
        //             {
        //                 enabled: true,
        //                 index: 57
        //             },
        //         ], // "bone2", "bone1", "bone0"
        //         minAngle: -Math.PI,
        //         maxAngle: Math.PI,
        //     }
        // ];
        // const xhelper = new CCDIKHelper(mesh, iks)
        // this.scene.add(xhelper)

        // this.transformControl.setMode("translate")
        // this.transformControl.attach(mesh.skeleton.bones[60])

        // console.log(xbot)
        // this.ikSolver = new CCDIKSolver(mesh, iks)
    }

    findObjectItem<T extends Object3D>(object: Object3D, name: string): T | null {
        //console.log(object);
        let result = null
        object.traverse((child) => {
            //console.log("child", child);
            if (child.name == name) {
                result = (child);
            }
        });
        return result
    }

    get CameraNear() {
        return this.camera.near
    }
    set CameraNear(value: number) {
        this.camera.near = value
        this.camera.updateProjectionMatrix();
    }

    get CameraFar() {
        return this.camera.far
    }
    set CameraFar(value: number) {
        this.camera.far = value
        this.camera.updateProjectionMatrix();
    }
}


