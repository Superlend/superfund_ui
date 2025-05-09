'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React, { useEffect, useState } from "react"
import DepositHistoryChart from '@/components/deposit-history-chart'
import ClaimRewards from "./claim-rewards"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import DailyEarningsHistoryChart from "@/components/daily-earnings-history-chart"
import { BodyText } from "@/components/ui/typography"
import ConnectWalletButton from "@/components/ConnectWalletButton"
import { useRewardsHook } from "@/hooks/vault_hooks/useRewardHook"
import useGetDailyEarningsHistory from "@/hooks/useGetDailyEarningsHistory"
import { VAULT_ADDRESS, VAULT_ADDRESS_MAP } from "@/lib/constants"
import { getStartTimestamp } from "@/lib/utils"
import { TAddress } from "@/types"
import { useTxContext } from "@/context/super-vault-tx-provider"
import { TTxContext } from "@/context/super-vault-tx-provider"
import { useChain } from "@/context/chain-context"
import { ChainId } from "@/types/chain"

const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
}

const transition = {
    duration: 0.4,
    ease: 'easeOut'
}

// Main Component
export default function PositionDetails() {
    // Wallet Connection
    const { walletAddress } = useWalletConnection()

    if (!walletAddress) {
        return (
            <WalletDisconnectedUI />
        )
    }

    return <PositionDetailsTabContentUI walletAddress={walletAddress} />
}

// Child Components

function WalletDisconnectedUI() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={transition}
            className="flex flex-col gap-4 items-center justify-center h-full"
        >
            <BodyText level="body1" weight="normal" className="text-gray-800">
                Connect your wallet to view your positions
            </BodyText>
            <div className="max-w-[180px] w-full">
                <ConnectWalletButton />
            </div>
        </motion.div>
    )
}

function NoActivePositionUI({
    title,
    description
}: {
    title?: string,
    description?: string
}) {
    const titleFallback = "You have no active position"
    const descriptionFallback = "Your positions will start appearing here post successful deposit"

    if (!title && !description) {
        return null
    }

    return (
        <div className="flex flex-col gap-2 items-center justify-center h-full">
            {title &&
                <BodyText level="body1" weight="medium" className="text-gray-800 text-center">
                    {title || titleFallback}
                </BodyText>}
            {description &&
                <BodyText level="body2" weight="normal" className="text-gray-600 text-center">
                    {description || descriptionFallback}
                </BodyText>}
        </div>
    )
}

function PositionDetailsTabContentUI({ walletAddress }: { walletAddress: TAddress }) {
    const { claimRewardsTx } = useTxContext() as TTxContext
    const { selectedChain } = useChain()
    const [refetchClaimRewards, setrefetchClaimRewards] = useState(false)
    // Claim Rewards
    const { formattedClaimData: rewardsData, isLoading: isLoadingRewards, isError: isErrorRewards, refetchClaimRewardsData } = useRewardsHook({
        refetchClaimRewards: refetchClaimRewards,
    });
    // Daily Earnings History
    const [selectedRangeForDailyEarningsHistory, setSelectedRangeForDailyEarningsHistory] = useState(Period.oneMonth)
    const startTimeStamp = getStartTimestamp(selectedRangeForDailyEarningsHistory)
    const {
        data: dailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory
    } = useGetDailyEarningsHistory({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        user_address: walletAddress.toLowerCase() as `0x${string}`,
        start_timestamp: startTimeStamp,
    })
    const earningsSuffixText = {
        [Period.oneDay]: 'today',
        [Period.oneWeek]: 'this week',
        [Period.oneMonth]: 'this month',
        [Period.allTime]: 'till date',
    } satisfies Record<Period, string>

    useEffect(() => {
        const shouldRefetchClaimRewards = claimRewardsTx.status === 'view' && claimRewardsTx.isConfirmed && claimRewardsTx.hash
        if (shouldRefetchClaimRewards) {
            setrefetchClaimRewards(true)
            setTimeout(() => {
                setrefetchClaimRewards(false)
            }, 7000)
        }
    }, [claimRewardsTx.status, claimRewardsTx.isConfirmed, claimRewardsTx.hash])

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={transition}
            className="flex flex-col gap-[40px]"
        >
            {(selectedChain !== ChainId.Sonic) &&
                <ClaimRewards
                    rewardsData={rewardsData}
                    isLoadingRewards={isLoadingRewards}
                    isErrorRewards={isErrorRewards}
                    noDataUI={
                        <NoActivePositionUI
                            description={`You have no rewards to claim`}
                        />
                    }
                />}
            <DailyEarningsHistoryChart
                selectedRange={selectedRangeForDailyEarningsHistory}
                setSelectedRange={setSelectedRangeForDailyEarningsHistory}
                dailyEarningsHistoryData={dailyEarningsHistoryData || []}
                isLoadingDailyEarningsHistory={isLoadingDailyEarningsHistory}
                isErrorDailyEarningsHistory={isErrorDailyEarningsHistory}
                earningsSuffixText={earningsSuffixText}
                noDataUI={
                    <NoActivePositionUI
                        description={`You have no interest earnings ${earningsSuffixText[selectedRangeForDailyEarningsHistory]}`}
                    />
                }
            />
            {/* <DepositHistoryChart
                selectedRange={Period.oneMonth}
                handleRangeChange={() => { }}
                selectedFilter={Period.oneMonth}
                handleFilterChange={() => { }}
                chartData={[]}
                disableCategoryFilters={[]}
            /> */}
        </motion.div>
    )
}
