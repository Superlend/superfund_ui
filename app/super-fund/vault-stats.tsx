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
import { getRewardsTooltipContent } from '@/lib/ui/getRewardsTooltipContent'
import { abbreviateNumber } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

export default function VaultStats({ last_7_day_avg_total_apy }: { last_7_day_avg_total_apy: number }) {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { totalAssets, spotApy, isLoading, error } = useVaultHook()
    const { rewards, totalRewardApy, isLoading: isLoading2, error: error2 } = useRewardsHook()
    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )
    const { isClient } = useIsClient()

    // const hasPosition = !!Number(userMaxWithdrawAmount ?? 0);

    const vaultStats = [
        {
            title: 'My Position',
            value: isWalletConnected ? `$${Number(userMaxWithdrawAmount).toFixed(4)}` : 'N/A',
            show: isWalletConnected,
        },
        {
            title: 'Spot APY',
            value: `${(Number(spotApy) + Number(totalRewardApy)).toFixed(2)}%`,
            show: true,
            hasRewards: true,
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
        },
    ]

    if (!isClient) {
        return (
            <div className="flex items-center justify-between gap-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        className="flex flex-col items-center max-w-[250px]"
                        key={item}
                    >
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-8 w-[80%]" />
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
                                {/* Rewards tooltip */}
                                <InfoTooltip
                                    label={
                                        <Sparkles
                                            className="cursor-pointer hover:scale-150 transition-all duration-300 stroke-warning-500/80 fill-warning-500/80"
                                            width={18}
                                            height={18}
                                        />
                                    }
                                    content={getRewardsTooltipContent({
                                        baseRateFormatted: spotApy,
                                        rewards: rewards,
                                        // [
                                        // {
                                        //     supply_apy: 5.34,
                                        //     asset: {
                                        //         symbol: 'ETH',
                                        //         name: 'Ethereum',
                                        //         address: '0x0000000000000000000000000000000000000000',
                                        //         decimals: 18,
                                        //         logo: '/images/platforms/morpho.webp',
                                        //         price_usd: 1700,
                                        //     }
                                        // },
                                        // ],
                                        apyCurrent: Number(spotApy) + Number(totalRewardApy),
                                        positionTypeParam: 'lend',
                                    })}
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
