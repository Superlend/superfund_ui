'use client'

import { AnimatedNumber } from '@/components/animations/animated_number'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useHistoricalDataCompat } from '@/hooks/vault_hooks/useVaultCompat'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useRewardsHook } from '@/hooks/vault_hooks/vaultHook'
import { VAULT_ADDRESS } from '@/lib/constants'
import { getRewardsTooltipContent } from '@/lib/ui/getRewardsTooltipContent'
import { abbreviateNumber } from '@/lib/utils'
import { Period } from '@/types/periodButtons'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'

type VaultStatsProps = {
    days_7_avg_total_apy: number
    days_7_avg_base_apy: number
    days_7_avg_rewards_apy: number
}

const starVariants = {
    first: {
        scale: [0, 1.2, 1],
        opacity: [0, 1, 0.8],
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
        }
    },
    second: {
        scale: [0, 1.2, 1],
        opacity: [0, 1, 0.8],
        transition: {
            duration: 2,
            delay: 0.5,
            repeat: Infinity,
            repeatDelay: 1
        }
    },
    third: {
        scale: [0, 1.2, 1],
        opacity: [0, 1, 0.8],
        transition: {
            duration: 2,
            delay: 1,
            repeat: Infinity,
            repeatDelay: 1
        }
    }
}

export default function VaultStats() {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { totalAssets, spotApy, isLoading: isLoadingVault, error: errorVault } = useVaultHook()
    const { rewards, totalRewardApy, isLoading: isLoadingRewards, error: errorRewards } = useRewardsHook()
    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )
    const { isClient } = useIsClient()
    const isLoadingSection = !isClient;
    const { days_7_avg_base_apy, days_7_avg_rewards_apy, days_7_avg_total_apy, isLoading, error } = useHistoricalData()

    const vaultStats = [
        {
            title: 'Spot APY',
            value: `${(Number(spotApy) + Number(totalRewardApy)).toFixed(2)}%`,
            show: true,
            hasRewards: true,
            rewardsTooltip: getRewardsTooltipContent({
                baseRateFormatted: spotApy,
                rewards: rewards,
                apyCurrent: Number(spotApy) + Number(totalRewardApy),
                positionTypeParam: 'lend',
            }),
        },
        {
            title: 'TVL',
            value: '$' + Number(totalAssets).toFixed(4),
            show: true,
        },
        {
            title: '7D APY',
            value: `${abbreviateNumber(days_7_avg_total_apy)}%`,
            show: true,
            hasRewards: true,
            rewardsTooltip: getRewardsTooltipContent({
                baseRateFormatted: days_7_avg_base_apy.toFixed(2),
                rewardsCustomList: [{
                    key: 'rewards_apy',
                    key_name: 'Rewards APY',
                    value: days_7_avg_rewards_apy.toFixed(2),
                }],
                apyCurrent: days_7_avg_total_apy,
            }),
        },
        {
            title: 'My Position',
            value: isWalletConnected ? `$${Number(userMaxWithdrawAmount).toFixed(4)}` : 'N/A',
            show: isWalletConnected,
        },
    ]

    if (isLoadingSection) {
        return (
            <div className="flex items-center justify-between gap-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        className="flex flex-col items-start gap-2 w-full max-w-[250px]"
                        key={item}
                    >
                        <Skeleton className="h-10 w-full rounded-4" />
                        <Skeleton className="h-7 w-[80%] rounded-4" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-6 pl-2 pr-6">
                {vaultStats.map((item, index) => (
                    <motion.div
                        key={index}
                        className="block shrink-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.2,
                            ease: 'easeOut',
                        }}
                    >
                        <BodyText
                            level="body1"
                            weight="normal"
                            className="text-gray-600"
                        >
                            {item.title}
                        </BodyText>
                        {item.hasRewards &&
                            <div className="flex items-center gap-2">
                                <HeadingText level="h3" weight="medium">
                                    <AnimatedNumber value={item.value} />
                                </HeadingText>
                                <InfoTooltip
                                    label={
                                        <motion.svg width="22" height="22" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <motion.path
                                                variants={starVariants}
                                                animate="first"
                                                d="M3.98987 0C3.98987 0 4.2778 1.45771 4.90909 2.08475C5.54037 2.71179 7 2.98987 7 2.98987C7 2.98987 5.54229 3.2778 4.91525 3.90909C4.28821 4.54037 4.01013 6 4.01013 6C4.01013 6 3.7222 4.54229 3.09091 3.91525C2.45963 3.28821 1 3.01013 1 3.01013C1 3.01013 2.45771 2.7222 3.08475 2.09091C3.71179 1.45963 3.98987 0 3.98987 0Z"
                                                fill="#FFC007"
                                            />
                                            <motion.path
                                                variants={starVariants}
                                                animate="second"
                                                d="M1.49493 4C1.49493 4 1.6389 4.72886 1.95454 5.04238C2.27019 5.35589 3 5.49493 3 5.49493C3 5.49493 2.27114 5.6389 1.95762 5.95454C1.64411 6.27019 1.50507 7 1.50507 7C1.50507 7 1.3611 6.27114 1.04546 5.95762C0.729813 5.64411 0 5.50507 0 5.50507C0 5.50507 0.728857 5.3611 1.04238 5.04546C1.35589 4.72981 1.49493 4 1.49493 4Z"
                                                fill="#FFC007"
                                            />
                                            <motion.path
                                                variants={starVariants}
                                                animate="third"
                                                d="M0.498311 3C0.498311 3 0.5463 3.24295 0.651514 3.34746C0.756729 3.45196 1 3.49831 1 3.49831C1 3.49831 0.757048 3.5463 0.652542 3.65151C0.548035 3.75673 0.501689 4 0.501689 4C0.501689 4 0.4537 3.75705 0.348486 3.65254C0.243271 3.54804 0 3.50169 0 3.50169C0 3.50169 0.242952 3.4537 0.347458 3.34849C0.451965 3.24327 0.498311 3 0.498311 3Z"
                                                fill="#FFC007"
                                            />
                                        </motion.svg>
                                    }
                                    content={item.rewardsTooltip}
                                />
                            </div>

                        }
                        {!item.hasRewards &&
                            <HeadingText level="h3" weight="medium">
                                <AnimatedNumber value={item.value} />
                            </HeadingText>
                        }
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
