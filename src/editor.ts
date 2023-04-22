import * as THREE from 'three'
import {
    Bone,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshDepthMaterial,
    MeshNormalMaterial,
    MeshPhongMaterial,
    Object3D,
    Skeleton,
    SkinnedMesh,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

// @ts-ignore
// import {
//     CCDIKHelper,
//     CCDIKSolver,
//     IKS,
// } from 'three/examples/jsm/animate/CCDIKSolver'
import { CCDIKSolver } from './utils/CCDIKSolver'
import Stats from 'three/examples/jsm/libs/stats.module'
import {
    BodyControlor,
    BodyData,
    CloneBody,
    GetExtremityMesh,
    IsBone,
    IsExtremities,
    IsFoot,
    IsHand,
    IsMask,
    IsNeedSaveObject,
    IsPickable,
    IsSkeleton,
    IsTarget,
    IsTranslate,
} from './body'

import { downloadJson, uploadJson } from './utils/transfer'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js'
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import { Oops } from './components/Oops'
import { getCurrentTime } from './utils/time'
import { sendToAll } from './hooks/useMessageDispatch'

type EditorEventHandler<T> = (args: T) => void

class EditorEventManager<T> {
    private eventHandlers: EditorEventHandler<T>[] = []

    AddEventListener(handler: EditorEventHandler<T>): void {
        this.eventHandlers.push(handler)
    }

    RemoveEventListener(handler: EditorEventHandler<T>): void {
        this.eventHandlers = this.eventHandlers.filter((h) => h !== handler)
    }

    TriggerEvent(args: T): void {
        this.eventHandlers.forEach((h) => h(args))
    }
}

interface CameraData {
    position: ReturnType<THREE.Vector3['toArray']>
    rotation: ReturnType<THREE.Euler['toArray']>
    target: ReturnType<THREE.Vector3['toArray']>
    near: number
    far: number
    zoom: number
}

interface TransformValue {
    scale: Object3D['scale']
    rotation: Object3D['rotation']
    position: Object3D['position']
}

function GetTransformValue(obj: Object3D): TransformValue {
    return {
        scale: obj.scale.clone(),
        rotation: obj.rotation.clone(),
        position: obj.position.clone(),
    }
}

export interface Command {
    execute: () => void
    undo: () => void
}

export interface ParentElement {
    addEventListener(
        type: 'keydown',
        listener: (this: any, ev: KeyboardEvent) => any,
        options?: boolean | AddEventListenerOptions | undefined
    ): void
    addEventListener(
        type: 'keyup',
        listener: (this: any, ev: KeyboardEvent) => any,
        options?: boolean | AddEventListenerOptions | undefined
    ): void
    removeEventListener(
        type: 'keydown',
        listener: (this: Document, ev: KeyboardEvent) => any,
        options?: boolean | EventListenerOptions | undefined
    ): void
    removeEventListener(
        type: 'keyup',
        listener: (this: Document, ev: KeyboardEvent) => any,
        options?: boolean | EventListenerOptions | undefined
    ): void
}

class PreviewRenderer {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    canvas?: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    orbitControls: OrbitControls

    constructor(setting: {
        scene: THREE.Scene
        camera: THREE.PerspectiveCamera
        orbitControls: OrbitControls

        canvas?: HTMLCanvasElement
        renderer?: THREE.WebGLRenderer
    }) {
        this.scene = setting.scene
        this.camera = setting.camera
        this.canvas = setting.canvas
        this.orbitControls = setting.orbitControls
        if (setting.renderer) {
            this.renderer = setting.renderer
        } else {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: setting.canvas,
                // logarithmicDepthBuffer: true
            })
        }
    }

    renderBySize(
        outputWidth: number,
        outputHeight: number,
        render: (outputWidth: number, outputHeight: number) => void
    ) {
        const save = {
            aspect: this.camera.aspect,
        }
        this.camera.aspect = outputWidth / outputHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(outputWidth, outputHeight, true)

        render(outputWidth, outputHeight)

        this.camera.aspect = save.aspect
        this.camera.updateProjectionMatrix()
    }

    GetCameraData() {
        const result = {
            position: this.camera.position.toArray(),
            rotation: this.camera.rotation.toArray(),
            target: this.orbitControls.target.toArray(),
            near: this.camera.near,
            far: this.camera.far,
            zoom: this.camera.zoom,
        }

        return result
    }

    RestoreCamera(data: CameraData, updateOrbitControl = true) {
        this.camera.position.fromArray(data.position)
        this.camera.rotation.fromArray(data.rotation as any)
        this.camera.near = data.near
        this.camera.far = data.far
        this.camera.zoom = data.zoom
        this.camera.updateProjectionMatrix()

        if (data.target) this.orbitControls.target.fromArray(data.target)
        if (updateOrbitControl) this.orbitControls.update() // fix position change
    }

    changeView(cameraDataOfView?: CameraData) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        if (!cameraDataOfView) return () => {}

        const old = this.GetCameraData()
        this.RestoreCamera(cameraDataOfView, false)
        return () => {
            this.RestoreCamera(old)
        }
    }

    render(
        outputWidth: number,
        outputHeight: number,
        cameraDataOfView?: CameraData,
        custom?: (outputWidth: number, outputHeight: number) => void
    ) {
        const render = () => {
            this.renderer.render(this.scene, this.camera)
        }
        const restoreView = this.changeView(cameraDataOfView)
        this.renderBySize(outputWidth, outputHeight, custom ?? render)
        restoreView()
    }
}

export class BodyEditor {
    renderer: THREE.WebGLRenderer
    outputRenderer: THREE.WebGLRenderer
    previewRenderer: PreviewRenderer
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
    stats: Stats | undefined

    // ikSolver?: CCDIKSolver
    composer?: EffectComposer
    finalComposer?: EffectComposer
    effectSobel?: ShaderPass
    enableComposer = false
    enablePreview = true
    enableHelper = true

    paused = false

    parentElem: ParentElement

    clearColor = 0xaaaaaa
    constructor({
        canvas,
        previewCanvas,
        parentElem = document,
        statsElem,
    }: {
        canvas: HTMLCanvasElement
        previewCanvas: HTMLCanvasElement
        parentElem?: ParentElement
        statsElem?: Element
    }) {
        this.parentElem = parentElem
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            // logarithmicDepthBuffer: true
        })
        this.outputRenderer = new THREE.WebGLRenderer({
            antialias: true,
            // logarithmicDepthBuffer: true
        })
        this.outputRenderer.domElement.style.display = 'none'
        document.body.appendChild(this.outputRenderer.domElement)

        this.renderer.setClearColor(this.clearColor, 0.0)
        this.scene = new THREE.Scene()

        this.gridHelper = new THREE.GridHelper(8000, 200)
        this.axesHelper = new THREE.AxesHelper(1000)
        this.scene.add(this.gridHelper)
        this.scene.add(this.axesHelper)

        const aspect = window.innerWidth / window.innerHeight

        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000)

        this.camera.position.set(0, 100, 200)
        this.camera.lookAt(0, 100, 0)
        // this.camera.near = 130
        // this.camera.far = 600
        this.camera.updateProjectionMatrix()

        this.orbitControls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        )
        this.orbitControls.target = new THREE.Vector3(0, 100, 0)
        this.orbitControls.update()

        this.transformControl = new TransformControls(
            this.camera,
            this.renderer.domElement
        )

        this.transformControl.setMode('rotate') //旋转
        this.transformControl.setSize(0.4)
        this.transformControl.setSpace('local')
        this.registerTranformControlEvent()
        this.scene.add(this.transformControl)

        this.previewRenderer = new PreviewRenderer({
            scene: this.scene,
            camera: this.camera,
            orbitControls: this.orbitControls,
            canvas: previewCanvas,
        })

        // Light
        this.dlight = new THREE.DirectionalLight(0xffffff, 1.0)
        this.dlight.position.set(0, 160, 1000)
        this.scene.add(this.dlight)
        this.alight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(this.alight)

        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.handleResize = this.handleResize.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)

        this.addEvent()

        this.initEdgeComposer()

        // // Create a render target with depth texture
        // this.setupRenderTarget();

        // // Setup post-processing step
        // this.setupPost();

        if (statsElem) {
            this.stats = Stats()
            statsElem.appendChild(this.stats.dom)
        }

        this.animate = this.animate.bind(this)
        this.animate()
        this.handleResize()
        this.AutoSaveScene()
    }

    disponse() {
        this.pause()
        this.removeEvent()
        this.renderer.dispose()
        this.outputRenderer.dispose()

        console.log('BodyEditor disponse')
    }

    commandHistory: Command[] = []
    historyIndex = -1
    pushCommand(cmd: Command) {
        console.log('pushCommand')
        if (this.historyIndex != this.commandHistory.length - 1)
            this.commandHistory = this.commandHistory.slice(
                0,
                this.historyIndex + 1
            )
        this.commandHistory.push(cmd)
        this.historyIndex = this.commandHistory.length - 1
    }

    CreateTransformCommand(obj: Object3D, _old: TransformValue): Command {
        const oldValue = _old
        const newValue = GetTransformValue(obj)
        const controlor = new BodyControlor(this.getBodyByPart(obj)!)
        return {
            execute: () => {
                obj.position.copy(newValue.position)
                obj.rotation.copy(newValue.rotation)
                obj.scale.copy(newValue.scale)
                controlor.Update()
            },
            undo: () => {
                obj.position.copy(oldValue.position)
                obj.rotation.copy(oldValue.rotation)
                obj.scale.copy(oldValue.scale)
                controlor.Update()
            },
        }
    }

    CreateAllTransformCommand(obj: Object3D, _old: BodyData): Command {
        const oldValue = _old
        const body = this.getBodyByPart(obj)!
        const controlor = new BodyControlor(body)
        const newValue = controlor.GetBodyData()

        return {
            execute: () => {
                controlor.RestoreBody(newValue)
                controlor.Update()
            },
            undo: () => {
                controlor.RestoreBody(oldValue)
                controlor.Update()
            },
        }
    }

    CreateAddBodyCommand(obj: Object3D): Command {
        return {
            execute: () => {
                this.scene.add(obj)
            },
            undo: () => {
                obj.removeFromParent()
                this.DetachTransfromControl()
            },
        }
    }

    CreateRemoveBodyCommand(obj: Object3D): Command {
        return {
            execute: () => {
                obj.removeFromParent()
                this.DetachTransfromControl()
            },
            undo: () => {
                this.scene.add(obj)
            },
        }
    }

    Undo() {
        console.log('Undo', this.historyIndex)

        if (this.historyIndex >= 0) {
            const cmd = this.commandHistory[this.historyIndex]
            cmd.undo()
            this.historyIndex--
        }
    }

    Redo() {
        console.log('Redo', this.historyIndex)

        if (this.historyIndex < this.commandHistory.length - 1) {
            const cmd = this.commandHistory[this.historyIndex + 1]
            cmd.execute()
            this.historyIndex++
        }
    }

    handleKeyDown(e: KeyboardEvent) {
        if (this.paused) {
            return
        }
        if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            this.Redo()
        } else if (e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) {
            this.Redo()
            // prevent brower refresh
            e.preventDefault()
        } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
            this.Undo()
        } else if (e.code === 'KeyD' && e.shiftKey) {
            this.CopySelectedBody()
        } else if (e.key === 'Delete') {
            this.RemoveBody()
        } else if (e.code === 'KeyX') {
            this.MoveMode = true
        }
    }

    handleKeyUp(e: KeyboardEvent) {
        if (this.paused) {
            return
        }

        if (e.code === 'KeyX') {
            this.MoveMode = false
        }
    }

    registerTranformControlEvent() {
        let oldTransformValue: TransformValue = {
            scale: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            position: new THREE.Vector3(),
        }
        let oldBodyData: BodyData = {} as BodyData
        this.transformControl.addEventListener('change', () => {
            const body = this.getSelectedBody()

            if (body) {
                new BodyControlor(body).UpdateBones()
            }
            // console.log('change')
            // this.renderer.render(this.scene, this.camera)
        })

        this.transformControl.addEventListener('objectChange', () => {
            // console.log('objectChange')
            // this.renderer.render(this.scene, this.camera)
        })

        this.transformControl.addEventListener('mouseDown', () => {
            const part = this.getSelectedPart()
            if (part) {
                oldTransformValue = GetTransformValue(part)
                const body = this.getBodyByPart(part)!
                oldBodyData = new BodyControlor(body).GetBodyData()
            }
            this.orbitControls.enabled = false
        })
        this.transformControl.addEventListener('mouseUp', () => {
            const part = this.getSelectedPart()
            if (part) {
                if (IsTarget(part.name))
                    this.pushCommand(
                        this.CreateAllTransformCommand(part, oldBodyData)
                    )
                else
                    this.pushCommand(
                        this.CreateTransformCommand(part, oldTransformValue)
                    )
            }
            this.orbitControls.enabled = true

            this.saveSelectedBodyControlor?.Update()
        })
    }

    ikSolver?: CCDIKSolver
    saveSelectedBodyControlor?: BodyControlor

    updateSelectedBodyIKSolver() {
        const body = this.getSelectedBody() ?? undefined

        if (body !== this.saveSelectedBodyControlor) {
            this.saveSelectedBodyControlor = body
                ? new BodyControlor(body!)
                : undefined
            this.ikSolver = body
                ? this.saveSelectedBodyControlor?.GetIKSolver()
                : undefined
        }

        if (IsTranslate(this.getSelectedPart()?.name ?? ''))
            this.ikSolver?.update()
        else this.saveSelectedBodyControlor?.ResetAllTargetsPosition()
    }

    render(width: number = this.Width, height: number = this.Height) {
        this.updateSelectedBodyIKSolver()

        this.renderer.setViewport(0, 0, width, height)
        this.renderer.setScissor(0, 0, width, height)
        this.renderer.setScissorTest(true)

        this.renderer.render(this.scene, this.camera)
    }

    autoSize = true
    outputWidth = 0
    outputHeight = 0
    get OutputWidth() {
        return this.autoSize
            ? this.Width
            : this.outputWidth === 0
            ? this.Height
            : this.outputWidth
    }
    set OutputWidth(value: number) {
        this.autoSize = false
        this.outputWidth = value
    }
    get OutputHeight() {
        return this.autoSize
            ? this.Height
            : this.outputHeight === 0
            ? this.Height
            : this.outputHeight
    }

    set OutputHeight(value: number) {
        this.autoSize = false
        this.outputHeight = value
    }

    renderPreview() {
        const outputWidth = this.OutputWidth
        const outputHeight = this.OutputHeight

        const outputAspect = outputWidth / outputHeight
        const maxOutoutAspect = 2
        const [left, bottom, width, height] =
            outputAspect > maxOutoutAspect
                ? [
                      this.Width - 50 - 150 * maxOutoutAspect,
                      220,
                      150 * maxOutoutAspect,
                      (150 * maxOutoutAspect * outputHeight) / outputWidth,
                  ]
                : [
                      this.Width - 50 - (150 * outputWidth) / outputHeight,
                      220,
                      (150 * outputWidth) / outputHeight,
                      150,
                  ]
        const save = {
            viewport: new THREE.Vector4(),
            scissor: new THREE.Vector4(),
            scissorTest: this.renderer.getScissorTest(),
            aspect: this.camera.aspect,
        }

        this.renderer.getViewport(save.viewport)
        this.renderer.getScissor(save.viewport)

        this.renderer.setViewport(left, bottom, width, height)
        this.renderer.setScissor(left, bottom, width, height)
        this.renderer.setScissorTest(true)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        const restoreView = this.changeView()
        this.renderer.render(this.scene, this.camera)
        restoreView()
        // restore
        this.renderer.setViewport(save.viewport)
        this.renderer.setScissor(save.scissor)
        this.renderer.setScissorTest(save.scissorTest)
        this.camera.aspect = save.aspect
        this.camera.updateProjectionMatrix()
    }

    renderOutputBySize(
        outputWidth: number,
        outputHeight: number,
        render: (outputWidth: number, outputHeight: number) => void
    ) {
        const save = {
            aspect: this.camera.aspect,
        }
        this.camera.aspect = outputWidth / outputHeight
        this.camera.updateProjectionMatrix()
        this.outputRenderer.setSize(outputWidth, outputHeight, true)

        render(outputWidth, outputHeight)

        this.camera.aspect = save.aspect
        this.camera.updateProjectionMatrix()
    }

    renderOutput(
        scale = 1,
        custom?: (outputWidth: number, outputHeight: number) => void
    ) {
        const outputWidth = this.OutputWidth * scale
        const outputHeight = this.OutputHeight * scale

        const render = () => {
            this.outputRenderer.render(this.scene, this.camera)
        }
        this.renderOutputBySize(outputWidth, outputHeight, custom ?? render)
    }
    getOutputPNG() {
        return this.outputRenderer.domElement.toDataURL('image/png')
    }
    animate() {
        if (this.paused) {
            return
        }
        requestAnimationFrame(this.animate)
        this.handleResize()
        this.render()
        this.outputPreview()
        this.stats?.update()
    }

    outputPreview() {
        if (this.enablePreview) this.CapturePreview()
        this.PreviewEventManager.TriggerEvent(this.enablePreview)
    }
    pause() {
        this.paused = true
    }

    resume() {
        this.paused = false
        this.animate()
    }

    getAncestors(o: Object3D) {
        const ancestors: Object3D[] = []
        o.traverseAncestors((ancestor) => ancestors.push(ancestor))
        return ancestors
    }
    getBodyByPart(o: Object3D) {
        if (o?.name === 'torso') return o

        const body =
            this.getAncestors(o).find((o) => o?.name === 'torso') ?? null
        return body
    }

    SelectEventManager = new EditorEventManager<BodyControlor>()
    UnselectEventManager = new EditorEventManager<void>()
    ContextMenuEventManager = new EditorEventManager<{
        mouseX: number
        mouseY: number
    }>()
    PreviewEventManager = new EditorEventManager<boolean>()
    LockViewEventManager = new EditorEventManager<boolean>()

    triggerSelectEvent(body: Object3D) {
        const c = new BodyControlor(body)
        this.SelectEventManager.TriggerEvent(c)
        this.UpdateBones()
    }
    triggerUnselectEvent() {
        this.UnselectEventManager.TriggerEvent()
        this.UpdateBones()
    }

    addEvent() {
        this.renderer.domElement.addEventListener(
            'mousedown',
            this.onMouseDown,
            false
        )
        this.renderer.domElement.addEventListener(
            'mousemove',
            this.onMouseMove,
            false
        )
        this.renderer.domElement.addEventListener(
            'mouseup',
            this.onMouseUp,
            false
        )

        this.renderer.domElement.addEventListener('resize', this.handleResize)

        this.parentElem.addEventListener('keydown', this.handleKeyDown)
        this.parentElem.addEventListener('keyup', this.handleKeyUp)
    }

    removeEvent() {
        this.renderer.domElement.removeEventListener(
            'mousedown',
            this.onMouseDown,
            false
        )
        this.renderer.domElement.removeEventListener(
            'mousemove',
            this.onMouseMove,
            false
        )
        this.renderer.domElement.removeEventListener(
            'mouseup',
            this.onMouseUp,
            false
        )

        this.renderer.domElement.removeEventListener(
            'resize',
            this.handleResize
        )

        this.parentElem.removeEventListener('keydown', this.handleKeyDown)
        this.parentElem.removeEventListener('keyup', this.handleKeyUp)
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault()
        this.IsClick = true
    }
    onMouseMove(event: MouseEvent) {
        // some devices still send movemove event, filter it.
        if (event.movementX == 0 && event.movementY == 0) return
        this.IsClick = false
    }

    onMouseUp(event: MouseEvent) {
        const x = event.offsetX - this.renderer.domElement.offsetLeft
        const y = event.offsetY - this.renderer.domElement.offsetTop
        this.raycaster.setFromCamera(
            {
                x: (x / this.renderer.domElement.clientWidth) * 2 - 1,
                y: -(y / this.renderer.domElement.clientHeight) * 2 + 1,
            },
            this.camera
        )
        const intersects: THREE.Intersection[] =
            this.raycaster.intersectObjects(this.GetBodies(), true)
        // If read_point is found, choose it first
        const point = intersects.find((o) => o.object.name === 'red_point')
        const intersectedObject: THREE.Object3D | null = point
            ? point.object
            : intersects.length > 0
            ? intersects[0].object
            : null
        const name = intersectedObject ? intersectedObject.name : ''
        let obj: Object3D | null = intersectedObject

        console.log(obj?.name)

        if (this.IsClick) {
            if (event.button === 2 || event.which === 3) {
                console.log('Right mouse button released')
                this.ContextMenuEventManager.TriggerEvent({
                    mouseX: x,
                    mouseY: y,
                })
                return
            }

            if (!obj) {
                this.DetachTransfromControl()
                this.triggerUnselectEvent()
                return
            }

            if (this.MoveMode) {
                const isOk = IsPickable(name, this.FreeMode)

                if (!isOk) {
                    obj =
                        this.getAncestors(obj).find((o) =>
                            IsPickable(o.name, this.FreeMode)
                        ) ?? null
                }

                if (obj) {
                    if (IsTranslate(obj.name, this.FreeMode) === false)
                        obj = this.getBodyByPart(obj)
                }

                if (obj) {
                    console.log(obj.name)
                    this.transformControl.setMode('translate')
                    this.transformControl.setSpace('world')
                    this.transformControl.attach(obj)
                    const body = this.getBodyByPart(obj)
                    if (body) this.triggerSelectEvent(body)
                }
            } else {
                const isOk = IsPickable(name)

                if (!isOk) {
                    obj =
                        this.getAncestors(obj).find((o) =>
                            IsPickable(o.name)
                        ) ?? null
                }

                if (obj) {
                    console.log(obj.name)

                    if (IsTranslate(obj.name)) {
                        this.transformControl.setMode('translate')
                        this.transformControl.setSpace('world')
                    } else {
                        this.transformControl.setMode('rotate')
                        this.transformControl.setSpace('local')
                    }

                    this.transformControl.attach(obj)

                    const body = this.getBodyByPart(obj)
                    if (body) this.triggerSelectEvent(body)
                }
            }
        }
    }

    traverseHandObjecct(handle: (o: THREE.Mesh) => void) {
        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                if (IsHand(child?.name)) {
                    handle(child as THREE.Mesh)
                }
            })
        })
    }

    traverseBodies(handle: (o: Object3D) => void) {
        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                handle(child)
            })
        })
    }

    traverseBones(handle: (o: Bone) => void) {
        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                if (child instanceof Bone && IsBone(child.name)) handle(child)
            })
        })
    }

    traverseExtremities(handle: (o: THREE.Mesh) => void) {
        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                if (IsExtremities(child.name)) {
                    handle(child as THREE.Mesh)
                }
            })
        })
    }

    onlyShowSkeleton() {
        const recoveryArr: Object3D[] = []
        this.traverseBodies((o) => {
            if (IsSkeleton(o.name) === false) {
                if (o.visible == true) {
                    o.visible = false
                    recoveryArr.push(o)
                }
            }
        })

        return () => {
            recoveryArr.forEach((o) => (o.visible = true))
        }
    }

    showMask() {
        const recoveryArr: Object3D[] = []
        this.scene.traverse((o) => {
            if (IsMask(o.name)) {
                console.log(o.name)
                o.visible = true
                recoveryArr.push(o)
            }
        })

        return () => {
            recoveryArr.forEach((o) => (o.visible = false))
        }
    }

    hideSkeleten() {
        const map = new Map<Object3D, Object3D | null>()

        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                if (IsExtremities(child?.name)) {
                    map.set(child, child.parent)
                    this.scene.attach(child)
                } else if (child?.name === 'red_point') {
                    child.visible = false
                }
            })
            o.visible = false
        })
        return map
    }

    GetBodies() {
        return this.scene.children.filter((o) => o?.name === 'torso')
    }
    showSkeleten(map: Map<Object3D, Object3D | null>) {
        for (const [k, v] of map.entries()) {
            v?.attach(k)
        }

        map.clear()

        this.GetBodies().forEach((o) => {
            o.traverse((child) => {
                if (child?.name === 'red_point') {
                    child.visible = true
                }
            })
            o.visible = true
        })
    }

    changeComposer(enable: boolean) {
        const save = this.enableComposer
        this.enableComposer = enable

        return () => (this.enableComposer = save)
    }

    changeHandMaterialTraverse(type: 'depth' | 'normal' | 'phone') {
        const map = new Map<THREE.Mesh, Material | Material[]>()
        this.scene.traverse((child) => {
            if (!IsExtremities(child.name)) return
            const o = GetExtremityMesh(child) as THREE.Mesh
            map.set(o, o.material)
            if (type == 'depth') o.material = new MeshDepthMaterial()
            else if (type == 'normal') o.material = new MeshNormalMaterial()
            else if (type == 'phone') o.material = new MeshPhongMaterial()
        })

        return () => {
            for (const [k, v] of map.entries()) {
                k.material = v
            }

            map.clear()
        }
    }

    changeHandMaterial(type: 'depth' | 'normal' | 'phone') {
        if (type == 'depth')
            this.scene.overrideMaterial = new MeshDepthMaterial()
        else if (type == 'normal')
            this.scene.overrideMaterial = new MeshNormalMaterial()
        else if (type == 'phone')
            this.scene.overrideMaterial = new MeshPhongMaterial()

        return () => {
            this.scene.overrideMaterial = null
        }
    }

    // https://stackoverflow.com/questions/15696963/three-js-set-and-read-camera-look-vector?noredirect=1&lq=1
    getCameraLookAtVector() {
        const lookAtVector = new THREE.Vector3(0, 0, -1)
        lookAtVector.applyQuaternion(this.camera.quaternion)
        return lookAtVector
    }

    getZDistanceFromCamera(p: THREE.Vector3) {
        const lookAt = this.getCameraLookAtVector().normalize()
        const v = p.clone().sub(this.camera.position)
        return v.dot(lookAt)
    }
    changeCamera() {
        let hands: THREE.Mesh[] = []
        this.scene.traverse((o) => {
            if (this.OnlyHand) {
                if (IsHand(o?.name)) hands.push(o as THREE.Mesh)
            } else {
                if (IsExtremities(o?.name)) hands.push(o as THREE.Mesh)
            }
        })

        // filter object in frustum
        hands = this.objectInView(hands)

        const cameraPos = new THREE.Vector3()
        this.camera.getWorldPosition(cameraPos)

        const handsPos = hands.map((o) => {
            const cameraPos = new THREE.Vector3()
            o.getWorldPosition(cameraPos)
            return cameraPos
        })

        const handsDis = handsPos.map((pos) => {
            return this.getZDistanceFromCamera(pos)
        })

        const minDis = Math.min(...handsDis)
        const maxDis = Math.max(...handsDis)

        const saveNear = this.camera.near
        const saveFar = this.camera.far

        this.camera.near = Math.max(minDis - 20, 0)
        this.camera.far = Math.max(maxDis + 20, 20)
        console.log('camera', this.camera.near, this.camera.far)

        this.camera.updateProjectionMatrix()
        return () => {
            this.camera.near = saveNear
            this.camera.far = saveFar
            this.camera.updateProjectionMatrix()
        }
    }

    Capture() {
        const restore = this.onlyShowSkeleton()

        this.renderOutput()
        const imgData = this.getOutputPNG()

        restore()

        return imgData
    }

    CapturePreview() {
        const scale = (window.devicePixelRatio * 140.0) / this.OutputHeight

        const outputWidth = this.OutputWidth * scale
        const outputHeight = this.OutputHeight * scale

        this.previewRenderer.render(
            outputWidth,
            outputHeight,
            this.cameraDataOfView
        )
    }

    CaptureCanny() {
        this.renderOutput(1, (outputWidth, outputHeight) => {
            this.changeComposerResoultion(outputWidth, outputHeight)
            const restoreMaterialTraverse =
                this.changeHandMaterialTraverse('normal')
            // step 1: get mask image
            const restoreMask = this.showMask()
            this.composer?.render()
            restoreMask()

            // step 2:
            // get sobel image
            // filer out pixels not in mask
            // get binarized pixels
            this.finalComposer?.render()
            restoreMaterialTraverse()
        })

        return this.getOutputPNG()
    }

    CaptureNormal() {
        const restoreHand = this.changeHandMaterial('normal')
        this.renderOutput()
        restoreHand()
        return this.getOutputPNG()
    }

    CaptureDepth() {
        const restoreHand = this.changeHandMaterial('depth')
        const restoreCamera = this.changeCamera()
        this.renderOutput()
        restoreCamera()
        restoreHand()
        return this.getOutputPNG()
    }

    changeTransformControl() {
        const part = this.getSelectedPart()

        if (part) {
            this.DetachTransfromControl()
            return () => {
                this.transformControl.attach(part)
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {}
    }
    changeHelper() {
        const old = {
            axesHelper: this.axesHelper.visible,
            gridHelper: this.gridHelper.visible,
        }
        this.axesHelper.visible = false
        this.gridHelper.visible = false

        return () => {
            this.axesHelper.visible = old.axesHelper
            this.gridHelper.visible = old.gridHelper
        }
    }
    MakeImages() {
        this.renderer.setClearColor(0x000000)

        const restoreHelper = this.changeHelper()

        const restoreTransfromControl = this.changeTransformControl()
        const restoreView = this.changeView()

        const poseImage = this.Capture()

        /// begin
        const map = this.hideSkeleten()
        const depthImage = this.CaptureDepth()
        const normalImage = this.CaptureNormal()
        const cannyImage = this.CaptureCanny()
        this.showSkeleten(map)
        /// end

        this.renderer.setClearColor(0x000000, 0)
        restoreHelper()

        restoreTransfromControl()
        restoreView()

        const result = {
            pose: poseImage,
            depth: depthImage,
            normal: normalImage,
            canny: cannyImage,
        }

        sendToAll({
            method: 'MakeImages',
            type: 'event',
            payload: result,
        })
        return result
    }

    CopySelectedBody() {
        const list = this.GetBodies()

        const selectedBody = this.getSelectedBody()

        if (!selectedBody && list.length !== 0) return

        const body =
            list.length === 0 ? CloneBody() : SkeletonUtils.clone(selectedBody!)

        if (!body) return

        this.pushCommand(this.CreateAddBodyCommand(body))

        if (list.length !== 0) body.position.x += 10
        this.scene.add(body)
        this.fixFootVisible()
        this.transformControl.setMode('translate')
        this.transformControl.setSpace('world')

        this.transformControl.attach(body)
    }

    CopyBodyZ() {
        const body = CloneBody()
        if (!body) return

        const list = this.GetBodies()
            .filter((o) => o.position.x === 0)
            .map((o) => Math.ceil(o.position.z / 30))

        if (list.length > 0) body.translateZ((Math.min(...list) - 1) * 30)

        this.pushCommand(this.CreateAddBodyCommand(body))

        this.scene.add(body)
        this.fixFootVisible()
    }

    CopyBodyX() {
        const body = CloneBody()
        if (!body) return

        const list = this.GetBodies()
            .filter((o) => o.position.z === 0)
            .map((o) => Math.ceil(o.position.x / 50))

        if (list.length > 0) body.translateX((Math.min(...list) - 1) * 50)

        this.pushCommand(this.CreateAddBodyCommand(body))

        this.scene.add(body)
        this.fixFootVisible()
    }

    getSelectedBody() {
        let obj: Object3D | null = this.getSelectedPart() ?? null
        obj = obj ? this.getBodyByPart(obj) : null

        return obj
    }
    getSelectedPart() {
        return this.transformControl.object
    }

    getHandByPart(o: Object3D) {
        if (IsHand(o?.name)) return o

        const body = this.getAncestors(o).find((o) => IsHand(o?.name)) ?? null
        return body
    }

    getSelectedHand() {
        let obj: Object3D | null = this.getSelectedPart() ?? null
        obj = obj ? this.getHandByPart(obj) : null
        return obj
    }
    RemoveBody() {
        const obj = this.getSelectedBody()

        if (obj) {
            this.pushCommand(this.CreateRemoveBodyCommand(obj))
            console.log(obj.name)
            obj.removeFromParent()
            this.DetachTransfromControl()
        }
    }

    pointsInView(points: THREE.Vector3[]) {
        this.camera.updateMatrix() // make sure camera's local matrix is updated
        this.camera.updateMatrixWorld() // make sure camera's world matrix is updated

        const frustum = new THREE.Frustum().setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            )
        )

        //console.log(points);
        return points.filter((p) => frustum.containsPoint(p))
    }

    getBouningSphere(o: Object3D) {
        const bbox = new THREE.Box3().setFromObject(o, true)
        // const helper = new THREE.Box3Helper(bbox, new THREE.Color(0, 255, 0))
        // this.scene.add(helper)

        const center = new THREE.Vector3()
        bbox.getCenter(center)

        const bsphere = bbox.getBoundingSphere(new THREE.Sphere(center))

        return bsphere
    }
    objectInView<T extends Object3D>(objs: T[]) {
        this.camera.updateMatrix() // make sure camera's local matrix is updated
        this.camera.updateMatrixWorld() // make sure camera's world matrix is updated

        const frustum = new THREE.Frustum().setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            )
        )

        //console.log(points);
        return objs.filter((obj) => {
            const sphere = this.getBouningSphere(obj)
            return frustum.intersectsSphere(sphere)
        })
    }
    isMoveMode = false
    get MoveMode() {
        return this.isMoveMode
    }
    set MoveMode(move: boolean) {
        let IsTranslateMode = move
        this.isMoveMode = move

        const name = this.getSelectedPart()?.name ?? ''

        if (move) {
            if (IsTranslate(name, this.FreeMode)) {
                IsTranslateMode = true
            } else {
                const obj = this.getSelectedBody()
                if (obj) this.transformControl.attach(obj)
            }
        } else {
            if (IsTarget(name)) {
                IsTranslateMode = true
            }
        }

        if (IsTranslateMode) {
            this.transformControl.setMode('translate')
            this.transformControl.setSpace('world')
        } else {
            this.transformControl.setMode('rotate')
            this.transformControl.setSpace('local')
        }
    }

    FreeMode = true

    get Width() {
        return this.renderer.domElement.clientWidth
    }

    get Height() {
        return this.renderer.domElement.clientHeight
    }

    onlyHand = false
    get OnlyHand() {
        return this.onlyHand
    }

    set OnlyHand(value: boolean) {
        this.onlyHand = value
        this.setFootVisible(!this.onlyHand)
    }

    get EnableHelper() {
        return this.enableHelper
    }
    set EnableHelper(value: boolean) {
        this.enableHelper = value
        this.gridHelper.visible = value
        this.axesHelper.visible = value
    }
    setFootVisible(value: boolean) {
        this.traverseExtremities((o) => {
            if (IsFoot(o.name)) {
                o.visible = value
            }
        })
    }

    fixFootVisible() {
        this.setFootVisible(!this.OnlyHand)
    }

    handleResize() {
        const size = new THREE.Vector2()
        this.renderer.getSize(size)

        if (size.width == this.Width && size.height === this.Height) return

        const canvas = this.renderer.domElement
        if (canvas.clientWidth == 0 || canvas.clientHeight == 0) return
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight

        this.camera.updateProjectionMatrix()

        // console.log(canvas.clientWidth, canvas.clientHeight)
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
        // console.log(this.Width, this.Height)
    }

    initEdgeComposer() {
        this.composer = new EffectComposer(this.outputRenderer)
        const renderPass = new RenderPass(this.scene, this.camera)
        this.composer.addPass(renderPass)
        this.composer.renderToScreen = false

        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: {
                        value: this.composer.renderTarget2.texture,
                    },
                },
                vertexShader: `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}`,
                fragmentShader: `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {
    vec4 bloomColor = texture2D(bloomTexture, vUv);
    float grayValue = dot(bloomColor.rgb, vec3(0.299, 0.587, 0.114));
    vec4 baseColor = texture2D(baseTexture, vUv);
    vec4 masked = vec4(baseColor.rgb * step(0.001, grayValue), 1.0);
    gl_FragColor = step(0.5, masked)  * vec4(1.0); // Binarization
    // gl_FragColor = bloomColor;
}

`,
                defines: {},
            }),
            'baseTexture'
        )
        finalPass.needsSwap = true

        this.finalComposer = new EffectComposer(this.outputRenderer)
        this.finalComposer.addPass(renderPass)

        // color to grayscale conversion
        const effectGrayScale = new ShaderPass(LuminosityShader)
        this.finalComposer.addPass(effectGrayScale)

        // Sobel operator
        const effectSobel = new ShaderPass(SobelOperatorShader)
        effectSobel.uniforms['resolution'].value.x =
            this.Width * window.devicePixelRatio
        effectSobel.uniforms['resolution'].value.y =
            this.Height * window.devicePixelRatio
        this.finalComposer.addPass(effectSobel)

        this.effectSobel = effectSobel

        this.finalComposer.addPass(finalPass)
    }

    changeComposerResoultion(width: number, height: number) {
        this.composer?.setSize(width, height)
        this.finalComposer?.setSize(width, height)

        if (this.effectSobel) {
            this.effectSobel.uniforms['resolution'].value.x =
                width * window.devicePixelRatio
            this.effectSobel.uniforms['resolution'].value.y =
                height * window.devicePixelRatio
        }
    }

    get CameraNear() {
        return this.camera.near
    }
    set CameraNear(value: number) {
        this.camera.near = value
        this.camera.updateProjectionMatrix()
    }

    get CameraFar() {
        return this.camera.far
    }
    set CameraFar(value: number) {
        this.camera.far = value
        this.camera.updateProjectionMatrix()
    }

    get CameraFocalLength() {
        return this.camera.getFocalLength()
    }
    set CameraFocalLength(value) {
        this.camera.setFocalLength(value)
    }

    GetCameraData() {
        const result = {
            position: this.camera.position.toArray(),
            rotation: this.camera.rotation.toArray(),
            target: this.orbitControls.target.toArray(),
            near: this.camera.near,
            far: this.camera.far,
            zoom: this.camera.zoom,
        }

        return result
    }
    GetSceneData() {
        const bodies = this.GetBodies().map((o) =>
            new BodyControlor(o).GetBodyData()
        )

        const data = {
            header: 'Openpose Editor by Yu Zhu',
            version: __APP_VERSION__,
            object: {
                bodies: bodies,
                camera: this.GetCameraData(),
            },
            setting: {},
        }

        return data
    }
    GetGesture() {
        const hand = this.getSelectedHand()
        const body = this.getSelectedBody()

        if (!hand || !body) return null
        const data = {
            header: 'Openpose Editor by Yu Zhu',
            version: __APP_VERSION__,
            object: {
                hand: new BodyControlor(body).GetHandData(
                    hand.name === 'left_hand' ? 'left_hand' : 'right_hand'
                ),
            },
            setting: {},
        }

        return data
    }

    AutoSaveScene() {
        try {
            const rawData = localStorage.getItem('AutoSaveSceneData')
            if (rawData) {
                localStorage.setItem('LastSceneData', rawData)
            }
            setInterval(() => {
                localStorage.setItem(
                    'AutoSaveSceneData',
                    JSON.stringify(this.GetSceneData())
                )
            }, 5000)
        } catch (error) {
            console.error(error)
        }
    }

    SaveScene() {
        try {
            downloadJson(
                JSON.stringify(this.GetSceneData()),
                `scene_${getCurrentTime()}.json`
            )
        } catch (error) {
            console.error(error)
        }
    }
    RestoreGesture(rawData: string) {
        const data = JSON.parse(rawData)

        const {
            version,
            object: { hand: handData },
            setting,
        } = data

        if (!handData) throw new Error('Invalid json')
        const hand = this.getSelectedHand()
        const body = this.getSelectedBody()

        if (!hand || !body) throw new Error('!hand || !body')

        new BodyControlor(body).RestoreHand(
            hand.name == 'left_hand' ? 'left_hand' : 'right_hand',
            handData
        )
    }
    SaveGesture() {
        const data = this.GetGesture()
        if (!data) throw new Error('Failed to get gesture')
        downloadJson(JSON.stringify(data), `gesture_${getCurrentTime()}.json`)
    }

    ClearScene() {
        this.GetBodies().forEach((o) => o.removeFromParent())
    }

    CreateBodiesFromData(bodies: BodyData[]) {
        return bodies.map((data) => {
            const body = CloneBody()!
            new BodyControlor(body).RestoreBody(data)
            return body
        })
    }
    RestoreCamera(data: CameraData, updateOrbitControl = true) {
        this.camera.position.fromArray(data.position)
        this.camera.rotation.fromArray(data.rotation as any)
        this.camera.near = data.near
        this.camera.far = data.far
        this.camera.zoom = data.zoom
        this.camera.updateProjectionMatrix()

        if (data.target) this.orbitControls.target.fromArray(data.target)
        if (updateOrbitControl) this.orbitControls.update() // fix position change
    }
    RestoreScene(rawData: string) {
        try {
            if (!rawData) return
            const data = JSON.parse(rawData)

            const {
                version,
                object: { bodies, camera },
                setting,
            } = data

            const bodiesObject = this.CreateBodiesFromData(bodies)
            this.ClearScene()

            if (bodiesObject.length > 0) this.scene.add(...bodiesObject)
            for (const body of bodiesObject) {
                new BodyControlor(body).ResetAllTargetsPosition()
            }
            this.RestoreCamera(camera)
        } catch (error: any) {
            Oops(error)
            console.error(error)
        }
    }
    ResetScene() {
        try {
            this.ClearScene()
            this.CopySelectedBody()
            const body = this.getSelectedBody()
            if (body) {
                this.scene.add(body)
                this.dlight.target = body
            }
        } catch (error: any) {
            Oops(error)
            console.error(error)
        }
    }
    RestoreLastSavedScene() {
        const rawData = localStorage.getItem('LastSceneData')
        if (rawData) this.RestoreScene(rawData)
    }
    async LoadScene() {
        const rawData = await uploadJson()
        if (rawData) this.RestoreScene(rawData)
    }

    // drawPoseData(positions: THREE.Vector3[]) {
    //     const objects: Record<
    //         keyof typeof PartIndexMappingOfBlazePoseModel,
    //         Object3D
    //     > = Object.fromEntries(
    //         Object.keys(PartIndexMappingOfBlazePoseModel).map((name) => {
    //             const p = positions[PartIndexMappingOfBlazePoseModel[name]]
    //             const material = new THREE.MeshBasicMaterial({
    //                 color: 0xff0000,
    //             })
    //             const mesh = new THREE.Mesh(
    //                 new THREE.SphereGeometry(1),
    //                 material
    //             )
    //             mesh.position.copy(p)
    //             this.scene.add(mesh)
    //             return [name, mesh]
    //         })
    //     )

    //     const CreateLink2 = (
    //         startObject: THREE.Object3D,
    //         endObject: THREE.Object3D
    //     ) => {
    //         const startPosition = startObject.position
    //         const endPostion = endObject.position
    //         const distance = startPosition.distanceTo(endPostion)

    //         const material = new THREE.MeshBasicMaterial({
    //             color: 0x666666,
    //             opacity: 0.6,
    //             transparent: true,
    //         })
    //         const mesh = new THREE.Mesh(new THREE.SphereGeometry(1), material)

    //         // 将拉伸后的球体放在中点，并计算旋转轴和角度
    //         const origin = startPosition
    //             .clone()
    //             .add(endPostion)
    //             .multiplyScalar(0.5)
    //         const v = endPostion.clone().sub(startPosition)
    //         const unit = new THREE.Vector3(1, 0, 0)
    //         const axis = unit.clone().cross(v)
    //         const angle = unit.clone().angleTo(v)

    //         mesh.scale.copy(new THREE.Vector3(distance / 2, 1, 1))
    //         mesh.position.copy(origin)
    //         mesh.setRotationFromAxisAngle(axis.normalize(), angle)
    //         this.scene.add(mesh)
    //     }

    //     CreateLink2(objects['left_shoulder'], objects['left_elbow'])
    //     CreateLink2(objects['left_elbow'], objects['left_wrist'])
    //     CreateLink2(objects['left_hip'], objects['left_knee'])
    //     CreateLink2(objects['left_knee'], objects['left_ankle'])
    //     CreateLink2(objects['right_shoulder'], objects['right_elbow'])
    //     CreateLink2(objects['right_elbow'], objects['right_wrist'])
    //     CreateLink2(objects['right_hip'], objects['right_knee'])
    //     CreateLink2(objects['right_knee'], objects['right_ankle'])

    //     CreateLink2(objects['left_shoulder'], objects['right_shoulder'])
    //     CreateLink2(objects['nose'], objects['right_eye'])
    //     CreateLink2(objects['nose'], objects['left_eye'])
    //     CreateLink2(objects['left_eye'], objects['left_ear'])

    //     CreateLink2(objects['right_eye'], objects['right_ear'])
    // }
    async GetBodyToSetPose() {
        const bodies = this.GetBodies()
        const body = bodies.length == 1 ? bodies[0] : this.getSelectedBody()
        return body
    }
    async SetPose(poseData: [number, number, number][]) {
        const body = await this.GetBodyToSetPose()

        if (!body) return

        const controlor = new BodyControlor(body)
        const old: BodyData = controlor.GetBodyData()
        controlor.SetPose(poseData)
        this.pushCommand(this.CreateAllTransformCommand(body, old))
    }
    async SetBlazePose(positions: [number, number, number][]) {
        const body = await this.GetBodyToSetPose()
        if (!body) return

        const controlor = new BodyControlor(body)
        const old: BodyData = controlor.GetBodyData()
        controlor.SetBlazePose(positions)
        this.pushCommand(this.CreateAllTransformCommand(body, old))
    }

    DetachTransfromControl() {
        this.transformControl.detach()
        this.triggerUnselectEvent()
    }

    cameraDataOfView?: CameraData
    LockView() {
        this.cameraDataOfView = this.GetCameraData()
        this.LockViewEventManager.TriggerEvent(true)
    }
    UnlockView() {
        this.cameraDataOfView = undefined
        this.LockViewEventManager.TriggerEvent(false)
    }
    RestoreView() {
        if (this.cameraDataOfView) this.RestoreCamera(this.cameraDataOfView)
    }

    changeView() {
        if (this.cameraDataOfView) {
            const old = this.GetCameraData()
            this.RestoreCamera(this.cameraDataOfView, false)
            return () => {
                this.RestoreCamera(old)
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {}
    }
    getSelectedBone() {
        const part = this.getSelectedPart()
        const isSelectBone = part && IsBone(part.name)
        return isSelectBone ? (part as Bone) : null
    }
    UpdateBones() {
        const DEFAULT_COLOR = 0xff0000
        const DEFAULT = 1
        const SELECTED = 1
        const SELECTED_COLOR = 0xeeee00
        const ACTIVE = 1
        const INACTIVE = 0.2

        const setColor = (
            bone: Bone,
            opacity: number,
            color = DEFAULT_COLOR
        ) => {
            const point = bone.children.find(
                (o) => o instanceof THREE.Mesh && !IsMask(o.name)
            ) as THREE.Mesh
            if (point) {
                const material = point.material as MeshBasicMaterial

                material.color.set(color)
                material.opacity = opacity
                material.needsUpdate = true
            }
        }
        const selectedBone = this.getSelectedBone()

        this.traverseBones((bone) => {
            setColor(bone, selectedBone ? INACTIVE : DEFAULT)
        })

        if (selectedBone) {
            let bone = selectedBone

            setColor(bone, SELECTED, SELECTED_COLOR)

            bone.traverseAncestors((ancestor) => {
                if (IsBone(ancestor.name)) {
                    setColor(ancestor as Bone, ACTIVE)
                }
            })

            for (;;) {
                const child = bone.children.filter((o) => o instanceof Bone)
                if (child.length !== 1) break
                setColor(child[0] as Bone, ACTIVE)
                bone = child[0] as Bone
            }
        }
    }
}
