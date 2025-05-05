'use client'

import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import ImageWithDefault from "@/components/ImageWithDefault"
import ExternalLink from "@/components/ExternalLink"
import AllocationDetailsChart from "@/components/allocation-details-chart"
import { useVaultAllocationPoints } from "@/hooks/vault_hooks/vaultHook"
import { motion } from "motion/react"
import { rebalancedAssetsList, tokensSupportedList } from "@/data/abi/vault-data"
import { DOCUMENTATION_LINK } from "@/constants"
import React, { lazy, Suspense } from "react"
import LazyLoad from '@/components/LazyLoad'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import TooltipText from '@/components/tooltips/TooltipText'
import { useChain } from '@/context/chain-context'
import clsx from 'clsx'

const AllocationHistoryChart = lazy(() =>
    import('@/components/allocation-history-chart').then(module => ({
        default: module.AllocationHistoryChart
    }))
)

const PerformanceHistoryChart = lazy(() =>
    import('@/components/performance-history-chart').then(module => ({
        default: module.PerformanceHistoryChart
    }))
)

const BenchmarkHistoryChart = lazy(() =>
    import('@/components/benchmark-history-chart').then(module => ({
        default: module.BenchmarkHistoryChart
    }))
)

const BenchmarkYieldTable = lazy(() =>
    import('@/components/benchmark-yield-table').then(module => ({
        default: module.BenchmarkYieldTable
    }))
)

export default function FundOverview() {
    const { allocationPoints } = useVaultAllocationPoints()
    const { selectedChain, chainDetails } = useChain()
    const currentChainDetails = chainDetails[selectedChain as keyof typeof chainDetails]
    const rebalancedAssetsListFiltered = rebalancedAssetsList.filter((token) => token.chainIds.includes(selectedChain))
    const gridColsClass = `md:grid-cols-${rebalancedAssetsListFiltered.length > 4 ? 4 : rebalancedAssetsListFiltered.length}`
    const CONTRACT_LINK = `${currentChainDetails?.explorerUrl}${currentChainDetails?.contractAddress}`

    const footerRows = [
        {
            id: 'Documentation',
            column_1: () => <BodyText level="body1" weight="medium">Documentation</BodyText>,
            column_2: () => <BodyText level="body1" weight="medium">Updated Recently</BodyText>,
            column_3: () => <ExternalLink href={DOCUMENTATION_LINK} className="font-medium" variant="secondary">View documentation</ExternalLink>
        },
        {
            id: 'Performance Fees',
            column_1: () => <BodyText level="body1" weight="medium">Performance Fees</BodyText>,
            column_2: () => <BodyText level="body1" weight="medium">Every Rebalance</BodyText>,
            column_3: () => <BodyText level="body1" weight="medium">10% of earnings</BodyText>
        },
        {
            id: 'Contract',
            column_1: () => <BodyText level="body1" weight="medium">Contract</BodyText>,
            column_2: () => null,
            column_3: () => <ExternalLink href={CONTRACT_LINK} className="font-medium" variant="secondary">View contract</ExternalLink>
        }
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
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Fund Information
                </HeadingText>
                <BodyText
                    level="body1"
                    weight="normal"
                    className="text-gray-600"
                >
                    This SuperFund optimally allocates your USDC across trusted
                    blue-chip lending protocols such as Aave, Morpho, Euler, & Fluid to
                    generate consistent and competitive returns. It is a
                    low-risk, high-reliability investment vault designed for
                    users looking to maximize yield on their stable coins in a
                    safe and efficient way.
                </BodyText>
            </section>
            <section className="block flex flex-col gap-4" id="tokens-supported">
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Tokens Supported
                </HeadingText>
                <Card>
                    <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                        {
                            tokensSupportedList
                                .filter((token) => token.chainId === selectedChain)
                                .map((token) => (
                                    <div className="item flex items-center justify-between gap-[12px] py-6 first:pt-2 last:pb-2" key={token.title}>
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
                                        <ExternalLink href={token.link} className="font-medium">
                                            Contract
                                        </ExternalLink>
                                    </div>
                                ))
                        }
                    </CardContent>
                </Card>
            </section>
            <section
                className="block flex flex-col gap-4"
                id="rebalanced-across"
            >
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Rebalanced Across
                </HeadingText>
                <Card>
                    <CardContent className={
                        clsx(
                            'p-5 flex items-center justify-center flex-wrap gap-6 sm:gap-8 lg:gap-12 sm:px-6 xl:px-24',
                        )
                    }>
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
                                        <BodyText level="body1" weight="medium" className="uppercase">
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
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}>
                    <PerformanceHistoryChart />
                </Suspense>
            </LazyLoad>
            <LazyLoad>
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}>
                    <BenchmarkHistoryChart />
                </Suspense>
            </LazyLoad>
            <LazyLoad>
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}>
                    <BenchmarkYieldTable />
                </Suspense>
            </LazyLoad>
            <AllocationDetailsChart allocationPoints={allocationPoints} />
            <LazyLoad>
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}>
                    <AllocationHistoryChart />
                </Suspense>
            </LazyLoad>
            <section className="block flex flex-col gap-4">
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Additional Information
                </HeadingText>
                <Card>
                    <CardContent className="px-4 md:px-9 py-8 bg-gray-100/50 divide-y divide-gray-400">
                        {/* <div className="row flex max-lg:flex-col flex-wrap gap-8 items-center justify-between py-6 first:pt-2 last:pb-2">
                            <div className="col flex-1 flex items-center gap-2">
                                <BodyText level="body1" weight="medium">
                                    Audit Report
                                </BodyText>
                                <div className="h-[16px] w-[2px] bg-gray-500" />
                                <BodyText level="body1" weight="medium">
                                    Yauditors
                                </BodyText>
                            </div>

                            <div className="col flex-1">
                                <BodyText level="body2" weight="medium" className="text-gray-600 text-center">
                                    20 Jan 2025
                                </BodyText>
                            </div>
                            <div className="col flex-1 flex justify-end">
                                <ExternalLink href="/" className="font-medium" variant="secondary">
                                    <BodyText level="body2" weight="medium">
                                        View Report
                                    </BodyText>
                                </ExternalLink>
                            </div>
                        </div> */}
                        {
                            footerRows.map((row) => (
                                <div key={row.id} className="row flex gap-8 items-center justify-between py-6 first:pt-2 last:pb-2">
                                    <div className="col flex-0 md:flex-1 flex flex-col items-start gap-0">
                                        <BodyText level="body1" weight="medium">
                                            {row.column_1()}
                                        </BodyText>
                                        {row.column_2() &&
                                            <Label
                                                size='small'
                                                weight="medium"
                                                className="md:hidden text-gray-600 text-center"
                                            >
                                                {row.column_2()}
                                            </Label>
                                        }
                                    </div>

                                    {row.column_2() &&
                                        <div className="col flex-0 md:flex-1">
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="hidden md:block text-gray-600 text-center"
                                            >
                                                {row.column_2()}
                                            </BodyText>
                                        </div>
                                    }
                                    <div className="col flex-1 flex justify-end">
                                        <BodyText level="body1" weight="medium" className="text-gray-800 text-right">
                                            {row.column_3()}
                                        </BodyText>
                                    </div>
                                </div>
                            ))
                        }
                    </CardContent>
                </Card>
            </section>
        </motion.div>
    )
}
