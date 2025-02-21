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
import { SelectTokenDialog } from "@/components/dialogs/SelectToken"
import { abbreviateNumber } from "@/lib/utils"
import { TClaimRewardsResponse } from "@/types"

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

const rewards = [
    {
        token: {
            address: "0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842",
            name: "Morpho Token",
            decimals: 18,
            symbol: "MORPHO",
            logo: 'https://cdn.morpho.org/assets/logos/morpho.svg',
        },
        claimable: "381639",
        distributor: {
            address: "0xE7865df082fFB92949c36D41cC870F2919e0468F",
            chainId: 8453
        },
        proof: [
            "0xe4162657377ff14ab1d7a389dc79da690707114ac26745b8d8d7d5ad1397057e",
            "0x6186021c58b248b876e9de76915f9abce44b7936813ddafa99f76549000171c2"
        ]
    },
    {
        token: {
            address: "0x3ee5e23eee121094f1cfc0ccc79d6c809ebd22e5",
            name: "Ionic",
            decimals: 18,
            symbol: "ION",
            logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        },
        claimable: "22612",
        distributor: {
            address: "0xE7865df082fFB92949c36D41cC870F2919e0468F",
            chainId: 8453
        },
        proof: [
            "0x5a8106d844ee690e3c21078f09db8c7ac79a700afd8c584156e87fa16a1f3904",
            "0x5234ac73d83d05db46d3769157bd1a587fec180404cf5df87fad213d34a20ea7",
            "0x4b3c43c26d576be90d7e754f0fddd1621f49f2e8f16d2adeb95b279b14951bbe",
            "0x380aa7feba396f0ea66aad420443b0e02a267dec6bb3b9fcb67ca974279d97dc"
        ]
    }
]

const CHAIN_ID = 8453;
export default function ClaimRewards() {
    const { data, isLoading, isError, refetch } = useGetClaimRewards({
        user_address: '0x03adfaa573ac1a9b19d2b8f79a5aaffb9c2a0532',
        chain_id: CHAIN_ID,
    })
    const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)
    const [isSelectTokenDialogOpen, setIsSelectTokenDialogOpen] = useState(false)
    const [selectedReward, setSelectedReward] = useState<TClaimRewardsResponse | null>(null)

    function handleSelectToken(token: any) {
        setSelectedReward(token)
        setIsSelectTokenDialogOpen(false)
        setIsTxDialogOpen(true)
    }

    return (
        <>
            <Card>
                <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                    {rewards.map(reward => (
                        <div className="item flex items-center justify-between gap-[12px] py-3 first:pt-2 last:pb-2" key={reward.claimable}>
                            <div className="flex items-center gap-2">
                                <ImageWithDefault
                                    src={reward.token.logo}
                                    alt={reward.token.symbol}
                                    width={24}
                                    height={24}
                                />
                                <BodyText level="body1" weight="medium">
                                    {reward.token.symbol}
                                </BodyText>
                            </div>
                            <BodyText level="body1" weight="medium">
                                {abbreviateNumber(Number(reward.claimable))}
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
                            onClick={() => setIsSelectTokenDialogOpen(true)}
                            size={'lg'}
                            variant="secondary"
                            className="uppercase rounded-5"
                        >
                            <span className="px-10">Claim</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Select token dialog */}
            <SelectTokenDialog
                open={isSelectTokenDialogOpen}
                setOpen={setIsSelectTokenDialogOpen}
                tokens={rewards.map(reward => ({
                    ...reward.token,
                    amount: reward.claimable,
                    price_usd: '100',
                }))}
                onSelectToken={handleSelectToken}
            />
            {/* Claim rewards tx dialog */}
            <ClaimRewardsTxDialog
                open={isTxDialogOpen}
                setOpen={setIsTxDialogOpen}
                disabled={false}
                positionType="claim"
                assetDetails={{
                    asset: {
                        token: {
                            ...selectedReward
                        },
                    },
                    chain_id: CHAIN_ID,
                }}
            />
        </>
    )
}