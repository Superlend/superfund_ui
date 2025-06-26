import { useQuery } from '@tanstack/react-query'
import { getLiquidityLandUsers } from '@/queries/get-liquidity-land-users-api'

export const useGetLiquidityLandUsers = () => {
  return useQuery({
    queryKey: ['liquidityLandUsers'],
    queryFn: getLiquidityLandUsers,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  })
} 