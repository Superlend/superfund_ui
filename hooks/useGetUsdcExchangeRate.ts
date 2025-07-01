'use client'

import { getUsdcExchangeRate, UsdcExchangeRateParams, UsdcExchangeRateResponse } from '@/queries/get-usdc-exchange-rate'
import { useQuery } from '@tanstack/react-query'

export interface UseUsdcExchangeRateProps {
  vaultAddress: string
  chainId: number
  blockNumbers: string[]
  fallbackUsdcPrice?: number
  enabled?: boolean
}

export default function useGetUsdcExchangeRate({
  vaultAddress,
  chainId,
  blockNumbers,
  fallbackUsdcPrice = 1,
  enabled = true
}: UseUsdcExchangeRateProps) {
  const { data, isLoading, isError, refetch } = useQuery<
    UsdcExchangeRateResponse,
    Error
  >({
    queryKey: ['usdc-exchange-rate', vaultAddress, chainId, blockNumbers.sort().join(',')],
    queryFn: async () => {
      try {
        const responseData = await getUsdcExchangeRate({
          vaultAddress,
          chainId,
          blockNumbers
        })
        return responseData
      } catch (error) {
        console.error('Error fetching USDC exchange rates:', error)
        throw error // Re-throw to trigger error state
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour - exchange rates for specific blocks are historical and won't change
    retry: 2, // Retry failed requests twice
    enabled: enabled && !!vaultAddress && !!chainId && blockNumbers.length > 0,
  })

  // Helper function to get exchange rate for a specific block with fallback
  const getExchangeRateForBlock = (blockNumber: string): number => {
    // If API failed or data not available, use fallback USDC price
    if (isError || !data || !data[blockNumber]) {
      return fallbackUsdcPrice
    }
    return data[blockNumber].exchangeRateFormatted
  }

  return { 
    data: data || {}, 
    isLoading, 
    isError, 
    refetch,
    getExchangeRateForBlock,
    // Helper to check if we're using fallback values
    isUsingFallback: isError || !data || Object.keys(data).length === 0
  }
} 