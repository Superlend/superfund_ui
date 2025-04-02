'use client'

import { getEffectiveApy } from '@/queries/effective-apy-api'
import { useQuery } from '@tanstack/react-query'

export function useGetEffectiveApy() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['effective-apy'],
        queryFn: async () => {
            try {
                const responseData = await getEffectiveApy()
                return responseData
            } catch (error) {
                console.error('Error fetching effective APY:', error)
                throw error
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    })

    return { data, isLoading, isError, refetch }
}
