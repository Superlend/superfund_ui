'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import RewardTimeline from './RewardTimeline'
import CrossSellSuggestion from './CrossSellSuggestion'
import CalendarReminder from './CalendarReminder'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

interface SuccessEnhancementProps {
    depositAmount: number
    currentApy: number
    tokenSymbol: string
    isVisible: boolean
    walletAddress?: string
}

export default function SuccessEnhancement({
    depositAmount,
    currentApy,
    tokenSymbol,
    isVisible,
    walletAddress,
}: SuccessEnhancementProps) {
    const [showCrossSell, setShowCrossSell] = useState(false)
    const [showCalendarReminder, setShowCalendarReminder] = useState(false)
    const { logEvent } = useAnalytics()

    // Progressive reveal of components
    useEffect(() => {
        if (isVisible) {
            // Log view event
            logEvent('post_deposit_engagement_viewed', {
                depositAmount,
                currentApy,
                tokenSymbol,
                walletAddress,
            })

            // Show cross-sell after timeline loads
            const crossSellTimer = setTimeout(() => setShowCrossSell(true), 1200)
            
            // Show calendar reminder after cross-sell
            const reminderTimer = setTimeout(() => setShowCalendarReminder(true), 1800)

            return () => {
                clearTimeout(crossSellTimer)
                clearTimeout(reminderTimer)
            }
        } else {
            // Reset state when not visible
            setShowCrossSell(false)
            setShowCalendarReminder(false)
        }
    }, [isVisible, depositAmount, currentApy, tokenSymbol, walletAddress, logEvent])

    if (!isVisible || depositAmount <= 0) {
        return null
    }

    return (
        <div className="space-y-4 px-1">
            {/* Reward Timeline - Always show first */}
            <RewardTimeline
                depositAmount={depositAmount}
                currentApy={currentApy}
                tokenSymbol={tokenSymbol}
            />

            {/* Cross-sell Suggestion - Show after delay */}
            {showCrossSell && (
                <CrossSellSuggestion
                    depositAmount={depositAmount}
                    tokenSymbol={tokenSymbol}
                />
            )}

            {/* Calendar Reminder - Show last */}
            {showCalendarReminder && (
                <CalendarReminder
                    depositAmount={depositAmount}
                    tokenSymbol={tokenSymbol}
                />
            )}
        </div>
    )
} 