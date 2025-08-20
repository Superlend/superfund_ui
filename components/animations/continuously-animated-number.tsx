'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { AnimatedNumber } from './animated_number'

interface ContinuouslyAnimatedNumberProps {
    targetValue: number
    isLoading?: boolean
    prefix?: string
    suffix?: string
    className?: string
    initialAnimationDuration?: number // in ms
    interimUpdateInterval?: number // in ms
    incrementAmount?: number
    maxDeviationPercent?: number
    formatValue?: (value: number) => string
}

export function ContinuouslyAnimatedNumber({
    targetValue,
    isLoading = false,
    prefix = '',
    suffix = '',
    className = '',
    initialAnimationDuration = 3000, // 3 seconds
    interimUpdateInterval = 500, // 500ms
    incrementAmount = 100, // +$100
    maxDeviationPercent = 1.5, // 1.5% max deviation
    formatValue = (value: number) =>
        value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
}: ContinuouslyAnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState<number>(0)
    const [isInitialAnimation, setIsInitialAnimation] = useState(true)
    const [overallDirection, setOverallDirection] = useState<
        'increment' | 'decrement' | 'auto'
    >('auto')
    const [previousFormattedValue, setPreviousFormattedValue] =
        useState<string>('')
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const animationRef = useRef<number | null>(null)
    const lastTargetValue = useRef<number>(0)
    const lastDisplayValue = useRef<number>(0)
    const hasInitialized = useRef(false)
    const startInterimAnimationRef = useRef<((target: number) => void) | null>(
        null
    )

    // Clear intervals and animations
    const clearAllTimers = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
    }, [])

    // Initial animation - only animate last 4-5 digits with throttled updates
    const startInitialAnimation = useCallback(
        (target: number) => {
            const startTime = Date.now()

            // Calculate the static part (first digits) and animated part (last 4-5 digits)
            // For a number like 1390604.55, we want to animate roughly the last 5 digits
            // So static: 1390000, animated: 604.55
            const animatedDigits = 3 // Last 3 whole number digits + decimals
            const staticPart = Math.floor(target / 1000) * 1000 // Keep thousands and above static
            const animatedPart = target - staticPart
            const startValue = staticPart // Start with static part, animate the remainder

            let lastUpdateTime = 0
                         const throttleInterval = 1300 // Update every 1300ms to match interim interval

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / initialAnimationDuration, 1)

                // Only update display value if enough time has passed (throttling)
                if (
                    elapsed - lastUpdateTime >= throttleInterval ||
                    progress >= 1
                ) {
                    lastUpdateTime = elapsed

                    // Much gentler easing function for very slow, visible animation
                    // Using a very slow exponential curve for maximum readability
                    const easeOutExpo =
                        progress === 1 ? 1 : 1 - Math.pow(2, -6 * progress)
                    const currentAnimatedValue = animatedPart * easeOutExpo
                    const currentValue = staticPart + currentAnimatedValue

                    // Update overall direction based on value change
                    if (currentValue > lastDisplayValue.current) {
                        setOverallDirection('increment')
                    } else if (currentValue < lastDisplayValue.current) {
                        setOverallDirection('decrement')
                    }

                    setDisplayValue(currentValue)
                    lastDisplayValue.current = currentValue
                }

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate)
                } else {
                    setIsInitialAnimation(false)
                    startInterimAnimationRef.current?.(target)
                }
            }

            animationRef.current = requestAnimationFrame(animate)
        },
        [initialAnimationDuration]
    )

    // Interim animation with mixed sequential pattern
    const startInterimAnimation = useCallback(
        (target: number) => {
            clearAllTimers()
            let sequenceStep = 0

            // Mixed sequential pattern that flows from hundreds to decimals
            const sequentialIncrements = [
                0.25, // Step 1: Quarter increment (affects decimals)
                0.75, // Step 2: Three-quarter increment (decimals + ones)
                1.5, // Step 3: Dollar fifty (ones + decimals)
                2.25, // Step 4: Mixed increment (multiple digits)
                1.0, // Step 5: Clean dollar (ones place)
                0.5, // Step 6: Half dollar (decimals)
                3.0, // Step 7: Three dollars (ones + tens)
                0.05, // Step 8: Nickel (fine decimals)
            ]

            intervalRef.current = setInterval(() => {
                setDisplayValue((prevValue) => {
                    const minIncrement = 0.01
                    const maxDeviation = target * (maxDeviationPercent / 100)
                    const upperBound = target + maxDeviation

                    // Calculate how much room we have left to increment
                    const remainingRoom = upperBound - prevValue

                    // If we're too close to the upper bound, stop incrementing
                    if (remainingRoom <= minIncrement) {
                        return prevValue // Stay at current value, don't go backward
                    }

                    // Get the next increment in the sequence
                    const sequenceIncrement =
                        sequentialIncrements[
                            sequenceStep % sequentialIncrements.length
                        ]
                    sequenceStep++

                    // Use a smaller increment if we're close to the bound
                    const actualIncrement = Math.min(
                        sequenceIncrement,
                        remainingRoom - minIncrement, // Leave some buffer
                        5.0 // Max increment capped at $5
                    )

                    // Only increment if we have meaningful room
                    if (actualIncrement >= minIncrement) {
                        const newValue = prevValue + actualIncrement
                        // Update direction since we're always incrementing in interim animation
                        setOverallDirection('increment')
                        return newValue
                    }

                    return prevValue // Stop incrementing when no room left
                })
            }, interimUpdateInterval)
        },
        [maxDeviationPercent, interimUpdateInterval, clearAllTimers]
    )

    // Set the ref to the function
    startInterimAnimationRef.current = startInterimAnimation

    // Smooth transition to new target value
    const transitionToNewTarget = useCallback(
        (newTarget: number, currentValue: number) => {
            clearAllTimers()

            const startTime = Date.now()
            const startValue = currentValue
            const transitionDuration = 1000 // 1 second for transitions

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / transitionDuration, 1)

                // Smooth easing
                const easeInOutCubic =
                    progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2

                const currentValue =
                    startValue + (newTarget - startValue) * easeInOutCubic
                setDisplayValue(currentValue)

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate)
                } else {
                    startInterimAnimationRef.current?.(newTarget)
                }
            }

            animationRef.current = requestAnimationFrame(animate)
        },
        [clearAllTimers]
    )

    // Main effect to handle target value changes
    useEffect(() => {
        if (isLoading || targetValue === 0) {
            return
        }

        // First time initialization
        if (!hasInitialized.current) {
            hasInitialized.current = true
            lastTargetValue.current = targetValue
            startInitialAnimation(targetValue)
            return
        }

        // Handle target value changes (new data from API)
        if (targetValue !== lastTargetValue.current) {
            const previousTarget = lastTargetValue.current
            lastTargetValue.current = targetValue

            if (isInitialAnimation) {
                // If still in initial animation, restart with new target
                clearAllTimers()
                startInitialAnimation(targetValue)
            } else {
                // Only transition if the new target is significantly different
                // or if the actual value decreased (we should show decreases)
                const targetDifference = Math.abs(targetValue - previousTarget)
                const isSignificantChange =
                    targetDifference > previousTarget * 0.001 // 0.1% threshold
                const isActualDecrease = targetValue < previousTarget

                if (isActualDecrease || isSignificantChange) {
                    // Transition from current display value to new target
                    transitionToNewTarget(targetValue, displayValue)
                } else {
                    // Small increase - just update target and continue interim animation
                    startInterimAnimationRef.current?.(targetValue)
                }
            }
        }
    }, [
        targetValue,
        isLoading,
        displayValue,
        isInitialAnimation,
        startInitialAnimation,
        transitionToNewTarget,
        clearAllTimers,
    ])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers()
        }
    }, [clearAllTimers])

    const formattedValue = formatValue(displayValue)

    // Use useEffect to track previous value properly
    useEffect(() => {
        setPreviousFormattedValue(formattedValue)
    }, [formattedValue])

    // Show loading state
    if (isLoading) {
        return (
            <AnimatedNumber
                value="0.00"
                prefix={prefix}
                suffix={suffix}
                className={className}
            />
        )
    }

    return (
        <AnimatedNumber
            value={formattedValue}
            prefix={prefix}
            suffix={suffix}
            className={className}
            overallDirection={overallDirection}
            previousValue={previousFormattedValue}
        />
    )
}
