"use client"

import React, { useMemo, useState } from "react"
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
import ClaimRewardsTxDialog from "@/components/dialogs/ClaimRewardsTx"
import { SelectTokenDialog } from "@/components/dialogs/SelectToken"
import { abbreviateNumber } from "@/lib/utils"
import { TClaimRewardsResponse } from "@/types"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { Skeleton } from "@/components/ui/skeleton"
import { useRewardsHook } from "../../hooks/vault_hooks/useRewardHook"
import { Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const CHAIN_ID = 8453;
export default function ClaimRewards() {
    const { isConnectingWallet } = useWalletConnection()
    const { formattedClaimData: rewardsData, isLoading: isLoadingRewards, isError: isErrorRewards, refetchClaimRewardsData } = useRewardsHook();
    const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)
    const [isSelectTokenDialogOpen, setIsSelectTokenDialogOpen] = useState(false)
    const [selectedReward, setSelectedReward] = useState<TClaimRewardsResponse | undefined>(undefined)

    function handleSelectToken(token: any) {
        const tokenReward = rewardsData?.find(rd => rd.token.address === token.address);
        setSelectedReward(tokenReward)
        setIsSelectTokenDialogOpen(false)
        setIsTxDialogOpen(true)
    }

    function filterByUnclaimedRewards(rewards: TClaimRewardsResponse[]) {
        return rewards.filter(reward => Number(reward.availabeToClaim) > 0)
    }

    const unclaimedRewardsData = useMemo(() => filterByUnclaimedRewards(rewardsData), [rewardsData]);
    const hasUnclaimedRewards = useMemo(() => unclaimedRewardsData?.length > 0, [unclaimedRewardsData]);

    if (rewardsData.length === 0 && !isLoadingRewards && !isConnectingWallet) {
        return null
    }

    return (
        <>
            {
                (isConnectingWallet || isLoadingRewards) && (
                    <Skeleton className="w-full h-[150px] rounded-4" />
                )
            }
            {(!isConnectingWallet && !isLoadingRewards) &&
                <Card className="w-full max-h-[300px]">
                    {hasUnclaimedRewards &&
                        <CardContent className="flex flex-col divide-y divide-gray-400 px-8 pt-5 pb-4">
                            <ScrollArea
                                type="always"
                                className={`${unclaimedRewardsData?.length > 2 ? 'h-[150px]' : 'h-[80px]'} p-0 pr-3`}
                            >
                                {unclaimedRewardsData?.map(reward => (
                                    <div className="item flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0" key={reward.token.address}>
                                        <div className="flex items-center gap-2">
                                            <ImageWithDefault
                                                src={reward.token?.logo || ''}
                                                alt={reward.token.symbol}
                                                width={24}
                                                height={24}
                                                className="rounded-full h-[24px] w-[24px] max-w-[24px] max-h-[24px]"
                                            />
                                            <BodyText level="body1" weight="medium">
                                                {reward.token.symbol}
                                            </BodyText>
                                        </div>
                                        <BodyText level="body1" weight="medium">
                                            {abbreviateNumber(Number(reward.availabeToClaimFormatted))}
                                        </BodyText>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    }
                    <CardFooter className="relative overflow-hidden rounded-4 md:rounded-6 p-0">
                        <ImageWithDefault
                            src="/images/claim-rewards-banner.png"
                            alt="Claim rewards"
                            width={800}
                            height={500}
                            className="w-full h-full max-h-[200px] object-cover"
                        />
                        <div className="absolute right-2 lg:right-10 z-10">
                            <Button
                                onClick={() => setIsSelectTokenDialogOpen(true)}
                                size={'lg'}
                                variant="secondary"
                                className="uppercase rounded-5 disabled:opacity-100 disabled:cursor-not-allowed"
                                disabled={!hasUnclaimedRewards}
                            >
                                <span className={`flex items-center gap-1 ${!hasUnclaimedRewards ? 'px-5' : 'px-10'}`}>
                                    Claim{hasUnclaimedRewards ? '' : 'ed'}
                                    {!hasUnclaimedRewards && <Check strokeWidth={2.5} className="w-4 h-4 text-green-500" />}</span>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>}

            {/* Select token dialog */}
            <SelectTokenDialog
                open={isSelectTokenDialogOpen}
                setOpen={setIsSelectTokenDialogOpen}
                tokens={unclaimedRewardsData?.map(reward => ({
                    ...reward.token,
                    amount: reward.availabeToClaimFormatted,
                })) || []}
                onSelectToken={handleSelectToken}
                filterByChain={false}
                showChainBadge={false}
            />
            {/* Claim rewards tx dialog */}
            <ClaimRewardsTxDialog
                open={isTxDialogOpen}
                setOpen={setIsTxDialogOpen}
                disabled={false}
                positionType="claim"
                assetDetails={{
                    reward: {
                        ...selectedReward
                    },
                    chain_id: CHAIN_ID,
                }}
            />
        </>
    )
}