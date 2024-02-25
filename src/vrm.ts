import * as THREE from 'three'
import { Object3D } from 'three'
import { JointUtils } from './body'
import { VRMModelObject } from './models'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import { PartIndexMappingOfBlazePoseModel } from './defines'
import { TupleToUnion } from 'type-fest'

export function CloneVRMModel() {
    if (VRMModelObject) return SkeletonUtils.clone(VRMModelObject)
}

const pickableObjectNames = [
    'J_Bip_L_Shoulder',
    'J_Bip_L_UpperArm',
    // 'J_Sec_L_TopsUpperArmInside',
    // 'J_Sec_L_TopsUpperArmOutside',
    'J_Bip_L_LowerArm',
    'J_Bip_L_Hand',
    'J_Bip_L_Index1',
    'J_Bip_L_Index2',
    'J_Bip_L_Index3',
    'J_Bip_L_Little1',
    'J_Bip_L_Little2',
    'J_Bip_L_Little3',
    'J_Bip_L_Middle1',
    'J_Bip_L_Middle2',
    'J_Bip_L_Middle3',
    'J_Bip_L_Ring1',
    'J_Bip_L_Ring2',
    'J_Bip_L_Ring3',
    'J_Bip_L_Thumb1',
    'J_Bip_L_Thumb2',
    'J_Bip_L_Thumb3',
    'J_Bip_R_Shoulder',
    'J_Bip_R_UpperArm',
    // 'J_Sec_R_TopsUpperArmInside',
    // 'J_Sec_R_TopsUpperArmOutside',
    'J_Bip_R_LowerArm',
    'J_Bip_R_Hand',
    'J_Bip_R_Index1',
    'J_Bip_R_Index2',
    'J_Bip_R_Index3',
    'J_Bip_R_Little1',
    'J_Bip_R_Little2',
    'J_Bip_R_Little3',
    'J_Bip_R_Middle1',
    'J_Bip_R_Middle2',
    'J_Bip_R_Middle3',
    'J_Bip_R_Ring1',
    'J_Bip_R_Ring2',
    'J_Bip_R_Ring3',
    'J_Bip_R_Thumb1',
    'J_Bip_R_Thumb2',
    'J_Bip_R_Thumb3',
    'J_Bip_L_UpperLeg',
    // 'J_Sec_L_TopsUpperLegBack',
    // 'J_Sec_L_TopsUpperLegFront',
    // 'J_Sec_L_TopsUpperLegSide',
    'J_Bip_L_LowerLeg',
    'J_Bip_L_Foot',
    'J_Bip_L_ToeBase',
    'J_Bip_R_UpperLeg',
    // 'J_Sec_R_TopsUpperLegBack',
    // 'J_Sec_R_TopsUpperLegFront',
    // 'J_Sec_R_TopsUpperLegSide',
    'J_Bip_R_LowerLeg',
    'J_Bip_R_Foot',
    'J_Bip_R_ToeBase',
    'J_Bip_C_Hips',
]

export function IsVRMPickable(name: string, isFreeMode = false) {
    return false
}

class VRMJointUtls implements JointUtils {
    IsSkeleton(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsExtremities(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsPickable(name: string, isFreeMode: boolean = false): boolean {
        if (pickableObjectNames.includes(name)) return true
        return false
    }
    IsTranslate(name: string, isFreeMode: boolean): boolean {
        return false
    }
    IsTarget(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsHand(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsFoot(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsMask(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsBone(name: string): boolean {
        throw new Error('Method not implemented.')
    }
    IsNeedSaveObject(name: string): boolean {
        throw new Error('Method not implemented.')
    }
}

export const vrmJointUtls = new VRMJointUtls()

const ControlablePart = [
    'J_Bip_C_Hips',

    'J_Bip_L_Shoulder',
    'J_Bip_L_UpperArm',
    'J_Bip_L_LowerArm',
    'J_Bip_L_Hand',
    'J_Bip_L_UpperLeg',
    'J_Bip_L_LowerLeg',
    'J_Bip_L_Foot',
    'J_Bip_L_ToeBase',
    'J_Bip_R_Shoulder',
    'J_Bip_R_UpperArm',
    'J_Bip_R_LowerArm',
    'J_Bip_R_Hand',
    'J_Bip_R_UpperLeg',
    'J_Bip_R_LowerLeg',
    'J_Bip_R_Foot',
    'J_Bip_R_ToeBase',
] as const
type ControlPartName = TupleToUnion<typeof ControlablePart>

export class VRMBodyControlor {
    body: Object3D
    part: Record<ControlPartName, Object3D> = {} as any

    constructor(o: Object3D) {
        this.body = o
        this.body.traverse((o) => {
            if (ControlablePart.includes(o.name as ControlPartName)) {
                console.log('ControlablePart', o.name, o)
                this.part[o.name as ControlPartName] = o
            }
        })
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

    rotateSelf(name: ControlPartName, dir: THREE.Vector3) {
        const obj = this.part[name]
        const unit = obj.position.clone().normalize()
        const axis = unit.clone().cross(dir)
        const angle = unit.clone().angleTo(dir)
        obj.rotateOnAxis(axis.normalize(), angle)
    }

    rotateTo(name: ControlPartName, dir: THREE.Vector3) {
        const obj = this.part[name]
        const unit = obj.position.clone().normalize()
        const axis = unit.clone().cross(dir)
        const angle = unit.clone().angleTo(dir)
        obj.parent?.rotateOnAxis(axis.normalize(), angle)
    }

    rotateSelf3(name: ControlPartName, from: THREE.Vector3, to: THREE.Vector3) {
        this.rotateSelf(name, this.getDirectionVectorByParentOf(name, from, to))
    }

    rotateTo3(name: ControlPartName, from: THREE.Vector3, to: THREE.Vector3) {
        this.rotateTo(name, this.getDirectionVectorByParentOf(name, from, to))
    }

    getMidpoint(from: THREE.Vector3, to: THREE.Vector3) {
        return from.clone().add(to).multiplyScalar(0.5)
    }

    SetBlazePose(rawData: [number, number, number][]) {
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

        const map: [
            ControlPartName,
            [
                THREE.Vector3 | keyof typeof PartIndexMappingOfBlazePoseModel,
                THREE.Vector3 | keyof typeof PartIndexMappingOfBlazePoseModel
            ]
        ][] = [
            ['J_Bip_L_LowerArm', ['left_shoulder', 'left_elbow']],
            ['J_Bip_L_Hand', ['left_elbow', 'left_wrist']],

            ['J_Bip_L_LowerLeg', ['left_hip', 'left_knee']],
            ['J_Bip_L_Foot', ['left_knee', 'left_ankle']],
            ['J_Bip_L_ToeBase', ['left_ankle', 'left_heel']],

            ['J_Bip_R_LowerArm', ['right_shoulder', 'right_elbow']],
            ['J_Bip_R_Hand', ['right_elbow', 'right_wrist']],

            ['J_Bip_R_LowerLeg', ['right_hip', 'right_knee']],
            ['J_Bip_R_Foot', ['right_knee', 'right_ankle']],
            ['J_Bip_R_ToeBase', ['right_ankle', 'right_heel']],
        ]

        for (const [name, [from, to]] of map) {
            this.rotateTo3(
                name,
                from instanceof THREE.Vector3 ? from : data[from],
                to instanceof THREE.Vector3 ? to : data[to]
            )
        }
    }
}
