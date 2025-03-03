'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React from "react"
import InterestHistoryChart from '@/components/interest-history-chart'
import DepositHistoryChart from '@/components/deposit-history-chart'
import ClaimRewards from "./claim-rewards"

export default function PositionDetails() {

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col gap-[40px]"
        >
            <ClaimRewards />
            {/* <InterestHistoryChart
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
            /> */}
        </motion.div>
    )
}