'use client'

import { getTransactionHistory, Transaction, TransactionHistoryParams, TransactionHistoryResponse } from '@/queries/transaction-history-api'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'

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
  // Simple state to track if we should be refetching
  const [isRefetching, setIsRefetching] = useState(false);

  // Count how many refetches have happened
  const refetchCountRef = useRef(0);
  const refetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query setup with minimal options
  const { data, isLoading, isError, refetch } = useQuery<
    TransactionHistoryResponse,
    Error
  >({
    queryKey: ['transaction-history', protocolIdentifier, chainId, walletAddress, isRefetching],
    queryFn: async () => {
      try {
        // Count refetches only during active refetch period
        if (isRefetching) {
          refetchCountRef.current += 1;
          console.log(`Transaction history refetch #${refetchCountRef.current}`);

          // Stop after 6 refetches (30 seconds)
          if (refetchCountRef.current >= 6) {
            console.log('Reached maximum refetches (30 seconds), stopping');
            setIsRefetching(false);
            refetchCountRef.current = 0;
          }
        }

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
    refetchInterval: isRefetching ? 5000 : false,
    refetchOnWindowFocus: false,
    enabled: !!protocolIdentifier && !!chainId && !!walletAddress,
  });

  // Simple transaction-complete event handler
  useEffect(() => {
    if (!refetchOnTransaction) return;

    const handleTransactionComplete = () => {
      console.log('Transaction completed, starting refetch cycle');

      // Clear any existing timer
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }

      // Reset counter
      refetchCountRef.current = 0;

      // Start refetching
      setIsRefetching(true);

      // Immediately refetch once
      refetch();

      // Also set a backup timeout to ensure we stop after 30 seconds
      refetchTimerRef.current = setTimeout(() => {
        console.log('Backup timer: stopping refetch after 30 seconds');
        setIsRefetching(false);
        refetchCountRef.current = 0;
      }, 30 * 1000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-complete', handleTransactionComplete);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-complete', handleTransactionComplete);
      }

      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }
    };
  }, [refetch, refetchOnTransaction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }
    };
  }, []);

  return {
    data: data || { transactions: [], capital: '0', interest_earned: '0' },
    isLoading,
    isError,
    refetch,
    // Simple function to manually trigger a refetch cycle
    startRefreshing: () => {
      console.log('Manually starting refetch cycle');

      // Clear any existing timer
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }

      // Reset counter
      refetchCountRef.current = 0;

      // Start refetching
      setIsRefetching(true);

      // Immediate refetch
      refetch();

      // Backup timeout
      refetchTimerRef.current = setTimeout(() => {
        console.log('Backup timer: stopping refetch after 30 seconds');
        setIsRefetching(false);
        refetchCountRef.current = 0;
      }, 30 * 1000);
    },
    stopRefreshing: () => {
      console.log('Manually stopping refetch cycle');
      setIsRefetching(false);
      refetchCountRef.current = 0;

      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }
    }
  }
} 