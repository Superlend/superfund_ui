'use client'

import { getTransactionHistory, Transaction, TransactionHistoryParams, TransactionHistoryResponse } from '@/queries/transaction-history-api'
import { useQuery } from '@tanstack/react-query'

export interface UseTransactionHistoryProps {
  protocolIdentifier: string
  chainId: number
  walletAddress: string
  refetchOnTransaction?: boolean
}

export default function useTransactionHistory({
  protocolIdentifier,
  chainId,
  walletAddress,
  refetchOnTransaction = false
}: UseTransactionHistoryProps) {
  // Simple query setup
  const { data, isLoading, isError, refetch } = useQuery<
    TransactionHistoryResponse,
    Error
  >({
    queryKey: ['transaction-history', protocolIdentifier, chainId, walletAddress],
    queryFn: async () => {
      try {
        const responseData = await getTransactionHistory({
          protocolIdentifier,
          chainId,
          walletAddress
        });
        return responseData;
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        return { transactions: [], capital: '0', interest_earned: '0' };
      }
    },
    staleTime: Infinity,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!protocolIdentifier && !!chainId && !!walletAddress,
  });

  return {
    data: data || { transactions: [], capital: '0', interest_earned: '0' },
    isLoading,
    isError,
    refetch,
  }
} 