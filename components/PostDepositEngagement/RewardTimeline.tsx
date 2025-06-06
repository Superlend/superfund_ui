'use client'

import { motion } from 'framer-motion'
import { Clock, Calendar, TrendingUp } from 'lucide-react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'

interface RewardTimelineProps {
    depositAmount: number
    currentApy: number
    tokenSymbol: string
}

export default function RewardTimeline({
    depositAmount,
    currentApy,
    tokenSymbol,
}: RewardTimelineProps) {
    // Calculate estimated rewards for 1-2 weeks
    const estimatedWeeklyReward = (depositAmount * currentApy) / 100 / 52
    const estimatedTwoWeekReward = estimatedWeeklyReward * 2

    const timelineSteps = [
        {
            day: 'Today',
            status: 'completed',
            label: 'Deposit Complete',
            description: 'Your funds are now earning yield',
        },
        {
            day: 'Week 1',
            status: 'current',
            label: 'Accruing Rewards',
            description: 'Rewards accumulating daily',
        },
        {
            day: 'Week 2',
            status: 'upcoming',
            label: 'Ready to Claim',
            description: 'Rewards available for claiming',
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-green-50 border border-green-200 rounded-5 p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                    <HeadingText level="h5" weight="medium" className="text-green-800">
                        Reward Timeline
                    </HeadingText>
                    <BodyText level="body3" weight="normal" className="text-green-600">
                        Check back in 1-2 weeks for claiming your accrued rewards
                    </BodyText>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
                {timelineSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                        {/* Timeline Icon */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-3 h-3 rounded-full ${
                                    step.status === 'completed'
                                        ? 'bg-green-500'
                                        : step.status === 'current'
                                        ? 'bg-green-400 animate-pulse'
                                        : 'bg-gray-300'
                                }`}
                            />
                            {index < timelineSteps.length - 1 && (
                                <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                            )}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className={
                                            step.status === 'completed'
                                                ? 'text-green-800'
                                                : step.status === 'current'
                                                ? 'text-green-700'
                                                : 'text-gray-600'
                                        }
                                    >
                                        {step.label}
                                    </BodyText>
                                    <BodyText
                                        level="body3"
                                        weight="normal"
                                        className={
                                            step.status === 'completed'
                                                ? 'text-green-600'
                                                : step.status === 'current'
                                                ? 'text-green-600'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {step.description}
                                    </BodyText>
                                </div>
                                <Badge
                                    variant={step.status === 'completed' ? 'green' : 'secondary'}
                                    size="sm"
                                    className="text-xs"
                                >
                                    {step.day}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Estimated Rewards Preview */}
            <div className="bg-white bg-opacity-60 rounded-4 p-3 border border-green-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <BodyText level="body3" weight="normal" className="text-green-700">
                            Estimated 2-week rewards
                        </BodyText>
                    </div>
                    <Badge variant="green" size="sm">
                        ~{estimatedTwoWeekReward.toFixed(4)} {tokenSymbol}
                    </Badge>
                </div>
            </div>
        </motion.div>
    )
} 