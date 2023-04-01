// https://github.com/rottitime/react-hook-window-message-event/blob/main/src/useMessage.ts

import { useCallback, useEffect, useRef, useState } from 'react'
import useEventCallback from './useEventCall'

export type IPostMessage = {
    method: string
    type: 'call' | 'return'
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

export default function useMessageDispatch(
    dispatch: Record<string, (...args: any[]) => any>
) {
    const originRef = useRef<string>()
    const sourceRef = useRef<MessageEvent['source']>(null)

    originRef.current = ''
    sourceRef.current = null as MessageEvent['source']

    const sendToSender = (data: IPostMessage) =>
        postMessage(data, sourceRef.current, originRef.current)

    const sendToParent = (data: IPostMessage) => {
        const { opener } = window
        if (!opener) throw new Error('Parent window has closed')
        postMessage(data, opener)
    }

    const onWatchEventHandler = useEventCallback(
        // tslint:disable-next-line: no-shadowed-variable
        ({ origin, source, data }: MessageEvent) => {
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
                    const ret = eventHandler(...(payload ?? []))
                    if (ret instanceof Promise) {
                        ret.then((value) => {
                            sendToSender({
                                method,
                                type: 'return',
                                payload: value,
                            })
                        })
                    } else {
                        sendToSender({
                            method,
                            type: 'return',
                            payload: ret,
                        })
                    }
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

    return { history, sendToParent }
}
