'use client'

import { getBenchmarkHistory, TBenchmarkHistoryParams } from '@/queries/get-benchmark-history-api'
import { useQuery } from '@tanstack/react-query'

export default function useGetBenchmarkHistory(params: TBenchmarkHistoryParams) {
    return useQuery({
        queryKey: ['benchmark-history', params],
        queryFn: async () => {
            try {
                const response = await getBenchmarkHistory(params)
                return response
            } catch (error) {
                return {
                    processMap: [],
                }
            }
        },
        enabled: !!params.protocol_identifier && !!params.token && !!params.period,
        staleTime: Infinity,
        // refetchInterval: 1000 * 60 * 60 * 24,
        // refetchOnWindowFocus: false,
        // refetchOnMount: false,
        // refetchOnReconnect: false,
        // refetchIntervalInBackground: false,
    })
}
