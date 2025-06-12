import { useChain } from "@/context/chain-context";
import { VAULT_ADDRESS, VAULT_ADDRESS_MAP, VAULT_STRATEGIES, VAULT_STRATEGIES_COLORS } from "@/lib/constants";
import { getStartTimestamp } from "@/lib/utils";
import { THistoricalDataPerformanceHistory, THistoricalDataRebalanceHistory } from "@/types";
import { Period } from "@/types/periodButtons";
import { useQuery } from "@tanstack/react-query";

// export function getPeriodData(period: Period, chartData: any) {
// }


const INDEXER_API = process.env.NEXT_PUBLIC_INDEXER_API || 'https://api.funds.superlend.xyz'

// ✅ Optimization 3.1: Convert useHistoricalData to React Query for better caching
export function useHistoricalData({
    period,
    chain_id
}: {
    period?: Period
    chain_id?: number
}) {
    const { selectedChain } = useChain()

    // Use the provided chain_id or fall back to selectedChain
    const effectiveChainId = chain_id || selectedChain

    const { data, isLoading, error } = useQuery({
        queryKey: ['historical-data', effectiveChainId, period],
        queryFn: async () => {
            const startTimestamp = period ? getStartTimestamp(period) : undefined
            const response = await fetch(`${INDEXER_API}/vaults/history_apy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vault_address: VAULT_ADDRESS_MAP[effectiveChainId as keyof typeof VAULT_ADDRESS_MAP],
                    ...(startTimestamp && { start_timestamp: startTimestamp })
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to fetch historical data');
            }

            const formattedData = result.data.history.map((item: any) => ({
                timestamp: item.T,
                baseApy: item.BA,
                rewardsApy: item.RA,
                totalApy: item.BA + item.RA,
                totalAssets: item.TA,
                spotApy: item.SA
            }));

            return {
                historicalData: formattedData,
                days_7_avg_base_apy: result.data.vault_stats.last_7_day_avg_base_apy,
                days_7_avg_rewards_apy: result.data.vault_stats.last_7_day_avg_rewards_apy,
                days_7_avg_total_apy: result.data.vault_stats.last_7_day_avg_total_apy,
            };
        },
        staleTime: 15 * 60 * 1000, // 15 minutes - historical data doesn't change frequently
        enabled: !!effectiveChainId,
    });

    return {
        historicalData: data?.historicalData || [],
        days_7_avg_base_apy: data?.days_7_avg_base_apy || 0,
        days_7_avg_rewards_apy: data?.days_7_avg_rewards_apy || 0,
        days_7_avg_total_apy: data?.days_7_avg_total_apy || 0,
        isLoading,
        error: error ? (error as Error).message : null
    }
}

// ✅ Optimization 3.2: Convert useRebalanceHistory to React Query for better caching
export function useRebalanceHistory(period: Period) {
    const { selectedChain } = useChain()

    const { data, isLoading, error } = useQuery({
        queryKey: ['rebalance-history', selectedChain, period],
        queryFn: async () => {
            const startTimestamp = getStartTimestamp(period)
            const response = await fetch(`${INDEXER_API}/vaults/history_rebalance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP], 
                    start_timestamp: startTimestamp 
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to fetch rebalance history');
            }

            const formattedData = result.data.map((item: any) => {
                // Get allocations with strategy names
                const allocations = Object.entries(item.A).map(([address, value]) => {
                    // Find strategy name from VAULT_STRATEGIES
                    const strategyName = Object.entries(VAULT_STRATEGIES).find(
                        ([_, strategy]) => strategy.address.toLowerCase() === address.toLowerCase()
                    )?.[0] || (address === '0x0000000000000000000000000000000000000000' ? 'CASH_RESERVE' : address);

                    return {
                        name: strategyName,
                        address: address,
                        value: value as number,
                        color: VAULT_STRATEGIES_COLORS[strategyName as keyof typeof VAULT_STRATEGIES_COLORS]
                    }
                });

                return {
                    timestamp: item.T,
                    totalAssets: item.TA,
                    allocations
                }
            });

            return formattedData;
        },
        staleTime: 15 * 60 * 1000, // 15 minutes - rebalance history doesn't change frequently
        enabled: !!selectedChain,
    });

    return {
        rebalanceHistory: data || [],
        isLoading,
        error: error ? (error as Error).message : null
    }
}
