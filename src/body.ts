import * as THREE from 'three'
import { Bone, Object3D } from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import type { TupleToUnion } from 'type-fest'
import {
    FindObjectItem,
    GetLocalPosition,
    GetWorldPosition,
} from './utils/three-utils'
import { CCDIKSolver } from './utils/CCDIKSolver'
import {
    BoneThickness,
    ConnectColor,
    ToHexColor,
    GetColorOfLinkByName,
    OpenposeKeypoints,
    OpenposeyKeypointsConst,
    PartIndexMappingOfBlazePoseModel,
    PartIndexMappingOfPoseModel,
} from './defines'
import {
    ExtremitiesMapping,
    FootObject,
    HandObject,
    IsMatchBonePrefix,
} from './models'

function GetPresetColorOfJoint(name: string) {
    const index = OpenposeKeypoints.indexOf(name)
    return index !== -1 ? ToHexColor(ConnectColor[index]) : 0x0
}

function CreateLink(
    startObject: THREE.Object3D,
    startName: string,
    endName: string
) {
    const presetColor = GetColorOfLinkByName(startName, endName)
    const material = new THREE.MeshBasicMaterial({
        color: presetColor ?? 0x0,
        opacity: 0.6,
        transparent: true,
    })
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(BoneThickness),
        material
    )
    mesh.name = startName + '_link_' + endName
    startObject.add(mesh)
    return mesh
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
    thickness = BoneThickness,
    create = false
) {
    const startPosition = new THREE.Vector3(0, 0, 0)
    const endPostion = endObject.position
    const distance = startPosition.distanceTo(endPostion)
    // 将拉伸后的球体放在中点，并计算旋转轴和角度
    const origin = startPosition.clone().add(endPostion).multiplyScalar(0.5)

    // Another method
    //     new THREE.Quaternion().setFromUnitVectors(...)
    const v = endPostion.clone().sub(startPosition)
    const unit = new THREE.Vector3(1, 0, 0)
    const axis = unit.clone().cross(v)
    const angle = unit.clone().angleTo(v)
    const mesh = create
        ? CreateLink(startObject, startName, endName)
        : startObject.getObjectByName(startName + '_link_' + endName)!
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
    thickness = BoneThickness,
    create = false
) {
    UpdateLink4(
        startObject,
        endObject,
        startObject.name,
        endObject.name,
        thickness,
        create
    )
}

function CreateSphere(name: string, thickness: number, color: number) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(thickness),
        new THREE.MeshBasicMaterial({ color: color })
    )
    sphere.name = name
    return sphere
}

function CreateGroup(name: string, x = 0, y = 0, z = 0) {
    const object = new THREE.Group()
    object.name = name
    object.translateX(x)
    object.translateY(y)
    object.translateZ(z)
    return object
}

function CreateJoint(
    name: string,
    x = 0,
    y = 0,
    z = 0,
    thickness: number = BoneThickness
) {
    return CreateGroup(name, x, y, z).add(
        CreateSphere(
            name + '_joint_sphere',
            thickness,
            GetPresetColorOfJoint(name)
        )
    )
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

function CreateHand(name: 'right_hand' | 'left_hand') {
    if (!HandObject || !FootObject) {
        throw new Error('Failed to create body')
    }

    if (name === 'right_hand') {
        const right_hand = SkeletonUtils.clone(HandObject)

        right_hand.name = 'right_hand'
        right_hand.translateX(-0.4)
        right_hand.translateY(3)
        right_hand.rotateY(Math.PI)
        right_hand.rotateZ(-Math.PI / 2)

        right_hand.scale.multiplyScalar(HandScale)

        right_hand.traverse((o) => {
            if (IsBone(o.name)) {
                o.name = o.name + '_R'
            }
        })
        return right_hand
    } else {
        const left_hand = SkeletonUtils.clone(HandObject)

        left_hand.name = 'left_hand'
        left_hand.scale.x = -1
        left_hand.translateX(0.4)
        left_hand.translateY(3)
        left_hand.rotateY(Math.PI)
        left_hand.rotateZ(Math.PI / 2)
        left_hand.scale.multiplyScalar(HandScale)

        left_hand.traverse((o) => {
            if (IsBone(o.name)) {
                o.name = o.name + '_L'
            }
        })
        return left_hand
    }
}

function CreateFoot(name: 'right_foot' | 'left_foot') {
    if (!HandObject || !FootObject) {
        throw new Error('Failed to create body')
    }

    if (name === 'right_foot') {
        const right_foot = SkeletonUtils.clone(FootObject)

        right_foot.name = 'right_foot'
        right_foot.scale.setX(-1)
        right_foot.scale.multiplyScalar(FootScale)

        right_foot.traverse((o) => {
            if (IsBone(o.name)) {
                o.name = o.name + '_R'
            }
        })

        return right_foot
    } else {
        const left_foot = SkeletonUtils.clone(FootObject)
        left_foot.name = 'left_foot'
        left_foot.scale.multiplyScalar(FootScale)

        left_foot.traverse((o) => {
            if (IsBone(o.name)) {
                o.name = o.name + '_L'
            }
        })
        return left_foot
    }
}

export function CreateTemplateBody() {
    if (!HandObject || !FootObject) {
        throw new Error('Failed to create body')
    }
    const width = 34
    const height = 46

    const torso = CreateGroup('torso', 0, 115, 0).add(
        CreateSphere('center', BoneThickness, 0x888888),
        CreateGroup('five', 0, height / 2, 0).add(
            CreateJoint('neck').add(
                CreateJoint('nose', 0, 20, 14).add(
                    CreateJoint('right_eye', -3, 3, -3).add(
                        CreateJoint('right_ear', -4, -3, -8)
                    ),
                    CreateJoint('left_eye', 3, 3, -3).add(
                        CreateJoint('left_ear', 4, -3, -8)
                    )
                )
            ),
            CreateGroup('left_shoulder_inner').add(
                CreateJoint('right_shoulder', -width / 2, 0, 0).add(
                    CreateJoint('right_elbow', 0, -25, 0).add(
                        CreateJoint('right_wrist', 0, -25, 0).add(
                            CreateHand('right_hand')
                        )
                    )
                )
            ),
            CreateGroup('right_shoulder_inner').add(
                CreateJoint('left_shoulder', width / 2, 0, 0).add(
                    CreateJoint('left_elbow', 0, -25, 0).add(
                        CreateJoint('left_wrist', 0, -25, 0).add(
                            CreateHand('left_hand')
                        )
                    )
                )
            ),
            CreateGroup('right_hip_inner').add(
                CreateJoint('right_hip', -width / 2 + 7, -height, 0).add(
                    CreateJoint('right_knee', 0, -40, 0).add(
                        CreateJoint('right_ankle', 0, -36, 0).add(
                            CreateFoot('right_foot')
                        )
                    )
                )
            ),
            CreateGroup('left_hip_inner').add(
                CreateJoint('left_hip', width / 2 - 7, -height, 0).add(
                    CreateJoint('left_knee', 0, -40, 0).add(
                        CreateJoint('left_ankle', 0, -36, 0).add(
                            CreateFoot('left_foot')
                        )
                    )
                )
            )
        )
    )

    new BodyControlor(torso).Create()
    templateBody = torso
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
    if (OpenposeKeypoints.includes(name)) return true
    if (name === 'right_hand' || name === 'left_hand') return true
    if (name === 'right_foot' || name === 'left_foot') return true
    if (IsVirtualPoint(name)) return true // virtual point
    if (IsBone(name)) return true
    if (name.includes('_joint_sphere')) return true
    if (name.includes('_link_')) return true
    return false
}

export function IsBone(name: string) {
    return IsMatchBonePrefix(name)
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
    if (isFreeMode && OpenposeKeypoints.includes(name)) return true
    if (pickableObjectNames.includes(name)) return true
    if (IsBone(name)) return true
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

export function IsMask(name: string) {
    return ['foot_mask', 'hand_mask'].includes(name)
}

export function IsSkeleton(name: string) {
    if (name == 'torso') return true
    if (OpenposeKeypoints.includes(name)) return true
    if (IsVirtualPoint(name)) return true // virtual point
    if (name.includes('_joint_sphere')) return true
    if (name.includes('_link_')) return true
    return false
}

export function IsExtremities(name: string) {
    return ['left_hand', 'right_hand', 'left_foot', 'right_foot'].includes(name)
}

const ControlablePart = [
    ...OpenposeyKeypointsConst,
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

export interface BodyData {
    position?: ReturnType<THREE.Vector3['toArray']>
    rotation?: ReturnType<THREE.Euler['toArray']>
    scale?: ReturnType<THREE.Vector3['toArray']>

    child: Record<
        string,
        {
            position?: ReturnType<THREE.Vector3['toArray']>
            rotation?: ReturnType<THREE.Euler['toArray']>
            scale?: ReturnType<THREE.Vector3['toArray']>
        }
    >
}

export interface HandData {
    child: Record<
        string,
        {
            position?: ReturnType<THREE.Vector3['toArray']>
            rotation?: ReturnType<THREE.Euler['toArray']>
            scale?: ReturnType<THREE.Vector3['toArray']>
        }
    >
}

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

    UpdateLink(
        name: ControlPartName,
        thickness = this.BoneThickness,
        create = false
    ) {
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
                thickness,
                create
            )
        else if (name !== 'neck' && OpenposeKeypoints.includes(name)) {
            UpdateLink2(
                this.part[name].parent!,
                this.part[name],
                thickness,
                create
            )
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

    GetHandData(hand: 'left_hand' | 'right_hand'): HandData {
        const o = this.part[hand]
        const result: HandData = {
            child: {},
        }
        o.traverse((child) => {
            if (child.name && IsBone(child.name)) {
                if (child.name in result.child)
                    console.log('Duplicate name', child.name, child)
                const data: Pick<BodyData, 'position' | 'rotation' | 'scale'> =
                    {}

                if (
                    this.getDistanceOf(
                        child.position,
                        new THREE.Vector3(0, 0, 0)
                    ) != 0
                ) {
                    data.position = child.position.toArray()
                }

                if (
                    this.getDistanceOf(
                        child.scale,
                        new THREE.Vector3(1, 1, 1)
                    ) != 0
                ) {
                    data.scale = child.scale.toArray()
                }

                if (
                    child.rotation.x !== 0 ||
                    child.rotation.y !== 0 ||
                    child.rotation.z !== 0
                ) {
                    data.rotation = child.rotation.toArray()
                }
                if (data) result.child[child.name] = data
            }
        })

        return result
    }

    RestoreHand(hand: 'left_hand' | 'right_hand', data: HandData) {
        data.child = Object.fromEntries(
            Object.entries(data.child).map(([k, v]) => {
                if (hand == 'left_hand') return [k.replace('_R', '_L'), v]
                if (hand == 'right_hand') return [k.replace('_L', '_R'), v]
                return [k, v]
            })
        )
        this.part[hand]?.traverse((o) => {
            if (o.name && o.name in data.child) {
                const child = data.child[o.name]
                if (child.position) o.position.fromArray(child.position)
                if (child.rotation) o.rotation.fromArray(child.rotation as any)
                if (child.scale) o.scale.fromArray(child.scale)
            }
        })
    }

    GetBodyData(): BodyData {
        const o = this.part['torso']
        const result: BodyData = {
            position: o.position.toArray(),
            rotation: o.rotation.toArray(),
            scale: o.scale.toArray(),
            child: {},
        }
        o.traverse((child) => {
            if (child.name && IsNeedSaveObject(child.name)) {
                if (child.name in result.child)
                    console.log('Duplicate name', child.name, child)
                const data: Pick<BodyData, 'position' | 'rotation' | 'scale'> =
                    {}

                if (
                    this.getDistanceOf(
                        child.position,
                        new THREE.Vector3(0, 0, 0)
                    ) != 0
                ) {
                    data.position = child.position.toArray()
                }

                if (
                    this.getDistanceOf(
                        child.scale,
                        new THREE.Vector3(1, 1, 1)
                    ) != 0
                ) {
                    data.scale = child.scale.toArray()
                }

                if (
                    child.rotation.x !== 0 ||
                    child.rotation.y !== 0 ||
                    child.rotation.z !== 0
                ) {
                    data.rotation = child.rotation.toArray()
                }
                if (data) result.child[child.name] = data
            }
        })

        return result
    }

    RestoreBody(data: BodyData) {
        const body = this.part['torso']

        body?.traverse((o) => {
            if (o.name && o.name in data.child) {
                const child = data.child[o.name]
                if (child.position) o.position.fromArray(child.position)
                if (child.rotation) o.rotation.fromArray(child.rotation as any)
                if (child.scale) o.scale.fromArray(child.scale)
            }
        })
        if (data.position) body.position.fromArray(data.position)
        if (data.rotation) body.rotation.fromArray(data.rotation as any)
        if (data.scale) body.scale.fromArray(data.scale)
    }

    UpdateBones(thickness = this.BoneThickness) {
        this.part['torso'].traverse((o) => {
            if (o.name in this.part) {
                const name = o.name as ControlPartName
                this.UpdateLink(name, thickness)
            }
        })
    }

    CreateBones(thickness = this.BoneThickness) {
        this.part['torso'].traverse((o) => {
            if (o.name in this.part) {
                const name = o.name as ControlPartName
                this.UpdateLink(name, thickness, true)
            }
        })
    }

    Create() {
        this.CreateBones()

        this.part['torso'].add(
            CreateIKTarget(
                this.part['torso'],
                this.part['left_wrist'],
                'left_wrist_target'
            )
        )
        this.part['torso'].add(
            CreateIKTarget(
                this.part['torso'],
                this.part['right_wrist'],
                'right_wrist_target'
            )
        )
        this.part['torso'].add(
            CreateIKTarget(
                this.part['torso'],
                this.part['left_ankle'],
                'left_ankle_target'
            )
        )
        this.part['torso'].add(
            CreateIKTarget(
                this.part['torso'],
                this.part['right_ankle'],
                'right_ankle_target'
            )
        )
    }

    Get18keyPointsData(): Array<[number, number, number]> {
        return OpenposeKeypoints.map((name) => {
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
