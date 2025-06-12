'use client'

import { getEffectiveApy } from '@/queries/effective-apy-api'
import { useQuery } from '@tanstack/react-query'

export function useGetEffectiveApy({
    vault_address,
    chain_id
}: {
    vault_address: `0x${string}`
    chain_id: number
}) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['effective-apy', vault_address, chain_id],
        queryFn: async () => {
            try {
                const responseData = await getEffectiveApy({
                    vault_address,
                    chain_id
                })
                return responseData
            } catch (error) {
                console.error('Error fetching effective APY:', error)
                throw error
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    })

    return { data, isLoading, isError, refetch }
}
