'use client'

import { Period } from "@/types/periodButtons"
import { motion } from "motion/react"
import React, { useState } from "react"
import DepositHistoryChart from '@/components/deposit-history-chart'
import ClaimRewards from "./claim-rewards"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import DailyEarningsHistoryChart from "@/components/daily-earnings-history-chart"

export default function PositionDetails() {
    const { isWalletConnected, isConnectingWallet } = useWalletConnection()

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col gap-[40px]"
        >
            {isWalletConnected && <ClaimRewards />}
            <DailyEarningsHistoryChart />
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