import React from 'react'
import * as Toast from '@radix-ui/react-toast'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { debounce } from 'lodash-es'

import classes from './styles.module.css'
import classNames from 'classnames'

const {
    ToastViewport,
    ToastRoot,
    ToastTitle,
    ToastAction,
    Button,
    small,
    green,
} = classes

const MyToast = NiceModal.create<{
    title: string
    button?: string
    duration?: number
}>(({ title, button, duration = 3000 }) => {
    const modal = useToast()
    return (
        <Toast.Provider swipeDirection="right" duration={duration}>
            <Toast.Root
                className={ToastRoot}
                defaultOpen={true}
                open={modal.visible}
                onOpenChange={(open) => {
                    if (open == false) {
                        modal.hide()
                    }
                }}
            >
                <Toast.Title className={ToastTitle}>{title}</Toast.Title>
                {button ? (
                    <Toast.Action className={ToastAction} asChild altText="">
                        <button
                            className={classNames(Button, small, green)}
                            onClick={() => {
                                modal.resolve('action')
                                modal.hide()
                            }}
                        >
                            {button}
                        </button>
                    </Toast.Action>
                ) : undefined}
            </Toast.Root>
            <Toast.Viewport className={ToastViewport} />
        </Toast.Provider>
    )
})

export function useToast() {
    return useModal(MyToast)
}

declare type NiceModalArgs<T> = T extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any>
    ? Omit<React.ComponentProps<T>, 'id'>
    : Record<string, unknown>

export type ShowProps = NiceModalArgs<typeof MyToast>

export function GetToast(wait = 0) {
    const show = debounce((props: ShowProps) => {
        NiceModal.show(MyToast, props)
    }, wait)

    return {
        show: (props: ShowProps) => {
            show(props)
        },
        hide: () => {
            show.cancel()
            HideToast()
        },
    }
}

export async function ShowToast(props: ShowProps): Promise<string> {
    return await NiceModal.show(MyToast, props)
}

export function HideToast() {
    return NiceModal.hide(MyToast)
}
