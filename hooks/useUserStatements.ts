'use client'

import { getUserStatements, UserStatementsResponse } from '@/queries/user-statements-api'
import { useQuery } from '@tanstack/react-query'

export interface UseUserStatementsProps {
  userAddress: string
  vaultAddress: string
  chainId: number
  limit?: number
  offset?: number
}

export default function useUserStatements({
  userAddress,
  vaultAddress,
  chainId,
  limit, // = 5,
  offset, // = 0,
}: UseUserStatementsProps) {
  const { data, isLoading, isError, error, refetch } = useQuery<
    UserStatementsResponse['data'],
    Error
  >({
    queryKey: ['user-statements', userAddress, vaultAddress, chainId, limit, offset],
    queryFn: async () => {
      try {
        const responseData = await getUserStatements({
          userAddress,
          vaultAddress,
          chainId,
          limit,
          offset,
        });
        return responseData;
      } catch (error) {
        console.error('Error fetching user statements:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!userAddress && !!vaultAddress && !!chainId,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  }
} 