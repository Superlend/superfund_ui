'use client'

import { AnimatedNumber } from '@/components/animations/animated_number'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useRewardsHook } from '@/hooks/vault_hooks/vaultHook'
import { VAULT_ADDRESS } from '@/lib/constants'
import { getRewardsTooltipContent } from '@/lib/ui/getRewardsTooltipContent'
import { abbreviateNumber } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

type VaultStatsProps = {
    last_7_day_avg_total_apy: number
    days_7_avg_base_apy: number
    days_7_avg_rewards_apy: number
}

export default function VaultStats({
    last_7_day_avg_total_apy,
    days_7_avg_base_apy,
    days_7_avg_rewards_apy,
}: VaultStatsProps) {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { totalAssets, spotApy, isLoading: isLoadingVault, error: errorVault } = useVaultHook()
    const { rewards, totalRewardApy, isLoading: isLoadingRewards, error: errorRewards } = useRewardsHook()
    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )
    const { isClient } = useIsClient()
    const isLoadingSection = !isClient;

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
            value: `${last_7_day_avg_total_apy.toFixed(2)}%`,
            show: true,
            hasRewards: true,
            rewardsTooltip: getRewardsTooltipContent({
                baseRateFormatted: days_7_avg_base_apy.toFixed(2),
                rewardsCustomList: [{
                    key: 'rewards_apy',
                    key_name: 'Rewards APY',
                    value: days_7_avg_rewards_apy.toFixed(2),
                }],
                apyCurrent: last_7_day_avg_total_apy,
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
                                        <Sparkles
                                            className="cursor-pointer hover:scale-150 transition-all duration-300 stroke-warning-500/80 fill-warning-500/80"
                                            width={18}
                                            height={18}
                                        />
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
