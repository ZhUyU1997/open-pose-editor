import * as THREE from 'three'
import { Object3D } from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import type { TupleToUnion } from 'type-fest'

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

const JointRadius = 1

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
    start: THREE.Object3D | THREE.Vector3
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(JointRadius), material)
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
    endName: string
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(JointRadius), material)
    mesh.name = startName + '_link_' + endName

    // 将拉伸后的球体放在中点，并计算旋转轴和角度
    const origin = startPosition.clone().add(endPostion).multiplyScalar(0.5)
    const v = endPostion.clone().sub(startPosition)
    const unit = new THREE.Vector3(1, 0, 0)
    const axis = unit.clone().cross(v)
    const angle = unit.clone().angleTo(v)

    mesh.scale.copy(new THREE.Vector3(distance / 2, 1, 1))
    mesh.position.copy(origin)
    mesh.setRotationFromAxisAngle(axis.normalize(), angle)
    startObject.add(mesh)
}

function UpdateLink4(
    startObject: Object3D,
    endObject: Object3D,
    startName: string,
    endName: string
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
    mesh.scale.copy(new THREE.Vector3(distance / 2, 1, 1))
    mesh.position.copy(origin)
    mesh.setRotationFromAxisAngle(axis.normalize(), angle)
}

function UpdateLink2(startObject: Object3D, endObject: Object3D) {
    UpdateLink4(startObject, endObject, startObject.name, endObject.name)
}

function Joint(name: string) {
    const object = new THREE.Mesh(
        new THREE.SphereGeometry(JointRadius),
        new THREE.MeshBasicMaterial({ color: GetPresetColorOfJoint(name) })
    )
    object.name = name
    return object
}

function Torso(x: number, y: number, z: number) {
    const width = 34
    const height = 46

    const object = new THREE.Group()
    object.name = 'torso'

    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)

    const five = new THREE.Group()
    five.name = 'five'
    five.translateY(height / 2)
    object.add(five)

    const neck = Joint('neck')
    five.add(neck)

    const shoulder = new THREE.Group()
    shoulder.name = 'shoulder'
    five.add(shoulder)

    const right_shoulder = Joint('right_shoulder')
    right_shoulder.translateX(-width / 2)

    const left_shoulder = Joint('left_shoulder')

    left_shoulder.translateX(width / 2)
    x
    shoulder.add(right_shoulder)
    shoulder.add(left_shoulder)

    const hip = new THREE.Group()
    hip.name = 'hip'
    five.add(hip)

    const right_hip = Joint('right_hip')

    right_hip.translateX(-width / 2 + 10)
    right_hip.translateY(-height)

    const left_hip = Joint('left_hip')

    left_hip.translateX(width / 2 - 10)
    left_hip.translateY(-height)

    hip.add(right_hip)
    hip.add(left_hip)

    CreateLink4(hip, right_hip, 'neck', 'right_hip')
    CreateLink4(hip, left_hip, 'neck', 'left_hip')
    CreateLink4(shoulder, right_shoulder, 'neck', 'right_shoulder')
    CreateLink4(shoulder, left_shoulder, 'neck', 'left_shoulder')

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
const FootScale = 0.0008

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
    right_foot.translateY(-11)
    right_foot.scale.setX(-1)
    right_foot.scale.multiplyScalar(FootScale)

    left_foot.name = 'left_foot'
    left_foot.translateY(-11)
    left_foot.scale.multiplyScalar(FootScale)

    right_ankle.add(right_foot)
    left_ankle.add(left_foot)
    templateBody = torso
}

export function IsNeedSaveObject(name: string) {
    if (coco_body_keypoints.includes(name)) return true
    if (name === 'right_hand' || name === 'left_hand') return true
    if (name === 'right_foot' || name === 'left_foot') return true
    if (name === 'shoulder' || name === 'hip') return true // virtual point
    if (name.startsWith('shoujoint')) return true
    if (name === 'Bone' || name === 'Bone001') return true

    if (name.includes('_link_')) return true
    return false
}

const pickableObjectNames: string[] = [
    'torso',
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
    'shoulder',
    'hip',
]

export function IsPickable(name: string) {
    return (
        pickableObjectNames.includes(name) ||
        name.startsWith('shoujoint') ||
        name.startsWith('Bone')
    )
}

export function IsHand(name: string) {
    return ['left_hand', 'right_hand'].includes(name)
}

export function IsFoot(name: string) {
    return ['left_foot', 'right_foot'].includes(name)
}

export function IsExtremities(name: string) {
    return ['left_hand', 'right_hand', 'left_foot', 'right_foot'].includes(name)
}
export class BodyControlor {
    body: Object3D
    part: Record<
        | TupleToUnion<typeof coco_body_keypoints_const>
        | 'hip'
        | 'shoulder'
        | 'five'
        | 'right_hand'
        | 'left_hand'
        | 'left_foot'
        | 'right_foot',
        Object3D
    > = {} as any
    constructor(o: Object3D) {
        this.body = o
        this.body.traverse((o) => {
            if (coco_body_keypoints.includes(o.name as any)) {
                this.part[
                    o.name as TupleToUnion<typeof coco_body_keypoints_const>
                ] = o
            }
        })
        this.part['hip'] = this.body.getObjectByName('hip')!
        this.part['shoulder'] = this.body.getObjectByName('shoulder')!
        this.part['five'] = this.body.getObjectByName('five')!
        this.part['right_hand'] = this.body.getObjectByName('right_hand')!
        this.part['left_hand'] = this.body.getObjectByName('left_hand')!
        this.part['right_foot'] = this.body.getObjectByName('right_foot')!
        this.part['left_foot'] = this.body.getObjectByName('left_foot')!
    }
    findObjectItem<T extends Object3D>(
        object: Object3D,
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

    getWorldPosition(o: Object3D) {
        const pos = new THREE.Vector3()
        o.getWorldPosition(pos)
        return pos
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

        UpdateLink2(this.part['nose'], this.part['left_eye'])
        UpdateLink2(this.part['nose'], this.part['right_eye'])
        UpdateLink2(this.part['left_eye'], this.part['left_ear'])
        UpdateLink2(this.part['right_eye'], this.part['right_ear'])
    }
    get NoseToNeck() {
        return this.part['nose'].position.length()
    }
    set NoseToNeck(value: number) {
        this.part['nose'].position.normalize().multiplyScalar(value)
        UpdateLink2(this.part['neck'], this.part['nose'])
    }
    get ShoulderToHip() {
        return this.part['five'].position.length() * 2
    }
    set ShoulderToHip(value: number) {
        this.part['five'].position.setY(value / 2)
        this.part['left_hip'].position.setY(-value)
        this.part['right_hip'].position.setY(-value)

        UpdateLink4(this.part['hip'], this.part['left_hip'], 'neck', 'left_hip')
        UpdateLink4(
            this.part['hip'],
            this.part['right_hip'],
            'neck',
            'right_hip'
        )
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

        UpdateLink4(
            this.part['shoulder'],
            this.part['right_shoulder'],
            'neck',
            'right_shoulder'
        )
        UpdateLink4(
            this.part['shoulder'],
            this.part['left_shoulder'],
            'neck',
            'left_shoulder'
        )
    }

    get UpperArm() {
        return this.part['left_elbow'].position.length()
    }
    set UpperArm(length: number) {
        this.part['left_elbow'].position.normalize().multiplyScalar(length)
        this.part['right_elbow'].position.normalize().multiplyScalar(length)
        UpdateLink2(this.part['left_shoulder'], this.part['left_elbow'])
        UpdateLink2(this.part['right_shoulder'], this.part['right_elbow'])
    }
    get Forearm() {
        return this.part['left_wrist'].position.length()
    }
    set Forearm(length: number) {
        this.part['left_wrist'].position.normalize().multiplyScalar(length)
        this.part['right_wrist'].position.normalize().multiplyScalar(length)

        UpdateLink2(this.part['left_elbow'], this.part['left_wrist'])
        UpdateLink2(this.part['right_elbow'], this.part['right_wrist'])
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

        UpdateLink2(this.part['left_hip'], this.part['left_knee'])
        UpdateLink2(this.part['right_hip'], this.part['right_knee'])
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
        return Math.abs(this.part['left_hip'].position.x) * 2
    }
    set Hips(width: number) {
        this.part['left_hip'].position.setX(-width / 2)
        this.part['right_hip'].position.setX(width / 2)
        UpdateLink4(this.part['hip'], this.part['left_hip'], 'neck', 'left_hip')
        UpdateLink4(
            this.part['hip'],
            this.part['right_hip'],
            'neck',
            'right_hip'
        )
    }
    get LowerLeg() {
        return this.part['left_ankle'].position.length()
    }
    set LowerLeg(length: number) {
        this.part['left_ankle'].position.normalize().multiplyScalar(length)
        this.part['right_ankle'].position.normalize().multiplyScalar(length)

        UpdateLink2(this.part['left_knee'], this.part['left_ankle'])
        UpdateLink2(this.part['right_knee'], this.part['right_ankle'])
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
}
