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
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook"
import { useGetEffectiveApy } from "@/hooks/vault_hooks/useGetEffectiveApy"
import { useHistoricalData } from "@/hooks/vault_hooks/useHistoricalDataHook"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, BarChart3, Grid3X3, List, Calendar, Target, Trophy, Activity, ChartNoAxesCombined } from "lucide-react"
import HistoricalSpotApyChart from '@/components/historical-spot-apy-chart'
import { Button } from "@/components/ui/button"
import TooltipText from "@/components/tooltips/TooltipText"
import ImageWithDefault from "@/components/ImageWithDefault"

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

    // New hooks for APY enhancement sections
    const { spotApy, isLoading: isLoadingSpotApy, error: errorSpotApy } = useVaultHook()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain || 0
    })
    const {
        historicalData,
        isLoading: isLoadingHistoricalData,
        error: errorHistoricalData
    } = useHistoricalData({
        period: Period.oneWeek,
        chain_id: selectedChain
    })

    // Calculate 7-day average spot APY from historical data
    const days_7_avg_spot_apy = useMemo(() => {
        if (!historicalData || historicalData.length === 0) return 0
        return historicalData.reduce((acc: number, item: any) => acc + item.spotApy, 0) / historicalData.length
    }, [historicalData])

    // Historical Spot APY Chart
    const [selectedRangeForHistoricalSpotApy, setSelectedRangeForHistoricalSpotApy] = useState(Period.oneMonth)
    const {
        historicalData: historicalSpotApyData,
        isLoading: isLoadingHistoricalSpotApyData,
        error: errorHistoricalSpotApyData
    } = useHistoricalData({
        period: selectedRangeForHistoricalSpotApy,
        chain_id: selectedChain
    })

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

    const [infoCardsLayout, setInfoCardsLayout] = useState<'grid' | 'row'>('grid')

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
                                    Total interest earned since your first deposit.
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

            {/* Section 1: Vault Specific Fields */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="relative p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
                            <Activity className="h-5 w-5 text-blue-600 drop-shadow-sm" />
                        </div>
                        <HeadingText level="h4" weight="medium" className="text-gray-800">
                            Vault Performance Metrics
                        </HeadingText>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Spot APY */}
                        <motion.div 
                            className="flex flex-col gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                        >
                            <InfoTooltip
                                label={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        <TooltipText>
                                            Spot APY
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        The current instantaneous APY rate being earned by the vault.
                                    </BodyText>
                                }
                            />
                            {!isLoadingSpotApy && !errorSpotApy && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    <HeadingText level="h3" weight="medium" className="text-blue-700">
                                        {Number(spotApy).toFixed(2)}%
                                    </HeadingText>
                                </motion.div>
                            )}
                            {(isLoadingSpotApy || errorSpotApy) && (
                                <Skeleton className="h-10 w-20 rounded-4" />
                            )}
                        </motion.div>

                        {/* Vault APY */}
                        <motion.div 
                            className="flex flex-col gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-md hover:shadow-lg transition-all duration-300"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                        >
                            <InfoTooltip
                                label={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        <TooltipText>
                                            Vault APY
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        The effective APY calculated as weighted average of underlying protocols.
                                    </BodyText>
                                }
                            />
                            {!isLoadingEffectiveApy && !isErrorEffectiveApy && effectiveApyData && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <HeadingText level="h3" weight="medium" className="text-green-700">
                                        {Number(effectiveApyData.total_apy).toFixed(2)}%
                                    </HeadingText>
                                </motion.div>
                            )}
                            {(isLoadingEffectiveApy || isErrorEffectiveApy) && (
                                <Skeleton className="h-10 w-20 rounded-4" />
                            )}
                        </motion.div>

                        {/* 7-Day Avg Spot APY */}
                        <motion.div 
                            className="flex flex-col gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                        >
                            <InfoTooltip
                                label={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        <TooltipText>
                                            7-Day Avg Spot APY
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        The trailing 7-day average of the spot APY performance.
                                    </BodyText>
                                }
                            />
                            {!isLoadingHistoricalData && !errorHistoricalData && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                >
                                    <HeadingText level="h3" weight="medium" className="text-purple-700">
                                        {Number(days_7_avg_spot_apy).toFixed(2)}%
                                    </HeadingText>
                                </motion.div>
                            )}
                            {(isLoadingHistoricalData || errorHistoricalData) && (
                                <Skeleton className="h-10 w-20 rounded-4" />
                            )}
                        </motion.div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: APY Progress Journey */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12 hover:scale-110">
                            <ChartNoAxesCombined className="h-5 w-5 text-green-600 drop-shadow-sm animate-pulse" />
                        </div>
                        <HeadingText level="h4" weight="medium" className="text-gray-800">
                            Your APY Journey
                        </HeadingText>
                    </div>
                    <BodyText level="body2" weight="normal" className="text-gray-600 mb-6">
                        Track your progress from current spot APY to the target vault APY for optimized returns.
                    </BodyText>

                    {!isLoadingSpotApy && !isLoadingEffectiveApy && !errorSpotApy && !isErrorEffectiveApy && effectiveApyData ? (
                        <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <motion.div 
                                className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <div className="flex flex-col">
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Current: {Number(spotApy).toFixed(2)}%
                                    </BodyText>
                                    <BodyText level="body3" weight="medium" className="text-gray-600">
                                        Spot APY
                                    </BodyText>
                                </div>
                                <div className="flex flex-col text-right">
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Target: {Number(effectiveApyData.total_apy).toFixed(2)}%
                                    </BodyText>
                                    <BodyText level="body3" weight="medium" className="text-gray-600">
                                        Vault APY
                                    </BodyText>
                                </div>
                            </motion.div>

                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg relative overflow-hidden"
                                            initial={{ width: "0%" }}
                                            whileInView={{ width: `${Math.min((Number(spotApy) / Number(effectiveApyData.total_apy)) * 100, 100)}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-transparent rounded-full"></div>
                                            <motion.div 
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "100%" }}
                                                transition={{ 
                                                    duration: 2, 
                                                    delay: 2.0, 
                                                    ease: "easeInOut",
                                                    repeat: Infinity,
                                                    repeatDelay: 4 
                                                }}
                                            />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                        </motion.div>
                                    </div>
                                </div>
                                <motion.div 
                                    className="flex justify-between"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 1.0 }}
                                >
                                    <BodyText level="body3" weight="normal" className="text-gray-500">
                                        0%
                                    </BodyText>
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 1.2 }}
                                    >
                                        <BodyText level="body3" weight="medium" className="text-green-600 font-semibold">
                                            {((Number(spotApy) / Number(effectiveApyData.total_apy)) * 100).toFixed(1)}% Progress
                                        </BodyText>
                                    </motion.div>
                                    <BodyText level="body3" weight="normal" className="text-gray-500">
                                        100%
                                    </BodyText>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 1.3 }}
                            >
                                <InfoTooltip
                                    label={
                                        <BodyText level="body3" weight="medium" className="text-blue-600 cursor-help">
                                            💡 Learn about APY ramp-up
                                        </BodyText>
                                    }
                                    content={
                                        <div className="space-y-2">
                                            <BodyText level="body2" weight="normal" className="text-gray-600">
                                                Vault APY increases over time as your funds get allocated across optimized protocols.
                                            </BodyText>
                                            <BodyText level="body3" weight="normal" className="text-gray-500">
                                                <a
                                                    href="https://docs.craft.do/editor/d/71fd7b22-8910-4b24-ee21-5c14ab0a71b2/CC6AEE76-9654-4E89-94F3-8B379327BC27?s=S3onFRBLuVP1Auieom2o2rEXcKhAQqvQvxwUaPCcyEgx"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Learn more →
                                                </a>
                                            </BodyText>
                                        </div>
                                    }
                                />
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-4" />
                            <Skeleton className="h-3 w-full rounded-4" />
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-16 rounded-4" />
                                <Skeleton className="h-4 w-20 rounded-4" />
                                <Skeleton className="h-4 w-16 rounded-4" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 3: Historical Spot APY Chart */}
            <HistoricalSpotApyChart
                selectedRange={selectedRangeForHistoricalSpotApy}
                setSelectedRange={setSelectedRangeForHistoricalSpotApy}
                historicalData={historicalSpotApyData || []}
                isLoadingHistoricalData={isLoadingHistoricalSpotApyData}
                isErrorHistoricalData={!!errorHistoricalSpotApyData}
                noDataUI={
                    <NoActivePositionUI
                        description={`No historical APY data available for the selected period`}
                    />
                }
            />

            {/* Section 4: APY Journey Timeline */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <Calendar className="h-5 w-5 text-purple-600 drop-shadow-sm" />
                        </div>
                        <HeadingText level="h4" weight="medium" className="text-gray-800">
                            Your APY Journey Timeline
                        </HeadingText>
                        <InfoTooltip
                            content={
                                <div className="space-y-2">
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        Assuming normal deposit and withdraw activities.
                                    </BodyText>
                                    <BodyText level="body3" weight="normal" className="text-gray-500">
                                        <a
                                            href="https://docs.craft.do/editor/d/71fd7b22-8910-4b24-ee21-5c14ab0a71b2/CC6AEE76-9654-4E89-94F3-8B379327BC27?s=S3onFRBLuVP1Auieom2o2rEXcKhAQqvQvxwUaPCcyEgx"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Learn more about APY ramp up →
                                        </a>
                                    </BodyText>
                                </div>
                            }
                        />
                    </div>

                    <div className="space-y-6">
                        {/* Less than a week: Red */}
                        <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="flex justify-between items-center">
                                <BodyText level="body1" weight="medium" className="text-gray-800">
                                    Less than a week
                                </BodyText>
                                <BodyText level="body2" weight="medium" className="text-red-600">
                                    ~1% APY
                                </BodyText>
                            </div>
                            <div className="relative">
                                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg relative"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: "10%" }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-transparent rounded-full"></div>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                                    </motion.div>
                                </div>
                            </div>
                            <BodyText level="body3" weight="medium" className="text-gray-600">
                                Initial adjustment period with lower yields
                            </BodyText>
                        </motion.div>

                        {/* Week 1-2: Yellow (Ramping up) */}
                        <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="flex justify-between items-center">
                                <BodyText level="body1" weight="medium" className="text-gray-800">
                                    Week 1-2
                                </BodyText>
                                <BodyText level="body2" weight="medium" className="text-yellow-600">
                                    ~1.7% APY (ramping up)
                                </BodyText>
                            </div>
                            <div className="relative">
                                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-lg relative"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: "60%" }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-transparent rounded-full"></div>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                                    </motion.div>
                                </div>
                            </div>
                            <BodyText level="body3" weight="medium" className="text-gray-600">
                                Gradual optimization across protocols
                            </BodyText>
                        </motion.div>

                        {/* 2+ Weeks: Green (Full rate) */}
                        <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="flex justify-between items-center">
                                <BodyText level="body1" weight="medium" className="text-gray-800">
                                    2+ Weeks
                                </BodyText>
                                <BodyText level="body2" weight="medium" className="text-green-600">
                                    ~4% APY (full rate)
                                </BodyText>
                            </div>
                            <div className="relative">
                                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg relative overflow-hidden"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: "100%" }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-transparent rounded-full"></div>
                                        <motion.div 
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ 
                                                duration: 2, 
                                                delay: 2.1, 
                                                ease: "easeInOut",
                                                repeat: Infinity,
                                                repeatDelay: 3 
                                            }}
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                    </motion.div>
                                </div>
                            </div>
                            <BodyText level="body3" weight="medium" className="text-gray-600">
                                Full optimization achieved across all protocols
                            </BodyText>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 5: Information Cards */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                <TrendingUp className="h-5 w-5 text-green-600 drop-shadow-sm animate-pulse" />
                            </div>
                            <HeadingText level="h4" weight="medium" className="text-gray-800">
                                Long-term Investment Benefits
                            </HeadingText>
                        </div>
                    </div>

                    <div className={`${infoCardsLayout === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}`}>
                        {/* Break-Even Point Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-orange-300">
                                <CardContent className="p-4">
                                    <motion.div 
                                        className="flex items-center gap-1 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg mr-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-6">
                                            <BarChart3 className="h-5 w-5 text-orange-700 drop-shadow-sm" />
                                        </div>
                                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                                            Break-Even Point
                                        </HeadingText>
                                        <InfoTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                                        Assuming normal deposit and withdraw activities.
                                                    </BodyText>
                                                    <BodyText level="body3" weight="normal" className="text-gray-500">
                                                        <a
                                                            href="https://docs.craft.do/editor/d/71fd7b22-8910-4b24-ee21-5c14ab0a71b2/CC6AEE76-9654-4E89-94F3-8B379327BC27?s=S3onFRBLuVP1Auieom2o2rEXcKhAQqvQvxwUaPCcyEgx"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Learn more →
                                                        </a>
                                                    </BodyText>
                                                </div>
                                            }
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                    >
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            You need to hold for at least 2 weeks to outperform similar type of other vaults in DeFi.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Sweet Spot Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-purple-300">
                                <CardContent className="p-4">
                                    <motion.div 
                                        className="flex items-center gap-1 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-200 to-purple-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12 hover:scale-110">
                                            <Target className="h-5 w-5 text-purple-700 drop-shadow-sm animate-pulse" />
                                        </div>
                                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                                            Sweet Spot
                                        </HeadingText>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                    >
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            3+ months with minimal withdrawals maximizes your returns.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Loyalty Advantage Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300">
                                <CardContent className="p-4">
                                    <motion.div 
                                        className="flex items-center gap-1 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.5 }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                            <Trophy className="h-5 w-5 text-blue-700 drop-shadow-sm animate-bounce" />
                                        </div>
                                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                                            Loyalty Advantage
                                        </HeadingText>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.7 }}
                                    >
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            When others early-exit, you earn their yield via redistribution.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>

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
