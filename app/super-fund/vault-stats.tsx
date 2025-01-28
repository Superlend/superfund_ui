'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { abbreviateNumber } from '@/lib/utils'
import { motion } from 'motion/react'

export default function VaultStats() {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { totalAssets, spotApy, isLoading, error } = useVaultHook()
    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )
    const { isClient } = useIsClient()

    // const hasPosition = !!Number(userMaxWithdrawAmount ?? 0);

    const vaultStats = [
        {
            title: 'My Position',
            value: isWalletConnected ? `$${abbreviateNumber(Number(userMaxWithdrawAmount))}` : 'N/A',
            show: isWalletConnected,
        },
        {
            title: 'Spot APY',
            value: `${spotApy}%`,
            show: true,
        },
        {
            title: 'TVL',
            value: abbreviateNumber(Number(totalAssets)),
            show: true,
        },
        {
            title: '7D APY',
            value: 'N/A',
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
                        <HeadingText level="h3" weight="medium">
                            {item.value}
                        </HeadingText>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
