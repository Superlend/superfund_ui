'use client'

import { useState, useEffect, useCallback } from 'react'
import { getClaimRewards } from '@/queries/get-claim-rewards-api'
import { TClaimRewardsResponse } from '@/types'
import { TClaimRewardsParams } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetClaimRewards(params: TClaimRewardsParams) {
    const [data, setData] = useState<TClaimRewardsResponse[] | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isError, setIsError] = useState<boolean>(false)

    const { refetch: fetchFromQuery } = useQuery<
        TClaimRewardsResponse[],
        Error
    >({
        queryKey: ['claim-rewards', params.user_address, params.chain_id],
        queryFn: async () => {
            setIsLoading(true)
            try {
                const responseData = await getClaimRewards(params)
                setData(responseData)
                setIsError(false)
                return responseData
            } catch (error) {
                setData([])
                setIsError(true)
                return []
            } finally {
                setIsLoading(false)
            }
        },
        staleTime: Infinity,
        refetchInterval: false,
        enabled: !!params.user_address && !!params.chain_id,
    })

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const responseData = await fetchFromQuery()
            if (responseData.data) {
                setData(responseData.data)
                setIsError(false)
            }
        } catch (error) {
            setData([])
            setIsError(true)
        } finally {
            setIsLoading(false)
        }
    }, [fetchFromQuery])

    useEffect(() => {
        if (params.user_address && params.chain_id) {
            fetchData()
        }
    }, [params.user_address, params.chain_id, fetchData])

    return { data, isLoading, isError, fetchData }
}
