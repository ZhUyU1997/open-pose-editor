import React, { useEffect, useMemo, useState } from 'react'
import * as Menubar from '@radix-ui/react-menubar'
import { CheckIcon, DotFilledIcon } from '@radix-ui/react-icons'

import classes from './styles.module.css'
import { BodyEditor } from '../../editor'
import i18n, { IsChina } from '../../i18n'
import { Helper } from '../../environments/online/helper'
import { uploadImage } from '../../utils/transfer'
import { getCurrentTime } from '../../utils/time'
import useForceUpdate from '../../hooks/useFoceUpdate'
import classNames from 'classnames'
import { useLanguageSelect } from '../../hooks'
import { ShowContextMenu } from '../ContextMenu'
import { ShowDialog } from '../Dialog'
import { SetCDNBase } from '../../utils/detect'

const {
    MenubarRoot,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarCheckboxItem,
    MenubarRadioItem,
    MenubarItemIndicator,
    MenubarSeparator,
    RightSlot,
    Blue,
    inset,
} = classes
const MenubarDemo: React.FC<{
    editor: BodyEditor
    onChangeBackground: (url: string) => void
    onScreenShot: (data: Record<string, { src: string; title: string }>) => void
    style?: React.CSSProperties
}> = ({ editor, onChangeBackground, onScreenShot, style }) => {
    const forceUpdate = useForceUpdate()
    const helper = useMemo(() => new Helper(editor), [editor])
    const { current, changeLanguage, languagList } = useLanguageSelect()

    useEffect(() => {
        const show = (data: { mouseX: number; mouseY: number }) => {
            ShowContextMenu({ ...data, editor, onChangeBackground })
        }
        editor?.ContextMenuEventManager.AddEventListener(show)
        return () => {
            editor?.ContextMenuEventManager.RemoveEventListener(show)
        }
    }, [editor])

    return (
        <Menubar.Root className={MenubarRoot} style={style}>
            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    {i18n.t('File')}
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-3}
                    >
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.ResetScene()}
                        >
                            {i18n.t('Reset Scene')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.LoadScene()}
                        >
                            {i18n.t('Load Scene')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.SaveScene()}
                        >
                            {i18n.t('Save Scene')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => helper.LoadGesture()}
                        >
                            {i18n.t('Load Gesture')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => helper.SaveGesture()}
                        >
                            {i18n.t('Save Gesture')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => {
                                helper.GenerateSceneURL()
                            }}
                        >
                            {i18n.t('Generate Scene URL')}
                        </Menubar.Item>
                        <Menubar.Separator className={MenubarSeparator} />
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.RestoreLastSavedScene()}
                        >
                            {i18n.t('Restore Last Scene')}
                        </Menubar.Item>
                        <Menubar.Separator className={MenubarSeparator} />
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() =>
                                helper.DetectFromImage(onChangeBackground)
                            }
                        >
                            {i18n.t('Detect From Image')}
                        </Menubar.Item>
                        {IsChina() ? (
                            <Menubar.Item
                                className={MenubarItem}
                                onSelect={() => {
                                    SetCDNBase(false)
                                    helper.DetectFromImage(onChangeBackground)
                                }}
                            >
                                {i18n.t('Detect From Image') + ' [中国]'}
                            </Menubar.Item>
                        ) : undefined}
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => helper.SetRandomPose()}
                        >
                            {i18n.t('Set Random Pose')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={async () => {
                                const image = await uploadImage()
                                if (image) onChangeBackground(image)
                            }}
                        >
                            {i18n.t('Set Background Image')}
                        </Menubar.Item>
                        <Menubar.Item className={MenubarItem}>
                            v{__APP_VERSION__}
                        </Menubar.Item>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    {i18n.t('Edit')}
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-3}
                    >
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.Undo()}
                        >
                            {i18n.t('Undo')}
                            <div className={RightSlot}>⌘ Z</div>
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.Redo()}
                        >
                            {i18n.t('Redo')}
                            <div className={RightSlot}>⇧ ⌘ Z</div>
                        </Menubar.Item>
                        <Menubar.Separator className={MenubarSeparator} />
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.CopySelectedBody()}
                        >
                            {i18n.t('Duplicate Skeleton')}
                            <div className={RightSlot}>⇧ D</div>
                        </Menubar.Item>
                        <Menubar.Item
                            className={MenubarItem}
                            onSelect={() => editor.RemoveBody()}
                        >
                            {i18n.t('Delete Skeleton')}
                            <div className={RightSlot}>{i18n.t('Del')}</div>
                        </Menubar.Item>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    {i18n.t('View')}
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-14}
                    >
                        <Menubar.Item
                            className={classNames(MenubarItem, inset)}
                            onSelect={() => {
                                editor.LockView()
                            }}
                        >
                            {i18n.t('Lock View')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={classNames(MenubarItem, inset)}
                            onSelect={() => {
                                editor.UnlockView()
                            }}
                        >
                            {i18n.t('Unlock View')}
                        </Menubar.Item>
                        <Menubar.Item
                            className={classNames(MenubarItem, inset)}
                            onSelect={() => {
                                editor.RestoreView()
                            }}
                        >
                            {i18n.t('Restore View')}
                        </Menubar.Item>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    {i18n.t('Setting')}
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-14}
                    >
                        <Menubar.CheckboxItem
                            className={classNames(MenubarCheckboxItem, inset)}
                            checked={editor.MoveMode}
                            onCheckedChange={() => {
                                editor.MoveMode = !editor.MoveMode
                                forceUpdate()
                            }}
                        >
                            <Menubar.ItemIndicator
                                className={MenubarItemIndicator}
                            >
                                <CheckIcon />
                            </Menubar.ItemIndicator>
                            {i18n.t('Move Mode')}
                        </Menubar.CheckboxItem>
                        <Menubar.CheckboxItem
                            className={classNames(MenubarCheckboxItem, inset)}
                            checked={editor.FreeMode}
                            onCheckedChange={() => {
                                editor.FreeMode = !editor.FreeMode
                                forceUpdate()
                            }}
                        >
                            <Menubar.ItemIndicator
                                className={MenubarItemIndicator}
                            >
                                <CheckIcon />
                            </Menubar.ItemIndicator>
                            {i18n.t('Free Mode')}
                        </Menubar.CheckboxItem>
                        <Menubar.CheckboxItem
                            className={classNames(MenubarCheckboxItem, inset)}
                            checked={editor.OnlyHand}
                            onCheckedChange={() => {
                                editor.OnlyHand = !editor.OnlyHand
                                forceUpdate()
                            }}
                        >
                            <Menubar.ItemIndicator
                                className={MenubarItemIndicator}
                            >
                                <CheckIcon />
                            </Menubar.ItemIndicator>
                            {i18n.t('Only Hand')}
                        </Menubar.CheckboxItem>
                        <Menubar.CheckboxItem
                            className={classNames(MenubarCheckboxItem, inset)}
                            checked={editor.enablePreview}
                            onCheckedChange={() => {
                                editor.enablePreview = !editor.enablePreview
                                forceUpdate()
                            }}
                        >
                            <Menubar.ItemIndicator
                                className={MenubarItemIndicator}
                            >
                                <CheckIcon />
                            </Menubar.ItemIndicator>
                            {i18n.t('Show Preview')}
                        </Menubar.CheckboxItem>
                        <Menubar.CheckboxItem
                            className={classNames(MenubarCheckboxItem, inset)}
                            checked={editor.EnableHelper}
                            onCheckedChange={() => {
                                editor.EnableHelper = !editor.EnableHelper
                                forceUpdate()
                            }}
                        >
                            <Menubar.ItemIndicator
                                className={MenubarItemIndicator}
                            >
                                <CheckIcon />
                            </Menubar.ItemIndicator>
                            {i18n.t('Show Grid')}
                        </Menubar.CheckboxItem>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    {i18n.t('Feedback')}
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-14}
                    >
                        <Menubar.Item
                            className={classNames(MenubarItem, inset)}
                            onSelect={() => {
                                helper.FeedbackByGithub()
                            }}
                        >
                            Github
                        </Menubar.Item>
                        <Menubar.Item
                            className={classNames(MenubarItem, inset)}
                            onSelect={() => {
                                helper.FeedbackByQQ()
                            }}
                        >
                            QQ
                        </Menubar.Item>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
                <Menubar.Trigger className={MenubarTrigger}>
                    Language
                </Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content
                        className={MenubarContent}
                        align="start"
                        sideOffset={5}
                        alignOffset={-14}
                    >
                        <Menubar.RadioGroup
                            value={current}
                            onValueChange={(v) => {
                                changeLanguage(v)
                            }}
                        >
                            {languagList.map((item) => (
                                <Menubar.RadioItem
                                    className={classNames(
                                        MenubarRadioItem,
                                        inset
                                    )}
                                    key={item}
                                    value={item}
                                >
                                    <Menubar.ItemIndicator
                                        className={MenubarItemIndicator}
                                    >
                                        <DotFilledIcon />
                                    </Menubar.ItemIndicator>
                                    {item}
                                </Menubar.RadioItem>
                            ))}
                        </Menubar.RadioGroup>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
                <Menubar.Trigger
                    className={classNames(MenubarTrigger, Blue)}
                    onClick={async () => {
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
                >
                    {i18n.t('Generate')}
                </Menubar.Trigger>
            </Menubar.Menu>
        </Menubar.Root>
    )
}

export default MenubarDemo
