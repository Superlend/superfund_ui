import { useQuery } from '@tanstack/react-query';
import { VAULT_ADDRESS, VAULT_STRATEGIES, VAULT_STRATEGIES_COLORS } from "@/lib/constants";
import { getStartTimestamp } from "@/lib/utils";
import { THistoricalDataPerformanceHistory } from "@/types";
import { Period } from "@/types/periodButtons";

// Make sure we're using the correct API URL
const INDEXER_API = process.env.NEXT_PUBLIC_INDEXER_API || 'https://api.funds.superlend.xyz';
console.log('🌐 Using API URL:', INDEXER_API);

// Fetch historical APY data
async function fetchHistoricalData(startTimestamp: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    console.log('📡 Sending API request to:', `${INDEXER_API}/vaults/history_apy`);
    const response = await fetch(`${INDEXER_API}/vaults/history_apy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        vault_address: VAULT_ADDRESS, 
        start_timestamp: startTimestamp 
      }),
      signal: controller.signal,
      cache: 'no-store'
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('⚠️ API request failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch rebalance history data
async function fetchRebalanceHistory(startTimestamp: number) {
  const response = await fetch(`${INDEXER_API}/vaults/history_rebalance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vault_address: VAULT_ADDRESS, start_timestamp: startTimestamp })
  });
  
  return response.json();
}

// Historical APY data hook with React Query
export function useHistoricalDataQuery(period: Period) {
  const startTimestamp = getStartTimestamp(period);
  
  // Add current timestamp to force refetch when needed
  const currentTimestamp = Date.now();
  
  return useQuery({
    queryKey: ['vault-historical-data', VAULT_ADDRESS, startTimestamp, Math.floor(currentTimestamp / (30 * 1000))], // Update every 30 seconds
    queryFn: async () => {
      console.log('🔍 Fetching historical data for period:', period, 'timestamp:', startTimestamp);
      const response = await fetchHistoricalData(startTimestamp);
      
      console.log('📊 API Response:', response);
      
      if (!response.success) {
        console.error('❌ API Error:', response.message || 'Unknown error');
        throw new Error(response.message || 'Failed to fetch historical data');
      }
      
      // Format data
      const formattedData = response.data.history.map((item: any) => ({
        timestamp: item.T,
        baseApy: item.BA,
        rewardsApy: item.RA,
        totalApy: item.BA + item.RA,
        totalAssets: item.TA
      }));
      
      // Extract 7-day averages
      const stats = response.data.vault_stats;
      console.log('📈 7-day averages from API:', {
        base_apy: stats.last_7_day_avg_base_apy,
        rewards_apy: stats.last_7_day_avg_rewards_apy,
        total_apy: stats.last_7_day_avg_total_apy
      });
      
      return {
        historicalData: formattedData,
        days_7_avg_base_apy: stats.last_7_day_avg_base_apy,
        days_7_avg_rewards_apy: stats.last_7_day_avg_rewards_apy,
        days_7_avg_total_apy: stats.last_7_day_avg_total_apy
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

// Rebalance history hook with React Query
export function useRebalanceHistoryQuery(period: Period) {
  const startTimestamp = getStartTimestamp(period);
  
  return useQuery({
    queryKey: ['vault-rebalance-history', VAULT_ADDRESS, startTimestamp],
    queryFn: async () => {
      const response = await fetchRebalanceHistory(startTimestamp);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch rebalance history');
      }
      
      // Format data
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 