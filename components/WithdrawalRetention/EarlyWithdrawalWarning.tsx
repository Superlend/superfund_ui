'use client'

import { AlertTriangle, Clock, TrendingDown } from 'lucide-react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import { VAULT_ADDRESS_MAP } from '@/lib/constants'
import { useChain } from '@/context/chain-context'
import { useApyData } from '@/context/apy-data-provider'

interface EarlyWithdrawalWarningProps {
    smearingPeriodDays: number
    currentDayInPeriod: number
}

export default function EarlyWithdrawalWarning({
    smearingPeriodDays,
    currentDayInPeriod,
}: EarlyWithdrawalWarningProps) {
    const { selectedChain } = useChain()
    const { spotApy, isLoading: isLoadingSpotApy, error: errorSpotApy } = useVaultHook()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain || 0
    })
    const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy } = useApyData()
    
    const TOTAL_SPOT_APY = useMemo(() => {
        return Number(spotApy ?? 0) + Number(effectiveApyData?.rewards_apy ?? 0) + Number(BOOST_APY ?? 0)
    }, [spotApy, effectiveApyData, BOOST_APY])
    
    const TOTAL_VAULT_APY = Number(effectiveApyData?.total_apy ?? 0) + Number(BOOST_APY ?? 0)
    
    const remainingDays = Math.max(0, smearingPeriodDays - currentDayInPeriod)
    const apyProgressPercentage = TOTAL_VAULT_APY > 0 ? Math.min((TOTAL_SPOT_APY / TOTAL_VAULT_APY) * 100, 100) : 0

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
                        APY Progress
                    </BodyText>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {remainingDays} days remaining
                    </Badge>
                </div>
                
                {!isLoadingSpotApy && !isLoadingEffectiveApy && !errorSpotApy && !isErrorEffectiveApy && effectiveApyData ? (
                    <>
                        <div className="w-full bg-amber-200 rounded-full h-2">
                            <div
                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${apyProgressPercentage}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-amber-600">
                            <span>Current: {TOTAL_SPOT_APY.toFixed(2)}%</span>
                            <span>Target: {TOTAL_VAULT_APY.toFixed(2)}%</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-full bg-amber-200 rounded-full h-2">
                            <div className="bg-amber-300 h-2 rounded-full animate-pulse w-1/2" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-amber-600">
                            <span>Loading...</span>
                            <span>Loading...</span>
                        </div>
                    </>
                )}
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