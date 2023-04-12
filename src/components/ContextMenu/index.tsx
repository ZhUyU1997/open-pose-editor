import React, { useMemo } from 'react'
import classes from './styles.module.css'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { debounce } from 'lodash-es'
import { BodyEditor } from '../../editor'
import i18n, { IsChina } from '../../i18n'
import { Helper } from '../../environments/online/helper'
import { SetCDNBase } from '../../utils/detect'

const { Root, ContextMenuContent, ContextMenuItem, RightSlot } = classes

const MyContextMenu = NiceModal.create<{
    editor: BodyEditor
    mouseX: number
    mouseY: number
    onChangeBackground: (url: string) => void
}>(({ editor, mouseX, mouseY, onChangeBackground }) => {
    const helper = useMemo(() => new Helper(editor), [editor])

    const modal = useModal()
    return (
        <div
            className={Root}
            style={{
                display: modal.visible ? undefined : 'none',
            }}
            onClick={() => {
                modal.hide()
            }}
            onContextMenu={(e) => {
                e.preventDefault()
            }}
        >
            <div
                className={ContextMenuContent}
                style={{
                    top: mouseY,
                    left: mouseX,
                }}
            >
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        editor.Undo()
                    }}
                >
                    {i18n.t('Undo')}
                    <div className={RightSlot}>⌘ Z</div>
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        editor.Redo()
                    }}
                >
                    {i18n.t('Redo')}
                    <div className={RightSlot}>⇧ ⌘ Z</div>
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        helper.CopySkeleton()
                    }}
                >
                    {i18n.t('Duplicate Skeleton')}
                    <div className={RightSlot}>⇧ D</div>
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        helper.RemoveSkeleton()
                    }}
                >
                    {i18n.t('Delete Skeleton')}
                    <div className={RightSlot}>{i18n.t('Del')}</div>
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        helper.CopyKeypointToClipboard()
                    }}
                >
                    {i18n.t('Copy Keypoint Data')}
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => {
                        helper.SetRandomPose()
                    }}
                >
                    {i18n.t('Set Random Pose')}
                </div>
                <div
                    className={ContextMenuItem}
                    onClick={() => helper.DetectFromImage(onChangeBackground)}
                >
                    {i18n.t('Detect From Image')}
                </div>
                {IsChina() ? (
                    <div
                        className={ContextMenuItem}
                        onClick={() => {
                            SetCDNBase(false)
                            helper.DetectFromImage(onChangeBackground)
                        }}
                    >
                        {i18n.t('Detect From Image') + ' [中国]'}
                    </div>
                ) : undefined}
            </div>
        </div>
    )
})

declare type NiceModalArgs<T> = T extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any>
    ? Omit<React.ComponentProps<T>, 'id'>
    : Record<string, unknown>

export type ShowProps = NiceModalArgs<typeof MyContextMenu>

export function GetContextMenu(wait = 0) {
    const show = debounce((props: ShowProps) => {
        NiceModal.show(MyContextMenu, props)
    }, wait)

    return {
        show: (props: ShowProps) => {
            show(props)
        },
        hide: () => {
            show.cancel()
            HideContextMenu()
        },
    }
}

export async function ShowContextMenu(props: ShowProps): Promise<string> {
    return await NiceModal.show(MyContextMenu, props)
}

export function HideContextMenu() {
    return NiceModal.hide(MyContextMenu)
}
