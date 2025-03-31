import { Period } from "@/types/periodButtons";
import { useHistoricalDataQuery, useRebalanceHistoryQuery } from "./useVaultQueries";

/**
 * Compatibility hook that uses the React Query implementation
 * but provides the same API as the original useHistoricalData hook
 */
export function useHistoricalDataCompat(period: Period) {
  const { data, isLoading, error } = useHistoricalDataQuery(period);
  
  console.log('🔄 useHistoricalDataCompat - received data:', data);
  
  const returnValue = {
    historicalData: data?.historicalData || [],
    days_7_avg_base_apy: data?.days_7_avg_base_apy || 0,
    days_7_avg_rewards_apy: data?.days_7_avg_rewards_apy || 0,
    days_7_avg_total_apy: data?.days_7_avg_total_apy || 0,
    isLoading,
    error: error ? (error as Error).message : null
  };
  
  console.log('🔄 useHistoricalDataCompat - returning:', returnValue);
  
  return returnValue;
}

/**
 * Compatibility hook that uses the React Query implementation
 * but provides the same API as the original useRebalanceHistory hook
 */
export function useRebalanceHistoryCompat(period: Period) {
  const { data, isLoading, error } = useRebalanceHistoryQuery(period);
  
  return {
    rebalanceHistory: data || [],
    isLoading,
    error: error ? (error as Error).message : null
  };
} 