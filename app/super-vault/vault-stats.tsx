'use client'

import { BodyText, HeadingText } from "@/components/ui/typography";
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook";
import { abbreviateNumber } from "@/lib/utils";

export default function VaultStats() {

    const { totalAssets, spotApy, isLoading, error } = useVaultHook()

    const items = [
        {
            title: 'Spot APY',
            value: `${spotApy}%`,
        },
        {
            title: 'Vault TVL',
            value: abbreviateNumber(Number(totalAssets)),
        },
        {
            title: '7D APY',
            value: 'N/A',
        },
        {
            title: 'Vault Sharpe',
            value: 'N/A',
        },
    ]

    return (
        <section>
            <div className="flex items-center justify-between gap-4 pl-2 pr-6">
                {items.map((item) => (
                    <div className="block">
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