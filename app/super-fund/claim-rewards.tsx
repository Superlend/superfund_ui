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
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { Skeleton } from "@/components/ui/skeleton"

const CHAIN_ID = 8453;
export default function ClaimRewards() {
    const { walletAddress, isConnectingWallet } = useWalletConnection()
    const { data: rewardsData, isLoading: isLoadingRewards, isError, refetch } = useGetClaimRewards({
        user_address: walletAddress,
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
            {
                (isConnectingWallet || isLoadingRewards) && (
                    <Skeleton className="w-full h-44 rounded-4" />
                )
            }
            {(!isConnectingWallet && !isLoadingRewards) &&
                <Card>
                    <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                        {rewardsData?.map(reward => (
                            <div className="item flex items-center justify-between gap-[12px] py-3 first:pt-2 last:pb-2" key={reward.claimable}>
                                <div className="flex items-center gap-2">
                                    {/* <ImageWithDefault
                                    src={reward.token?.logo || ''}
                                    alt={reward.token.symbol}
                                    width={24}
                                    height={24}
                                /> */}
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
                </Card>}

            {/* Select token dialog */}
            <SelectTokenDialog
                open={isSelectTokenDialogOpen}
                setOpen={setIsSelectTokenDialogOpen}
                tokens={rewardsData?.map(reward => ({
                    ...reward.token,
                    amount: reward.claimable,
                    price_usd: '0.5',
                })) || []}
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