"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { BodyText, HeadingText } from "@/components/ui/typography"
import ImageWithDefault from "@/components/ImageWithDefault"
import { Button } from "@/components/ui/button"
import ClaimRewardsTxDialog from "@/components/dialogs/ClaimRewardsTx"
import { SelectTokenDialog } from "@/components/dialogs/SelectToken"
import { abbreviateNumber, formatAmountToDisplay, hasLowestDisplayValuePrefix } from "@/lib/utils"
import { TClaimRewardsResponse } from "@/types"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { Skeleton } from "@/components/ui/skeleton"
import { useRewardsHook } from "../../hooks/vault_hooks/useRewardHook"
import { Check, GiftIcon, InfoIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "motion/react"
import useDimensions from "@/hooks/useDimensions"
import { useChain } from "@/context/chain-context"
import { useTxContext } from "@/context/super-vault-tx-provider"
import { TTxContext } from "@/context/super-vault-tx-provider"

export default function ClaimRewards({
    noDataUI
}: {
    noDataUI: React.ReactNode
}) {
    const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)
    const [isSelectTokenDialogOpen, setIsSelectTokenDialogOpen] = useState(false)
    const [selectedReward, setSelectedReward] = useState<TClaimRewardsResponse | undefined>(undefined)
    const { width: screenWidth } = useDimensions()
    const { selectedChain } = useChain()
    const [refetchClaimRewards, setrefetchClaimRewards] = useState(false)
    const { formattedClaimData: rewardsData, isLoading: isLoadingRewards, isError: isErrorRewards, refetchClaimRewardsData } = useRewardsHook({
        refetchClaimRewards: refetchClaimRewards,
    });
    const { claimRewardsTx } = useTxContext() as TTxContext
    useEffect(() => {
        const shouldRefetchClaimRewards = (claimRewardsTx.status === 'view') && (claimRewardsTx.isConfirmed) && (!!claimRewardsTx.hash)
        if (shouldRefetchClaimRewards) {
            setrefetchClaimRewards(true)
            refetchClaimRewardsData()
            setTimeout(() => {
                setrefetchClaimRewards(false)
            }, 7000)
        }
    }, [claimRewardsTx.status, claimRewardsTx.isConfirmed, claimRewardsTx.hash])

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

    if (isLoadingRewards) {
        return <Skeleton className="w-full h-[250px] rounded-4" />
    }

    // if ((rewardsData.length === 0 && !isLoadingRewards) || (!hasUnclaimedRewards && !isLoadingRewards)) {
    //     return noDataUI
    // }

    return (
        <>
            <Card className="w-full max-h-[280px]">
                {hasUnclaimedRewards && !isLoadingRewards &&
                    <CardContent className="flex flex-col divide-y divide-gray-400 px-8 pt-5 pb-4">
                        <ScrollArea
                            type="always"
                            className={`${unclaimedRewardsData?.length > 2 ? 'h-[120px]' : 'h-[80px]'} p-0 pr-3`}
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
                                        {`${hasLowestDisplayValuePrefix(Number(reward.availabeToClaimFormatted))} ${formatAmountToDisplay(reward.availabeToClaimFormatted)}`}
                                    </BodyText>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                }
                {
                    isLoadingRewards && (
                        <Skeleton className="w-full h-[150px] rounded-4" />
                    )
                }
                <CardFooter className="relative overflow-hidden rounded-4 md:rounded-6 p-0 h-full min-h-[100px]">
                    <ImageWithDefault
                        src="/banners/claim-rewards-banner-desktop.png"
                        alt="Claim rewards"
                        width={800}
                        height={120}
                        className="w-full h-full max-h-[150px] object-cover hidden md:block"
                        priority={true}
                    />
                    <ImageWithDefault
                        src="/banners/claim-rewards-banner-mobile.png"
                        alt="Claim rewards"
                        width={800}
                        height={120}
                        className="w-full h-full max-h-[150px] object-cover md:hidden"
                        priority={true}
                    />
                    <h3 className={`absolute text-2xl md:text-4xl max-w-[12ch] text-center uppercase ${!unclaimedRewardsData.length ? '' : 'top-3'} md:top-1/2 left-1/2 -translate-x-1/2 md:-translate-y-1/2 text-accent-navy font-bold leading-0`}>
                        {unclaimedRewardsData.length > 0 ? "Claim your rewards" : "No rewards to claim"}
                    </h3>
                    {hasUnclaimedRewards &&
                        <motion.div className="absolute max-md:bottom-8 max-md:w-full max-md:flex max-md:justify-center md:right-5 z-[5]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                        >
                            <Button
                                onClick={() => setIsSelectTokenDialogOpen(true)}
                                size={screenWidth > 1024 ? 'lg' : 'md'}
                                variant="primary"
                                className="uppercase bg-white shadow-lg hover:shadow-md active:shadow-sm hover:bg-gray-50 rounded-5 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                                disabled={!hasUnclaimedRewards}
                            >
                                <span className={`flex items-center gap-1 tracking-wide text-white px-10`}>
                                    <GiftIcon className="w-4 h-4 text-inherit" />
                                    Claim{hasUnclaimedRewards ? '' : 'ed'}
                                    {!hasUnclaimedRewards && <Check strokeWidth={2.5} className="w-4 h-4 text-gray-200" />}</span>
                            </Button>
                        </motion.div>}
                </CardFooter>
                {!hasUnclaimedRewards &&
                    <div className="py-3 px-4 flex items-start sm:items-center justify-center gap-1">
                        <InfoIcon className="w-4 h-4 text-secondary-500 shrink-0" />
                        <BodyText level="body2" weight="medium" className="text-gray-600">
                            Rewards can be claimed weekly, based on epochs that start from May 25th.
                        </BodyText>
                    </div>
                }
            </Card>
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
                    chain_id: selectedChain,
                }}
            />
        </>
    )
}