import * as THREE from 'three'
import { Object3D } from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'

const coco_body_keypoints = [
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
]
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

function GetColorOfLink(start: Object3D, end: Object3D) {
    if (!start.name || !end.name) return null

    const indexStart = coco_body_keypoints.indexOf(start.name)
    const indexEnd = coco_body_keypoints.indexOf(end.name)

    if (indexStart === -1 || indexEnd === -1) return null

    if (indexStart > indexEnd) return SearchColor(indexEnd, indexStart)
    else return SearchColor(indexStart, indexEnd)
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
    mesh.name = parent.name

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

function Joint(name: string) {
    const object = new THREE.Mesh(
        new THREE.SphereGeometry(JointRadius),
        new THREE.MeshBasicMaterial({ color: GetPresetColorOfJoint(name) })
    )
    object.name = name
    return object
}

function Torso(x: number, y: number, z: number) {
    const width = 30
    const height = 50

    let object = new THREE.Group()
    object.name = 'torso'

    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)

    const neck = Joint('neck')
    neck.translateY(height / 2 - 5)
    object.add(neck)

    const right_shoulder = Joint('right_shoulder')
    right_shoulder.translateX(-width / 2 - 2)
    right_shoulder.translateY(height / 2 - 5)

    const left_shoulder = Joint('left_shoulder')

    left_shoulder.translateX(width / 2 + 2)
    left_shoulder.translateY(height / 2 - 5)

    object.add(right_shoulder)
    object.add(left_shoulder)

    const right_hip = Joint('right_hip')

    right_hip.translateX(-width / 2 + 8)
    right_hip.translateY(-height / 2)

    const left_hip = Joint('left_hip')

    left_hip.translateX(width / 2 - 8)
    left_hip.translateY(-height / 2)

    CreateLink2(object, neck, right_hip)
    CreateLink2(object, neck, left_hip)
    CreateLink2(object, neck, right_shoulder)
    CreateLink2(object, neck, left_shoulder)

    object.add(right_hip)
    object.add(left_hip)

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

export function CreateTemplateBody(hand: Object3D) {
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

    right_hand.translateX(-0.4)
    right_hand.translateY(-22)
    right_hand.rotateY(Math.PI)
    right_hand.rotateZ(-Math.PI / 2)

    right_hand.scale.multiplyScalar(2.2)

    left_hand.scale.x = -1
    left_hand.translateX(0.4)
    left_hand.translateY(-22)
    left_hand.rotateY(Math.PI)
    left_hand.rotateZ(Math.PI / 2)
    left_hand.scale.multiplyScalar(2.2)

    right_elbow.add(right_hand)
    left_elbow.add(left_hand)

    templateBody = torso
}
