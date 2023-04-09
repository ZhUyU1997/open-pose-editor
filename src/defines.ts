export const OpenposeyKeypointsConst = [
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

export const OpenposeKeypoints = OpenposeyKeypointsConst as unknown as string[]

export const ConnectKeypoints = [
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

export const ConnectColor = [
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

export function ToHexColor([r, g, b]: readonly [number, number, number]) {
    return (r << 16) + (g << 8) + b
}
function SearchColor(start: number, end: number) {
    const index = ConnectKeypoints.findIndex(
        ([s, e]) => s === start && e === end
    )

    if (typeof index !== 'undefined') {
        const [r, g, b] = ConnectColor[index]

        return (r << 16) + (g << 8) + b
    }
    return null
}

export function GetColorOfLinkByName(startName: string, endName: string) {
    if (!startName || !endName) return null

    const indexStart = OpenposeKeypoints.indexOf(startName)
    const indexEnd = OpenposeKeypoints.indexOf(endName)

    if (indexStart === -1 || indexEnd === -1) return null

    if (indexStart > indexEnd) return SearchColor(indexEnd, indexStart)
    else return SearchColor(indexStart, indexEnd)
}

export const BoneThickness = 1

export const PartIndexMappingOfPoseModel = {
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
