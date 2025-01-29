'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React from "react"
import InterestHistoryChart from '@/components/interest-history-chart'
import DepositHistoryChart from '@/components/deposit-history-chart'
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


export default function PositionDetails() {

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col gap-[40px]"
        >
            <ClaimRewards />
            <InterestHistoryChart
                selectedRange={Period.oneMonth}
                handleRangeChange={() => { }}
                selectedFilter={Period.oneMonth}
                handleFilterChange={() => { }}
                chartData={[]}
                disableCategoryFilters={[]}
            />
            <DepositHistoryChart
                selectedRange={Period.oneMonth}
                handleRangeChange={() => { }}
                selectedFilter={Period.oneMonth}
                handleFilterChange={() => { }}
                chartData={[]}
                disableCategoryFilters={[]}
            />
        </motion.div>
    )
}

const rewardTokens = [
    {
        title: 'MORPHO',
        logo: 'https://cdn.morpho.org/assets/logos/morpho.svg',
        amount: '4.21',
    },
    {
        title: 'USDC',
        logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        amount: '6.82',
    },

]

function ClaimRewards() {
    return (
        <Card>
            <CardContent className="flex flex-col divide-y divide-gray-400 px-8 py-5">
                {rewardTokens.map(token => (
                    <div className="item flex items-center justify-between gap-[12px] py-3 first:pt-2 last:pb-2" key={token.title}>
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
                        <BodyText level="body1" weight="medium">
                            {token.amount}
                        </BodyText>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="relative overflow-hidden rounded-4 md:rounded-6 p-0">
                <ImageWithDefault
                    src="/images/claim-rewards-banner.png"
                    alt="Claim rewards"
                    width={800}
                    height={500}
                    className="w-full h-full object-cover"
                />
                <div className="absolute right-2 lg:right-10 z-10">
                    <Button
                        size={'lg'}
                        variant="secondary"
                        className="uppercase rounded-5">
                        <span className="px-10">Claim</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
