'use client'

import { BodyText, HeadingText } from "@/components/ui/typography";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useUserBalance } from "@/hooks/vault_hooks/useUserBalanceHook";
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook";
import { abbreviateNumber } from "@/lib/utils";

export default function VaultStats() {
    const { walletAddress } = useWalletConnection()
    const { totalAssets, spotApy, isLoading, error } = useVaultHook()
    const { userMaxWithdrawAmount } = useUserBalance(walletAddress as `0x${string}`)

    const items = [
        {
            title: 'My Position',
            value: `${abbreviateNumber(Number(userMaxWithdrawAmount))}`,
            show: !!Number(userMaxWithdrawAmount ?? 0),
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

    return (
        <section>
            <div className="flex items-center justify-between gap-4 pl-2 pr-6">
                {items.map((item, index) => (
                    <div className="block" key={index}>
                        <BodyText level="body1" weight="normal" className="text-gray-600">
                            {item.title}
                        </BodyText>
                        <HeadingText level="h3" weight="medium">
                            {item.value}
                        </HeadingText>
                    </div>
                ))}
            </div>
        </section>
    );
}