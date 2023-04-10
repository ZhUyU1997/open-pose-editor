import React, { useEffect, useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { PinLeftIcon } from '@radix-ui/react-icons'
import classes from './styles.module.css'
import Slider from '../Slider'
import { BodyEditor } from '../../editor'
import useForceUpdate from '../../hooks/useFoceUpdate'
import i18n from '../../i18n'
import { BodyControlor } from '../../body'

const { PopoverContent, IconButton, PopoverArrow, Input } = classes

const Slider2: React.FC<{
    type: 'int' | 'float' | undefined
    name: string
    range: [number, number]
    getValue(): number
    onChange?: (value: number) => void
    onValueCommit?: (value: number) => void
    forceUpdate: () => any
}> = ({
    type,
    name,
    range,
    getValue,
    onChange,
    onValueCommit,
    forceUpdate,
}) => {
    const value = getValue()
    const [inputValue, setInputValue] = useState(() =>
        type == 'int' ? value.toString() : getValue().toFixed(2)
    )

    useEffect(() => {
        setInputValue(type == 'int' ? value.toString() : getValue().toFixed(2))
    }, [value])

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
            }}
        >
            <div
                style={{
                    minWidth: 60,
                    maxWidth: 120,
                    // width:"max-content",
                    overflow: 'hidden',
                    color: 'gray',
                    fontSize: '70%',
                    marginInlineEnd: 10,
                    // whiteSpace: 'nowrap',
                    textAlign: 'end',
                    textOverflow: 'ellipsis',
                }}
            >
                {name}
            </div>
            <Slider
                key={name}
                range={range}
                value={getValue()}
                onValueChange={(value: number) => {
                    if (type == 'int') {
                        onChange?.(Math.round(value))
                    } else onChange?.(value)
                    forceUpdate()
                }}
                onValueCommit={onValueCommit}
                style={{
                    width: 150,
                }}
            ></Slider>
            <input
                className={Input}
                style={{
                    marginInlineStart: 10,
                    width: 60,
                    height: 20,
                    color: 'gray',
                    fontSize: '70%',
                }}
                value={inputValue}
                onChange={(event) => {
                    const value = event.target.value

                    setInputValue(value)
                }}
                onBlur={() => {
                    try {
                        let v = parseFloat(inputValue)
                        if (isNaN(v)) throw 'Is NaN'
                        v = Math.max(Math.min(v, range[1]), range[0])
                        console.log(v)
                        onChange?.(v)
                    } catch (error) {
                        console.log('invalid input')
                        setInputValue(value.toString())
                    }
                }}
            ></input>
        </div>
    )
}

function GetCameraParamControlor(editor: BodyEditor) {
    const CameraParamsInit = {
        OutputWidth: { type: 'int', range: [128, 3000], name: i18n.t('Width') },
        OutputHeight: {
            type: 'int',
            range: [128, 3000],
            name: i18n.t('Height'),
        },
        CameraNear: { range: [0.1, 2000], name: i18n.t('Camera Near') },
        CameraFar: { range: [0.1, 20000], name: i18n.t('Camera Far') },
        CameraFocalLength: {
            range: [0.1, 100],
            name: i18n.t('Camera Focal Length'),
        },
    } as const

    return Object.entries(
        CameraParamsInit as Record<
            keyof typeof CameraParamsInit,
            {
                type: 'int' | 'float' | undefined
                range: [number, number]
                name: string
            }
        >
    ).map(([paramName, { type, range, name }]) => {
        return {
            type,
            name,
            range,
            getValue() {
                const value = editor[paramName as keyof typeof CameraParamsInit]
                // webui exception in launch
                return isNaN(value) ? range[0] : value
            },
            onChange(value: number) {
                editor[paramName as keyof typeof CameraParamsInit] = value
            },
        }
    })
}

function GetBodyParamControlor(editor: BodyEditor) {
    const BodyParamsInit = {
        BoneThickness: { range: [0.1, 3], name: i18n.t('Bone Thickness') },
        HeadSize: { range: [0.1, 100], name: i18n.t('Head Size') },
        NoseToNeck: { range: [0.1, 100], name: i18n.t('Nose To Neck') },
        ShoulderWidth: { range: [0.1, 100], name: i18n.t('Shoulder Width') },
        ShoulderToHip: { range: [0.1, 100], name: i18n.t('Shoulder To Hip') },
        ArmLength: { range: [0.1, 100], name: i18n.t('Arm Length') },
        Forearm: { range: [0.1, 100], name: i18n.t('Forearm') },
        UpperArm: { range: [0.1, 100], name: i18n.t('Upper Arm') },
        HandSize: { range: [0.1, 10], name: i18n.t('Hand Size') },
        Hips: { range: [0.1, 100], name: i18n.t('Hips') },
        LegLength: { range: [0.1, 100], name: i18n.t('Leg Length') },
        Thigh: { range: [0.1, 100], name: i18n.t('Thigh') },
        LowerLeg: { range: [0.1, 100], name: i18n.t('Lower Leg') },
        FootSize: { range: [0.1, 10], name: i18n.t('Foot Size') },
    } as const

    function PushExecuteBodyParamsCommand(
        editor: BodyEditor,
        controlor: BodyControlor,
        name: keyof typeof BodyParamsInit,
        oldValue: number,
        value: number
    ) {
        console.log(oldValue, value)
        const cmd = {
            execute: () => {
                controlor[name] = value
                controlor.Update()
            },
            undo: () => {
                controlor[name] = oldValue
                controlor.Update()
            },
        }
        cmd.execute()
        editor.pushCommand(cmd)
    }

    let currentBody = editor.getSelectedBody()
    let currentControlor: BodyControlor | null = currentBody
        ? new BodyControlor(currentBody)
        : null

    const getCurrentControlor = () => {
        const body = editor.getSelectedBody()

        if (body !== currentBody) {
            currentBody = body
            currentControlor = body ? new BodyControlor(body) : null
        }

        return currentControlor
    }

    let oldValue = 0
    let changing = false

    return Object.entries(
        BodyParamsInit as Record<
            keyof typeof BodyParamsInit,
            {
                type: 'int' | 'float' | undefined
                range: [number, number]
                name: string
            }
        >
    ).map(([_paramName, { type, range, name }]) => {
        return {
            type,
            name,
            range,
            getValue: () => {
                const paramName = _paramName as keyof typeof BodyParamsInit
                const controlor = getCurrentControlor()
                if (controlor) {
                    return controlor[paramName]
                }
                return -1
            },
            onChange(value: number) {
                const paramName = _paramName as keyof typeof BodyParamsInit
                const controlor = getCurrentControlor()

                if (controlor) {
                    // the first time
                    if (changing == false) oldValue = controlor[paramName]
                    changing = true
                    controlor[paramName] = value
                }
            },
            onValueCommit(value: number) {
                const paramName = _paramName as keyof typeof BodyParamsInit
                const controlor = getCurrentControlor()

                if (controlor) {
                    changing = false
                    PushExecuteBodyParamsCommand(
                        editor,
                        controlor,
                        paramName,
                        oldValue,
                        value
                    )
                    controlor[paramName] = value
                }
            },
        }
    })
}

const ControlorPopover: React.FC<{
    editor: BodyEditor
    style?: React.CSSProperties
}> = ({ editor, style }) => {
    const forceUpdate = useForceUpdate()
    const [open, setOpen] = useState(true)

    const cameraParamControlor = useMemo(() => {
        return GetCameraParamControlor(editor)
    }, [editor])
    const bodyParamControlor = useMemo(() => {
        return GetBodyParamControlor(editor)
    }, [editor])

    const [bodySelected, setBodySelected] = useState(false)
    useEffect(() => {
        const select = () => {
            setBodySelected(true)
        }
        const unselect = () => {
            setBodySelected(false)
        }
        editor.SelectEventManager.AddEventListener(select)
        editor.UnselectEventManager.AddEventListener(unselect)

        return () => {
            editor.SelectEventManager.RemoveEventListener(select)
            editor.UnselectEventManager.RemoveEventListener(unselect)
        }
    }, [editor])
    return (
        <Popover.Root open={open}>
            <Popover.Trigger asChild>
                <button
                    className={IconButton}
                    style={style}
                    onClick={() => setOpen((v) => !v)}
                >
                    <PinLeftIcon />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className={PopoverContent} sideOffset={5}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        {cameraParamControlor.map((props, index) => (
                            <Slider2
                                key={index}
                                {...props}
                                forceUpdate={forceUpdate}
                            ></Slider2>
                        ))}
                        {bodySelected ? (
                            <>
                                <div
                                    style={{
                                        fontSize: 15,
                                        marginTop: 10,
                                        marginBottom: 8,
                                    }}
                                >
                                    {i18n.t('Body Parameters')}
                                </div>
                                {bodyParamControlor.map((props, index) => (
                                    <Slider2
                                        key={index}
                                        {...props}
                                        forceUpdate={forceUpdate}
                                    ></Slider2>
                                ))}
                            </>
                        ) : undefined}
                    </div>
                    <Popover.Arrow className={PopoverArrow} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default ControlorPopover
