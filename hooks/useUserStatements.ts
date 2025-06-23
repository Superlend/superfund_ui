'use client'

import { getUserStatements, UserStatementData, UserStatementsParams } from '@/queries/user-statements-api'
import { useQuery } from '@tanstack/react-query'

export interface UseUserStatementsProps {
  userAddress: string
  vaultAddress: string
  chainId: number
}

export default function useUserStatements({
  userAddress,
  vaultAddress,
  chainId,
}: UseUserStatementsProps) {
  const { data, isLoading, isError, error, refetch } = useQuery<
    UserStatementData[],
    Error
  >({
    queryKey: ['user-statements', userAddress, vaultAddress, chainId],
    queryFn: async () => {
      try {
        const responseData = await getUserStatements({
          userAddress,
          vaultAddress,
          chainId,
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