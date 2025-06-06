'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, TrendingUp, Zap, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Badge } from '../ui/badge'

interface PostDepositEngagementToastProps {
    depositAmount: number
    currentApy: number
    tokenSymbol: string
    walletAddress?: string
    onDismiss: () => void
}

interface ToastSection {
    id: string
    title: string
    icon: React.ReactNode
    content: React.ReactNode
    primaryAction?: {
        label: string
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
}

export default function PostDepositEngagementToast({
    depositAmount,
    currentApy,
    tokenSymbol,
    walletAddress,
    onDismiss,
}: PostDepositEngagementToastProps) {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

    // Calculate estimated rewards
    const estimatedWeeklyReward = (depositAmount * currentApy) / 100 / 52
    const estimatedTwoWeekReward = estimatedWeeklyReward * 2

    const handleExploreAggregator = () => {
        // logEvent('cross_sell_aggregator_clicked', {
        //     depositAmount,
        //     tokenSymbol,
        //     walletAddress,
        //     source: 'post_deposit_toast',
        // })
        window.open('https://app.superlend.xyz', '_blank')
    }

    const handleSetReminder = () => {
        // logEvent('calendar_reminder_clicked', {
        //     depositAmount,
        //     tokenSymbol,
        //     walletAddress,
        //     source: 'post_deposit_toast',
        // })

        // Create calendar event
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + 7)
        const eventTitle = `Claim SuperFund Rewards - ${depositAmount} ${tokenSymbol}`
        const eventDescription = `Time to claim your accrued rewards from your SuperFund deposit.`
        const startDate = reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent('https://funds.superlend.xyz')}`

        window.open(googleCalendarUrl, '_blank')
    }

    const sections: ToastSection[] = [
        {
            id: 'reward-timeline',
            title: 'Your Rewards Timeline',
            icon: (
                <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-4">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
            ),
            content: (
                <div className="space-y-2">
                    <BodyText level="body3" weight="normal" className="text-gray-600">
                        Check back in a week for claiming rewards
                    </BodyText>
                    <div className="bg-amber-50 rounded-4 p-2 border border-amber-100">
                        <BodyText level="body3" weight="normal" className="text-amber-800">
                            💡 Set a reminder to claim rewards in a week.
                        </BodyText>
                    </div>

                    {/* <div className="bg-green-50 rounded-4 p-2 border border-green-100">
                        <div className="flex items-center justify-between">
                            <BodyText level="body3" weight="normal" className="text-green-700">
                                Est. 1-week rewards
                            </BodyText>
                            <Badge variant="green" size="sm">
                                ~{estimatedTwoWeekReward.toFixed(4)} {tokenSymbol}
                            </Badge>
                        </div>
                    </div> */}
                </div>
            ),
            primaryAction: {
                label: 'Set Reminder',
                onClick: handleSetReminder,
            },
        },
        {
            id: 'cross-sell',
            title: 'Maximize DeFi Yields',
            icon: (
                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-4">
                    <Zap className="w-4 h-4 text-blue-600" />
                </div>
            ),
            content: (
                <div className="space-y-2">
                    <BodyText level="body3" weight="normal" className="text-gray-600">
                        Explore our aggregator for the best yields across protocols.
                    </BodyText>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400 rounded-full" />
                            <BodyText level="body3" weight="normal" className="text-gray-600">
                                350+ markets
                            </BodyText>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400 rounded-full" />
                            <BodyText level="body3" weight="normal" className="text-gray-600">
                                Auto-optimization
                            </BodyText>
                        </div>
                    </div>
                </div>
            ),
            primaryAction: {
                label: 'Launch App',
                onClick: handleExploreAggregator,
            },
        },
        // {
        //     id: 'calendar-reminder',
        //     title: 'Never Miss Rewards',
        //     icon: <Calendar className="w-4 h-4 text-amber-600" />,
        //     content: (
        //         <div className="space-y-2">
        //             <BodyText level="body3" weight="normal" className="text-gray-600">
        //                 Set a calendar reminder to claim rewards in a week.
        //             </BodyText>

        //             <div className="bg-amber-50 rounded-4 p-2 border border-amber-100">
        //                 <BodyText level="body3" weight="normal" className="text-amber-800">
        //                     💡 Optimal claiming window
        //                 </BodyText>
        //             </div>
        //         </div>
        //     ),
        //     primaryAction: {
        //         label: 'Add to Calendar',
        //         onClick: handleSetReminder,
        //     },
        // },
    ]

    const currentSection = sections[currentSectionIndex]

    // Log view events (no auto-progress)
    // useEffect(() => {
    //     logEvent('post_deposit_toast_section_viewed', {
    //         sectionId: currentSection.id,
    //         sectionIndex: currentSectionIndex,
    //         depositAmount,
    //         tokenSymbol,
    //         walletAddress,
    //     })
    // }, [currentSectionIndex, currentSection.id, logEvent, depositAmount, tokenSymbol, walletAddress])

    const handlePrevious = () => {
        setCurrentSectionIndex(prev => Math.max(0, prev - 1))
    }

    const handleNext = () => {
        setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1))
    }

    const handleDismiss = () => {
        // logEvent('post_deposit_toast_dismissed', {
        //     sectionId: currentSection.id,
        //     sectionIndex: currentSectionIndex,
        //     depositAmount,
        //     tokenSymbol,
        //     walletAddress,
        // })
        onDismiss()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-5 border border-gray-200 p-4 w-96 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {currentSection.icon}
                    <HeadingText level="h6" weight="medium" className="text-gray-800">
                        {currentSection.title}
                    </HeadingText>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 !p-0 border border-gray-200 hover:bg-gray-200 !rounded-4"
                >
                    <X className="h-4 w-4 text-gray-600" />
                </Button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSection.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4"
                >
                    {currentSection.content}
                </motion.div>
            </AnimatePresence>

            {/* Actions & Navigation Combined */}
            <div className="flex items-center justify-between">
                {/* CTA Button */}
                <div className="flex-1 mr-4">
                    {currentSection.primaryAction && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={currentSection.primaryAction.onClick}
                            className="w-full h-9"
                        >
                            {currentSection.primaryAction.label}
                        </Button>
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-3">
                    {/* Progress Dots */}
                    <div className="flex items-center gap-1.5">
                        {sections.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentSectionIndex
                                    ? 'bg-primary'
                                    : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        <Button
                            onClick={handlePrevious}
                            disabled={currentSectionIndex === 0}
                            size="none"
                            className="h-7 w-7 !p-0 border border-gray-200 hover:border-gray-300 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={currentSectionIndex === sections.length - 1}
                            size="none"
                            className="h-7 w-7 !p-0 border border-gray-200 hover:border-gray-300 disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
} 