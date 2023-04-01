import * as THREE from 'three'
import { Object3D } from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import type { TupleToUnion } from 'type-fest'
import { LoadFBXFile, LoadGLTFile, LoadObjFile } from './utils/loader'
import {
    FindObjectItem,
    GetLocalPosition,
    GetWorldPosition,
} from './utils/three-utils'
import { CCDIKSolver } from './utils/CCDIKSolver'

const coco_body_keypoints_const = [
    'nose',
    'neck',
    'right_shoulder',
    'right_elbow',
    'right_wrist',
    'left_shoulder',
    'left_elbow',
    'left_wrist',
    'right_hip',
    'right_knee',
    'right_ankle',
    'left_hip',
    'left_knee',
    'left_ankle',
    'right_eye',
    'left_eye',
    'right_ear',
    'left_ear',
] as const

const coco_body_keypoints = coco_body_keypoints_const as unknown as string[]

const connect_keypoints = [
    [1, 2],
    [1, 5],
    [2, 3],
    [3, 4],
    [5, 6],
    [6, 7],
    [1, 8],
    [8, 9],
    [9, 10],
    [1, 11],
    [11, 12],
    [12, 13],
    [0, 1],
    [0, 14],
    [14, 16],
    [0, 15],
    [15, 17],
] as const

const connect_color = [
    [255, 0, 0], // [1, 2], 0
    [255, 85, 0], // [1, 5], 1
    [255, 170, 0], // [2, 3], 2
    [255, 255, 0], // [3, 4], 3
    [170, 255, 0], // [5, 6], 4
    [85, 255, 0], // [6, 7], 5
    [0, 255, 0], // [1, 8], 6
    [0, 255, 85], // [8, 9], 7
    [0, 255, 170], // [9, 10], 8
    [0, 255, 255], // [1, 11], 9
    [0, 170, 255], // [11, 12], 10
    [0, 85, 255], // [12, 13], 11
    [0, 0, 255], // [0, 1], 12
    [85, 0, 255], // [0, 14], 13
    [170, 0, 255], // [14, 16], 14
    [255, 0, 255], // [0, 15], 15
    [255, 0, 170], // [15, 17], 16
    [255, 0, 85], // 17
] as const

const BoneThickness = 1

function ToHexColor([r, g, b]: readonly [number, number, number]) {
    return (r << 16) + (g << 8) + b
}
function SearchColor(start: number, end: number) {
    const index = connect_keypoints.findIndex(
        ([s, e]) => s === start && e === end
    )

    if (typeof index !== 'undefined') {
        const [r, g, b] = connect_color[index]

        return (r << 16) + (g << 8) + b
    }
    return null
}

function GetColorOfLinkByName(startName: string, endName: string) {
    if (!startName || !endName) return null

    const indexStart = coco_body_keypoints.indexOf(startName)
    const indexEnd = coco_body_keypoints.indexOf(endName)

    if (indexStart === -1 || indexEnd === -1) return null

    if (indexStart > indexEnd) return SearchColor(indexEnd, indexStart)
    else return SearchColor(indexStart, indexEnd)
}

function GetColorOfLink(start: Object3D, end: Object3D) {
    if (!start.name || !end.name) return null

    return GetColorOfLinkByName(start.name, end.name)
}

function GetPresetColorOfJoint(name: string) {
    const index = coco_body_keypoints.indexOf(name)
    return index !== -1 ? ToHexColor(connect_color[index]) : 0x0
}

function CreateLink(parent: Object3D, endObject: THREE.Object3D) {
    CreateLink2(parent, endObject, new THREE.Vector3(0, 0, 0))
}

function CreateLink2(
    parent: Object3D,
    endObject: THREE.Object3D,
    start: THREE.Object3D | THREE.Vector3,
    thickness: number = BoneThickness
) {
    const startPosition =
        start instanceof THREE.Vector3 ? start.clone() : start.position.clone()
    const endPostion = endObject.position
    const distance = startPosition.distanceTo(endPostion)

    const presetColor = GetColorOfLink(
        start instanceof THREE.Vector3 ? parent : start,
        endObject
    )
    const material = new THREE.MeshBasicMaterial({
        color: presetColor ?? 0x0,
        opacity: 0.6,
        transparent: true,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(thickness), material)
    mesh.name = parent.name + '_link_' + endObject.name

    // 将拉伸后的球体放在中点，并计算旋转轴和jiaodu
    const origin = startPosition.clone().add(endPostion).multiplyScalar(0.5)
    const v = endPostion.clone().sub(startPosition)
    const unit = new THREE.Vector3(1, 0, 0)
    const axis = unit.clone().cross(v)
    const angle = unit.clone().angleTo(v)

    mesh.scale.copy(new THREE.Vector3(distance / 2, 1, 1))
    mesh.position.copy(origin)
    mesh.setRotationFromAxisAngle(axis.normalize(), angle)
    parent.add(mesh)
}

function CreateLink4(
    startObject: THREE.Object3D,
    endObject: THREE.Object3D,
    startName: string,
    endName: string,
    thickness: number = BoneThickness
) {
    const startPosition = new THREE.Vector3(0, 0, 0)
    const endPostion = endObject.position
    const distance = startPosition.distanceTo(endPostion)

    const presetColor = GetColorOfLinkByName(startName, endName)
    const material = new THREE.MeshBasicMaterial({
        color: presetColor ?? 0x0,
        opacity: 0.6,
        transparent: true,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(thickness), material)
    mesh.name = startName + '_link_' + endName

    // 将拉伸后的球体放在中点，并计算旋转轴和角度
    const origin = startPosition.clone().add(endPostion).multiplyScalar(0.5)
    const v = endPostion.clone().sub(startPosition)
    const unit = new THREE.Vector3(1, 0, 0)
    const axis = unit.clone().cross(v)
    const angle = unit.clone().angleTo(v)
    // Another method
    //     new THREE.Quaternion().setFromUnitVectors(...)

    mesh.scale.copy(new THREE.Vector3(distance / 2, 1, 1))
    mesh.position.copy(origin)
    mesh.setRotationFromAxisAngle(axis.normalize(), angle)
    startObject.add(mesh)
}

function UpdateJointSphere(obj: Object3D, thickness = BoneThickness) {
    const name = obj.name + '_joint_sphere'
    obj.getObjectByName(name)?.scale.setScalar(thickness)
}

function UpdateLink4(
    startObject: Object3D,
    endObject: Object3D,
    startName: string,
    endName: string,
    thickness = BoneThickness
) {
    const startPosition = new THREE.Vector3(0, 0, 0)
    const endPostion = endObject.position
    const distance = startPosition.distanceTo(endPostion)
    // 将拉伸后的球体放在中点，并计算旋转轴和角度
    const origin = startPosition.clone().add(endPostion).multiplyScalar(0.5)
    const v = endPostion.clone().sub(startPosition)
    const unit = new THREE.Vector3(1, 0, 0)
    const axis = unit.clone().cross(v)
    const angle = unit.clone().angleTo(v)
    const mesh = startObject.getObjectByName(startName + '_link_' + endName)!
    mesh.scale.copy(
        new THREE.Vector3(
            distance / 2,
            thickness / BoneThickness,
            thickness / BoneThickness
        )
    )
    mesh.position.copy(origin)
    mesh.setRotationFromAxisAngle(axis.normalize(), angle)

    UpdateJointSphere(startObject, thickness)
    UpdateJointSphere(endObject, thickness)
}

function UpdateLink2(
    startObject: Object3D,
    endObject: Object3D,
    thickness = BoneThickness
) {
    UpdateLink4(
        startObject,
        endObject,
        startObject.name,
        endObject.name,
        thickness
    )
}

function Joint(name: string, thickness: number = BoneThickness) {
    const object = new THREE.Group()
    object.name = name

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(thickness),
        new THREE.MeshBasicMaterial({ color: GetPresetColorOfJoint(name) })
    )

    sphere.name = name + '_joint_sphere'
    object.add(sphere)
    return object
}

function Torso(x: number, y: number, z: number) {
    const width = 34
    const height = 46

    const object = new THREE.Group()
    object.name = 'torso'

    // for debug
    const torso = new THREE.Mesh(
        new THREE.SphereGeometry(BoneThickness),
        new THREE.MeshBasicMaterial({ color: 0x888888 })
    )

    torso.name = 'center'
    object.add(torso)

    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)

    const five = new THREE.Group()
    five.name = 'five'
    five.translateY(height / 2)
    object.add(five)

    const neck = Joint('neck')
    five.add(neck)

    const left_shoulder_inner = new THREE.Group()
    left_shoulder_inner.name = 'left_shoulder_inner'
    five.add(left_shoulder_inner)

    const right_shoulder_inner = new THREE.Group()
    right_shoulder_inner.name = 'right_shoulder_inner'
    five.add(right_shoulder_inner)

    const right_hip_inner = new THREE.Group()
    right_hip_inner.name = 'right_hip_inner'
    five.add(right_hip_inner)

    const left_hip_inner = new THREE.Group()
    left_hip_inner.name = 'left_hip_inner'
    five.add(left_hip_inner)

    const right_shoulder = Joint('right_shoulder')
    right_shoulder.translateX(-width / 2)

    const left_shoulder = Joint('left_shoulder')

    left_shoulder.translateX(width / 2)

    right_shoulder_inner.add(right_shoulder)
    left_shoulder_inner.add(left_shoulder)

    const right_hip = Joint('right_hip')

    right_hip.translateX(-width / 2 + 7)
    right_hip.translateY(-height)

    const left_hip = Joint('left_hip')

    left_hip.translateX(width / 2 - 7)
    left_hip.translateY(-height)

    right_hip_inner.add(right_hip)
    left_hip_inner.add(left_hip)

    CreateLink4(right_hip_inner, right_hip, 'neck', 'right_hip')
    CreateLink4(left_hip_inner, left_hip, 'neck', 'left_hip')
    CreateLink4(right_shoulder_inner, right_shoulder, 'neck', 'right_shoulder')
    CreateLink4(left_shoulder_inner, left_shoulder, 'neck', 'left_shoulder')

    return {
        neck,
        torso: object,
        right_shoulder,
        left_shoulder,
        right_hip,
        left_hip,
    }
}

function Head(x: number, y: number, z: number) {
    const nose = Joint('nose')

    nose.translateX(x)
    nose.translateY(y)
    nose.translateZ(z)

    const right_eye = Joint('right_eye')

    right_eye.translateX(-3)
    right_eye.translateY(3)
    right_eye.translateZ(-3)

    const left_eye = Joint('left_eye')

    left_eye.translateX(3)
    left_eye.translateY(3)
    left_eye.translateZ(-3)

    CreateLink(nose, right_eye)
    CreateLink(nose, left_eye)

    nose.add(right_eye)
    nose.add(left_eye)

    const right_ear = Joint('right_ear')

    right_ear.translateX(-4)
    right_ear.translateY(-3)
    right_ear.translateZ(-8)

    const left_ear = Joint('left_ear')

    left_ear.translateX(4)
    left_ear.translateY(-3)
    left_ear.translateZ(-8)

    CreateLink(right_eye, right_ear)
    CreateLink(left_eye, left_ear)

    right_eye.add(right_ear)
    left_eye.add(left_ear)

    return { nose, right_eye, left_eye, right_ear, left_ear }
}

function Elbow(name: string, x: number, y: number, z: number) {
    const object = Joint(name)
    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)
    return object
}

function Knee(name: string, x: number, y: number, z: number) {
    const object = Joint(name)
    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)
    return object
}

function Ankle(name: string, x: number, y: number, z: number) {
    const object = Joint(name)
    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)
    return object
}

let templateBody: THREE.Group | null = null

export function CloneBody() {
    if (templateBody) {
        return SkeletonUtils.clone(templateBody)
    }
    return null
}

const HandScale = 2.2
const FootScale = 0.25

export function CreateTemplateBody(hand: Object3D, foot: Object3D) {
    const { torso, right_shoulder, left_shoulder, right_hip, left_hip, neck } =
        Torso(0, 115, 0)
    const { nose, left_ear, right_ear, right_eye, left_eye } = Head(0, 20, 14)
    const right_elbow = Elbow('right_elbow', 0, -25, 0)
    const left_elbow = Elbow('left_elbow', 0, -25, 0)
    const right_wrist = Elbow('right_wrist', 0, -25, 0)
    const left_wrist = Elbow('left_wrist', 0, -25, 0)
    const right_knee = Knee('right_knee', 0, -40, 0)
    const left_knee = Knee('left_knee', 0, -40, 0)
    const right_ankle = Ankle('right_ankle', 0, -36, 0)
    const left_ankle = Ankle('left_ankle', 0, -36, 0)

    neck.add(nose)
    right_shoulder.add(right_elbow)
    left_shoulder.add(left_elbow)
    right_elbow.add(right_wrist)
    left_elbow.add(left_wrist)
    right_hip.add(right_knee)
    left_hip.add(left_knee)
    right_knee.add(right_ankle)
    left_knee.add(left_ankle)

    CreateLink(neck, nose)
    CreateLink(right_shoulder, right_elbow)
    CreateLink(left_shoulder, left_elbow)
    CreateLink(right_elbow, right_wrist)
    CreateLink(left_elbow, left_wrist)
    CreateLink(right_hip, right_knee)
    CreateLink(left_hip, left_knee)
    CreateLink(right_knee, right_ankle)
    CreateLink(left_knee, left_ankle)

    const right_hand = SkeletonUtils.clone(hand)
    const left_hand = SkeletonUtils.clone(hand)
    right_hand.name = 'right_hand'
    right_hand.translateX(-0.4)
    right_hand.translateY(3)
    right_hand.rotateY(Math.PI)
    right_hand.rotateZ(-Math.PI / 2)

    right_hand.scale.multiplyScalar(HandScale)

    left_hand.name = 'left_hand'
    left_hand.scale.x = -1
    left_hand.translateX(0.4)
    left_hand.translateY(3)
    left_hand.rotateY(Math.PI)
    left_hand.rotateZ(Math.PI / 2)
    left_hand.scale.multiplyScalar(HandScale)

    right_wrist.add(right_hand)
    left_wrist.add(left_hand)

    const right_foot = SkeletonUtils.clone(foot)
    const left_foot = SkeletonUtils.clone(foot)

    right_foot.name = 'right_foot'
    right_foot.scale.setX(-1)
    right_foot.scale.multiplyScalar(FootScale)

    left_foot.name = 'left_foot'
    left_foot.scale.multiplyScalar(FootScale)

    right_ankle.add(right_foot)
    left_ankle.add(left_foot)
    templateBody = torso

    torso.add(CreateIKTarget(torso, left_wrist, 'left_wrist_target'))
    torso.add(CreateIKTarget(torso, right_wrist, 'right_wrist_target'))
    torso.add(CreateIKTarget(torso, left_ankle, 'left_ankle_target'))
    torso.add(CreateIKTarget(torso, right_ankle, 'right_ankle_target'))
}

function CreateIKTarget(body: Object3D, effector: Object3D, name: string) {
    const target = new THREE.Mesh(
        new THREE.BoxGeometry(
            BoneThickness * 5,
            BoneThickness * 5,
            BoneThickness * 5
        ),
        new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.5,
        })
    )

    const effector_pos = GetWorldPosition(effector)
    target.position.copy(GetLocalPosition(body, effector_pos))
    target.name = name

    return target
}

const handModelInfo = {
    meshName: 'shoupolySurface1',
    bonePrefix: 'shoujoint',
}
const footModelInfo = {
    meshName: 'FootObject',
    bonePrefix: 'FootBone',
}

const ExtremitiesMapping: Record<
    string,
    {
        meshName: string
        bonePrefix: string
    }
> = {
    left_hand: handModelInfo,
    right_hand: handModelInfo,
    left_foot: footModelInfo,
    right_foot: footModelInfo,
}
export async function LoadHand(
    handFBXFileUrl: string,
    onLoading?: (loaded: number) => void
) {
    const fbx = await LoadFBXFile(handFBXFileUrl, onLoading)

    // fbx.scale.multiplyScalar(10)
    const mesh = FindObjectItem<THREE.SkinnedMesh>(fbx, handModelInfo.meshName)!
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

    return fbx
}

export async function LoadFoot(
    footFBXFileUrl: string,
    onLoading?: (loaded: number) => void
) {
    const fbx = await LoadFBXFile(footFBXFileUrl, onLoading)

    console.log(fbx)
    // fbx.scale.multiplyScalar(0.001)

    const mesh = FindObjectItem<THREE.SkinnedMesh>(fbx, footModelInfo.meshName)!
    mesh.material = new THREE.MeshPhongMaterial()
    // this.scene.add();
    // const helper = new THREE.SkeletonHelper(mesh.parent!);
    // this.scene.add(helper);

    console.log(mesh.skeleton.bones)
    mesh.skeleton.bones.forEach((o) => {
        if (o.name !== 'FootBone2') return
        const point = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false })
        )

        point.name = 'red_point'
        // point.position.copy(o.position)
        point.translateX(-0.3)
        o.add(point)
    })

    return fbx
}

export function GetExtremityMesh(o: Object3D) {
    if (!(o.name in ExtremitiesMapping)) {
        return null
    }
    return FindObjectItem<THREE.SkinnedMesh>(
        o,
        ExtremitiesMapping[o.name].meshName
    )
}

export function IsVirtualPoint(name: string) {
    return [
        'right_shoulder_inner',
        'left_shoulder_inner',
        'right_hip_inner',
        'left_hip_inner',
        'five',
    ].includes(name)
}

export function IsNeedSaveObject(name: string) {
    if (coco_body_keypoints.includes(name)) return true
    if (name === 'right_hand' || name === 'left_hand') return true
    if (name === 'right_foot' || name === 'left_foot') return true
    if (IsVirtualPoint(name)) return true // virtual point
    if (name.startsWith(handModelInfo.bonePrefix)) return true
    if (name.startsWith(footModelInfo.bonePrefix)) return true
    if (name.includes('_joint_sphere')) return true
    if (name.includes('_link_')) return true
    return false
}

const pickableObjectNames: string[] = [
    'torso',
    'nose',
    'neck',
    'right_shoulder',
    'left_shoulder',
    'right_elbow',
    'left_elbow',
    'right_hip',
    'left_hip',
    'right_knee',
    'left_knee',
    // virtual point for better control
    'right_shoulder_inner',
    'left_shoulder_inner',
    'right_hip_inner',
    'left_hip_inner',
    'left_wrist_target',
    'right_wrist_target',
    'left_ankle_target',
    'right_ankle_target',
]

export function IsPickable(name: string, isFreeMode = false) {
    if (isFreeMode && coco_body_keypoints.includes(name)) return true
    if (pickableObjectNames.includes(name)) return true
    if (name.startsWith(handModelInfo.bonePrefix)) return true
    if (name.startsWith(footModelInfo.bonePrefix)) return true
    return false
}

export function IsTranslate(name: string, isFreeMode = false) {
    if (isFreeMode)
        return (
            [
                'right_shoulder_inner',
                'left_shoulder_inner',
                'right_hip_inner',
                'left_hip_inner',
                'neck',
            ].includes(name) == false
        )

    if (name.endsWith('_target')) return true
    return false
}

export function IsTarget(name: string) {
    if (name.endsWith('_target')) return true
    return false
}

export function IsHand(name: string) {
    return ['left_hand', 'right_hand'].includes(name)
}

export function IsFoot(name: string) {
    return ['left_foot', 'right_foot'].includes(name)
}

export function IsSkeleton(name: string) {
    if (name == 'torso') return true
    if (coco_body_keypoints.includes(name)) return true
    if (IsVirtualPoint(name)) return true // virtual point
    if (name.includes('_joint_sphere')) return true
    if (name.includes('_link_')) return true
    return false
}

export function IsExtremities(name: string) {
    return ['left_hand', 'right_hand', 'left_foot', 'right_foot'].includes(name)
}

const ControlablePart = [
    ...coco_body_keypoints_const,
    'left_shoulder_inner',
    'right_shoulder_inner',
    'left_hip_inner',
    'right_hip_inner',
    'five',
    'right_hand',
    'left_hand',
    'left_foot',
    'right_foot',
    'torso',

    'left_wrist_target',
    'right_wrist_target',
    'left_ankle_target',
    'right_ankle_target',
] as const

type ControlPartName = TupleToUnion<typeof ControlablePart>

export class BodyControlor {
    body: Object3D
    part: Record<ControlPartName, Object3D> = {} as any
    constructor(o: Object3D) {
        this.body = o
        this.body.traverse((o) => {
            if (ControlablePart.includes(o.name as ControlPartName)) {
                this.part[o.name as ControlPartName] = o
            }
        })

        this.part['left_shoulder_inner'] = this.getObjectByName(
            'left_shoulder_inner'
        )
        this.part['right_shoulder_inner'] = this.getObjectByName(
            'right_shoulder_inner'
        )
        this.part['left_hip_inner'] = this.getObjectByName('left_hip_inner')
        this.part['right_hip_inner'] = this.getObjectByName('right_hip_inner')
        this.part['five'] = this.getObjectByName('five')
        this.part['right_hand'] = this.getObjectByName('right_hand')
        this.part['left_hand'] = this.getObjectByName('left_hand')
        this.part['right_foot'] = this.getObjectByName('right_foot')
        this.part['left_foot'] = this.getObjectByName('left_foot')
        this.part['torso'] = this.body
    }

    getObjectByName(name: string) {
        const part = this.body.getObjectByName(name)

        if (!part) throw new Error(`Not found part: ${name}`)

        return part
    }
    getWorldPosition(o: Object3D) {
        const pos = new THREE.Vector3()
        o.getWorldPosition(pos)
        return pos
    }

    UpdateLink(name: ControlPartName, thickness = this.BoneThickness) {
        if (
            [
                'left_hip',
                'right_hip',
                'right_shoulder',
                'left_shoulder',
            ].includes(name)
        )
            UpdateLink4(
                this.part[`${name}_inner` as ControlPartName],
                this.part[name],
                'neck',
                name,
                thickness
            )
        else if (name !== 'neck' && coco_body_keypoints.includes(name)) {
            UpdateLink2(this.part[name].parent!, this.part[name], thickness)
        }
    }

    get HeadSize() {
        const size = this.getWorldPosition(this.part['right_ear']).distanceTo(
            this.getWorldPosition(this.part['left_ear'])
        )
        return size
    }

    set HeadSize(value: number) {
        const scale = value / this.HeadSize

        const earLength = this.part['left_ear'].position.length() * scale
        const eyeLength = this.part['left_eye'].position.length() * scale

        this.part['left_ear'].position.normalize().multiplyScalar(earLength)
        this.part['right_ear'].position.normalize().multiplyScalar(earLength)
        this.part['left_eye'].position.normalize().multiplyScalar(eyeLength)
        this.part['right_eye'].position.normalize().multiplyScalar(eyeLength)

        this.UpdateLink('left_eye')
        this.UpdateLink('right_eye')
        this.UpdateLink('left_ear')
        this.UpdateLink('right_ear')
    }
    get NoseToNeck() {
        return this.part['nose'].position.length()
    }
    set NoseToNeck(value: number) {
        this.part['nose'].position.normalize().multiplyScalar(value)
        this.UpdateLink('nose')
    }
    get ShoulderToHip() {
        return this.getDistanceOf(
            this.getWorldPosition(this.part['five']),
            this.getMidpoint(
                this.getWorldPosition(this.part['left_hip']),
                this.getWorldPosition(this.part['right_hip'])
            )
        )
    }
    set ShoulderToHip(value: number) {
        const origin = this.ShoulderToHip

        this.part['five'].position.normalize().multiplyScalar(value / 2)
        this.part['left_hip'].position.multiplyScalar(value / origin)
        this.part['right_hip'].position.multiplyScalar(value / origin)

        this.UpdateLink('left_hip')
        this.UpdateLink('right_hip')
    }
    get ShoulderWidth() {
        return this.part['left_shoulder'].position.distanceTo(
            this.part['right_shoulder'].position
        )
    }
    set ShoulderWidth(width: number) {
        const right_shoulder = this.part['right_shoulder']
        right_shoulder.position.x = -width / 2
        const left_shoulder = this.part['left_shoulder']
        left_shoulder.position.x = width / 2

        this.UpdateLink('right_shoulder')
        this.UpdateLink('left_shoulder')
    }

    get UpperArm() {
        return this.part['left_elbow'].position.length()
    }
    set UpperArm(length: number) {
        this.part['left_elbow'].position.normalize().multiplyScalar(length)
        this.part['right_elbow'].position.normalize().multiplyScalar(length)
        this.UpdateLink('left_elbow')
        this.UpdateLink('right_elbow')
    }
    get Forearm() {
        return this.part['left_wrist'].position.length()
    }
    set Forearm(length: number) {
        this.part['left_wrist'].position.normalize().multiplyScalar(length)
        this.part['right_wrist'].position.normalize().multiplyScalar(length)

        this.UpdateLink('left_wrist')
        this.UpdateLink('right_wrist')
    }

    get ArmLength() {
        return this.UpperArm + this.Forearm
    }
    set ArmLength(length: number) {
        const origin = this.ArmLength
        this.UpperArm = (length * this.UpperArm) / origin
        this.Forearm = (length * this.Forearm) / origin
    }

    get Thigh() {
        return this.part['left_knee'].position.length()
    }
    set Thigh(length: number) {
        this.part['left_knee'].position.normalize().multiplyScalar(length)
        this.part['right_knee'].position.normalize().multiplyScalar(length)

        this.UpdateLink('left_knee')
        this.UpdateLink('right_knee')
    }

    get HandSize() {
        return Math.abs(this.part['left_hand'].scale.x) / HandScale
    }
    set HandSize(size: number) {
        const origin = this.HandSize
        this.part['left_hand'].scale
            .divideScalar(origin * HandScale)
            .multiplyScalar(size * HandScale)
        this.part['right_hand'].scale
            .divideScalar(origin * HandScale)
            .multiplyScalar(size * HandScale)
    }

    get Hips() {
        return this.getDistanceOf(
            this.getWorldPosition(this.part['left_hip']),
            this.getWorldPosition(this.part['right_hip'])
        )
    }
    set Hips(width: number) {
        const left = this.getWorldPosition(this.part['left_hip'])
        const right = this.getWorldPosition(this.part['right_hip'])

        const mid = this.getMidpoint(left, right)

        // newLLeft = normalize(left - mid) * width + mid

        const newLeft = left
            .sub(mid)
            .normalize()
            .multiplyScalar(width / 2.0)
            .add(mid)
        const newRight = right
            .sub(mid)
            .normalize()
            .multiplyScalar(width / 2.0)
            .add(mid)

        this.setPositionFromWorld(this.part['left_hip'], newLeft)
        this.setPositionFromWorld(this.part['right_hip'], newRight)

        this.UpdateLink('left_hip')
        this.UpdateLink('right_hip')
    }
    get LowerLeg() {
        return this.part['left_ankle'].position.length()
    }
    set LowerLeg(length: number) {
        this.part['left_ankle'].position.normalize().multiplyScalar(length)
        this.part['right_ankle'].position.normalize().multiplyScalar(length)

        this.UpdateLink('left_ankle')
        this.UpdateLink('right_ankle')
    }

    get LegLength() {
        return this.Thigh + this.LowerLeg
    }
    set LegLength(length: number) {
        const origin = this.LegLength
        this.Thigh = (length * this.Thigh) / origin
        this.LowerLeg = (length * this.LowerLeg) / origin
    }

    get FootSize() {
        return Math.abs(this.part['left_foot'].scale.x) / FootScale
    }
    set FootSize(size: number) {
        const origin = this.FootSize
        this.part['left_foot'].scale
            .divideScalar(origin * FootScale)
            .multiplyScalar(size * FootScale)
        this.part['right_foot'].scale
            .divideScalar(origin * FootScale)
            .multiplyScalar(size * FootScale)
    }
    getLocalPosition(obj: Object3D, postion: THREE.Vector3) {
        return obj.worldToLocal(postion.clone())
    }

    setPositionFromWorld(obj: Object3D, postion: THREE.Vector3) {
        return obj.position.copy(this.getLocalPosition(obj.parent!, postion))
    }

    getDirectionVectorByParentOf(
        name: ControlPartName,
        from: THREE.Vector3,
        to: THREE.Vector3
    ) {
        const parent = this.part[name].parent!
        const localFrom = this.getLocalPosition(parent, from)
        const localTo = this.getLocalPosition(parent, to)

        return localTo.clone().sub(localFrom).normalize()
    }

    rotateTo(name: ControlPartName, dir: THREE.Vector3) {
        const obj = this.part[name]
        const unit = obj.position.clone().normalize()
        const axis = unit.clone().cross(dir)
        const angle = unit.clone().angleTo(dir)
        obj.parent?.rotateOnAxis(axis.normalize(), angle)
    }

    rotateTo3(name: ControlPartName, from: THREE.Vector3, to: THREE.Vector3) {
        this.rotateTo(name, this.getDirectionVectorByParentOf(name, from, to))
    }

    setPositionByDistance(
        name: ControlPartName,
        from: THREE.Vector3,
        to: THREE.Vector3
    ) {
        const dis = this.getDistanceOf(from, to)
        this.part[name].position.normalize().multiplyScalar(dis)
    }

    setDirectionVector(name: ControlPartName, v: THREE.Vector3) {
        const len = this.part[name].position.length()
        this.part[name].position.copy(v).multiplyScalar(len)
        this.UpdateLink(name)
    }

    getDistanceOf(from: THREE.Vector3, to: THREE.Vector3) {
        return from.distanceTo(to)
    }

    getMidpoint(from: THREE.Vector3, to: THREE.Vector3) {
        return from.clone().add(to).multiplyScalar(0.5)
    }
    ResetPose() {
        templateBody?.traverse((o) => {
            if (o.name in this.part) {
                const name = o.name as ControlPartName

                if (name == 'torso') this.part[name].position.setY(o.position.y)
                else this.part[name].position.copy(o.position)

                this.part[name].rotation.copy(o.rotation)
                this.part[name].scale.copy(o.scale)
                this.UpdateLink(name)
            }
        })
    }

    SetBlazePose(rawData: [number, number, number][]) {
        this.ResetPose()

        const data = Object.fromEntries(
            Object.entries(PartIndexMappingOfBlazePoseModel).map(
                ([name, index]) => {
                    return [
                        name,
                        new THREE.Vector3().fromArray(
                            rawData[index] ?? [0, 0, 0]
                        ),
                    ]
                }
            )
        ) as Record<
            keyof typeof PartIndexMappingOfBlazePoseModel,
            THREE.Vector3
        >

        // this.Hips = this.getDistanceOf(data['right_hip'], data['left_hip'])
        // this.Thigh = this.getDistanceOf(data['left_knee'], data['left_hip'])
        // this.LowerLeg = this.getDistanceOf(
        //     data['left_ankle'],
        //     data['left_knee']
        // )
        // this.UpperArm = this.getDistanceOf(
        //     data['left_shoulder'],
        //     data['left_elbow']
        // )
        // this.Forearm = this.getDistanceOf(
        //     data['left_elbow'],
        //     data['left_wrist']
        // )
        // this.ShoulderWidth = this.getDistanceOf(
        //     data['left_shoulder'],
        //     data['right_shoulder']
        // )

        // this.NoseToNeck = this.getDistanceOf(
        //     data['nose'],
        //     this.getMidpoint(data['left_shoulder'], data['right_shoulder'])
        // )

        const map: [
            ControlPartName,
            [
                THREE.Vector3 | keyof typeof PartIndexMappingOfBlazePoseModel,
                THREE.Vector3 | keyof typeof PartIndexMappingOfBlazePoseModel
            ]
        ][] = [
            [
                'five',
                [
                    this.getMidpoint(
                        this.getMidpoint(data['left_hip'], data['right_hip']),
                        this.getMidpoint(
                            data['left_shoulder'],
                            data['right_shoulder']
                        )
                    ),
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                ],
            ],

            [
                'left_shoulder',
                [
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                    'left_shoulder',
                ],
            ],
            ['left_elbow', ['left_shoulder', 'left_elbow']],
            ['left_wrist', ['left_elbow', 'left_wrist']],
            [
                'left_hip',
                [
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                    'left_hip',
                ],
            ],
            ['left_knee', ['left_hip', 'left_knee']],
            ['left_ankle', ['left_knee', 'left_ankle']],

            [
                'right_shoulder',
                [
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                    'right_shoulder',
                ],
            ],
            ['right_elbow', ['right_shoulder', 'right_elbow']],
            ['right_wrist', ['right_elbow', 'right_wrist']],

            [
                'right_hip',
                [
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                    'right_hip',
                ],
            ],
            ['right_knee', ['right_hip', 'right_knee']],
            ['right_ankle', ['right_knee', 'right_ankle']],

            [
                'nose',
                [
                    this.getMidpoint(
                        data['left_shoulder'],
                        data['right_shoulder']
                    ),
                    'nose',
                ],
            ],
            ['left_eye', ['nose', 'left_eye']],
            ['right_eye', ['nose', 'right_eye']],
            ['left_ear', ['left_eye', 'left_ear']],
            ['right_ear', ['right_eye', 'right_ear']],
        ]

        for (const [name, [from, to]] of map) {
            this.rotateTo3(
                name,
                from instanceof THREE.Vector3 ? from : data[from],
                to instanceof THREE.Vector3 ? to : data[to]
            )

            this.setPositionByDistance(
                name,
                from instanceof THREE.Vector3 ? from : data[from],
                to instanceof THREE.Vector3 ? to : data[to]
            )

            this.UpdateLink(name)
        }
        this.Update()
    }
    SetPose(rawData: [number, number, number][]) {
        this.ResetPose()

        const data = Object.fromEntries(
            Object.entries(PartIndexMappingOfPoseModel).map(([name, index]) => {
                return [
                    name,
                    new THREE.Vector3().fromArray(rawData[index] ?? [0, 0, 0]),
                ]
            })
        ) as Record<keyof typeof PartIndexMappingOfPoseModel, THREE.Vector3>

        this.part['torso'].position.setY(
            this.getMidpoint(data['Hips'], data['Chest']).y
        )
        this.Hips = this.getDistanceOf(data['Hips'], data['UpLeg_L']) * 2
        this.Thigh = this.getDistanceOf(data['UpLeg_L'], data['Leg_L'])
        this.LowerLeg = this.getDistanceOf(data['Leg_L'], data['Foot_L'])
        this.UpperArm = this.getDistanceOf(data['Arm_L'], data['ForeArm_L'])
        this.Forearm = this.getDistanceOf(data['ForeArm_L'], data['Hand_L'])
        this.ShoulderWidth =
            2 *
            (this.getDistanceOf(data['Shoulder_L'], data['Arm_L']) +
                this.getDistanceOf(data['Chest'], data['Shoulder_L']) /
                    Math.SQRT2)

        const map: [
            ControlPartName,
            [
                keyof typeof PartIndexMappingOfPoseModel,
                keyof typeof PartIndexMappingOfPoseModel
            ]
        ][] = [
            ['five', ['Hips', 'Chest']],
            ['left_elbow', ['Arm_L', 'ForeArm_L']],
            ['left_wrist', ['ForeArm_L', 'Hand_L']],
            ['left_knee', ['UpLeg_L', 'Leg_L']],
            ['left_ankle', ['Leg_L', 'Foot_L']],
            ['right_elbow', ['Arm_R', 'ForeArm_R']],
            ['right_wrist', ['ForeArm_R', 'Hand_R']],
            ['right_knee', ['UpLeg_R', 'Leg_R']],
            ['right_ankle', ['Leg_R', 'Foot_R']],
        ]

        for (const [name, [from, to]] of map)
            this.rotateTo(
                name,
                this.getDirectionVectorByParentOf(name, data[from], data[to])
            )
        this.Update()
    }

    UpdateBones(thickness = this.BoneThickness) {
        this.part['torso'].traverse((o) => {
            if (o.name in this.part) {
                const name = o.name as ControlPartName
                this.UpdateLink(name, thickness)
            }
        })
    }

    Get18keyPointsData(): Array<[number, number, number]> {
        return coco_body_keypoints.map((name) => {
            if (name in this.part) {
                return this.getWorldPosition(
                    this.part[name as ControlPartName]
                ).toArray()
            } else {
                return [0, 0, 0]
            }
        })
    }

    get BoneThickness() {
        return Math.abs(
            this.part['neck'].getObjectByName('neck_joint_sphere')?.scale.x ??
                BoneThickness
        )
    }

    set BoneThickness(thickness: number) {
        this.UpdateBones(thickness)
    }

    GetIKSolver() {
        return new CCDIKSolver([
            {
                target: this.part['left_wrist_target'],
                effector: this.part['left_wrist'],
                links: [
                    {
                        index: this.part['left_elbow'],
                        enabled: true,
                    },
                    {
                        index: this.part['left_shoulder'],
                        enabled: true,
                    },
                ],
                iteration: 10,
                minAngle: 0.0,
                maxAngle: 1.0,
            },
            {
                target: this.part['right_wrist_target'],
                effector: this.part['right_wrist'],
                links: [
                    {
                        index: this.part['right_elbow'],
                        enabled: true,
                    },
                    {
                        index: this.part['right_shoulder'],
                        enabled: true,
                    },
                ],
                iteration: 10,
                minAngle: 0.0,
                maxAngle: 1.0,
            },
            {
                target: this.part['left_ankle_target'],
                effector: this.part['left_ankle'],
                links: [
                    {
                        index: this.part['left_knee'],
                        enabled: true,
                    },
                    {
                        index: this.part['left_hip'],
                        enabled: true,
                    },
                ],
                iteration: 10,
                minAngle: 0.0,
                maxAngle: 1.0,
            },
            {
                target: this.part['right_ankle_target'],
                effector: this.part['right_ankle'],
                links: [
                    {
                        index: this.part['right_knee'],
                        enabled: true,
                    },
                    {
                        index: this.part['right_hip'],
                        enabled: true,
                    },
                ],
                iteration: 10,
                minAngle: 0.0,
                maxAngle: 1.0,
            },
        ])
    }

    ResetTargetPosition(
        effectorName: ControlPartName,
        targetName: ControlPartName
    ) {
        const body = this.part['torso']
        const effector = this.part[effectorName]
        const target = this.part[targetName]

        const effector_pos = GetWorldPosition(effector)
        target.position.copy(this.getLocalPosition(body, effector_pos))
    }

    ResetAllTargetsPosition() {
        this.ResetTargetPosition('left_wrist', 'left_wrist_target')
        this.ResetTargetPosition('right_wrist', 'right_wrist_target')
        this.ResetTargetPosition('left_ankle', 'left_ankle_target')
        this.ResetTargetPosition('right_ankle', 'right_ankle_target')
    }

    Update() {
        this.ResetAllTargetsPosition()
        this.UpdateBones()
        this.part['torso'].updateMatrixWorld(true)
    }
}

const PartIndexMappingOfPoseModel = {
    Root: 0,
    Hips: 1,
    Spine: 2,
    Spine1: 3,
    Spine2: 4,
    Chest: 5,
    Neck: 6,
    Head: 7,
    Eye_R: 8,
    Eye_L: 9,
    Head_Null: 10, // maybe null
    Shoulder_L: 11,
    Arm_L: 12,
    ForeArm_L: 13,
    Hand_L: 14,
    HandPinky1_L: 15,
    HandPinky2_L: 16,
    HandPinky3_L: 17,
    HandRing1_L: 18,
    HandRing2_L: 19,
    HandRing3_L: 20,
    HandMiddle1_L: 21,
    HandMiddle2_L: 22,
    HandMiddle3_L: 23,
    HandIndex1_L: 24,
    HandIndex2_L: 25,
    HandIndex3_L: 26,
    HandThumb1_L: 27,
    HandThumb2_L: 28,
    HandThumb3_L: 29,
    Elbow_L: 30,
    ForeArmTwist_L: 31,
    ArmTwist_L: 32,
    Shoulder_R: 33,
    Arm_R: 34,
    ForeArm_R: 35,
    Hand_R: 36,
    HandPinky1_R: 37,
    HandPinky2_R: 38,
    HandPinky3_R: 39,
    HandRing1_R: 40,
    HandRing2_R: 41,
    HandRing3_R: 42,
    HandMiddle1_R: 43,
    HandMiddle2_R: 44,
    HandMiddle3_R: 45,
    HandIndex1_R: 46,
    HandIndex2_R: 47,
    HandIndex3_R: 48,
    HandThumb1_R: 49,
    HandThumb2_R: 50,
    HandThumb3_R: 51,
    Elbow_R: 52,
    ForeArmTwist_R: 53,
    ArmTwist_R: 54,
    UpLeg_L: 55,
    Leg_L: 56,
    Knee_L: 57,
    Foot_L: 58,
    FootPinky1_L: 59,
    FootRing_L: 60,
    FootMiddle_L: 61,
    FootIndex_L: 62,
    FootThumb_L: 63,
    UpLegTwist_L: 64,
    ThighFront_L: 65,
    UpLeg_R: 66,
    Leg_R: 67,
    Knee_R: 68,
    Foot_R: 69,
    FootPinky1_R: 70,
    FootRing_R: 71,
    FootMiddle_R: 72,
    FootIndex_R: 73,
    FootThumb_R: 74,
    UpLegTwist_R: 75,
    ThighFront_R: 76,
}

export const PartIndexMappingOfBlazePoseModel = {
    nose: 0,
    left_eye_inner: 1,
    left_eye: 2,
    left_eye_outer: 3,
    right_eye_inner: 4,
    right_eye: 5,
    right_eye_outer: 6,
    left_ear: 7,
    right_ear: 8,
    mouth_left: 9,
    mouth_right: 10,
    left_shoulder: 11,
    right_shoulder: 12,
    left_elbow: 13,
    right_elbow: 14,
    left_wrist: 15,
    right_wrist: 16,
    left_pinky: 17,
    right_pinky: 18,
    left_index: 19,
    right_index: 20,
    left_thumb: 21,
    right_thumb: 22,
    left_hip: 23,
    right_hip: 24,
    left_knee: 25,
    right_knee: 26,
    left_ankle: 27,
    right_ankle: 28,
    left_heel: 29,
    right_heel: 30,
    left_foot_index: 31,
    right_foot_index: 32,
}

const PosesLibrary: [number, number, number][][] | null = []

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function GetRandomPose() {
    if (PosesLibrary)
        return PosesLibrary[getRandomInt(0, PosesLibrary.length - 1)]
    return null
}

export async function LoadPosesLibrary(posesLibraryUrl: string) {
    const response = await fetch(posesLibraryUrl)
    const buffer = await response.arrayBuffer()

    console.log(buffer.byteLength)
    const int16Array = new Int32Array(buffer)

    const num = Object.keys(PartIndexMappingOfPoseModel).length

    for (let i = 0; i < int16Array.length / (num * 3); i++) {
        const temp: [number, number, number][] = []
        for (let j = 0; j < num; j++) {
            const a = int16Array[i * (num * 3) + j * 3 + 0]
            const b = int16Array[i * (num * 3) + j * 3 + 1]
            const c = int16Array[i * (num * 3) + j * 3 + 2]

            temp.push([a / 1000.0, b / 1000.0, c / 1000.0])
        }

        PosesLibrary?.push(temp)
    }
}
