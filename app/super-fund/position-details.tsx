'use client'

import { Period } from '@/types/periodButtons'
import { motion, Transition } from 'motion/react'
import React, { useEffect, useMemo, useState } from 'react'
import ClaimRewards from './claim-rewards'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import DailyEarningsHistoryChart from '@/components/daily-earnings-history-chart'
import { BodyText, HeadingText } from '@/components/ui/typography'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import useGetDailyEarningsHistory from '@/hooks/useGetDailyEarningsHistory'
import { USDC_DECIMALS, VAULT_ADDRESS_MAP } from '@/lib/constants'
import {
    abbreviateNumberWithoutRounding,
    convertNegativeToZero,
    getStartTimestamp,
} from '@/lib/utils'
import { TAddress } from '@/types'
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import {
    TrendingUp,
    BarChart3,
    Calendar,
    Target,
    Trophy,
    Activity,
    CircleHelp,
    Percent,
    Dot,
    ArrowDownToLine,
    InfoIcon,
} from 'lucide-react'
import HistoricalSpotApyChart from '@/components/historical-spot-apy-chart'
import TooltipText from '@/components/tooltips/TooltipText'
import { getRewardsTooltipContent } from '@/lib/ui/getRewardsTooltipContent'
import { starVariants } from '@/lib/animations'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import {
    LIQUIDITY_LAND_TARGET_APY,
    UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL,
} from '@/constants'
import { useActiveAccount, useConnect } from 'thirdweb/react'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useGetLiquidityLandUsers } from '@/hooks/useGetLiquidityLandUsers'
import { TTxContext, useTxContext } from '@/context/super-vault-tx-provider'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { Button } from '@/components/ui/button'
import CustomAlert from '@/components/alerts/CustomAlert'

const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
}

const transition: Transition = {
    duration: 0.4,
    ease: 'easeOut',
}

// Main Component
export default function PositionDetails() {
    // Wallet Connection
    // const { walletAddress, isConnectingWallet } = useWalletConnection()
    const account = useActiveAccount()
    const walletAddress = account?.address as `0x${string}`
    const { connect, isConnecting, error } = useConnect()

    if (!walletAddress) {
        return <WalletDisconnectedUI />
    }

    return (
        <PositionDetailsTabContentUI
            walletAddress={walletAddress}
            isConnecting={isConnecting}
        />
    )
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
    description,
}: {
    title?: string
    description?: string
}) {
    const titleFallback = 'You have no active position'
    const descriptionFallback =
        'Your positions will start appearing here post successful deposit'

    if (!title && !description) {
        return null
    }

    return (
        <div className="flex flex-col gap-2 items-center justify-center h-full">
            {title && (
                <BodyText
                    level="body1"
                    weight="medium"
                    className="text-gray-800 text-center"
                >
                    {title || titleFallback}
                </BodyText>
            )}
            {description && (
                <BodyText
                    level="body2"
                    weight="normal"
                    className="text-gray-600 text-center"
                >
                    {description || descriptionFallback}
                </BodyText>
            )}
        </div>
    )
}

function PositionDetailsTabContentUI({
    walletAddress,
    isConnecting,
}: {
    walletAddress: TAddress
    isConnecting?: boolean
}) {
    const { depositTxCompleted, withdrawTxCompleted } =
        useTxContext() as TTxContext
    const { selectedChain, chainDetails } = useChain()
    const {
        balance,
        shareTokenBalanceRaw,
        userMaxWithdrawAmount,
        isLoading: isLoadingBalance,
        error: balanceError,
    } = useUserBalance(walletAddress as `0x${string}`)

    const protocolId = useMemo(() => {
        if (!selectedChain) return ''
        return (
            chainDetails[selectedChain as keyof typeof chainDetails]
                ?.contractAddress || ''
        )
    }, [selectedChain, chainDetails])

    const vaultAddress = useMemo(() => {
        return VAULT_ADDRESS_MAP[
            selectedChain as keyof typeof VAULT_ADDRESS_MAP
        ] as `0x${string}`
    }, [selectedChain])

    const {
        // data: { capital, interest_earned },
        isLoading: isLoadingPositionDetails,
        refetch: refetchTransactionHistory,
    } = useTransactionHistory({
        protocolIdentifier: protocolId,
        chainId: selectedChain || 0,
        walletAddress: walletAddress || '',
        refetchOnTransaction: true,
    })

    const {
        data: boostRewardsData,
        isLoading: isLoadingBoostRewards,
        error: errorBoostRewards,
    } = useGetBoostRewards({
        vaultAddress: vaultAddress,
        chainId: selectedChain,
        userAddress: walletAddress,
    })
    // const GLOBAL_BOOST_APY =
    //     boostRewardsData
    //         ?.filter(
    //             (item) =>
    //                 item.description?.includes(
    //                     'A global boost for all users'
    //                 ) ?? false
    //         )
    //         .reduce((acc, curr) => acc + curr.boost_apy / 100, 0) ?? 0
    const Farcaster_BOOST_APY =
        boostRewardsData
            ?.filter(
                (item) =>
                    !item.description?.includes('A global boost for all users')
            )
            .reduce((acc, curr) => acc + curr.boost_apy / 100, 0) ?? 0
    const hasFarcasterBoost = Farcaster_BOOST_APY > 0

    // Daily Earnings History
    const [
        selectedRangeForDailyEarningsHistory,
        setSelectedRangeForDailyEarningsHistory,
    ] = useState(Period.oneMonth)
    const startTimeStamp = getStartTimestamp(
        selectedRangeForDailyEarningsHistory
    )
    const {
        data: allDailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory,
    } = useGetDailyEarningsHistory({
        vault_address: vaultAddress,
        user_address: walletAddress.toLowerCase() as `0x${string}`,
    })

    // Filter data based on startTimeStamp
    const dailyEarningsHistoryData = React.useMemo(() => {
        if (!allDailyEarningsHistoryData) return []
        return allDailyEarningsHistoryData.filter(
            (item) => item.timestamp >= startTimeStamp
        )
    }, [allDailyEarningsHistoryData, startTimeStamp])

    const totalInterestEarned = useMemo(() => {
        return (
            allDailyEarningsHistoryData?.reduce(
                (acc: number, item: any) => acc + item.earnings,
                0
            ) ?? 0
        )
    }, [allDailyEarningsHistoryData])

    const capital = useMemo(() => {
        return (
            Number(userMaxWithdrawAmount ?? 0) -
            Number(totalInterestEarned ?? 0)
        )
    }, [userMaxWithdrawAmount, totalInterestEarned])

    // New hooks for APY enhancement sections
    const {
        spotApy,
        isLoading: isLoadingSpotApy,
        error: errorSpotApy,
        totalSupply,
        rewards,
    } = useVaultHook()
    const {
        data: effectiveApyData,
        isLoading: isLoadingEffectiveApy,
        isError: isErrorEffectiveApy,
    } = useGetEffectiveApy({
        vault_address: vaultAddress,
        chain_id: selectedChain || 0,
    })
    const {
        historicalData: historicalWeeklyData,
        isLoading: isLoadingHistoricalWeeklyData,
        error: errorHistoricalWeeklyData,
    } = useHistoricalData({
        period: Period.oneWeek,
        chain_id: selectedChain,
    })

    // Liquidity Land boost logic
    const { data: liquidityLandUsers, isLoading: isLoadingLiquidityLandUsers } =
        useGetLiquidityLandUsers()
    const isLiquidityLandUser = useMemo(() => {
        if (!walletAddress || !liquidityLandUsers) return false
        return liquidityLandUsers.some(
            (user) =>
                user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        )
    }, [walletAddress, liquidityLandUsers])

    // Use spotApy consistently for both boost calculation and display
    const baseAPY =
        Number(spotApy ?? 0) +
        Number(effectiveApyData?.rewards_apy ?? 0) +
        // Number(GLOBAL_BOOST_APY ?? 0) +
        Number(Farcaster_BOOST_APY ?? 0)
    const LIQUIDITY_LAND_BOOST_APY = useMemo(() => {
        if (!isLiquidityLandUser) return 0
        const targetAPY = LIQUIDITY_LAND_TARGET_APY
        const boost = Math.max(0, targetAPY - baseAPY)
        return boost
    }, [isLiquidityLandUser, baseAPY])
    const hasLiquidityLandBoost = LIQUIDITY_LAND_BOOST_APY > 0

    const accruedInterest = useMemo(() => {
        const denominator = BigNumber.from(totalSupply)
        const numerator = BigNumber.from(rewards).mul(
            BigNumber.from(shareTokenBalanceRaw)
        )

        if (denominator.eq(0)) {
            return 0
        }

        const result = numerator.div(denominator)
        return Number(formatUnits(result, USDC_DECIMALS))
    }, [rewards, totalSupply, shareTokenBalanceRaw])

    const unrealizedVaultInterest = Number(formatUnits(rewards, USDC_DECIMALS))

    useEffect(() => {
        if (depositTxCompleted || withdrawTxCompleted) {
            refetchTransactionHistory()
        }
    }, [depositTxCompleted, withdrawTxCompleted])

    // Calculate 7-day average spot APY from historical data
    const days_7_avg_spot_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return (
            historicalWeeklyData.reduce(
                (acc: number, item: any) => acc + item.spotApy,
                0
            ) / historicalWeeklyData.length
        )
    }, [historicalWeeklyData])

    // Calculate 7-day average spot APY from historical data
    const days_7_avg_base_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return (
            historicalWeeklyData.reduce(
                (acc: number, item: any) => acc + item.baseApy,
                0
            ) / historicalWeeklyData.length
        )
    }, [historicalWeeklyData])

    // Calculate 7-day average rewards APY from historical data
    const days_7_avg_rewards_apy = useMemo(() => {
        if (!historicalWeeklyData || historicalWeeklyData.length === 0) return 0
        return (
            historicalWeeklyData.reduce(
                (acc: number, item: any) => acc + item.rewardsApy,
                0
            ) / historicalWeeklyData.length
        )
    }, [historicalWeeklyData])

    // Historical Spot APY Chart
    const [
        selectedRangeForHistoricalSpotApy,
        setSelectedRangeForHistoricalSpotApy,
    ] = useState(Period.oneMonth)
    const {
        historicalData: historicalSpotApyData,
        isLoading: isLoadingHistoricalSpotApyData,
        error: errorHistoricalSpotApyData,
    } = useHistoricalData({
        period: selectedRangeForHistoricalSpotApy,
        chain_id: selectedChain,
    })

    const earningsSuffixText = {
        [Period.oneDay]: 'today',
        [Period.oneWeek]: 'this week',
        [Period.oneMonth]: 'this month',
        [Period.oneYear]: 'this year',
    } satisfies Record<Period, string>

    const [infoCardsLayout, setInfoCardsLayout] = useState<'grid' | 'row'>(
        'grid'
    )

    const TOTAL_SPOT_APY = useMemo(() => {
        return baseAPY + Number(LIQUIDITY_LAND_BOOST_APY ?? 0)
    }, [baseAPY, LIQUIDITY_LAND_BOOST_APY])

    // Combine all APY calculations in a single useMemo to prevent cascading re-renders
    const apyCalculations = useMemo(() => {
        const totalApy =
            Number(effectiveApyData?.rewards_apy ?? 0) +
            Number(spotApy ?? 0) +
            // Number(GLOBAL_BOOST_APY ?? 0) +
            Number(Farcaster_BOOST_APY ?? 0) +
            Number(LIQUIDITY_LAND_BOOST_APY ?? 0)
        const totalVaultApy =
            Number(effectiveApyData?.total_apy ?? 0) +
            // Number(GLOBAL_BOOST_APY ?? 0) +
            Number(Farcaster_BOOST_APY ?? 0)
        const total7DayAvgVaultApy =
            Number(days_7_avg_base_apy ?? 0) +
            Number(days_7_avg_rewards_apy ?? 0) +
            // Number(GLOBAL_BOOST_APY ?? 0) +
            Number(Farcaster_BOOST_APY ?? 0)

        return {
            TOTAL_APY: totalApy,
            TOTAL_VAULT_APY: totalVaultApy,
            TOTAL_7_DAY_AVG_VAULT_APY: total7DayAvgVaultApy,
        }
    }, [
        effectiveApyData,
        spotApy,
        // GLOBAL_BOOST_APY,
        Farcaster_BOOST_APY,
        days_7_avg_base_apy,
        days_7_avg_rewards_apy,
        LIQUIDITY_LAND_BOOST_APY,
    ])

    const { TOTAL_APY, TOTAL_VAULT_APY, TOTAL_7_DAY_AVG_VAULT_APY } =
        apyCalculations

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
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-600"
                            >
                                Capital
                            </BodyText>
                            <Skeleton className="h-10 w-16 rounded-4" />
                        </div>
                        <div className="w-[1.5px] h-4 bg-secondary-100/50 rounded-full m-auto"></div>
                        <div className="flex flex-col items-start w-fit gap-1 m-auto">
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-600"
                            >
                                Realized Interest
                            </BodyText>
                            <Skeleton className="h-10 w-16 rounded-4" />
                        </div>
                        <div className="w-[1.5px] h-4 bg-secondary-100/50 rounded-full m-auto"></div>
                        {/* <div className="flex flex-col items-start w-fit gap-1 m-auto">
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-600"
                            >
                                Unrealized Interest
                            </BodyText>
                            <Skeleton className="h-10 w-16 rounded-4" />
                        </div> */}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3 shadow-md">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <HeadingText
                                level="h4"
                                weight="medium"
                                className="text-gray-800"
                            >
                                Loading Vault Performance Metrics...
                            </HeadingText>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
                                >
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
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
                            <Percent className="h-5 w-5 text-green-600 drop-shadow-sm" />
                        </div>
                        <HeadingText
                            level="h4"
                            weight="medium"
                            className="text-gray-800"
                        >
                            Your Position
                        </HeadingText>
                    </div>
                    <div className="grid sm:grid-cols-2 max-md:gap-4">
                        <div className="flex flex-col items-start w-fit gap-1">
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-600"
                            >
                                Capital
                            </BodyText>
                            {!isLoadingPositionDetails && (
                                <HeadingText
                                    level="h3"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    $
                                    {abbreviateNumberWithoutRounding(
                                        convertNegativeToZero(
                                            Number(capital ?? 0)
                                        )
                                    )}
                                </HeadingText>
                            )}
                            {isLoadingPositionDetails && (
                                <Skeleton className="h-10 w-16 rounded-4" />
                            )}
                        </div>
                        <div className="flex flex-col items-start w-fit gap-1">
                            <InfoTooltip
                                label={
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        <TooltipText>
                                            Realized Interest
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        Total interest earned since your first
                                        deposit.
                                    </BodyText>
                                }
                            />
                            {!isLoadingPositionDetails && (
                                <HeadingText
                                    level="h3"
                                    weight="medium"
                                    className="text-gray-800 flex items-center gap-1"
                                >
                                    $
                                    {abbreviateNumberWithoutRounding(
                                        convertNegativeToZero(
                                            Number(totalInterestEarned ?? 0)
                                        )
                                    )}
                                </HeadingText>
                            )}
                            {isLoadingPositionDetails && (
                                <Skeleton className="h-10 w-16 rounded-4" />
                            )}
                        </div>
                        {/* <div className="flex flex-col items-start w-fit gap-1">
                            <InfoTooltip
                                label={
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        <TooltipText>
                                            Unrealized Interest
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={
                                    <div className="flex flex-col divide-y divide-gray-400">
                                        <div className="py-2">
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="text-gray-800 mb-2"
                                            >
                                                Understanding Your Interest
                                            </BodyText>
                                            <ul className="list-none text-gray-600 gap-2 space-y-2">
                                                <li className="text-sm text-gray-600">
                                                    <span className="font-medium pr-1">
                                                        Unrealized Interest
                                                    </span>
                                                    → Your share of vault&apos;s
                                                    accrued interest that will
                                                    be realized over the next 7
                                                    days.
                                                </li>
                                                <li className="text-sm text-gray-600">
                                                    <span className="font-medium pr-1">
                                                        Realized Interest
                                                    </span>
                                                    → Interest that has already
                                                    been released and is fully
                                                    yours.
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 py-3">
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-gray-700"
                                            >
                                                Your Unrealized Interest:
                                            </BodyText>
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="text-gray-800"
                                            >
                                                $
                                                {abbreviateNumberWithoutRounding(
                                                    convertNegativeToZero(
                                                        Number(
                                                            accruedInterest ?? 0
                                                        )
                                                    )
                                                )}
                                            </BodyText>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 py-3">
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-gray-700"
                                            >
                                                Vault&apos;s Unrealized
                                                Interest:
                                            </BodyText>
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="text-gray-800"
                                            >
                                                $
                                                {abbreviateNumberWithoutRounding(
                                                    convertNegativeToZero(
                                                        unrealizedVaultInterest
                                                    )
                                                )}
                                            </BodyText>
                                        </div>
                                        <div className="pb-2 pt-3">
                                            <CustomAlert
                                                variant="info"
                                                size="xs"
                                                hasPrefixIcon={false}
                                                description={
                                                    <BodyText
                                                        level="body3"
                                                        weight="normal"
                                                        className="text-gray-800"
                                                    >
                                                        <span className="font-medium pr-1">
                                                            Pro tip:
                                                        </span>
                                                        The longer you stay and
                                                        the bigger your share,
                                                        the more of the
                                                        vault&apos;s unrealized
                                                        interest you capture.
                                                    </BodyText>
                                                }
                                            />
                                        </div>
                                    </div>
                                }
                            />
                            {!isLoadingPositionDetails && (
                                <HeadingText
                                    level="h3"
                                    weight="medium"
                                    className="text-gray-800 flex items-center gap-1"
                                >
                                    $
                                    {abbreviateNumberWithoutRounding(
                                        convertNegativeToZero(
                                            Number(accruedInterest ?? 0)
                                        )
                                    )}
                                </HeadingText>
                            )}
                            {isLoadingPositionDetails && (
                                <Skeleton className="h-10 w-16 rounded-4" />
                            )}
                        </div> */}
                    </div>
                </CardContent>
            </Card>

            {selectedChain !== ChainId.Sonic && (
                <ClaimRewards
                    noDataUI={
                        <NoActivePositionUI
                            description={`You have no rewards to claim`}
                        />
                    }
                />
            )}

            {/* Section 3: Historical Spot APY Chart */}
            {/* <HistoricalSpotApyChart
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
            /> */}

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

            {/* Earn more info cards section */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                <TrendingUp className="h-5 w-5 text-green-600 drop-shadow-sm animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2">
                                <HeadingText
                                    level="h4"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    Here&apos;s How To Earn More
                                </HeadingText>
                                <InfoTooltip
                                    isResponsive={false}
                                    label={
                                        <CircleHelp className="h-5 w-5 text-gray-600 drop-shadow-sm" />
                                    }
                                    content={'Only applicable on Base yield.'}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${infoCardsLayout === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}`}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-orange-300">
                                <CardContent className="p-4">
                                    <motion.div
                                        className="flex items-center gap-2 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.3,
                                        }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-3 mr-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-6">
                                            <BarChart3 className="h-5 w-5 text-orange-700 drop-shadow-sm" />
                                        </div>
                                        <HeadingText
                                            level="h5"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Fair Share
                                        </HeadingText>
                                        {/* <InfoTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <BodyText
                                                        level="body2"
                                                        weight="normal"
                                                        className="text-gray-600"
                                                    >
                                                        Yield is shared fairly
                                                        as users enter the
                                                        vault. This can briefly
                                                        lower your returns — but
                                                        staying longer helps
                                                        balance things out.
                                                    </BodyText>
                                                    <BodyText
                                                        level="body3"
                                                        weight="normal"
                                                        className="text-gray-500"
                                                    >
                                                        <a
                                                            href={
                                                                UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL
                                                            }
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
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.5,
                                        }}
                                    >
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className="text-gray-600"
                                        >
                                            Earnings are released gradually to
                                            keep things fair. When new users
                                            enter, your unrealized interest
                                            might dip slightly but balances out
                                            over time.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-purple-300">
                                <CardContent className="p-4">
                                    <motion.div
                                        className="flex items-center gap-2 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.4,
                                        }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-200 to-purple-300 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12 hover:scale-110">
                                            <Target className="h-5 w-5 text-purple-700 drop-shadow-sm animate-pulse" />
                                        </div>
                                        <HeadingText
                                            level="h5"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Stay longer
                                        </HeadingText>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.6,
                                        }}
                                    >
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className="text-gray-600"
                                        >
                                            The longer you stay, the more of
                                            your unrealized interest is released
                                            as realized interest.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-green-300">
                                <CardContent className="p-4">
                                    <motion.div
                                        className="flex items-center gap-2 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.5,
                                        }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-200 to-green-300 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                            <ArrowDownToLine className="h-5 w-5 text-green-700 drop-shadow-sm" />
                                        </div>
                                        <HeadingText
                                            level="h5"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Deposit more
                                        </HeadingText>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.7,
                                        }}
                                    >
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className="text-gray-600"
                                        >
                                            Increasing your share of the vault
                                            can give your unrealized interest a
                                            quick boost.
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300">
                                <CardContent className="p-4">
                                    <motion.div
                                        className="flex items-center gap-2 mb-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.5,
                                        }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                            <Trophy className="h-5 w-5 text-blue-700 drop-shadow-sm" />
                                        </div>
                                        <HeadingText
                                            level="h5"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Loyalty pays
                                        </HeadingText>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.7,
                                        }}
                                    >
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className="text-gray-600"
                                        >
                                            When others exit early, their
                                            unrealized interest is
                                            redistributed, giving you a bonus!
                                        </BodyText>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
