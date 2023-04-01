export type IPostMessage = {
    method: string
    type: 'call' | 'return'
    payload: any
}

const iframe = document.getElementById('open-pose-editor') as HTMLIFrameElement

const poseMessage = (message: IPostMessage) => {
    iframe.contentWindow?.postMessage(message)
}

const MessageReturnHandler: Record<string, (arg: any) => void> = {}
const MessageEventHandler: Record<string, (arg: any) => void> = {}

window.addEventListener('message', (event) => {
    const { data } = event
    if (data && data.cmd && data.cmd == 'openpose-3d' && data.method) {
        const method = data.method
        console.log('Method', method, event)
        if (data.type == 'return') {
            MessageReturnHandler[method]?.(data.payload)
        } else if (data.type == 'event') {
            console.log(MessageEventHandler)
            MessageEventHandler[method]?.(data.payload)
        }
    }
})

function InvokeOnlineOpenPose3D(method: string, ...args: any[]) {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            delete MessageReturnHandler[method]

            reject({
                method,
                status: 'Timeout',
            })
        }, 1000)

        const onReutrn = (arg: any) => {
            clearTimeout(id)
            resolve(arg)
        }
        MessageReturnHandler[method] = onReutrn

        poseMessage({
            method,
            type: 'call',
            payload: args,
        })
    })
}
function CreateClick(name: string, ...args: any[]) {
    const ele = document.getElementById(name)

    ele?.addEventListener('click', async () => {
        console.log(name)
        const value = await InvokeOnlineOpenPose3D(name, ...args)
        console.log('return', value)
    })
}

MessageEventHandler['MakeImages'] = (arg) => {
    console.log('event', arg)
}

CreateClick('GetAPIs')
CreateClick('GetAppVersion')
CreateClick('MakeImages')
CreateClick('Pause')
CreateClick('Resume')
CreateClick('OutputWidth', 512)
CreateClick('OutputHeight', 512)
CreateClick('OnlyHand', true)
CreateClick('MoveMode', true)
CreateClick('GetWidth')
CreateClick('GetHeight')
CreateClick('GetSceneData')
CreateClick('LockView')
CreateClick('UnlockView')
CreateClick('RestoreView')
