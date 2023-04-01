import React, { useCallback, useEffect, useRef, useState } from 'react'
import { download } from '../../utils/transfer'
import classes from './App.module.css'
import Menu from '../../components/Menu'
import PopupOver from '../../components/PopupOver'
import { useBodyEditor } from '../../hooks'
import {
    LockClosedIcon,
    LockOpen2Icon,
    ResetIcon,
    ResumeIcon,
} from '@radix-ui/react-icons'
import { getCurrentTime } from '../../utils/time'
import useMessageDispatch from '../../hooks/useMessageDispatch'

const { app, threejsCanvas, gallery, background } = classes

const PreviewImage: React.FC<{
    previewImage: string
    isLock: boolean
    onChange: (isLock: boolean) => void
    onRestore: () => void
    onRun: () => void
}> = ({ previewImage, isLock, onChange, onRestore, onRun }) => {
    const Icon = isLock ? LockClosedIcon : LockOpen2Icon
    return (
        <div
            style={{
                position: 'relative',
            }}
        >
            <img
                src={previewImage}
                style={{
                    objectFit: 'contain',
                    width: 'unset',
                    // height:"unset",
                    maxWidth: 300,
                }}
            ></img>
            <ResumeIcon
                style={{
                    position: 'absolute',
                    top: -10,
                    right: 5,
                    backgroundColor: 'white',
                    borderRadius: 10,
                    padding: 5,
                }}
                onClick={() => {
                    onRun()
                }}
            ></ResumeIcon>
            <Icon
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 5,
                    backgroundColor: 'white',
                    borderRadius: 10,
                    padding: 5,
                }}
                onClick={() => {
                    onChange(!isLock)
                }}
            ></Icon>

            <ResetIcon
                style={{
                    position: 'absolute',
                    top: 50,
                    right: 5,
                    backgroundColor: !isLock ? 'gray' : 'white',
                    borderRadius: 10,
                    padding: 5,
                }}
                onClick={() => {
                    if (isLock) onRestore()
                }}
            ></ResetIcon>
        </div>
    )
}

function App() {
    const canvasRef = useRef(null)
    const backgroundRef = useRef<HTMLDivElement>(null)
    const editor = useBodyEditor(canvasRef, backgroundRef)
    const [imageData, setImageData] = useState<
        Record<string, { title: string; src: string }>
    >(() => ({
        pose: {
            title: '',
            src: '',
        },
        depth: {
            title: '',
            src: '',
        },
        normal: {
            title: '',
            src: '',
        },
        canny: {
            title: '',
            src: '',
        },
    }))

    const onChangeBackground = useCallback((url: string) => {
        const div = backgroundRef.current
        if (div) {
            div.style.backgroundImage = url ? `url(${url})` : 'none'
        }
    }, [])

    const onScreenShot = useCallback(
        (data: Record<string, { src: string; title: string }>) => {
            setImageData(data)
        },
        []
    )

    const [previewImage, setPreivewImage] = useState('')
    const [lockView, setLockView] = useState(false)

    useEffect(() => {
        const preview = (url: string) => {
            setPreivewImage(url)
        }

        const lcokView = (value: boolean) => {
            setLockView(value)
        }
        editor?.PreviewEventManager.AddEventListener(preview)
        editor?.LockViewEventManager.AddEventListener(lcokView)

        return () => {
            editor?.PreviewEventManager.RemoveEventListener(preview)
            editor?.LockViewEventManager.RemoveEventListener(lcokView)
        }
    }, [editor])

    useMessageDispatch({
        GetAppVersion: () => __APP_VERSION__,
        MakeImages: () => editor?.MakeImages(),
        Pause: () => editor?.pause(),
        Resume: () => editor?.resume(),
        OutputWidth: (value: number) => {
            if (editor && typeof value === 'number') {
                editor.OutputWidth = value
                return true
            } else return false
        },
        OutputHeight: (value: number) => {
            if (editor && typeof value === 'number') {
                editor.OutputHeight = value
                return true
            } else return false
        },
        OnlyHand(value: boolean) {
            if (editor && typeof value === 'boolean') {
                editor.OnlyHand = value
                return true
            } else return false
        },
        MoveMode(value: boolean) {
            if (editor && typeof value === 'boolean') {
                editor.MoveMode = value
                return true
            } else return false
        },
        GetWidth: () => editor?.Width,
        GetHeight: () => editor?.Height,
        GetSceneData: () => editor?.GetSceneData(),
        LockView: () => editor?.LockView(),
        UnlockView: () => editor?.UnlockView(),
        RestoreView: () => editor?.RestoreView(),
    })

    return (
        <div ref={backgroundRef} className={background}>
            <canvas
                className={threejsCanvas}
                tabIndex={-1}
                ref={canvasRef}
                onContextMenu={(e) => {
                    e.preventDefault()
                }}
            ></canvas>
            <div className={gallery}>
                {previewImage !== '' ? (
                    <PreviewImage
                        previewImage={previewImage}
                        isLock={lockView}
                        onChange={(isLock) => {
                            if (isLock) {
                                editor?.LockView()
                            } else {
                                editor?.UnlockView()
                            }
                        }}
                        onRestore={() => {
                            editor?.RestoreView()
                        }}
                        onRun={async () => {
                            if (!editor) return
                            const image = editor.MakeImages()
                            const result = Object.fromEntries(
                                Object.entries(image).map(([name, imgData]) => [
                                    name,
                                    {
                                        src: imgData,
                                        title: name + '_' + getCurrentTime(),
                                    },
                                ])
                            )
                            onScreenShot(result)
                        }}
                    ></PreviewImage>
                ) : undefined}

                {Object.entries(imageData).map(([name, { src, title }]) => (
                    <img
                        key={name}
                        // avoid show error image
                        {...(src ? { src } : {})}
                        title={title}
                        onClick={(e) => {
                            const image = e.target as HTMLImageElement
                            const title = image?.getAttribute('title') ?? ''
                            const url = image?.getAttribute('src') ?? ''
                            download(url, title)
                        }}
                    ></img>
                ))}
            </div>
            <div
                className={app}
                style={{
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        pointerEvents: 'initial',
                        marginTop: 10,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    {editor ? (
                        <Menu
                            editor={editor}
                            onChangeBackground={onChangeBackground}
                            onScreenShot={onScreenShot}
                        />
                    ) : undefined}
                </div>
            </div>
            {editor ? (
                <PopupOver
                    editor={editor}
                    style={{
                        pointerEvents: 'initial',
                        position: 'fixed',
                        top: 10,
                        right: 10,
                    }}
                ></PopupOver>
            ) : undefined}
        </div>
    )
}

export default App
