import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'
import classes from './styles.module.css'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { debounce } from 'lodash-es'
import classNames from 'classnames'

const {
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    Button,
    IconButton,
    green,
} = classes

const MyDialog = NiceModal.create<{
    title?: string
    description?: string
    children?: React.ReactNode
    button?: string
}>(({ title, description, children, button }) => {
    const modal = useModal()
    return (
        <Dialog.Root
            defaultOpen={true}
            open={modal.visible}
            onOpenChange={(value) => {
                if (value) modal.show()
                else modal.hide()
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className={DialogOverlay} />
                <Dialog.Content className={DialogContent}>
                    <Dialog.Title className={DialogTitle}>{title}</Dialog.Title>
                    <Dialog.Description className={DialogDescription}>
                        {description}
                    </Dialog.Description>
                    <div> {children}</div>
                    <div
                        style={{
                            display: 'flex',
                            marginTop: 25,
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Dialog.Close asChild>
                            <button
                                className={classNames(Button, green)}
                                onClick={() => {
                                    modal.resolve('action')
                                }}
                            >
                                {button}
                            </button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Close asChild>
                        <button className={IconButton}>
                            <Cross2Icon />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
})

declare type NiceModalArgs<T> = T extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any>
    ? Omit<React.ComponentProps<T>, 'id'>
    : Record<string, unknown>

export type ShowProps = NiceModalArgs<typeof MyDialog>

export function GetDialog(wait = 0) {
    const show = debounce((props: ShowProps) => {
        NiceModal.show(MyDialog, props)
    }, wait)

    return {
        show: (props: ShowProps) => {
            show(props)
        },
        hide: () => {
            show.cancel()
            HideDialog()
        },
    }
}

export async function ShowDialog(props: ShowProps): Promise<string> {
    console.log(props)
    return await NiceModal.show(MyDialog, props)
}

export function HideDialog() {
    return NiceModal.hide(MyDialog)
}
