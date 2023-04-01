// https://github.com/Volune/use-event-callback/blob/master/src/index.ts

import { useLayoutEffect, useMemo, useRef } from 'react'

type Fn<ARGS extends any[], R> = (...args: ARGS) => R

const useEventCallback = <A extends any[], R>(fn: Fn<A, R>): Fn<A, R> => {
    const ref = useRef<Fn<A, R>>(fn)
    useLayoutEffect(() => {
        ref.current = fn
    })
    return useMemo(
        () =>
            (...args: A): R => {
                const { current } = ref
                return current(...args)
            },
        []
    )
}

export default useEventCallback
