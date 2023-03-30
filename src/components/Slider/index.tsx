import React from 'react'
import * as Slider from '@radix-ui/react-slider'
import classes from './styles.module.css'

const { SliderRoot, SliderTrack, SliderRange } = classes
const SliderDemo: React.FC<{
    range: [number, number]
    value: number
    onValueChange?: (value: number) => void
    onValueCommit?: (value: number) => void
    style?: React.CSSProperties
}> = ({ range, value, onValueChange, onValueCommit, style }) => (
    <form
        style={{
            ...style,
        }}
    >
        <Slider.Root
            className={SliderRoot}
            value={[value]}
            min={range[0]}
            max={range[1]}
            step={(range[1] - range[0]) / 150.0}
            onValueChange={([value]: number[]) => {
                onValueChange?.(value)
            }}
            onValueCommit={([value]: number[]) => {
                onValueCommit?.(value)
            }}
        >
            <Slider.Track className={SliderTrack}>
                <Slider.Range className={SliderRange} />
            </Slider.Track>
        </Slider.Root>
    </form>
)

export default SliderDemo
