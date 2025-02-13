'use client'

import { BodyText, HeadingText } from '@/components/ui/typography'
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
import { PerformanceHistoryChart } from '@/components/performance-history-chart'

const AllocationHistoryChart = lazy(() =>
    import('@/components/allocation-history-chart').then(module => ({
        default: module.AllocationHistoryChart
    }))
)

// const PerformanceHistoryChart = lazy(() =>
//     import('@/components/performance-history-chart').then(module => ({
//         default: module.PerformanceHistoryChart
//     }))
// )

export default function FundOverview() {
    const { allocationPoints } = useVaultAllocationPoints()

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
                <HeadingText level="h4" weight="medium">
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
                <HeadingText level="h4" weight="medium">
                    Tokens Suported
                </HeadingText>
                <Card>
                    <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                        {
                            tokensSupportedList.map((token) => (
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
                <HeadingText level="h4" weight="medium">
                    Rebalanced Across
                </HeadingText>
                <Card>
                    <CardContent className="p-5 flex flex-wrap items-center justify-between gap-6 sm:gap-4 sm:px-6 xl:px-24">
                        {rebalancedAssetsList.map((token) => (
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
                                        <BodyText level="body1" weight="medium">
                                            {token.title}
                                        </BodyText>
                                    </ExternalLink>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
            {/* <LazyLoad>
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}> */}
            <PerformanceHistoryChart />
            {/* </Suspense>
            </LazyLoad> */}
            <AllocationDetailsChart allocationPoints={allocationPoints} />
            <LazyLoad>
                <Suspense fallback={<LoadingSectionSkeleton className="h-[300px]" />}>
                    <AllocationHistoryChart />
                </Suspense>
            </LazyLoad>
            <section className="block flex flex-col gap-4">
                <HeadingText level="h4" weight="medium">
                    Additional Information
                </HeadingText>
                <Card>
                    <CardContent className="px-9 py-8 bg-gray-100/50 divide-y divide-gray-400">
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
                        <div className="row flex max-lg:flex-col flex-wrap gap-8 items-center justify-between py-6 first:pt-2 last:pb-2">
                            <div className="col flex-1 flex items-center gap-2">
                                <BodyText level="body1" weight="medium">
                                    Documentation
                                </BodyText>
                            </div>

                            <div className="col flex-1">
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-600 text-center"
                                >
                                    Updated Recently
                                </BodyText>
                            </div>
                            <div className="col flex-1 flex justify-end">
                                <ExternalLink
                                    href={DOCUMENTATION_LINK}
                                    className="font-medium"
                                    variant="secondary"
                                >
                                    <BodyText level="body2" weight="medium" className="shrink-0">
                                        View documentation
                                    </BodyText>
                                </ExternalLink>
                            </div>
                        </div>
                        <div className="row flex max-lg:flex-col flex-wrap gap-8 items-center justify-between py-6 first:pt-2 last:pb-2">
                            <div className="col flex-1 flex items-center gap-2">
                                <BodyText level="body1" weight="medium">
                                    Management Fees
                                </BodyText>
                            </div>

                            <div className="col flex-1">
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-600 text-center"
                                >
                                    Every Rebalance
                                </BodyText>
                            </div>
                            <div className="col flex-1 flex justify-end">
                                <BodyText level="body1" weight="medium">
                                    10% of earnings
                                </BodyText>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </motion.div>
    )
}
