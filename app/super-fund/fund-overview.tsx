'use client'

import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import ImageWithDefault from '@/components/ImageWithDefault'
import ExternalLink from '@/components/ExternalLink'
// import AllocationDetailsChart from '@/components/allocation-details-chart'
import { useVaultAllocationPoints } from '@/hooks/vault_hooks/vaultHook'
import { motion } from 'motion/react'
import {
    rebalancedAssetsList,
    tokensSupportedList,
} from '@/data/abi/vault-data'
import { DOCUMENTATION_LINK } from '@/constants'
import React, { lazy, Suspense, useState } from 'react'
import LazyLoad from '@/components/LazyLoad'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { useChain } from '@/context/chain-context'
import clsx from 'clsx'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { Period } from '@/types/periodButtons'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import {
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    Sector,
    Cell,
    Label as RechartsLabel,
} from 'recharts'
import { PieSectorDataItem } from 'recharts/types/polar/Pie'
import {
    VAULT_STRATEGIES_COLORS_MAP,
    VAULT_STRATEGIES_MAP,
} from '@/lib/constants'

const AllocationHistoryChart = lazy(() =>
    import('@/components/allocation-history-chart').then((module) => ({
        default: module.AllocationHistoryChart,
    }))
)

const HistoricalSpotApyChart = lazy(
    () => import('@/components/historical-spot-apy-chart')
)

const BenchmarkHistoryChart = lazy(() =>
    import('@/components/benchmark-history-chart').then((module) => ({
        default: module.BenchmarkHistoryChart,
    }))
)

const BenchmarkYieldTable = lazy(() =>
    import('@/components/benchmark-yield-table').then((module) => ({
        default: module.BenchmarkYieldTable,
    }))
)

const allocatedAssetDetails = {
    name: 'Loading...',
    value: '0',
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">{payload[0].name}</p>
                <p className="text-sm text-muted-foreground">
                    {payload[0].value}%
                </p>
            </div>
        )
    }
    return null
}

export default function FundOverview() {
    const { allocationPoints } = useVaultAllocationPoints()
    const { selectedChain, chainDetails } = useChain()
    const { logEvent } = useAnalytics()
    const currentChainDetails =
        chainDetails[selectedChain as keyof typeof chainDetails]
    const rebalancedAssetsListFiltered = rebalancedAssetsList.filter((token) =>
        token.chainIds.includes(selectedChain)
    )
    const gridColsClass = `md:grid-cols-${rebalancedAssetsListFiltered.length > 4 ? 4 : rebalancedAssetsListFiltered.length}`
    const CONTRACT_LINK = `${currentChainDetails?.explorerUrl}${currentChainDetails?.contractAddress}`
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
    const vaultStrategies =
        VAULT_STRATEGIES_MAP[selectedChain as keyof typeof VAULT_STRATEGIES_MAP]
    const vaultStrategiesColors =
        VAULT_STRATEGIES_COLORS_MAP[
            selectedChain as keyof typeof VAULT_STRATEGIES_COLORS_MAP
        ]
    const getHighestValueAssetDetails = allocationPoints?.length
        ? allocationPoints.reduce(
              (max, current) => (current.value > max.value ? current : max),
              allocationPoints[0]
          )
        : { name: 'Loading...', value: 0 }
    const highestAllocation = getHighestValueAssetDetails
    allocatedAssetDetails.name = highestAllocation.name
    allocatedAssetDetails.value = highestAllocation.value.toString()
    const truncatedAssetName =
        allocatedAssetDetails.name.length > 15
            ? allocatedAssetDetails.name.slice(0, 15) + '...'
            : allocatedAssetDetails.name

    const logDocumentationLinkClick = () => {
        logEvent('clicked_documentation_link', {
            chain: selectedChain,
            url: DOCUMENTATION_LINK,
        })
    }

    const logContractLinkClick = () => {
        logEvent('clicked_contract_link', {
            chain: selectedChain,
            url: CONTRACT_LINK,
        })
    }

    const footerRows = [
        {
            id: 'Documentation',
            column_1: () => (
                <BodyText level="body1" weight="medium">
                    Documentation
                </BodyText>
            ),
            column_2: () => (
                <BodyText level="body1" weight="medium">
                    Updated Recently
                </BodyText>
            ),
            column_3: () => (
                <ExternalLink
                    href={DOCUMENTATION_LINK}
                    className="font-medium"
                    variant="secondary"
                    onClick={logDocumentationLinkClick}
                >
                    View <span className="hidden md:inline">documentation</span>
                </ExternalLink>
            ),
        },
        {
            id: 'Performance Fees',
            column_1: () => (
                <BodyText level="body1" weight="medium">
                    Performance Fees
                </BodyText>
            ),
            column_2: () => (
                <BodyText level="body1" weight="medium">
                    Every Rebalance
                </BodyText>
            ),
            column_3: () => (
                <BodyText level="body1" weight="medium">
                    10% of earnings
                </BodyText>
            ),
        },
        {
            id: 'Contract',
            column_1: () => (
                <BodyText level="body1" weight="medium">
                    Contract
                </BodyText>
            ),
            column_2: () => null,
            column_3: () => (
                <ExternalLink
                    href={CONTRACT_LINK}
                    className="font-medium"
                    variant="secondary"
                    onClick={logContractLinkClick}
                >
                    View <span className="hidden md:inline">contract</span>
                </ExternalLink>
            ),
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col gap-[40px]"
        >
            <section
                className="block flex flex-col gap-2"
                id="fund-information"
            >
                <HeadingText
                    level="h4"
                    weight="medium"
                    className="text-gray-800"
                >
                    Fund Information
                </HeadingText>
                <BodyText
                    level="body1"
                    weight="normal"
                    className="text-gray-600"
                >
                    This USDC SuperFund optimally allocates your USDC across
                    trusted blue-chip lending protocols such as Aave, Morpho,
                    Euler, & Fluid to generate consistent and competitive
                    returns. It is a low-risk, high-reliability investment vault
                    designed for users looking to maximize yield on their stable
                    coins in a safe and efficient way.
                </BodyText>
            </section>
            <section
                className="block flex flex-col gap-4"
                id="tokens-supported"
            >
                <HeadingText
                    level="h4"
                    weight="medium"
                    className="text-gray-800"
                >
                    Tokens Supported
                </HeadingText>
                <Card>
                    <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                        {tokensSupportedList
                            .filter((token) => token.chainId === selectedChain)
                            .map((token) => (
                                <div
                                    className="item flex items-center justify-between gap-[12px] py-6 first:pt-2 last:pb-2"
                                    key={token.title}
                                >
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
                                    <ExternalLink
                                        href={token.link}
                                        className="font-medium"
                                    >
                                        Contract
                                    </ExternalLink>
                                </div>
                            ))}
                    </CardContent>
                </Card>
            </section>
            <section
                className="block flex flex-col gap-4"
                id="rebalanced-across"
            >
                <HeadingText
                    level="h4"
                    weight="medium"
                    className="text-gray-800"
                >
                    Rebalanced Across
                </HeadingText>
                <Card>
                    <CardContent
                        className={clsx(
                            'p-5 grid min-[320px]:grid-cols-2 md:grid-cols-3 items-center justify-center gap-6 sm:px-6 xl:px-24'
                        )}
                    >
                        {rebalancedAssetsListFiltered.map((token) => (
                            <div
                                className="item flex items-center gap-2"
                                key={token.title}
                            >
                                <ImageWithDefault
                                    src={token.logo}
                                    alt={token.title}
                                    width={24}
                                    height={24}
                                />
                                <div className="flex items-center gap-1">
                                    <ExternalLink
                                        href={token.link}
                                        className="font-medium text-gray-500 stroke-gray-600"
                                        variant="ghost"
                                        iconSize={14}
                                    >
                                        <BodyText
                                            level="body1"
                                            weight="medium"
                                            className="uppercase shrink-0"
                                        >
                                            {token.title}
                                        </BodyText>
                                    </ExternalLink>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
            <LazyLoad>
                <Suspense
                    fallback={<LoadingSectionSkeleton className="h-[300px]" />}
                >
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
                </Suspense>
            </LazyLoad>
            <LazyLoad>
                <Suspense
                    fallback={<LoadingSectionSkeleton className="h-[300px]" />}
                >
                    <BenchmarkHistoryChart />
                </Suspense>
            </LazyLoad>
            <LazyLoad>
                <Suspense
                    fallback={<LoadingSectionSkeleton className="h-[300px]" />}
                >
                    <BenchmarkYieldTable />
                </Suspense>
            </LazyLoad>
            {/* <AllocationDetailsChart allocationPoints={allocationPoints} /> */}
            <LazyLoad>
                <Suspense
                    fallback={<LoadingSectionSkeleton className="h-[300px]" />}
                >
                    <AllocationHistoryChart />
                </Suspense>
            </LazyLoad>
            <section className="block flex flex-col gap-4">
                <HeadingText
                    level="h4"
                    weight="medium"
                    className="text-gray-800"
                >
                    Additional Information
                </HeadingText>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,auto)_minmax(250px,280px)] gap-4">
                    <Card>
                        <CardContent className="relative bg-gray-100/50 p-0 pt-10 pb-4">
                            <div className="w-full flex justify-start py-4 px-6 absolute top-2 left-0">
                                <HeadingText
                                    level="h4"
                                    weight="medium"
                                    className="text-gray-600"
                                >
                                    Current Allocation
                                </HeadingText>
                            </div>
                            <div className="relative h-[320px] w-[260px] max-w-[260px] m-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart
                                        margin={{
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            left: 0,
                                        }}
                                    >
                                        <Pie
                                            data={allocationPoints}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={0}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            startAngle={90}
                                            endAngle={450}
                                            minAngle={0}
                                            nameKey="name"
                                            cornerRadius={4}
                                            activeShape={({
                                                outerRadius = 0,
                                                ...props
                                            }: PieSectorDataItem) => (
                                                <Sector
                                                    {...props}
                                                    outerRadius={
                                                        outerRadius + 10
                                                    }
                                                    className="cursor-pointer transition-all duration-300 hover:opacity-80"
                                                />
                                            )}
                                        >
                                            {allocationPoints
                                                .sort(
                                                    (a, b) => b.value - a.value
                                                )
                                                .map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            vaultStrategiesColors[
                                                                entry.name as keyof typeof vaultStrategiesColors
                                                            ]
                                                        }
                                                    />
                                                ))}
                                            <RechartsLabel
                                                content={({ viewBox }) => {
                                                    if (
                                                        viewBox &&
                                                        'cx' in viewBox &&
                                                        'cy' in viewBox
                                                    ) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={
                                                                        viewBox.cx
                                                                    }
                                                                    y={
                                                                        (viewBox?.cy ||
                                                                            0) -
                                                                        2
                                                                    }
                                                                    className="fill-foreground text-2xl font-medium"
                                                                >
                                                                    {allocatedAssetDetails.value.toLocaleString()}
                                                                    %
                                                                </tspan>
                                                                <tspan
                                                                    x={
                                                                        viewBox.cx
                                                                    }
                                                                    y={
                                                                        (viewBox.cy ||
                                                                            0) +
                                                                        24
                                                                    }
                                                                    className="fill-muted-foreground text-sm"
                                                                >
                                                                    {truncatedAssetName.toString()}
                                                                </tspan>
                                                            </text>
                                                        )
                                                    }
                                                }}
                                            />
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="px-4 md:px-9 py-8 bg-gray-100/50 h-full divide-y divide-gray-400">
                            {footerRows.map((row) => (
                                <div
                                    key={row.id}
                                    className="flex flex-col py-6 first:pt-2 last:pb-2"
                                >
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        {row.column_1()}
                                    </BodyText>
                                    <BodyText
                                        level="body1"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        {row.column_3()}
                                    </BodyText>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>
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
