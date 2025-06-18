'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React, { useEffect, useMemo, useState } from "react"
import ClaimRewards from "./claim-rewards"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import DailyEarningsHistoryChart from "@/components/daily-earnings-history-chart"
import { BodyText, HeadingText } from "@/components/ui/typography"
import ConnectWalletButton from "@/components/ConnectWalletButton"
import useGetDailyEarningsHistory from "@/hooks/useGetDailyEarningsHistory"
import { VAULT_ADDRESS_MAP } from "@/lib/constants"
import { abbreviateNumber, convertNegativeToZero, getStartTimestamp } from "@/lib/utils"
import { TAddress } from "@/types"
import { useChain } from "@/context/chain-context"
import { ChainId } from "@/types/chain"
import useTransactionHistory from "@/hooks/useTransactionHistory"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import InfoTooltip from "@/components/tooltips/InfoTooltip"
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook"
import { useGetEffectiveApy } from "@/hooks/vault_hooks/useGetEffectiveApy"
import { useHistoricalData } from "@/hooks/vault_hooks/useHistoricalDataHook"
import { TrendingUp, BarChart3, Calendar, Target, Trophy, Activity, CircleHelp } from "lucide-react"
import HistoricalSpotApyChart from '@/components/historical-spot-apy-chart'
import TooltipText from "@/components/tooltips/TooltipText"
import { getRewardsTooltipContent } from "@/lib/ui/getRewardsTooltipContent"
import { starVariants } from "@/lib/animations"
import useGetBoostRewards from "@/hooks/useGetBoostRewards"
import { UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL } from "@/constants"
import { useActiveAccount, useConnect } from "thirdweb/react"

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
    // const { walletAddress, isConnectingWallet } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const { connect, isConnecting, error } = useConnect();

    if (!walletAddress) {
        return (
            <WalletDisconnectedUI />
        )
    }

    return <PositionDetailsTabContentUI walletAddress={walletAddress} isConnecting={isConnecting} />
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

function PositionDetailsTabContentUI({ walletAddress, isConnecting }: { walletAddress: TAddress; isConnecting?: boolean }) {
    const { selectedChain, chainDetails } = useChain()

    const protocolId = useMemo(() => {
        if (!selectedChain) return ''
        return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
    }, [selectedChain, chainDetails])

    const vaultAddress = useMemo(() => {
        return VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`
    }, [selectedChain])

    const { data: { capital, interest_earned }, isLoading: isLoadingPositionDetails, startRefreshing } = useTransactionHistory({
        protocolIdentifier: protocolId,
        chainId: selectedChain || 0,
        walletAddress: walletAddress || '',
        refetchOnTransaction: true
    })
    const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: vaultAddress,
        chainId: selectedChain,
        userAddress: walletAddress
    })
    const GLOBAL_BOOST_APY =
        boostRewardsData?.filter((item) => item.description?.includes('A global boost for all users') ?? false)
            .reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0
    const Farcaster_BOOST_APY =
        boostRewardsData?.filter((item) => !item.description?.includes('A global boost for all users'))
            .reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0
    const hasFarcasterBoost = Farcaster_BOOST_APY > 0

    // Daily Earnings History
    const [selectedRangeForDailyEarningsHistory, setSelectedRangeForDailyEarningsHistory] = useState(Period.oneMonth)
    const startTimeStamp = getStartTimestamp(selectedRangeForDailyEarningsHistory)
    const {
        data: allDailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory
    } = useGetDailyEarningsHistory({
        vault_address: vaultAddress,
        user_address: walletAddress.toLowerCase() as `0x${string}`,
    })

    // Filter data based on startTimeStamp
    const dailyEarningsHistoryData = React.useMemo(() => {
        if (!allDailyEarningsHistoryData) return []
        return allDailyEarningsHistoryData.filter(item => item.timestamp >= startTimeStamp)
    }, [allDailyEarningsHistoryData, startTimeStamp])

    const totalInterestEarned = useMemo(() => {
        return allDailyEarningsHistoryData?.reduce((acc: number, item: any) => acc + item.earnings, 0) ?? 0
    }, [allDailyEarningsHistoryData])

    // New hooks for APY enhancement sections
    const { spotApy, isLoading: isLoadingSpotApy, error: errorSpotApy } = useVaultHook()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: vaultAddress,
        chain_id: selectedChain || 0
    })
    const TOTAL_SPOT_APY = useMemo(() => {
        return Number(spotApy ?? 0) + Number(effectiveApyData?.rewards_apy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0)
    }, [spotApy, effectiveApyData, GLOBAL_BOOST_APY, Farcaster_BOOST_APY])
    const {
        historicalData: historicalWeeklyData,
        isLoading: isLoadingHistoricalWeeklyData,
        error: errorHistoricalWeeklyData
    } = useHistoricalData({
        period: Period.oneWeek,
        chain_id: selectedChain
    })

    // Listen for transaction events from the global event system if available
  useEffect(() => {
    const handleTransactionComplete = () => {
      // Manually trigger refreshing for 30 seconds when transaction completes
      startRefreshing();
    };

    // Add event listener if window exists
    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-complete', handleTransactionComplete);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-complete', handleTransactionComplete);
      }
    };
  }, [startRefreshing]);

    // Calculate 7-day average spot APY from historical data
    const days_7_avg_spot_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return historicalWeeklyData.reduce((acc: number, item: any) => acc + item.spotApy, 0) / historicalWeeklyData.length
    }, [historicalWeeklyData])

    // Calculate 7-day average spot APY from historical data
    const days_7_avg_base_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return historicalWeeklyData.reduce((acc: number, item: any) => acc + item.baseApy, 0) / historicalWeeklyData.length
    }, [historicalWeeklyData])

    // Calculate 7-day average rewards APY from historical data
    const days_7_avg_rewards_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return historicalWeeklyData.reduce((acc: number, item: any) => acc + item.rewardsApy, 0) / historicalWeeklyData.length
    }, [historicalWeeklyData])

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

    const [infoCardsLayout, setInfoCardsLayout] = useState<'grid' | 'row'>('grid')

    // Combine all APY calculations in a single useMemo to prevent cascading re-renders
    const apyCalculations = useMemo(() => {
        const totalApy = Number((effectiveApyData?.rewards_apy ?? 0)) + Number(spotApy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0)
        const totalVaultApy = Number(effectiveApyData?.total_apy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0)
        const total7DayAvgVaultApy = Number(days_7_avg_base_apy ?? 0) + Number(days_7_avg_rewards_apy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0)

        return {
            TOTAL_APY: totalApy,
            TOTAL_VAULT_APY: totalVaultApy,
            TOTAL_7_DAY_AVG_VAULT_APY: total7DayAvgVaultApy
        }
    }, [effectiveApyData, spotApy, GLOBAL_BOOST_APY, Farcaster_BOOST_APY, days_7_avg_base_apy, days_7_avg_rewards_apy])

    const { TOTAL_APY, TOTAL_VAULT_APY, TOTAL_7_DAY_AVG_VAULT_APY } = apyCalculations

    // Show loading state if wallet is connecting or critical data is still loading
    if (isConnecting) {
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
                            <Skeleton className="h-10 w-16 rounded-4" />
                        </div>
                        <div className="w-[1.5px] h-4 bg-secondary-100/50 rounded-full m-auto"></div>
                        <div className="flex flex-col items-start w-fit gap-1 m-auto">
                            <BodyText level="body2" weight="medium" className="text-gray-600">Interest Earned</BodyText>
                            <Skeleton className="h-10 w-16 rounded-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3 shadow-md">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <HeadingText level="h4" weight="medium" className="text-gray-800">
                                Loading Vault Performance Metrics...
                            </HeadingText>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                                    <Skeleton className="h-6 w-20 rounded-4" />
                                    <Skeleton className="h-10 w-16 rounded-4" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

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
                        <div className="relative p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
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
                                        The current annualized yield (APY) you are earning right now, based on real-time data. This rate can change frequently basis deposits and withdrawals.
                                    </BodyText>
                                }
                            />
                            {!isLoadingSpotApy && !errorSpotApy && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="flex items-center gap-2"
                                >
                                    <HeadingText level="h3" weight="medium" className="text-blue-700">
                                        {Number(TOTAL_SPOT_APY).toFixed(2)}%
                                    </HeadingText>
                                    <InfoTooltip
                                        label={
                                            <motion.svg width="22" height="22" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="first"
                                                    d="M3.98987 0C3.98987 0 4.2778 1.45771 4.90909 2.08475C5.54037 2.71179 7 2.98987 7 2.98987C7 2.98987 5.54229 3.2778 4.91525 3.90909C4.28821 4.54037 4.01013 6 4.01013 6C4.01013 6 3.7222 4.54229 3.09091 3.91525C2.45963 3.28821 1 3.01013 1 3.01013C1 3.01013 2.45771 2.7222 3.08475 2.09091C3.71179 1.45963 3.98987 0 3.98987 0Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="second"
                                                    d="M1.49493 4C1.49493 4 1.6389 4.72886 1.95454 5.04238C2.27019 5.35589 3 5.49493 3 5.49493C3 5.49493 2.27114 5.6389 1.95762 5.95454C1.64411 6.27019 1.50507 7 1.50507 7C1.50507 7 1.3611 6.27114 1.04546 5.95762C0.729813 5.64411 0 5.50507 0 5.50507C0 5.50507 0.728857 5.3611 1.04238 5.04546C1.35589 4.72981 1.49493 4 1.49493 4Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="third"
                                                    d="M0.498311 3C0.498311 3 0.5463 3.24295 0.651514 3.34746C0.756729 3.45196 1 3.49831 1 3.49831C1 3.49831 0.757048 3.5463 0.652542 3.65151C0.548035 3.75673 0.501689 4 0.501689 4C0.501689 4 0.4537 3.75705 0.348486 3.65254C0.243271 3.54804 0 3.50169 0 3.50169C0 3.50169 0.242952 3.4537 0.347458 3.34849C0.451965 3.24327 0.498311 3 0.498311 3Z"
                                                    fill="#FFC007"
                                                />
                                            </motion.svg>
                                        }
                                        content={
                                            getRewardsTooltipContent({
                                                baseRateFormatted: abbreviateNumber(Number(spotApy)),
                                                rewardsCustomList: [
                                                    {
                                                        key: 'rewards_apy',
                                                        key_name: 'Rewards APY',
                                                        value: abbreviateNumber(effectiveApyData?.rewards_apy),
                                                    },
                                                    {
                                                        key: 'superlend_rewards_apy',
                                                        key_name: 'Superlend USDC Reward',
                                                        value: abbreviateNumber(GLOBAL_BOOST_APY ?? 0, 0),
                                                        logo: "/images/tokens/usdc.webp"
                                                    },
                                                    {
                                                        key: 'farcaster_rewards_apy',
                                                        key_name: 'Farcaster Yieldrop',
                                                        value: abbreviateNumber(Farcaster_BOOST_APY ?? 0, 0),
                                                        logo: "/icons/sparkles.svg",
                                                        show: hasFarcasterBoost,
                                                    },
                                                ],
                                                apyCurrent: TOTAL_APY,
                                                positionTypeParam: 'lend',
                                            })
                                        }
                                    />
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
                                        The overall annual yield (APY) currently earned by the vault, calculated as a weighted average of all the strategies and protocols it&apos;s using.
                                    </BodyText>
                                }
                            />
                            {!isLoadingEffectiveApy && !isErrorEffectiveApy && effectiveApyData && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="flex items-center gap-2"
                                >
                                    <HeadingText level="h3" weight="medium" className="text-green-700">
                                        {Number(TOTAL_VAULT_APY).toFixed(2)}%
                                    </HeadingText>
                                    <InfoTooltip
                                        label={
                                            <motion.svg width="22" height="22" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="first"
                                                    d="M3.98987 0C3.98987 0 4.2778 1.45771 4.90909 2.08475C5.54037 2.71179 7 2.98987 7 2.98987C7 2.98987 5.54229 3.2778 4.91525 3.90909C4.28821 4.54037 4.01013 6 4.01013 6C4.01013 6 3.7222 4.54229 3.09091 3.91525C2.45963 3.28821 1 3.01013 1 3.01013C1 3.01013 2.45771 2.7222 3.08475 2.09091C3.71179 1.45963 3.98987 0 3.98987 0Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="second"
                                                    d="M1.49493 4C1.49493 4 1.6389 4.72886 1.95454 5.04238C2.27019 5.35589 3 5.49493 3 5.49493C3 5.49493 2.27114 5.6389 1.95762 5.95454C1.64411 6.27019 1.50507 7 1.50507 7C1.50507 7 1.3611 6.27114 1.04546 5.95762C0.729813 5.64411 0 5.50507 0 5.50507C0 5.50507 0.728857 5.3611 1.04238 5.04546C1.35589 4.72981 1.49493 4 1.49493 4Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="third"
                                                    d="M0.498311 3C0.498311 3 0.5463 3.24295 0.651514 3.34746C0.756729 3.45196 1 3.49831 1 3.49831C1 3.49831 0.757048 3.5463 0.652542 3.65151C0.548035 3.75673 0.501689 4 0.501689 4C0.501689 4 0.4537 3.75705 0.348486 3.65254C0.243271 3.54804 0 3.50169 0 3.50169C0 3.50169 0.242952 3.4537 0.347458 3.34849C0.451965 3.24327 0.498311 3 0.498311 3Z"
                                                    fill="#FFC007"
                                                />
                                            </motion.svg>
                                        }
                                        content={
                                            getRewardsTooltipContent({
                                                baseRateFormatted: abbreviateNumber(Number(effectiveApyData?.base_apy)),
                                                rewardsCustomList: [
                                                    {
                                                        key: 'rewards_apy',
                                                        key_name: 'Rewards APY',
                                                        value: abbreviateNumber(effectiveApyData?.rewards_apy),
                                                    },
                                                    {
                                                        key: 'superlend_rewards_apy',
                                                        key_name: 'Superlend USDC Reward',
                                                        value: abbreviateNumber(GLOBAL_BOOST_APY ?? 0, 0),
                                                        logo: "/images/tokens/usdc.webp"
                                                    },
                                                    {
                                                        key: 'farcaster_rewards_apy',
                                                        key_name: 'Farcaster Yieldrop',
                                                        value: abbreviateNumber(Farcaster_BOOST_APY ?? 0, 0),
                                                        logo: "/icons/sparkles.svg",
                                                        show: hasFarcasterBoost,
                                                    },
                                                ],
                                                apyCurrent: TOTAL_VAULT_APY,
                                                positionTypeParam: 'lend',
                                            })
                                        }
                                    />
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
                                            7-Day Avg. Vault APY
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        The average Vault APY over the past 7 days. This smooths out short-term changes and shows recent performance trends.                                    </BodyText>
                                }
                            />
                            {!isLoadingHistoricalWeeklyData && !errorHistoricalWeeklyData && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    className="flex items-center gap-2"
                                >
                                    <HeadingText level="h3" weight="medium" className="text-purple-700">
                                        {Number(TOTAL_7_DAY_AVG_VAULT_APY).toFixed(2)}%
                                    </HeadingText>
                                    <InfoTooltip
                                        label={
                                            <motion.svg width="22" height="22" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="first"
                                                    d="M3.98987 0C3.98987 0 4.2778 1.45771 4.90909 2.08475C5.54037 2.71179 7 2.98987 7 2.98987C7 2.98987 5.54229 3.2778 4.91525 3.90909C4.28821 4.54037 4.01013 6 4.01013 6C4.01013 6 3.7222 4.54229 3.09091 3.91525C2.45963 3.28821 1 3.01013 1 3.01013C1 3.01013 2.45771 2.7222 3.08475 2.09091C3.71179 1.45963 3.98987 0 3.98987 0Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="second"
                                                    d="M1.49493 4C1.49493 4 1.6389 4.72886 1.95454 5.04238C2.27019 5.35589 3 5.49493 3 5.49493C3 5.49493 2.27114 5.6389 1.95762 5.95454C1.64411 6.27019 1.50507 7 1.50507 7C1.50507 7 1.3611 6.27114 1.04546 5.95762C0.729813 5.64411 0 5.50507 0 5.50507C0 5.50507 0.728857 5.3611 1.04238 5.04546C1.35589 4.72981 1.49493 4 1.49493 4Z"
                                                    fill="#FFC007"
                                                />
                                                <motion.path
                                                    variants={starVariants}
                                                    animate="third"
                                                    d="M0.498311 3C0.498311 3 0.5463 3.24295 0.651514 3.34746C0.756729 3.45196 1 3.49831 1 3.49831C1 3.49831 0.757048 3.5463 0.652542 3.65151C0.548035 3.75673 0.501689 4 0.501689 4C0.501689 4 0.4537 3.75705 0.348486 3.65254C0.243271 3.54804 0 3.50169 0 3.50169C0 3.50169 0.242952 3.4537 0.347458 3.34849C0.451965 3.24327 0.498311 3 0.498311 3Z"
                                                    fill="#FFC007"
                                                />
                                            </motion.svg>
                                        }
                                        content={
                                            getRewardsTooltipContent({
                                                baseRateFormatted: abbreviateNumber(Number(days_7_avg_base_apy)),
                                                baseRateLabel: 'Base APY Avg.',
                                                rewardsCustomList: [
                                                    {
                                                        key: 'rewards_apy',
                                                        key_name: 'Rewards APY Avg.',
                                                        value: abbreviateNumber(days_7_avg_rewards_apy),
                                                    },
                                                    {
                                                        key: 'superlend_rewards_apy',
                                                        key_name: 'Superlend USDC Reward',
                                                        value: abbreviateNumber(GLOBAL_BOOST_APY ?? 0, 0),
                                                        logo: "/images/tokens/usdc.webp"
                                                    },
                                                    {
                                                        key: 'farcaster_rewards_apy',
                                                        key_name: 'Farcaster Yieldrop',
                                                        value: abbreviateNumber(Farcaster_BOOST_APY ?? 0, 0),
                                                        logo: "/icons/sparkles.svg",
                                                        show: hasFarcasterBoost,
                                                    },
                                                ],
                                                apyCurrent: TOTAL_7_DAY_AVG_VAULT_APY,
                                                positionTypeParam: 'lend',
                                                netApyLabel: 'Net APY Avg.',
                                            })
                                        }
                                    />
                                </motion.div>
                            )}
                            {(isLoadingHistoricalWeeklyData || errorHistoricalWeeklyData) && (
                                <Skeleton className="h-10 w-20 rounded-4" />
                            )}
                        </motion.div>
                    </div>
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
            {/* 
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <Calendar className="h-5 w-5 text-purple-600 drop-shadow-sm" />
                        </div>
                        <HeadingText level="h4" weight="medium" className="text-gray-800">
                            Your APY Journey Timeline
                        </HeadingText>
                    </div>

                    <div className="space-y-6">
                        // Less than a week: Red
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

                        // Week 1-2: Yellow (Ramping up) 
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

                        // 2+ Weeks: Green (Full rate)
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
            </Card> */}

            {/* Section 5: Information Cards */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                <TrendingUp className="h-5 w-5 text-green-600 drop-shadow-sm animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2">
                                <HeadingText level="h4" weight="medium" className="text-gray-800">
                                    Long-term Investment Benefits
                                </HeadingText>
                                <InfoTooltip
                                    label={
                                        <CircleHelp className="h-5 w-5 text-gray-600 drop-shadow-sm" />
                                    }
                                    content={"Only applicable on Base yield."}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${infoCardsLayout === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}`}>
                        {/* Fair Share Adjustment Card */}
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
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-3 mr-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-6">
                                            <BarChart3 className="h-5 w-5 text-orange-700 drop-shadow-sm" />
                                        </div>
                                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                                            Fair Share Adjustment
                                        </HeadingText>
                                        {/* <InfoTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                                        Yield is shared fairly as users enter the vault. This can briefly lower your returns — but staying longer helps balance things out.
                                                    </BodyText>
                                                    <BodyText level="body3" weight="normal" className="text-gray-500">
                                                        <a
                                                            href={UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Learn more →
                                                        </a>
                                                    </BodyText>
                                                </div>
                                            }
                                        /> */}
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                    >
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            You need to hold for at least 2 weeks to get the optimum yield.
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
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-200 to-purple-300 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12 hover:scale-110">
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
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
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
