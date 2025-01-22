'use client'

import { BodyText, HeadingText } from "@/components/ui/typography";
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook";

export default function VaultStats() {

    const { totalAssets, spotApy, isLoading, error } = useVaultHook()

    return (
        <section>
            <div className="flex items-center justify-around">
                <div className="block">
                    <BodyText level="body1" weight="normal" className="text-gray-600">
                        Spot APY
                    </BodyText>
                    <HeadingText level="h3" weight="medium">
                        {spotApy}%
                    </HeadingText>
                </div>

                <div className="block">
                    <BodyText level="body1" weight="normal" className="text-gray-600">
                        Vault TVL
                    </BodyText>
                    <HeadingText level="h3" weight="medium">
                        {(parseFloat(totalAssets).toFixed(2))}
                    </HeadingText>
                </div>

                <div className="block">
                    <BodyText level="body1" weight="normal" className="text-gray-600">
                        7D APY
                    </BodyText>
                    <HeadingText level="h3" weight="medium">
                        N/A%
                    </HeadingText>
                </div>

                <div className="block">
                    <BodyText level="body1" weight="normal" className="text-gray-600">
                        Vault Sharpe
                    </BodyText>
                    <HeadingText level="h3" weight="medium">
                        N/A%
                    </HeadingText>
                </div>
            </div>
        </section>
    );
}