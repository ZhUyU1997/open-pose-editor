import { IPostMessage as IPostMessageBase } from '../../../hooks/useMessageDispatch'

export type IPostMessage = IPostMessageBase & {
    cmd: string
}

const poseMessage = (message: IPostMessage) => {
    const iframe =
        gradioApp().querySelector<HTMLIFrameElement>('#openpose3d_iframe')!
    iframe.contentWindow!.postMessage(message, '*')
}

const MessageReturnHandler: Record<string, (arg: any) => void> = {}
const MessageEventHandler: Record<string, (arg: any) => void> = {}

export const InitMessageListener = () => {
    window.addEventListener('message', (event: MessageEvent<IPostMessage>) => {
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
}

export const AddMessageEventListener = (
    listeners: Record<string, (arg: any) => void>
) => {
    Object.assign(MessageEventHandler, listeners)
}

export function InvokeCommand(method: string, ...args: any[]) {
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
            cmd: 'openpose-3d',
            method,
            type: 'call',
            payload: args,
        })
    })
}
