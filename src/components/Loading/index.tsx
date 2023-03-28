import React from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { debounce } from 'lodash-es'

import classes from './styles.module.css'

const {
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    'lds-roller': LdsRoller,
} = classes

function CSSLoading() {
    return (
        <div className={LdsRoller}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
}

const Loading = NiceModal.create<{ title: string }>(
    ({ title }: { title: string }) => {
        const modal = useLoading()
        return (
            <AlertDialog.Root defaultOpen={true} open={modal.visible}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className={AlertDialogOverlay} />
                    <AlertDialog.Content className={AlertDialogContent}>
                        <AlertDialog.Title className={AlertDialogTitle}>
                            <CSSLoading></CSSLoading>
                            {title}
                        </AlertDialog.Title>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        )
    }
)

export function useLoading() {
    return useModal(Loading)
}

declare type NiceModalArgs<T> = T extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any>
    ? Omit<React.ComponentProps<T>, 'id'>
    : Record<string, unknown>

export type ShowProps = NiceModalArgs<typeof Loading>

export function GetLoading(wait = 0) {
    const show = debounce((props: ShowProps) => {
        NiceModal.show(Loading, props)
    }, wait)

    return {
        show: (props: ShowProps) => {
            show(props)
        },
        hide: () => {
            show.cancel()
            HideLoading()
        },
    }
}

export function ShowLoading(props: ShowProps) {
    NiceModal.show(Loading, props)
}

export function HideLoading() {
    NiceModal.hide(Loading)
}
