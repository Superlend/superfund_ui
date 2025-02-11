import { VAULT_ADDRESS, VAULT_STRATEGIES } from "@/lib/constants";
import { THistoricalDataPerformanceHistory, THistoricalDataRebalanceHistory } from "@/types";
import { Period } from "@/types/periodButtons";
import { useEffect, useState } from "react";

// export function getPeriodData(period: Period, chartData: any) {
// }


const INDEXER_API = 'https://api.funds.superlend.xyz'

export function useHistoricalData(period: Period) {
    const [historicalData, setHistoricalData] = useState<THistoricalDataPerformanceHistory[]>([])
    const [days_7_avg_base_apy, setDays_7_avg_base_apy] = useState<number>(0)
    const [days_7_avg_rewards_apy, setDays_7_avg_rewards_apy] = useState<number>(0)
    const [days_7_avg_total_apy, setDays_7_avg_total_apy] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function fetchHistoricalData(startTimestamp: number) {
        if (isLoading) return
        setIsLoading(true)
        const response = await fetch(`${INDEXER_API}/vaults/history_apy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vault_address: VAULT_ADDRESS, start_timestamp: startTimestamp })
        });
        setIsLoading(false)
        return response.json();
    }

    useEffect(() => {
        let startTimeStamp = getStartTimestamp(period)
        fetchHistoricalData(startTimeStamp).then((response) => {
            if (response.success && response.data) {
                const formattedData = response.data.history.map((item: any) => ({
                    timestamp: item.T,
                    baseApy: item.BA,
                    rewardsApy: item.RA,
                    totalApy: item.BA + item.RA,
                    totalAssets: item.TA
                }));
                setHistoricalData(formattedData);

                // console.table(formattedData)

                // Set 7-day averages
                const stats = response.data.vault_stats;
                setDays_7_avg_base_apy(stats.last_7_day_avg_base_apy);
                setDays_7_avg_rewards_apy(stats.last_7_day_avg_rewards_apy);
                setDays_7_avg_total_apy(stats.last_7_day_avg_total_apy);
            }
        }).catch((error) => {
            setError(error.message || 'Failed to fetch data');
        })
    }, [period])

    return {
        historicalData,
        days_7_avg_base_apy,
        days_7_avg_rewards_apy,
        days_7_avg_total_apy,
        isLoading,
        error
    }
}


export function useRebalanceHistory(period: Period) {
    const [rebalanceHistory, setRebalanceHistory] = useState<THistoricalDataPerformanceHistory[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function fetchRebalanceHistory(startTimestamp: number) {
        if (isLoading) return
        setIsLoading(true)
        const response = await fetch(`${INDEXER_API}/vaults/history_rebalance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vault_address: VAULT_ADDRESS, start_timestamp: startTimestamp })
        });
        setIsLoading(false)
        return response.json();
    }

    useEffect(() => {
        let startTimeStamp = getStartTimestamp(period)
        fetchRebalanceHistory(startTimeStamp).then((response) => {
            if (response.success && response.data) {
                const formattedData = response.data.map((item: any) => {
                    // Get allocations with strategy names
                    const allocations = Object.entries(item.A).map(([address, value]) => {
                        // Find strategy name from VAULT_STRATEGIES
                        const strategyName = Object.entries(VAULT_STRATEGIES).find(
                            ([_, strategy]) => strategy.address.toLowerCase() === address.toLowerCase()
                        )?.[0] || (address === '0x0000000000000000000000000000000000000000' ? 'CASH_RESERVE' : address);

                        return {
                            name: strategyName,
                            address: address,
                            value: value as number
                        }
                    });

                    return {
                        timestamp: item.T,
                        totalAssets: item.TA,
                        allocations
                    }
                });

                setRebalanceHistory(formattedData);
            }
        }).catch((error) => {
            setError(error.message || 'Failed to fetch data');
        })
    }, [period])

    return {
        rebalanceHistory,
        isLoading,
        error
    }

}

function getStartTimestamp(period: Period) {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    switch (period) {
        case Period.allTime:
            return 0
        case Period.oneMonth:
            return currentTimestamp - 86400 * 30
        case Period.oneWeek:
            return currentTimestamp - 86400 * 7
        case Period.oneDay:
            return currentTimestamp - 86400
    }
}
