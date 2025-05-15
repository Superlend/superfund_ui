'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React, { useEffect, useMemo, useState } from "react"
import DepositHistoryChart from '@/components/deposit-history-chart'
import ClaimRewards from "./claim-rewards"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import DailyEarningsHistoryChart from "@/components/daily-earnings-history-chart"
import { BodyText, HeadingText } from "@/components/ui/typography"
import ConnectWalletButton from "@/components/ConnectWalletButton"
import { useRewardsHook } from "@/hooks/vault_hooks/useRewardHook"
import useGetDailyEarningsHistory from "@/hooks/useGetDailyEarningsHistory"
import { VAULT_ADDRESS, VAULT_ADDRESS_MAP } from "@/lib/constants"
import { abbreviateNumber, convertNegativeToZero, getStartTimestamp } from "@/lib/utils"
import { TAddress } from "@/types"
import { useTxContext } from "@/context/super-vault-tx-provider"
import { TTxContext } from "@/context/super-vault-tx-provider"
import { useChain } from "@/context/chain-context"
import { ChainId } from "@/types/chain"
import useTransactionHistory from "@/hooks/useTransactionHistory"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import InfoTooltip from "@/components/tooltips/InfoTooltip"

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
    const { selectedChain, chainDetails } = useChain()
    const getProtocolIdentifier = () => {
        if (!selectedChain) return ''
        return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
    }
    const protocolId = getProtocolIdentifier()
    const { data: { capital, interest_earned }, isLoading: isLoadingPositionDetails } = useTransactionHistory({
        protocolIdentifier: protocolId,
        chainId: selectedChain || 0,
        walletAddress: walletAddress || '',
        refetchOnTransaction: true
    })
    const [refetchClaimRewards, setrefetchClaimRewards] = useState(false)
    // Claim Rewards
    const { formattedClaimData: rewardsData, isLoading: isLoadingRewards, isError: isErrorRewards, refetchClaimRewardsData } = useRewardsHook({
        refetchClaimRewards: refetchClaimRewards,
    });
    // Daily Earnings History
    const [selectedRangeForDailyEarningsHistory, setSelectedRangeForDailyEarningsHistory] = useState(Period.oneMonth)
    const startTimeStamp = getStartTimestamp(selectedRangeForDailyEarningsHistory)
    const {
        data: allDailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory
    } = useGetDailyEarningsHistory({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        user_address: walletAddress.toLowerCase() as `0x${string}`,
    })

    // Filter data based on startTimeStamp
    const dailyEarningsHistoryData = React.useMemo(() => {
        if (!allDailyEarningsHistoryData) return []
        return allDailyEarningsHistoryData.filter(item => item.timestamp >= startTimeStamp)
    }, [allDailyEarningsHistoryData, startTimeStamp, isLoadingDailyEarningsHistory, isErrorDailyEarningsHistory])

    const totalInterestEarned = useMemo(() => {
        return allDailyEarningsHistoryData?.reduce((acc: number, item: any) => acc + item.earnings, 0) ?? 0
    }, [allDailyEarningsHistoryData, isLoadingDailyEarningsHistory, isErrorDailyEarningsHistory])

    const earningsSuffixText = {
        [Period.oneDay]: 'today',
        [Period.oneWeek]: 'this week',
        [Period.oneMonth]: 'this month',
        [Period.oneYear]: 'this year',
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
            <Card>
                <CardContent className="p-4 max-md:px-2 grid grid-cols-3 place-content-center gap-4">
                    <div className="flex flex-col items-start w-fit gap-1 m-auto">
                        <BodyText level="body2" weight="medium" className="text-gray-600">Capital</BodyText>
                        {!isLoadingPositionDetails && <HeadingText level="h3" weight="medium" className="text-gray-800">
                            ${abbreviateNumber(convertNegativeToZero(Number(capital ?? 0)))}
                        </HeadingText>}
                        {isLoadingPositionDetails && <Skeleton className="h-10 w-16 rounded-4" />}
                    </div>
                    <div className="w-[1.5px] h-4 bg-secondary-100/50 rounded-full m-auto"></div>
                    <div className="flex flex-col items-start w-fit gap-1 m-auto">
                        <BodyText level="body2" weight="medium" className="text-gray-600">Interest Earned</BodyText>
                        {!isLoadingPositionDetails && <HeadingText level="h3" weight="medium" className="text-gray-800 flex items-center gap-1">
                            ${abbreviateNumber(convertNegativeToZero(Number(totalInterestEarned ?? 0)))}
                            <InfoTooltip
                                content={<BodyText level="body2" weight="normal" className="text-gray-600">
                                    Total interest earned since the vault&apos;s first deposit.
                                </BodyText>}
                            />
                        </HeadingText>}
                        {isLoadingPositionDetails && <Skeleton className="h-10 w-16 rounded-4" />}
                    </div>
                </CardContent>
            </Card>
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
