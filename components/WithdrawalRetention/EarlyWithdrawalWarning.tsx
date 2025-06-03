'use client'

import { AlertTriangle, Clock, TrendingDown } from 'lucide-react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface EarlyWithdrawalWarningProps {
    smearingPeriodDays: number
    currentDayInPeriod: number
}

export default function EarlyWithdrawalWarning({
    smearingPeriodDays,
    currentDayInPeriod,
}: EarlyWithdrawalWarningProps) {
    const remainingDays = Math.max(0, smearingPeriodDays - currentDayInPeriod)
    const progressPercentage = (currentDayInPeriod / smearingPeriodDays) * 100

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-amber-50 border border-amber-200 rounded-5 p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                    <HeadingText
                        level="h5"
                        weight="medium"
                        className="text-amber-800 mb-1"
                    >
                        Early Withdrawal During Smearing Period
                    </HeadingText>
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-amber-700"
                    >
                        Withdrawing now will impact your yield due to our smearing period mechanism designed to protect all vault participants.
                    </BodyText>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <BodyText level="body3" weight="medium" className="text-amber-700">
                        Smearing Period Progress
                    </BodyText>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {remainingDays} days remaining
                    </Badge>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                    <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-amber-600">
                    <span>Day {currentDayInPeriod}</span>
                    <span>Day {smearingPeriodDays}</span>
                </div>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <BodyText level="body3" weight="normal" className="text-amber-700">
                        <span className="font-medium">Yield Impact:</span> Early withdrawal reduces your earned yield to ensure fair distribution among all vault participants.
                    </BodyText>
                </div>
                <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <BodyText level="body3" weight="normal" className="text-amber-700">
                        <span className="font-medium">Optimal Timing:</span> Waiting until the smearing period ends maximizes your returns.
                    </BodyText>
                </div>
            </div>
        </motion.div>
    )
} 