import { useCallback, useRef, useState } from 'react'
import { download } from '../../utils/transfer'
import classes from './App.module.css'
import Menu from '../../components/Menu'
import PopupOver from '../../components/PopupOver'
import { useBodyEditor } from '../../hooks'

const { app, threejsCanvas, gallery, background } = classes

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

    return (
        <div ref={backgroundRef} className={background}>
            <canvas
                className={threejsCanvas}
                tabIndex={-1}
                ref={canvasRef}
            ></canvas>
            <div className={gallery}>
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
