'use client'

import { useState, useEffect, useMemo } from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { motion } from 'motion/react'
import { TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { abbreviateNumber, getLowestDisplayValue, hasLowestDisplayValuePrefix } from '@/lib/utils'

interface YieldLossCalculatorProps {
    withdrawalAmount: number
    currentApy: number
    smearingPeriodDays: number
    currentDayInPeriod: number
    tokenSymbol: string
}

interface YieldData {
    totalYieldLoss: number
    retainedYield: number
    penaltyPercentage: number
    projectedYieldIfWait: number
    optimalWithdrawalDate: Date
}

export default function YieldLossCalculator({
    withdrawalAmount,
    currentApy,
    smearingPeriodDays,
    currentDayInPeriod,
    tokenSymbol,
}: YieldLossCalculatorProps) {
    const [isAnimated, setIsAnimated] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 500)
        return () => clearTimeout(timer)
    }, [])

    const yieldData: YieldData = useMemo(() => {
        // Calculate penalty based on remaining days in smearing period
        const remainingDays = Math.max(0, smearingPeriodDays - currentDayInPeriod)
        const penaltyPercentage = (remainingDays / smearingPeriodDays) * 100
        
        // Calculate daily yield
        const dailyYield = (withdrawalAmount * currentApy) / 100 / 365
        
        // Calculate total yield accumulated so far
        const accumulatedYield = dailyYield * currentDayInPeriod
        
        // Calculate yield loss due to early withdrawal
        const totalYieldLoss = accumulatedYield * (penaltyPercentage / 100)
        const retainedYield = accumulatedYield - totalYieldLoss
        
        // Calculate potential yield if user waits
        const projectedYieldIfWait = dailyYield * remainingDays
        
        // Optimal withdrawal date
        const optimalWithdrawalDate = new Date()
        optimalWithdrawalDate.setDate(optimalWithdrawalDate.getDate() + remainingDays)
        
        return {
            totalYieldLoss,
            retainedYield,
            penaltyPercentage,
            projectedYieldIfWait,
            optimalWithdrawalDate,
        }
    }, [withdrawalAmount, currentApy, smearingPeriodDays, currentDayInPeriod])

    const formatCurrency = (amount: number) => {
        const formattedAmount = getLowestDisplayValue(amount)
        const prefix = hasLowestDisplayValuePrefix(amount)
        return `${prefix}$${formattedAmount}`
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-5 p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <HeadingText level="h5" weight="medium" className="text-gray-800">
                    Yield Impact Calculator
                </HeadingText>
            </div>

            {/* Visual Graph */}
            <div className="space-y-3">
                <BodyText level="body3" weight="medium" className="text-gray-700">
                    Impact Breakdown
                </BodyText>
                
                {/* Loss vs Retained Bars */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <BodyText level="body3" weight="normal" className="text-red-600">
                            Yield Loss
                        </BodyText>
                        <BodyText level="body3" weight="medium" className="text-red-600">
                            {formatCurrency(yieldData.totalYieldLoss)}
                        </BodyText>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                            className="bg-red-400 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                                width: isAnimated ? `${Math.min(yieldData.penaltyPercentage, 100)}%` : 0 
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <BodyText level="body3" weight="normal" className="text-green-600">
                            Retained Yield
                        </BodyText>
                        <BodyText level="body3" weight="medium" className="text-green-600">
                            {formatCurrency(yieldData.retainedYield)}
                        </BodyText>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                            className="bg-green-400 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                                width: isAnimated ? `${100 - Math.min(yieldData.penaltyPercentage, 100)}%` : 0 
                            }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-4 p-3 text-center">
                    <DollarSign className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <BodyText level="body3" weight="medium" className="text-gray-800">
                        {formatCurrency(yieldData.projectedYieldIfWait)}
                    </BodyText>
                    <BodyText level="body3" weight="normal" className="text-gray-600">
                        Potential gain if wait
                    </BodyText>
                </div>
                <div className="bg-gray-50 rounded-4 p-3 text-center">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <BodyText level="body3" weight="medium" className="text-gray-800">
                        {formatDate(yieldData.optimalWithdrawalDate)}
                    </BodyText>
                    <BodyText level="body3" weight="normal" className="text-gray-600">
                        Optimal withdrawal
                    </BodyText>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-4 p-3">
                <BodyText level="body3" weight="normal" className="text-blue-800">
                    {/* <span className="font-medium">Summary:</span> Early withdrawal will cost you{' '}
                    <span className="font-medium text-red-600">
                        {formatCurrency(yieldData.totalYieldLoss)}
                    </span>{' '}
                    in yield penalties.  */}
                    Waiting {Math.max(0, smearingPeriodDays - currentDayInPeriod)} more days could earn you an additional{' '}
                    <span className="font-medium text-green-600">
                        {formatCurrency(yieldData.projectedYieldIfWait)}
                    </span>.
                </BodyText>
            </div>
        </motion.div>
    )
} 