// https://github.com/rottitime/react-hook-window-message-event/blob/main/src/useMessage.ts

import { useEffect, useRef } from 'react'
import useEventCallback from './useEventCall'

let SEND_TO_SENDER = false // Avoid duplicate event

export type IPostMessage = {
    method: string
    type: 'call' | 'return' | 'event'
    payload: any
}

export type EventHandler = (
    callback: (data: IPostMessage) => unknown,
    payload: IPostMessage['payload']
) => void

const postMessage = (
    data: IPostMessage & {
        cmd?: string // Just avoid webui exception
    },
    target: MessageEvent['source'],
    origin = '*'
) => {
    console.log('return', { target, origin, data })
    target?.postMessage(
        { cmd: 'openpose-3d', ...data },
        { targetOrigin: origin }
    )
}

export const sendToParent = (data: IPostMessage) => {
    if (SEND_TO_SENDER) return
    const { parent } = window
    if (!parent) throw new Error('Parent window has closed')
    postMessage(data, parent)
}

export const sendToParentDirectly = (data: IPostMessage) => {
    const { parent } = window
    if (!parent) throw new Error('Parent window has closed')
    postMessage(data, parent)
}

export const sendToOpener = (data: IPostMessage) => {
    const { opener } = window
    if (!opener) throw new Error('Opener window has closed')
    postMessage(data, opener)
}

export const sendToAll = (data: IPostMessage) => {
    if (SEND_TO_SENDER) return
    const { opener, parent } = window
    if (!opener && !parent) {
        throw new Error('window has closed')
    }
    if (parent) sendToParent(data)
    if (opener) sendToOpener(data)
}

export default function useMessageDispatch(
    dispatch: Record<string, (...args: any[]) => any>
) {
    const originRef = useRef<string>()
    const sourceRef = useRef<MessageEvent['source']>(null)

    originRef.current = ''
    sourceRef.current = null as MessageEvent['source']

    const sendToSender = (data: IPostMessage) =>
        postMessage(data, sourceRef.current, originRef.current)

    const onWatchEventHandler = useEventCallback(
        // tslint:disable-next-line: no-shadowed-variable
        async ({ origin, source, data }: MessageEvent) => {
            if (!data) return

            const { method, payload, type } = data as IPostMessage
            // It is invalid message, not from webui extension.
            if (type != 'call') return

            console.log('method', method, payload)

            if (payload && Array.isArray(payload) === false) {
                console.error('payload is not array')
                return
            }

            sourceRef.current = source
            originRef.current = origin

            if (method in dispatch) {
                const eventHandler = dispatch[method]
                if (typeof eventHandler === 'function') {
                    SEND_TO_SENDER = true
                    const ret = eventHandler(...(payload ?? []))
                    const value = ret instanceof Promise ? await ret : ret
                    try {
                        sendToSender({
                            method,
                            type: 'return',
                            payload: value,
                        })
                    } catch (error) {
                        console.log(error)
                    }
                    SEND_TO_SENDER = false
                }
            } else if (method === 'GetAPIs') {
                sendToSender({
                    method,
                    type: 'return',
                    payload: Object.keys(dispatch),
                })
            }
        }
    )

    useEffect(() => {
        window.addEventListener('message', onWatchEventHandler)
        return () => window.removeEventListener('message', onWatchEventHandler)
    }, [onWatchEventHandler])
}
