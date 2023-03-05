import * as THREE from "three"
import { MeshDepthMaterial, Object3D } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import Stats from "three/examples/jsm/libs/stats.module";
import { CreateBody } from "./body";
import { options } from "./config";
import { SetScreenShot } from "./image";
import { LoadObjFile } from "./loader";
import { getCurrentTime } from "./util";

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
    templateBody: Object3D | null = null

    stats: Stats
    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            logarithmicDepthBuffer: true
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
        this.camera.near = 130
        this.camera.far = 600
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


        document.addEventListener('mousedown', () => this.IsClick = true, false)
        document.addEventListener('mousemove', () => this.IsClick = false, false)
        document.addEventListener('mouseup', this.onDocumentMouseDown.bind(this), false)

        window.addEventListener('resize', this.handleResize.bind(this))
        this.stats = Stats()
        document.body.appendChild(this.stats.dom)
        this.render()
        this.handleResize()
    }

    onDocumentMouseDown(event: MouseEvent) {

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
                while (obj) {
                    if (obj?.name !== "torso")
                        obj = obj.parent
                    else
                        break
                }
                while (obj) {
                    if (obj?.parent?.name == name)
                        obj = obj.parent
                    else
                        break
                }

                if (obj) {
                    console.log(obj.name)
                    this.transformControl.setMode("translate")
                    this.transformControl.setSpace("world")
                    this.transformControl.attach(obj)
                }


            }
            else if (pickableObjectNames.includes(name)) {
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

    Capture() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name === "038F_05SET_04SHOT") {
                        child.visible = false
                    }
                })
            })

        this.renderer.render(this.scene, this.camera);//renderer为three.js里的渲染器，scene为场景 camera为相机
        let imgData = this.renderer.domElement.toDataURL("image/png");//这里可以选择png格式jpeg格式
        const fileName = "pose_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name === "038F_05SET_04SHOT") {
                        child.visible = true
                    }
                })
            })
        return {
            imgData, fileName
        }
    }

    CaptureDepth() {
        this.transformControl.detach()

        this.axesHelper.visible = false
        this.gridHelper.visible = false

        this.renderer.setClearColor(0x000000)

        const map = new Map<Object3D, Object3D | null>()

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.traverse((child) => {
                    if (child?.name === "038F_05SET_04SHOT") {
                        map.set(child, child.parent)
                        this.scene.attach(child)
                    }
                })
                o.visible = false
            })

        this.renderer.render(this.scene, this.camera);//renderer为three.js里的渲染器，scene为场景 camera为相机
        let imgData = this.renderer.domElement.toDataURL("image/png");//这里可以选择png格式jpeg格式
        const fileName = "pose_" + getCurrentTime()
        this.axesHelper.visible = true
        this.gridHelper.visible = true
        this.renderer.setClearColor(options.clearColor)

        for (const [k, v] of map.entries()) {
            v?.attach(k)
        }

        this.scene.children
            .filter(o => o?.name === "torso")
            .forEach((o) => {
                o.visible = true
            })


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
    }

    CopyBody() {
        if (!this.templateBody)
            return
        const body = this.templateBody.clone()

        const list = this.scene.children
            .filter(o => o?.name === "torso")
            .filter(o => o.position.x === 0)
            .map(o => Math.ceil(o.position.z / 30))

        body.translateZ((Math.min(...list) - 1) * 30)
        this.scene.add(body)

    }

    get Width() {
        return this.renderer.domElement.clientWidth
    }

    get Height() {
        return this.renderer.domElement.clientHeight
    }

    render() {
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
        this.stats.update()
    }

    handleResize() {
        const canvas = this.renderer.domElement
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight
        this.camera.updateProjectionMatrix()

        console.log(canvas.clientWidth, canvas.clientHeight)
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    }

    async loadBodyData() {
        const object = await LoadObjFile('/models/hand.obj')
        object.traverse(function (child) {

            if (child instanceof THREE.Mesh) {

                child.material = new MeshDepthMaterial();
            }
        });

        this.templateBody = CreateBody(object)
        // scene.add( object );
        const body = this.templateBody.clone()
        this.scene.add(body);
        this.dlight.target = body;
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


