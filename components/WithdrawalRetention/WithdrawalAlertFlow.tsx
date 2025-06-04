'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import EarlyWithdrawalWarning from './EarlyWithdrawalWarning'
import YieldLossCalculator from './YieldLossCalculator'
import ConsentCheckbox from './ConsentCheckbox'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

interface WithdrawalAlertFlowProps {
    withdrawalAmount: number
    currentApy: number
    tokenSymbol: string
    onConsentChange: (consented: boolean) => void
    isVisible: boolean
    smearingPeriodDays?: number
    currentDayInPeriod?: number
}

export default function WithdrawalAlertFlow({
    withdrawalAmount,
    currentApy,
    tokenSymbol,
    onConsentChange,
    isVisible,
    smearingPeriodDays = 7, // Default to 30 days if not provided
    currentDayInPeriod = 1, // Default to day 15 if not provided
}: WithdrawalAlertFlowProps) {
    const [hasConsented, setHasConsented] = useState(false)
    const [showCalculator, setShowCalculator] = useState(false)
    const { walletAddress } = useWalletConnection()
    const { logEvent } = useAnalytics()

    // Reset consent when visibility changes
    useEffect(() => {
        if (!isVisible) {
            setHasConsented(false)
            setShowCalculator(false)
        }
    }, [isVisible])

    // Show calculator after warning is displayed
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setShowCalculator(true), 800)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    const handleConsentChange = (consented: boolean) => {
        logEvent('withdrawal_alert_flow_consent_change', {
            consented,
            withdrawalAmount,
            currentApy,
            smearingPeriodDays,
            currentDayInPeriod,
            walletAddress,
        })
        setHasConsented(consented)
        onConsentChange(consented)
    }

    // Only show if we're in withdrawal mode and within smearing period
    const remainingDays = Math.max(0, smearingPeriodDays - currentDayInPeriod)
    const isInSmearingPeriod = remainingDays > 0

    if (!isVisible || !isInSmearingPeriod || withdrawalAmount <= 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {/* Early Withdrawal Warning */}
            <EarlyWithdrawalWarning
                smearingPeriodDays={smearingPeriodDays}
                currentDayInPeriod={currentDayInPeriod}
            />

            {/* Yield Loss Calculator */}
            {/* {showCalculator && (
                <YieldLossCalculator
                    withdrawalAmount={withdrawalAmount}
                    currentApy={currentApy}
                    smearingPeriodDays={smearingPeriodDays}
                    currentDayInPeriod={currentDayInPeriod}
                    tokenSymbol={tokenSymbol}
                />
            )} */}

            {/* Alternative Actions Suggestion */}
            {/* {hasConsented && ( */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}
                    className="bg-blue-50 border border-blue-200 rounded-5 p-4 mb-2"
                >
                    <div className="text-center space-y-2">
                        <p className="text-blue-800 font-medium text-sm">
                            💡 Consider waiting {remainingDays} more days for optimal returns
                        </p>
                        <p className="text-blue-600 text-xs">
                            Set a calendar reminder to withdraw after the smearing period ends for maximum yield retention.
                        </p>
                    </div>
                </motion.div> */}
            {/* )} */}

            {/* Consent Checkbox */}
            {showCalculator && (
                <ConsentCheckbox
                    onConsentChange={handleConsentChange}
                    isRequired={true}
                />
            )}
        </div>
    )
} 