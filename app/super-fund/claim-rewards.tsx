"use client"

import React, { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { BodyText } from "@/components/ui/typography"
import ImageWithDefault from "@/components/ImageWithDefault"
import { Button } from "@/components/ui/button"
import useGetClaimRewards from "@/hooks/useGetClaimRewards"
import ClaimRewardsTxDialog from "@/components/dialogs/ClaimRewardsTx"

const rewardTokens = [
    {
        title: 'MORPHO',
        logo: 'https://cdn.morpho.org/assets/logos/morpho.svg',
        amount: '4.21',
    },
    {
        title: 'USDC',
        logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        amount: '6.82',
    },

]

export default function ClaimRewards() {
    const { data, isLoading, isError, refetch } = useGetClaimRewards({
        user_address: '0x1234567890123456789012345678901234567890',
        chain_id: 1,
    })
    const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)

    return (
        <Card>
            <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                {rewardTokens.map(token => (
                    <div className="item flex items-center justify-between gap-[12px] py-3 first:pt-2 last:pb-2" key={token.title}>
                        <div className="flex items-center gap-2">
                            <ImageWithDefault
                                src={token.logo}
                                alt={token.title}
                                width={24}
                                height={24}
                            />
                            <BodyText level="body1" weight="medium">
                                {token.title}
                            </BodyText>
                        </div>
                        <BodyText level="body1" weight="medium">
                            {token.amount}
                        </BodyText>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="relative overflow-hidden rounded-4 md:rounded-6 p-0">
                <ImageWithDefault
                    src="/images/claim-rewards-banner.png"
                    alt="Claim rewards"
                    width={800}
                    height={500}
                    className="w-full h-full object-cover"
                />
                <div className="absolute right-2 lg:right-10 z-10">
                    <Button
                        onClick={() => setIsTxDialogOpen(true)}
                        size={'lg'}
                        variant="secondary"
                        className="uppercase rounded-5"
                    >
                        <span className="px-10">Claim</span>
                    </Button>
                </div>
            </CardFooter>
            <ClaimRewardsTxDialog
                open={isTxDialogOpen}
                setOpen={setIsTxDialogOpen}
                disabled={false}
                positionType="claim"
                assetDetails={{
                    asset: {
                        token: {
                            decimals: 18,
                            amount: '100',
                            symbol: 'MORPHO',
                            name: 'MORPHO',
                            address: '0x1234567890123456789012345678901234567890',
                        },
                    },
                    chain_id: 1,
                }}
            />
        </Card>
    )
}