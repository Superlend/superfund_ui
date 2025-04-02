'use client'

import { getDailyEarningsHistory } from '@/queries/daily-earnings-history-api'
import { TDailyEarningsHistory, TDailyEarningsHistoryParams, TDailyEarningsHistoryResponse } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetDailyEarningsHistory(params: TDailyEarningsHistoryParams) {
    const { data, isLoading, isError, refetch } = useQuery<
        TDailyEarningsHistory[],
        Error
    >({
        queryKey: ['daily-earnings-history', params.user_address, params.vault_address, params.start_timestamp],
        queryFn: async () => {
            try {
                const responseData = await getDailyEarningsHistory(params)
                return responseData.history
            } catch (error) {
                return []
            }
        },
        staleTime: Infinity,
        refetchInterval: false,
        // enabled: !!params.user_address && !!params.vault_address,
    })

    return { data, isLoading, isError, refetch }
}
