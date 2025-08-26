'use client'

import { debounce } from '@/lib/utils'
import { useLayoutEffect, useState } from 'react'

type DimensionsType = {
    width: number
    height: number
    isDesktop: boolean
    isMobile: boolean
    isTablet: boolean
}

const dimensionsInit = {
    height: 0,
    width: 0,
    isDesktop: false,
    isMobile: false,
    isTablet: false,
}

export default function useDimensions() {
    const [dimensions, setDimensions] = useState<DimensionsType>(dimensionsInit)

    useLayoutEffect(() => {
        const updateDimensions = function () {
            const { innerWidth, innerHeight } = window
            const isDesktop = innerWidth > 1024
            const isMobile = innerWidth < 768
            const isTablet = innerWidth >= 768 && innerWidth < 1024
            
            setDimensions((prev) => {
                // Only update if dimensions actually changed
                if (prev.width === innerWidth && prev.height === innerHeight) {
                    return prev
                }
                return { width: innerWidth, height: innerHeight, isDesktop, isMobile, isTablet }
            })
        }

        const debouncedUpdate = debounce(updateDimensions, 100)
        updateDimensions()

        window.addEventListener('resize', debouncedUpdate)
        return () => {
            window.removeEventListener('resize', debouncedUpdate)
        }
    }, [])

    return dimensions
}
