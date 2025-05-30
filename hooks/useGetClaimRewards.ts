'use client'

import { getClaimRewards } from '@/queries/get-claim-rewards-api'
import { TClaimRewardsResponse } from '@/types'
import { TClaimRewardsParams } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetClaimRewards(params: TClaimRewardsParams) {
    const { data, isLoading, isError, refetch } = useQuery<
        TClaimRewardsResponse[],
        Error
    >({
        queryKey: ['claim-rewards', params.user_address, params.chain_id],
        queryFn: async () => {
            try {
                const responseData = await getClaimRewards(params)
                return responseData
            } catch (error) {
                return []
            }
        },
        staleTime: Infinity,
        enabled: !!params.user_address && !!params.chain_id,
    })

    return { data, isLoading, isError, refetch }
}
